import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your local or production API base URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8100/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored auth token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----------------------------------------------------------------

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'personal_shipper' | 'delivery_driver';
}) => api.post('/auth/register', payload);

export const registerCompany = (payload: {
  company_name: string;
  admin_full_name: string;
  admin_email: string;
  admin_password: string;
  admin_password_confirm: string;
  phone?: string;
  country?: string;
  city?: string;
}) => api.post('/companies/register', payload);

// ---- Shipments (Shipper) -------------------------------------------------

export const createShipment = (data: object) => api.post('/marketplace/shipments', data);
export const getMyShipments  = (status?: string) =>
  api.get('/marketplace/shipments', { params: status ? { status } : undefined });
export const getShipment     = (shipmentId: string) =>
  api.get(`/marketplace/shipments/${shipmentId}`);
export const getShipmentBids = (shipmentId: string) =>
  api.get(`/marketplace/shipments/${shipmentId}/bids`);
export const acceptBid = (shipmentId: string, bidId: string) =>
  api.post(`/marketplace/shipments/${shipmentId}/bids/${bidId}/accept`);

// ---- Driver Dashboard ---------------------------------------------------

// lat/lon default to Accra centre — the app should pass device location
export const getDriverDashboard = (lat = 5.6037, lon = -0.1870, radiusKm = 100) =>
  api.get('/marketplace/dashboard/driver', { params: { lat, lon, radius_km: radiusKm } });
export const placeBid = (shipmentId: string, data: object) =>
  api.post(`/marketplace/shipments/${shipmentId}/bids`, data);

// ---- KYC ----------------------------------------------------------------

export const getKycStatus = () => api.get('/kyc/status');
export const submitKyc = (formData: FormData) =>
  api.post('/kyc/submit-manual', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ---- Shipment tracking --------------------------------------------------

export const trackShipment = (trackingNumber: string) =>
  api.get(`/marketplace/track/${trackingNumber}`);

export default api;
