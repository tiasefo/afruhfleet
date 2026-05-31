import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { register as apiRegister } from '../../services/api';

type Role = 'personal_shipper' | 'delivery_driver';

export default function RegisterScreen({ route, navigation }: any) {
  const defaultTab: Role = route.params?.tab === 'driver' ? 'delivery_driver' : 'personal_shipper';
  const [role, setRole]       = useState<Role>(defaultTab);
  const [fullName, setFullName] = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy]       = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) { Alert.alert('Fill in all required fields'); return; }
    if (password !== confirm) { Alert.alert('Passwords do not match'); return; }
    setBusy(true);
    try {
      await apiRegister({ email: email.trim().toLowerCase(), password, full_name: fullName, phone, role });
      Alert.alert('Account created!', 'Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration failed', err?.response?.data?.detail ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Create Account</Text>

        {/* Role selector */}
        <View style={styles.tabs}>
          {([['personal_shipper', 'Personal Shipper'], ['delivery_driver', 'Delivery Driver']] as [Role, string][]).map(([r, label]) => (
            <TouchableOpacity key={r} style={[styles.tab, role === r && styles.tabActive]} onPress={() => setRole(r)}>
              <Text style={[styles.tabText, role === r && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Full Name *" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password *" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirm Password *" value={confirm} onChangeText={setConfirm} secureTextEntry />

        {role === 'delivery_driver' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Driver accounts require KYC verification (ID + liveness photo) before you can bid on shipments.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign in →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  inner:        { padding: 28, paddingTop: 60 },
  title:        { fontSize: 24, fontWeight: '800', marginBottom: 24, color: '#222' },
  tabs:         { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: BRAND },
  tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', backgroundColor: '#fff' },
  tabActive:    { backgroundColor: BRAND },
  tabText:      { fontSize: 13, color: BRAND },
  tabTextActive:{ color: '#fff', fontWeight: '700' },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  notice:       { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 12, marginBottom: 16 },
  noticeText:   { color: '#E65100', fontSize: 13 },
  btn:          { backgroundColor: BRAND, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 6 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:         { color: BRAND, marginTop: 18, fontSize: 14, textAlign: 'center' },
});
