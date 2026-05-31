import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

type Tab = 'shipper' | 'driver' | 'company';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy]         = useState(false);
  const [tab, setTab]           = useState<Tab>('shipper');

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Please fill in all fields'); return; }
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation will react to auth state change in AppNavigator
    } catch (err: any) {
      Alert.alert('Login failed', err?.response?.data?.detail ?? 'Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>Afruheritage</Text>
        <Text style={styles.tagline}>Freight Platform</Text>

        {/* Role tabs */}
        <View style={styles.tabs}>
          {(['shipper', 'driver', 'company'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'shipper' ? 'Ship' : t === 'driver' ? 'Drive' : 'Company'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register', { tab })}>
          <Text style={styles.link}>New here? Create an account →</Text>
        </TouchableOpacity>

        {tab === 'company' && (
          <TouchableOpacity onPress={() => navigation.navigate('CompanyRegister')}>
            <Text style={styles.link}>Register your freight company →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BRAND = '#E67E22';

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#fff' },
  inner:     { padding: 28, alignItems: 'center', paddingTop: 80 },
  logo:      { fontSize: 30, fontWeight: '800', color: BRAND, marginBottom: 4 },
  tagline:   { fontSize: 14, color: '#888', marginBottom: 36 },
  tabs:      { flexDirection: 'row', marginBottom: 24, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: BRAND },
  tab:       { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  tabActive: { backgroundColor: BRAND },
  tabText:   { fontSize: 13, color: BRAND },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  input:     { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 14, fontSize: 15 },
  btn:       { width: '100%', backgroundColor: BRAND, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:      { color: BRAND, marginTop: 18, fontSize: 14 },
});
