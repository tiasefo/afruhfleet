import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { getMyShipments, createShipment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Shipment {
  id: string;
  tracking_number: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  item_description: string;
  created_at: string;
}

export default function ShipperDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await getMyShipments();
      setShipments(res.data?.items ?? res.data ?? []);
    } catch {
      Alert.alert('Could not load shipments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const statusColor = (s: string) => {
    if (s === 'delivered') return '#27AE60';
    if (s === 'in_transit') return '#2980B9';
    if (s === 'accepted') return '#8E44AD';
    return '#F39C12';
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BRAND} /></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Your shipments</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={styles.logoutText}>Sign out</Text></TouchableOpacity>
      </View>

      {/* KYC banner if not verified */}
      {user?.kyc_status !== 'approved' && (
        <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KYCSubmit')}>
          <Text style={styles.kycText}>⚠️ Complete KYC verification to access all features →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewShipment')}>
        <Text style={styles.fabText}>+ New Shipment</Text>
      </TouchableOpacity>

      <FlatList
        data={shipments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchShipments(); }} />}
        contentContainerStyle={shipments.length === 0 ? styles.empty : { padding: 16 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No shipments yet.{'\n'}Tap "+ New Shipment" to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ShipmentDetail', { shipmentId: item.id })}>
            <View style={styles.cardRow}>
              <Text style={styles.tracking}>{item.tracking_number}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.route} numberOfLines={1}>
              {item.pickup_address} → {item.dropoff_address}
            </Text>
            <Text style={styles.desc} numberOfLines={1}>{item.item_description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F5F6FA' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#fff' },
  greeting:  { fontSize: 20, fontWeight: '700', color: '#222' },
  subtitle:  { fontSize: 13, color: '#888', marginTop: 2 },
  logoutText:{ color: '#E74C3C', fontSize: 13 },
  kycBanner: { backgroundColor: '#FFF3E0', padding: 12, margin: 16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: BRAND },
  kycText:   { color: '#E65100', fontSize: 13 },
  fab:       { margin: 16, backgroundColor: BRAND, borderRadius: 8, padding: 14, alignItems: 'center' },
  fabText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
  card:      { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tracking:  { fontWeight: '700', fontSize: 14, color: '#333' },
  badge:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  route:     { fontSize: 13, color: '#555', marginBottom: 4 },
  desc:      { fontSize: 12, color: '#999' },
  empty:     { flex: 1, padding: 40 },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 15, lineHeight: 24 },
});
