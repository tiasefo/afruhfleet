import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { submitKyc } from '../../services/api';

type IdType = 'ghana_card' | 'passport' | 'voter_id' | 'drivers_license';

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: 'ghana_card', label: 'Ghana Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'drivers_license', label: "Driver's License" },
];

export default function KYCSubmitScreen({ navigation }: any) {
  const [idType, setIdType]     = useState<IdType>('ghana_card');
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [idFront, setIdFront]   = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [idBack, setIdBack]     = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [liveness, setLiveness] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy]         = useState(false);

  const pickImage = async (setter: (v: ImagePicker.ImagePickerAsset) => void) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera roll permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0]);
  };

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, cameraType: ImagePicker.CameraType.front });
    if (!result.canceled && result.assets[0]) setLiveness(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!idNumber.trim() || !fullName.trim()) { Alert.alert('Required', 'Fill in your ID number and full name'); return; }
    if (!idFront || !idBack)  { Alert.alert('Required', 'Upload both front and back of your ID'); return; }
    if (!liveness)            { Alert.alert('Required', 'Take a selfie for liveness verification'); return; }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('id_type', idType);
      formData.append('id_number', idNumber.trim());
      formData.append('full_name', fullName.trim());
      const appendAsset = (key: string, asset: ImagePicker.ImagePickerAsset) =>
        formData.append(key, { uri: asset.uri, name: `${key}.jpg`, type: 'image/jpeg' } as any);
      appendAsset('id_front', idFront);
      appendAsset('id_back', idBack);
      appendAsset('liveness_photo', liveness);

      await submitKyc(formData);
      Alert.alert('Documents Submitted', "Your KYC is under review. You'll be notified once approved (usually within 24 hours).",
        [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Submission failed', err?.response?.data?.detail ?? 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Identity Verification</Text>
      <Text style={styles.sub}>Your data is encrypted and used only to verify your identity.</Text>

      <Text style={styles.label}>ID Type</Text>
      <View style={styles.chipRow}>
        {ID_TYPES.map(({ value, label }) => (
          <TouchableOpacity key={value} style={[styles.chip, idType === value && styles.chipActive]} onPress={() => setIdType(value)}>
            <Text style={[styles.chipText, idType === value && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>ID Number *</Text>
      <TextInput style={styles.input} placeholder="e.g. GHA-XXXXXXXXX-X" value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />

      <Text style={styles.label}>Full Name (as on ID) *</Text>
      <TextInput style={styles.input} placeholder="Your full legal name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />

      <Text style={styles.label}>ID Front *</Text>
      <UploadSlot label="Upload front of your ID" asset={idFront} onPress={() => pickImage(setIdFront)} />

      <Text style={styles.label}>ID Back *</Text>
      <UploadSlot label="Upload back of your ID" asset={idBack} onPress={() => pickImage(setIdBack)} />

      <Text style={styles.label}>Liveness Selfie *</Text>
      <UploadSlot label="Take a front-facing selfie" asset={liveness} onPress={takeSelfie} cameraIcon />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit for Verification</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function UploadSlot({ label, asset, onPress, cameraIcon }: { label: string; asset: ImagePicker.ImagePickerAsset | null; onPress: () => void; cameraIcon?: boolean }) {
  return (
    <TouchableOpacity style={[styles.uploadSlot, !!asset && styles.uploadDone]} onPress={onPress}>
      <Text style={styles.uploadIcon}>{asset ? '✅' : cameraIcon ? '📷' : '📎'}</Text>
      <Text style={styles.uploadLabel} numberOfLines={1}>{asset ? (asset.fileName ?? 'Image selected') : label}</Text>
    </TouchableOpacity>
  );
}

const BRAND = '#E67E22';
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#fff' },
  inner:         { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title:         { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 6 },
  sub:           { fontSize: 13, color: '#888', marginBottom: 24 },
  label:         { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive:    { borderColor: BRAND, backgroundColor: '#FFF3E0' },
  chipText:      { fontSize: 13, color: '#666' },
  chipTextActive:{ color: BRAND, fontWeight: '700' },
  input:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, fontSize: 15 },
  uploadSlot:    { borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadDone:    { borderColor: '#27AE60', borderStyle: 'solid', backgroundColor: '#F0FFF4' },
  uploadIcon:    { fontSize: 22 },
  uploadLabel:   { flex: 1, color: '#666', fontSize: 14 },
  btn:           { backgroundColor: BRAND, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText:       { color: '#fff', fontWeight: '700', fontSize: 16 },
});
