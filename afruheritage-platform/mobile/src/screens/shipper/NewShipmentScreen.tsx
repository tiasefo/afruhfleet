import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { createShipment } from '../../services/api';

export default function NewShipmentScreen({ navigation }: any) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [pickupLabel, setPickupLabel] = useState('');
  const [dropoffLabel, setDropoffLabel] = useState('');
  const [pickupLat, setPickupLat]     = useState('');
  const [pickupLon, setPickupLon]     = useState('');
  const [dropoffLat, setDropoffLat]   = useState('');
  const [dropoffLon, setDropoffLon]   = useState('');
  const [weightKg, setWeightKg]       = useState('');
  const [packageCount, setPackageCount] = useState('1');
  const [packageValue, setPackageValue] = useState('');
  const [fragile, setFragile]         = useState(false);
  const [refrigerated, setRefrigerated] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [busy, setBusy]               = useState(false);

  const handleSubmit = async () => {
    if (!pickupLabel || !dropoffLabel) {
      Alert.alert('Required', 'Enter pickup and dropoff addresses');
      return;
    }
    setBusy(true);
    try {
      await createShipment({
        title:                title || `Shipment ${new Date().toLocaleDateString()}`,
        description,
        pickup_label:         pickupLabel,
        dropoff_label:        dropoffLabel,
        pickup_latitude:      pickupLat ? parseFloat(pickupLat) : null,
        pickup_longitude:     pickupLon ? parseFloat(pickupLon) : null,
        dropoff_latitude:     dropoffLat ? parseFloat(dropoffLat) : null,
        dropoff_longitude:    dropoffLon ? parseFloat(dropoffLon) : null,
        weight_kg:            weightKg ? parseFloat(weightKg) : null,
        package_count:        parseInt(packageCount || '1'),
        package_value:        packageValue ? parseFloat(packageValue) : null,
        fragile,
        refrigerated,
        customer_name:        customerName || undefined,
        customer_phone:       customerPhone || undefined,
      });
      Alert.alert(
        'Shipment Created',
        'Your shipment is now visible to drivers who can place bids.',
        [{ text: 'View My Shipments', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.detail ?? 'Could not create shipment. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>New Shipment</Text>

        <Field label="Title (optional)">
          <TextInput style={styles.input} placeholder="e.g. Office furniture delivery" value={title} onChangeText={setTitle} />
        </Field>

        <Field label="Description">
          <TextInput style={[styles.input, { height: 72 }]} placeholder="What are you shipping?" value={description} onChangeText={setDescription} multiline />
        </Field>

        <Field label="Pickup Address *">
          <TextInput style={styles.input} placeholder="Street, city" value={pickupLabel} onChangeText={setPickupLabel} />
        </Field>

        <Field label="Dropoff Address *">
          <TextInput style={styles.input} placeholder="Street, city" value={dropoffLabel} onChangeText={setDropoffLabel} />
        </Field>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Weight (kg)">
              <TextInput style={styles.input} placeholder="0.0" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Packages">
              <TextInput style={styles.input} placeholder="1" value={packageCount} onChangeText={setPackageCount} keyboardType="number-pad" />
            </Field>
          </View>
        </View>

        <Field label="Declared Value (GHS)">
          <TextInput style={styles.input} placeholder="0.00" value={packageValue} onChangeText={setPackageValue} keyboardType="decimal-pad" />
        </Field>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Fragile</Text>
          <Switch value={fragile} onValueChange={setFragile} trackColor={{ true: BRAND }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Refrigerated</Text>
          <Switch value={refrigerated} onValueChange={setRefrigerated} trackColor={{ true: BRAND }} />
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionHeader}>Recipient (optional)</Text>

        <Field label="Recipient Name">
          <TextInput style={styles.input} placeholder="Full name" value={customerName} onChangeText={setCustomerName} />
        </Field>
        <Field label="Recipient Phone">
          <TextInput style={styles.input} placeholder="+233..." value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
        </Field>

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post Shipment for Bids</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fff' },
  inner:         { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title:         { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 20 },
  label:         { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 13, fontSize: 15 },
  row:           { flexDirection: 'row' },
  toggleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  toggleLabel:   { fontSize: 15, color: '#333' },
  divider:       { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn:           { backgroundColor: BRAND, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText:       { color: '#fff', fontWeight: '700', fontSize: 16 },
});
