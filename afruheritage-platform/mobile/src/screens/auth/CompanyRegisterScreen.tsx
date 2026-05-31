import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { registerCompany } from '../../services/api';

export default function CompanyRegisterScreen({ navigation }: any) {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName]     = useState('');
  const [email, setEmail]             = useState('');
  const [phone, setPhone]             = useState('');
  const [country, setCountry]         = useState('GH');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [busy, setBusy]               = useState(false);

  const handleRegister = async () => {
    if (!companyName || !adminName || !email || !password) {
      Alert.alert('Fill in all required fields');
      return;
    }
    if (password !== confirm) { Alert.alert('Passwords do not match'); return; }
    setBusy(true);
    try {
      const res = await registerCompany({
        company_name: companyName,
        admin_full_name: adminName,
        admin_email: email.trim().toLowerCase(),
        admin_password: password,
        admin_password_confirm: confirm,
        phone,
        country,
      });
      const { subdomain, portal_url } = res.data;
      Alert.alert(
        'Company Registered!',
        `Your freight portal is ready at:\n${portal_url ?? `https://${subdomain}.afruheritage.com`}\n\nYou can now log in.`,
        [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err: any) {
      Alert.alert('Registration failed', err?.response?.data?.detail ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Register Freight Company</Text>
        <Text style={styles.sub}>Provision your branded freight portal with Fleetbase integration.</Text>

        <Text style={styles.label}>Company Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Accra Logistics Ltd" value={companyName} onChangeText={setCompanyName} />

        <Text style={styles.label}>Admin Full Name *</Text>
        <TextInput style={styles.input} placeholder="Your full name" value={adminName} onChangeText={setAdminName} />

        <Text style={styles.label}>Admin Email *</Text>
        <TextInput style={styles.input} placeholder="admin@yourcompany.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} placeholder="+233..." value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Country Code</Text>
        <TextInput style={styles.input} placeholder="GH" value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} />

        <Text style={styles.label}>Password *</Text>
        <TextInput style={styles.input} placeholder="Minimum 8 characters" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={busy}>
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Freight Portal</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>← Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#fff' },
  inner:  { padding: 28, paddingTop: 60 },
  title:  { fontSize: 24, fontWeight: '800', color: '#222', marginBottom: 6 },
  sub:    { fontSize: 13, color: '#666', marginBottom: 24 },
  label:  { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 4 },
  input:  { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 15 },
  btn:    { backgroundColor: BRAND, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 6 },
  btnText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
  link:   { color: BRAND, marginTop: 18, fontSize: 14, textAlign: 'center' },
});
