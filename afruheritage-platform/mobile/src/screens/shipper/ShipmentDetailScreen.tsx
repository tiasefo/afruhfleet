import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import { getShipment, acceptBid } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Bid {
  bid_id: string;
  driver_name: string;
  proposed_price: number;
  currency: string;
  message?: string;
  status: string;
  counter_price?: number;
}

interface ShipmentDetail {
  id: string;
  tracking_number: string;
  status: string;
  title: string;
  description?: string;
  pickup_address: string;
  dropoff_address: string;
  weight_kg?: number;
  distance_km?: number;
  suggested_price?: number;
  currency: string;
  bid_count: number;
  bids: Bid[];
  created_at: string;
}

export default function ShipmentDetailScreen({ route, navigation }: any) {
  const { shipmentId } = route.params as { shipmentId: string };
  const { user } = useAuth();
  const [shipment, setShipment]   = useState<ShipmentDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchShipment = useCallback(async () => {
    try {
      const res = await getShipment(shipmentId);
      setShipment(res.data);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail ?? 'Could not load shipment.');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shipmentId]);

  useEffect(() => { fetchShipment(); }, [fetchShipment]);

  const handleAccept = async (bid: Bid) => {
    if (!shipment) return;
    Alert.alert(
      'Accept Bid',
      `Accept ${bid.driver_name}'s bid of ${bid.currency} ${bid.proposed_price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(bid.bid_id);
            try {
              await acceptBid(shipment.id, bid.bid_id);
              Alert.alert('Bid Accepted', `${bid.driver_name} will handle your shipment.`);
              fetchShipment();
            } catch (err: any) {
              Alert.alert('Failed', err?.response?.data?.detail ?? 'Try again.');
            } finally {
              setAccepting(null);
            }
          },
        },
      ],
    );
  };

  const statusColor = (s: string) => {
    if (s === 'delivered') return '#27AE60';
    if (s === 'in_transit') return '#2980B9';
    if (s === 'accepted') return '#8E44AD';
    return '#F39C12';
  };

  const bidStatusColor = (s: string) =>
    s === 'accepted' ? '#27AE60' : s === 'rejected' ? '#E74C3C' : '#F39C12';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BRAND} /></View>;
  if (!shipment) return null;

  const isOwner = user?.id === shipment.id; // will compare after full user data; fallback is show bids

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchShipment(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tracking}>{shipment.tracking_number}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor(shipment.status) }]}>
          <Text style={styles.badgeText}>{shipment.status.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.card}>
        <Row label="From" value={shipment.pickup_address} />
        <Row label="To"   value={shipment.dropoff_address} />
        {shipment.distance_km ? <Row label="Distance" value={`${shipment.distance_km} km`} /> : null}
        {shipment.weight_kg ? <Row label="Weight" value={`${shipment.weight_kg} kg`} /> : null}
        {shipment.suggested_price ? (
          <Row label="Suggested price" value={`${shipment.currency} ${shipment.suggested_price}`} />
        ) : null}
      </View>

      {/* Description */}
      {shipment.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>{shipment.description}</Text>
        </View>
      ) : null}

      {/* Bids */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Bids {shipment.bid_count > 0 ? `(${shipment.bid_count})` : ''}
        </Text>

        {shipment.bids.length === 0 ? (
          <Text style={styles.emptyBids}>No bids yet. Check back soon.</Text>
        ) : (
          shipment.bids.map((bid) => (
            <View key={bid.bid_id} style={styles.bidCard}>
              <View style={styles.bidRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{bid.driver_name || 'Driver'}</Text>
                  {bid.message ? (
                    <Text style={styles.bidMsg} numberOfLines={2}>{bid.message}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.bidPrice}>{bid.currency} {bid.proposed_price}</Text>
                  <Text style={[styles.bidStatus, { color: bidStatusColor(bid.status) }]}>
                    {bid.status}
                  </Text>
                </View>
              </View>

              {bid.counter_price ? (
                <Text style={styles.counter}>Counter offer: {bid.currency} {bid.counter_price}</Text>
              ) : null}

              {bid.status === 'pending' && shipment.status === 'open' && (
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(bid)}
                  disabled={accepting === bid.bid_id}
                >
                  {accepting === bid.bid_id
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.acceptBtnText}>Accept This Bid</Text>}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F5F6FA' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#fff' },
  tracking:    { fontSize: 18, fontWeight: '800', color: '#222' },
  badge:       { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText:   { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  card:        { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 10, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  bodyText:    { fontSize: 14, color: '#555', lineHeight: 20 },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, color: '#333', fontWeight: '600', flex: 1, textAlign: 'right' },
  emptyBids:   { color: '#aaa', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  bidCard:     { borderWidth: 1, borderColor: '#f0f0f0', borderRadius: 8, padding: 12, marginBottom: 10 },
  bidRow:      { flexDirection: 'row', alignItems: 'flex-start' },
  driverName:  { fontSize: 14, fontWeight: '700', color: '#222', marginBottom: 4 },
  bidMsg:      { fontSize: 13, color: '#666' },
  bidPrice:    { fontSize: 16, fontWeight: '800', color: '#222' },
  bidStatus:   { fontSize: 12, fontWeight: '600', textTransform: 'capitalize', marginTop: 2 },
  counter:     { fontSize: 13, color: '#E67E22', marginTop: 6 },
  acceptBtn:   { backgroundColor: BRAND, borderRadius: 6, padding: 10, alignItems: 'center', marginTop: 10 },
  acceptBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
