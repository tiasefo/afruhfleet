import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { getDriverDashboard, placeBid } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface AvailableShipment {
  shipment_id: string;
  tracking_number: string;
  pickup_label: string;
  dropoff_label: string;
  distance_from_you_km: number;
  trip_distance_km: number;
  suggested_price?: number;
  weight_kg?: number;
  package_count?: number;
  my_bid?: { bid_id: string; status: string; proposed_price: number; counter_price?: number } | null;
}

export default function DriverDashboard({ navigation }: any) {
  const { user, logout } = useAuth();
  const [available, setAvailable] = useState<AvailableShipment[]>([]);
  const [myBids, setMyBids]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bid modal
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<AvailableShipment | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Use Accra centre as fallback — production app will inject device GPS
      const res = await getDriverDashboard(5.6037, -0.1870, 200);
      setAvailable(res.data?.shipments ?? []);
      const myActive = (res.data?.shipments ?? []).filter((s: AvailableShipment) => s.my_bid);
      setMyBids(myActive.map((s: AvailableShipment) => ({
        id: s.my_bid!.bid_id,
        tracking_number: s.tracking_number,
        proposed_price: s.my_bid!.proposed_price,
        status: s.my_bid!.status,
      })));
    } catch {
      Alert.alert('Could not load driver dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openBidModal = (shipment: AvailableShipment) => {
    setSelectedShipment(shipment);
    setBidPrice('');
    setBidMessage('');
    setBidModalVisible(true);
  };

  const submitBid = async () => {
    if (!bidPrice || isNaN(Number(bidPrice))) { Alert.alert('Enter a valid price'); return; }
    if (!selectedShipment) return;
    setSubmittingBid(true);
    try {
      await placeBid(selectedShipment.shipment_id, {
        proposed_price: parseFloat(bidPrice),
        currency: 'GHS',
        message: bidMessage,
      });
      setBidModalVisible(false);
      Alert.alert('Bid submitted!', `You bid GHS ${bidPrice} on shipment ${selectedShipment.tracking_number}`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Bid failed', err?.response?.data?.detail ?? 'Try again.');
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BRAND} /></View>;

  // KYC gate
  if (user?.kyc_status !== 'approved') {
    return (
      <View style={styles.kycGate}>
        <Text style={styles.kycTitle}>KYC Verification Required</Text>
        <Text style={styles.kycDesc}>
          You must complete identity verification before bidding on shipments.
        </Text>
        <TouchableOpacity style={styles.kycBtn} onPress={() => navigation.navigate('KYCSubmit')}>
          <Text style={styles.kycBtnText}>Start Verification →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>{available.length} shipments available</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={styles.logoutText}>Sign out</Text></TouchableOpacity>
      </View>

      {myBids.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Active Bids ({myBids.length})</Text>
          {myBids.slice(0, 3).map((bid) => (
            <View key={bid.id} style={styles.bidRow}>
              <Text style={styles.bidTrack}>{bid.tracking_number}</Text>
              <Text style={styles.bidPrice}>GHS {bid.proposed_price}</Text>
              <Text style={[styles.bidStatus, bid.status === 'accepted' ? styles.accepted : bid.status === 'rejected' ? styles.rejected : styles.pending]}>
                {bid.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 8 }]}>Available Shipments</Text>
      <FlatList
        data={available}
        keyExtractor={(item) => item.shipment_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No shipments available right now. Pull to refresh.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.tracking}>{item.tracking_number}</Text>
              <Text style={styles.bids}>{item.distance_from_you_km} km away</Text>
            </View>
            <Text style={styles.route} numberOfLines={1}>
              {item.pickup_label} → {item.dropoff_label}
            </Text>
            <Text style={styles.meta}>
              {item.trip_distance_km ? `${item.trip_distance_km} km trip  ·  ` : ''}
              {item.weight_kg ? `${item.weight_kg} kg  ·  ` : ''}
              {item.suggested_price ? `GHS ${item.suggested_price} suggested` : ''}
            </Text>
            {item.my_bid ? (
              <View style={[styles.bidBtn, { backgroundColor: item.my_bid.status === 'accepted' ? '#27AE60' : '#888' }]}>
                <Text style={styles.bidBtnText}>
                  {item.my_bid.status === 'accepted' ? '✅ Bid Accepted' : `Bid: GHS ${item.my_bid.proposed_price} (${item.my_bid.status})`}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.bidBtn} onPress={() => openBidModal(item)}>
                <Text style={styles.bidBtnText}>Place Bid</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Bid Modal */}
      <Modal visible={bidModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Place a Bid</Text>
            {selectedShipment && (
              <Text style={styles.modalSub}>{selectedShipment.pickup_label} → {selectedShipment.dropoff_label}</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Your price (GHS)"
              value={bidPrice}
              onChangeText={setBidPrice}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Message to shipper (optional)"
              value={bidMessage}
              onChangeText={setBidMessage}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBidModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitBid} disabled={submittingBid}>
                {submittingBid ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Bid</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5F6FA' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#fff' },
  greeting:   { fontSize: 20, fontWeight: '700', color: '#222' },
  subtitle:   { fontSize: 13, color: '#888', marginTop: 2 },
  logoutText: { color: '#E74C3C', fontSize: 13 },
  section:    { backgroundColor: '#fff', margin: 16, borderRadius: 10, padding: 14, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  bidRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  bidTrack:   { flex: 1, fontSize: 13, color: '#333' },
  bidPrice:   { fontSize: 13, fontWeight: '700', color: '#222', marginRight: 10 },
  bidStatus:  { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  accepted:   { color: '#27AE60' },
  rejected:   { color: '#E74C3C' },
  pending:    { color: '#F39C12' },
  card:       { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tracking:   { fontWeight: '700', fontSize: 14, color: '#333' },
  bids:       { fontSize: 12, color: '#888' },
  route:      { fontSize: 13, color: '#555', marginBottom: 4 },
  meta:       { fontSize: 12, color: '#999', marginBottom: 10 },
  bidBtn:     { backgroundColor: BRAND, borderRadius: 6, padding: 10, alignItems: 'center' },
  bidBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyText:  { textAlign: 'center', color: '#aaa', fontSize: 14, padding: 32 },
  // KYC gate
  kycGate:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff' },
  kycTitle:   { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 12, textAlign: 'center' },
  kycDesc:    { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  kycBtn:     { backgroundColor: BRAND, borderRadius: 8, paddingHorizontal: 28, paddingVertical: 14 },
  kycBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Modal
  modalOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:  { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#222', marginBottom: 6 },
  modalSub:   { fontSize: 13, color: '#888', marginBottom: 16 },
  input:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 },
  modalActions:{ flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:  { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '600' },
  submitBtn:  { flex: 1, backgroundColor: BRAND, borderRadius: 8, padding: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
