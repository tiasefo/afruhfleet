import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type Booking = {
  id: string;
  tenant_id: string;
  shipment_id?: string | null;
  status: string;
  pickup_address?: string | null;
  delivery_address?: string | null;
  offer_expires_at?: string | null;
  current_location?: string | null;
};

type TrackingPoint = {
  latitude: number;
  longitude: number;
  captured_at: string;
  source?: string;
};

type SupportTicket = {
  id: string;
  public_token: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  tracking_reference?: string;
  shipment_reference?: string;
  glpi_ticket_id?: string | null;
};

type SupportTicketMessage = {
  id: string;
  author_type: string;
  author_name?: string;
  body: string;
};

type MobileTab = "operations" | "tracking" | "kyc" | "vendorDocs" | "vendorJoin" | "support" | "parity";
type AppMode = "web" | "native";

type CoverageStatus = "LIVE" | "PARTIAL" | "MISSING";

const parityRows: {
  feature: string;
  web: CoverageStatus;
  mobile: CoverageStatus;
  note: string;
}[] = [
  {
    feature: "Email/password authentication",
    web: "LIVE",
    mobile: "LIVE",
    note: "Both clients call real login APIs.",
  },
  {
    feature: "Social OAuth login",
    web: "LIVE",
    mobile: "PARTIAL",
    note: "Native app relies on Web mode for social login.",
  },
  {
    feature: "Customer shipment dashboard",
    web: "LIVE",
    mobile: "PARTIAL",
    note: "Native app has no customer dashboard; available via Web mode.",
  },
  {
    feature: "Public shipment tracking",
    web: "LIVE",
    mobile: "LIVE",
    note: "Web and native now call real tracking endpoints.",
  },
  {
    feature: "Support create/track/reply",
    web: "LIVE",
    mobile: "LIVE",
    note: "Web and native support both use support-crm APIs.",
  },
  {
    feature: "KYC submission",
    web: "LIVE",
    mobile: "LIVE",
    note: "Both sides submit multipart KYC payloads.",
  },
  {
    feature: "Vendor registration",
    web: "PARTIAL",
    mobile: "LIVE",
    note: "Web registration flow is simulated; native submits real payload.",
  },
  {
    feature: "Vendor document upload",
    web: "MISSING",
    mobile: "LIVE",
    note: "Only native app uploads vendor docs to /vendors/me/documents.",
  },
  {
    feature: "Driver operations (bookings)",
    web: "MISSING",
    mobile: "LIVE",
    note: "Driver booking actions are native-only.",
  },
  {
    feature: "Live GPS ingestion",
    web: "MISSING",
    mobile: "LIVE",
    note: "Native app streams location points to shipment tracking endpoint.",
  },
  {
    feature: "Admin analytics",
    web: "LIVE",
    mobile: "MISSING",
    note: "Admin analytics dashboard exists only on web.",
  },
  {
    feature: "WhatsApp CSV upload",
    web: "LIVE",
    mobile: "MISSING",
    note: "CSV ingest tooling is available only in web admin.",
  },
];

function statusStyle(status: CoverageStatus) {
  if (status === "LIVE") return { bg: "#dcfce7", fg: "#166534", border: "#86efac" };
  if (status === "PARTIAL") return { bg: "#fef3c7", fg: "#92400e", border: "#fcd34d" };
  return { bg: "#ffe4e6", fg: "#9f1239", border: "#fda4af" };
}

const TOKEN_KEY = "driver_auth_token";
const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.afruheritage.com";
const DEFAULT_WEB_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || "https://afruheritage.com";

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>("web");
  const [webUrl, setWebUrl] = useState(DEFAULT_WEB_URL);
  const [webLoading, setWebLoading] = useState(false);
  const [webCanGoBack, setWebCanGoBack] = useState(false);
  const [webCanGoForward, setWebCanGoForward] = useState(false);
  const webRef = useRef<WebView>(null);

  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState("offline");
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [tab, setTab] = useState<MobileTab>("operations");

  const [trackingTenantId, setTrackingTenantId] = useState("");
  const [trackingShipmentId, setTrackingShipmentId] = useState("");
  const [trackingLatest, setTrackingLatest] = useState<TrackingPoint | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingPoint[]>([]);

  const [kycIdType, setKycIdType] = useState("ghana_card");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [kycFullName, setKycFullName] = useState("");
  const [kycIdFront, setKycIdFront] = useState<string | null>(null);
  const [kycIdBack, setKycIdBack] = useState<string | null>(null);
  const [kycLivePhoto, setKycLivePhoto] = useState<string | null>(null);
  const [kycLiveVideo, setKycLiveVideo] = useState<string | null>(null);

  const [vendorIdFront, setVendorIdFront] = useState<string | null>(null);
  const [vendorIdBack, setVendorIdBack] = useState<string | null>(null);
  const [vendorSelfie, setVendorSelfie] = useState<string | null>(null);
  const [vendorInsurance, setVendorInsurance] = useState<string | null>(null);
  const [vendorRoadworthy, setVendorRoadworthy] = useState<string | null>(null);

  const [vendorStep, setVendorStep] = useState<1 | 2 | 3 | 4>(1);
  const [vendorRegFullName, setVendorRegFullName] = useState("");
  const [vendorRegEmail, setVendorRegEmail] = useState("");
  const [vendorRegPhone, setVendorRegPhone] = useState("");
  const [vendorRegIdType, setVendorRegIdType] = useState("ghana_card");
  const [vendorRegIdNumber, setVendorRegIdNumber] = useState("");
  const [vendorRegVehicleTypes, setVendorRegVehicleTypes] = useState<string[]>([]);
  const [vendorRegVehicleRegNumber, setVendorRegVehicleRegNumber] = useState("");
  const [vendorRegVehicleModel, setVendorRegVehicleModel] = useState("");
  const [vendorRegVehicleYear, setVendorRegVehicleYear] = useState("");
  const [vendorRegBusinessName, setVendorRegBusinessName] = useState("");
  const [vendorRegBusinessType, setVendorRegBusinessType] = useState("individual");
  const [vendorRegRegions, setVendorRegRegions] = useState("");
  const [vendorRegYearsExperience, setVendorRegYearsExperience] = useState("");
  const [vendorRegTermsAccepted, setVendorRegTermsAccepted] = useState(false);
  const [vendorRegInsuranceAccepted, setVendorRegInsuranceAccepted] = useState(false);
  const [vendorRegBackgroundAccepted, setVendorRegBackgroundAccepted] = useState(false);

  const [supportTenantId, setSupportTenantId] = useState("");
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportCategory, setSupportCategory] = useState("shipment");
  const [supportPriority, setSupportPriority] = useState("medium");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportDescription, setSupportDescription] = useState("");
  const [supportShipmentRef, setSupportShipmentRef] = useState("");
  const [supportTrackingRef, setSupportTrackingRef] = useState("");
  const [supportTrackToken, setSupportTrackToken] = useState("");
  const [supportReplyBody, setSupportReplyBody] = useState("");
  const [supportTrackedTicket, setSupportTrackedTicket] = useState<SupportTicket | null>(null);
  const [supportTrackedMessages, setSupportTrackedMessages] = useState<SupportTicketMessage[]>([]);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const activeTrackingBooking = useMemo(
    () => bookings.find((b) => b.status === "in_progress" || b.status === "accepted"),
    [bookings]
  );

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
      }
    })();
  }, []);

  useEffect(() => {
    if (token) {
      void refreshBookings(token);
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
      }
    };
  }, []);

  async function apiFetch(path: string, init?: RequestInit, authToken?: string) {
    const resp = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`${resp.status} ${body || resp.statusText}`);
    }
    return resp;
  }

  function buildFilePart(uri: string, fallbackName: string, type: string) {
    const name = uri.split("/").pop() || fallbackName;
    return { uri, name, type } as any;
  }

  async function pickImage(setter: (uri: string | null) => void) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission denied", "Media library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setter(result.assets[0].uri);
    }
  }

  async function pickVideo(setter: (uri: string | null) => void) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission denied", "Media library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setter(result.assets[0].uri);
    }
  }

  async function pickDocument(setter: (uri: string | null) => void) {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) {
      setter(result.assets[0].uri);
    }
  }

  async function login() {
    setLoading(true);
    setStatusMessage("");
    try {
      const form = new URLSearchParams();
      form.set("username", email);
      form.set("password", password);

      const resp = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });

      if (!resp.ok) {
        throw new Error(`Login failed (${resp.status})`);
      }

      const data = await resp.json();
      if (!data?.access_token) {
        throw new Error("No access token in login response");
      }
      await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setStatusMessage("Login successful");
    } catch (error) {
      Alert.alert("Login error", String(error));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setBookings([]);
    setGpsEnabled(false);
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }

  async function refreshBookings(authToken = token || "") {
    if (!authToken) return;
    setLoading(true);
    try {
      const resp = await apiFetch("/api/v1/vendors/me/bookings?page=1&page_size=25", undefined, authToken);
      const data = await resp.json();
      setBookings(data.items || []);
    } catch (error) {
      Alert.alert("Booking load failed", String(error));
    } finally {
      setLoading(false);
    }
  }

  async function updateAvailability(next: string) {
    if (!token) return;
    try {
      await apiFetch(
        "/api/v1/vendors/me/availability",
        {
          method: "PATCH",
          body: JSON.stringify({ availability_status: next }),
        },
        token
      );
      setAvailability(next);
      setStatusMessage(`Availability updated: ${next}`);
    } catch (error) {
      Alert.alert("Availability update failed", String(error));
    }
  }

  async function decideBooking(bookingId: string, action: "accept" | "reject") {
    if (!token) return;
    try {
      await apiFetch(
        `/api/v1/vendors/me/bookings/${bookingId}/${action}`,
        {
          method: "POST",
          body: JSON.stringify({ note: `driver_${action}` }),
        },
        token
      );
      await refreshBookings(token);
    } catch (error) {
      Alert.alert("Booking decision failed", String(error));
    }
  }

  async function sendTrackingPoint(lat: number, lng: number) {
    if (!token || !activeTrackingBooking?.shipment_id) {
      return;
    }
    const payload = {
      latitude: lat,
      longitude: lng,
      captured_at: new Date().toISOString(),
      source: "driver_app",
    };
    await apiFetch(
      `/api/v1/shipments/${activeTrackingBooking.tenant_id}/${activeTrackingBooking.shipment_id}/tracking/point`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token
    );
  }

  async function loadTrackingReadModels() {
    if (!token || !trackingTenantId || !trackingShipmentId) {
      Alert.alert("Missing fields", "Provide tenant ID and shipment ID.");
      return;
    }
    try {
      const latestResp = await apiFetch(
        `/api/v1/shipments/${trackingTenantId}/${trackingShipmentId}/tracking/latest`,
        undefined,
        token
      );
      const latest = await latestResp.json();
      setTrackingLatest(latest);

      const historyResp = await apiFetch(
        `/api/v1/shipments/${trackingTenantId}/${trackingShipmentId}/tracking/history?limit=50`,
        undefined,
        token
      );
      const history = await historyResp.json();
      setTrackingHistory(history || []);
      setStatusMessage("Tracking view refreshed");
    } catch (error) {
      Alert.alert("Tracking fetch failed", String(error));
    }
  }

  async function submitKyc() {
    if (!token) return;
    if (!kycIdFront || !kycIdBack || !kycLivePhoto || !kycIdNumber || !kycFullName) {
      Alert.alert("Missing fields", "Complete all required KYC fields and files.");
      return;
    }

    const form = new FormData();
    form.append("id_type", kycIdType);
    form.append("id_number", kycIdNumber);
    form.append("full_name", kycFullName);
    form.append("id_front", buildFilePart(kycIdFront, "id_front.jpg", "image/jpeg"));
    form.append("id_back", buildFilePart(kycIdBack, "id_back.jpg", "image/jpeg"));
    form.append("liveness_photo", buildFilePart(kycLivePhoto, "live_photo.jpg", "image/jpeg"));
    if (kycLiveVideo) {
      form.append("liveness_video", buildFilePart(kycLiveVideo, "live_video.mp4", "video/mp4"));
    }

    try {
      const resp = await fetch(`${baseUrl}/api/v1/kyc/submit-manual`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `KYC submit failed: ${resp.status}`);
      }
      setStatusMessage("KYC submitted for manual admin review");
      Alert.alert("Success", "KYC submission sent to admin review queue.");
    } catch (error) {
      Alert.alert("KYC submit failed", String(error));
    }
  }

  async function submitVendorDocuments() {
    if (!token) return;
    if (!vendorIdFront && !vendorIdBack && !vendorSelfie && !vendorInsurance && !vendorRoadworthy) {
      Alert.alert("Missing files", "Select at least one vendor document.");
      return;
    }

    const form = new FormData();
    if (vendorIdFront) form.append("id_front", buildFilePart(vendorIdFront, "vendor_id_front.jpg", "image/jpeg"));
    if (vendorIdBack) form.append("id_back", buildFilePart(vendorIdBack, "vendor_id_back.jpg", "image/jpeg"));
    if (vendorSelfie) form.append("selfie_photo", buildFilePart(vendorSelfie, "vendor_selfie.jpg", "image/jpeg"));
    if (vendorInsurance) form.append("insurance_doc", buildFilePart(vendorInsurance, "insurance.pdf", "application/pdf"));
    if (vendorRoadworthy) form.append("roadworthy_doc", buildFilePart(vendorRoadworthy, "roadworthy.pdf", "application/pdf"));

    try {
      const resp = await fetch(`${baseUrl}/api/v1/vendors/me/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `Vendor docs submit failed: ${resp.status}`);
      }
      setStatusMessage("Vendor documents submitted for admin review");
      Alert.alert("Success", "Vendor documents submitted.");
    } catch (error) {
      Alert.alert("Vendor documents submit failed", String(error));
    }
  }

  function toggleVehicleType(type: string) {
    setVendorRegVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((v) => v !== type) : [...prev, type]
    );
  }

  function vendorCanProceed() {
    if (vendorStep === 1) {
      return (
        vendorRegFullName.trim() &&
        vendorRegEmail.trim() &&
        vendorRegPhone.trim() &&
        vendorRegIdType.trim() &&
        vendorRegIdNumber.trim()
      );
    }
    if (vendorStep === 2) {
      return vendorRegVehicleTypes.length > 0 && vendorRegVehicleRegNumber.trim();
    }
    if (vendorStep === 3) {
      return vendorRegRegions.trim().length > 0;
    }
    return vendorRegTermsAccepted && vendorRegInsuranceAccepted && vendorRegBackgroundAccepted;
  }

  async function submitVendorRegistration() {
    try {
      const payload = {
        full_name: vendorRegFullName,
        email: vendorRegEmail,
        phone: vendorRegPhone,
        id_type: vendorRegIdType,
        id_number: vendorRegIdNumber,
        vehicle_types: vendorRegVehicleTypes,
        vehicle_reg_number: vendorRegVehicleRegNumber,
        vehicle_model: vendorRegVehicleModel || null,
        vehicle_year: vendorRegVehicleYear || null,
        business_name: vendorRegBusinessName || null,
        business_type: vendorRegBusinessType,
        operating_regions: vendorRegRegions
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        years_experience: vendorRegYearsExperience || null,
        terms_accepted: vendorRegTermsAccepted,
        insurance_accepted: vendorRegInsuranceAccepted,
        background_check_accepted: vendorRegBackgroundAccepted,
      };

      const resp = await fetch(`${baseUrl}/api/v1/vendors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `Vendor registration failed: ${resp.status}`);
      }

      const data = await resp.json();
      Alert.alert("Submitted", data.message || "Vendor registration submitted.");
      setStatusMessage("Vendor registration submitted for review");
    } catch (error) {
      Alert.alert("Vendor registration failed", String(error));
    }
  }

  async function createSupportTicket() {
    if (!supportTenantId || !supportName || !supportSubject || !supportDescription) {
      Alert.alert("Missing fields", "Tenant, name, subject, and description are required.");
      return;
    }
    try {
      const payload = {
        tenant_id: supportTenantId,
        public_submitter_name: supportName,
        public_submitter_email: supportEmail || null,
        subject: supportSubject,
        description: supportDescription,
        category: supportCategory,
        priority: supportPriority,
        shipment_reference: supportShipmentRef || null,
        tracking_reference: supportTrackingRef || null,
      };
      const resp = await fetch(
        `${baseUrl}/api/v1/support-crm/public/tickets?tenant_id=${encodeURIComponent(supportTenantId)}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
      );
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `Ticket creation failed: ${resp.status}`);
      }
      const data = (await resp.json()) as SupportTicket;
      setSupportTrackedTicket(data);
      setSupportTrackToken(data.public_token);
      setStatusMessage(`Ticket created: ${data.public_token}`);
      Alert.alert("Ticket created", `Tracking token: ${data.public_token}`);
    } catch (error) {
      Alert.alert("Create ticket failed", String(error));
    }
  }

  async function trackSupportTicket() {
    if (!supportTenantId || !supportTrackToken) {
      Alert.alert("Missing fields", "Provide tenant ID/slug and public ticket token.");
      return;
    }
    try {
      const ticketResp = await fetch(
        `${baseUrl}/api/v1/support-crm/public/tickets/${supportTrackToken}?tenant_id=${encodeURIComponent(supportTenantId)}`
      );
      if (!ticketResp.ok) {
        const body = await ticketResp.text();
        throw new Error(body || `Ticket lookup failed: ${ticketResp.status}`);
      }
      const ticket = (await ticketResp.json()) as SupportTicket;
      setSupportTrackedTicket(ticket);

      const msgResp = await fetch(
        `${baseUrl}/api/v1/support-crm/public/tickets/${supportTrackToken}/messages?tenant_id=${encodeURIComponent(supportTenantId)}`
      );
      if (!msgResp.ok) {
        const body = await msgResp.text();
        throw new Error(body || `Ticket messages failed: ${msgResp.status}`);
      }
      const msgs = (await msgResp.json()) as SupportTicketMessage[];
      setSupportTrackedMessages(msgs || []);
      setStatusMessage("Support ticket loaded");
    } catch (error) {
      Alert.alert("Track ticket failed", String(error));
    }
  }

  async function replySupportTicket() {
    if (!supportTenantId || !supportTrackToken || !supportReplyBody.trim()) {
      Alert.alert("Missing fields", "Provide tenant ID, token, and reply message.");
      return;
    }
    try {
      const resp = await fetch(
        `${baseUrl}/api/v1/support-crm/public/tickets/${supportTrackToken}/reply?tenant_id=${encodeURIComponent(supportTenantId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: supportReplyBody,
            author_type: "public",
            author_name: supportName || "Mobile User",
            visible_to_public: true,
          }),
        }
      );
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `Ticket reply failed: ${resp.status}`);
      }
      setSupportReplyBody("");
      await trackSupportTicket();
      setStatusMessage("Reply sent to support ticket");
    } catch (error) {
      Alert.alert("Reply failed", String(error));
    }
  }

  async function toggleGps() {
    if (!token) return;
    if (!activeTrackingBooking?.shipment_id) {
      Alert.alert("No active shipment", "Accept or start a booking with shipment to send tracking.");
      return;
    }

    if (gpsEnabled) {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setGpsEnabled(false);
      setStatusMessage("GPS tracking stopped");
      return;
    }

    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 15,
        timeInterval: 15000,
      },
      async (position) => {
        try {
          await sendTrackingPoint(position.coords.latitude, position.coords.longitude);
          setStatusMessage(
            `Tracking sent: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
          );
        } catch (error) {
          setStatusMessage(`Tracking send failed: ${String(error)}`);
        }
      }
    );

    locationSubRef.current = sub;
    setGpsEnabled(true);
    setStatusMessage("GPS tracking started");
  }

  if (appMode === "web") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.webToolbar}>
          <Text style={styles.webTitle}>Afruheritage Mobile</Text>
          <View style={styles.rowWrap}>
            <Pressable
              style={[styles.secondaryBtn, !webCanGoBack ? styles.disabledBtn : null]}
              onPress={() => webRef.current?.goBack()}
              disabled={!webCanGoBack}
            >
              <Text style={styles.btnText}>Back</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryBtn, !webCanGoForward ? styles.disabledBtn : null]}
              onPress={() => webRef.current?.goForward()}
              disabled={!webCanGoForward}
            >
              <Text style={styles.btnText}>Forward</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => webRef.current?.reload()}>
              <Text style={styles.btnText}>Reload</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setAppMode("native")}>
              <Text style={styles.btnText}>Native Tools</Text>
            </Pressable>
          </View>
        </View>
        <WebView
          ref={webRef}
          source={{ uri: webUrl }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          startInLoadingState
          onLoadStart={() => setWebLoading(true)}
          onLoadEnd={() => setWebLoading(false)}
          onNavigationStateChange={(state) => {
            setWebCanGoBack(state.canGoBack);
            setWebCanGoForward(state.canGoForward);
            setWebUrl(state.url);
          }}
          style={styles.webView}
        />
        {webLoading ? (
          <View style={styles.webLoadingOverlay}>
            <ActivityIndicator size="small" />
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.loginCard}>
          <Text style={styles.title}>Driver App</Text>
          <Text style={styles.small}>Use "Use Full App" for full web features in mobile view.</Text>
          <TextInput value={baseUrl} onChangeText={setBaseUrl} style={styles.input} placeholder="API base URL" />
          <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" autoCapitalize="none" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="Password"
            secureTextEntry
          />
          <Pressable style={styles.primaryBtn} onPress={login}>
            <Text style={styles.btnText}>Login</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setAppMode("web")}>
            <Text style={styles.btnText}>Use Full App</Text>
          </Pressable>
          {loading && <ActivityIndicator />}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.brandRow}>
          <Image source={require("./assets/afruheritage-logo.png")} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Afruheritage Driver</Text>
            <Text style={styles.small}>AI-Powered Freight Forwarding Platform</Text>
          </View>
        </View>

        <View style={styles.rowWrap}>
          {[
            { key: "operations", label: "Operations" },
            { key: "tracking", label: "Tracking" },
            { key: "kyc", label: "KYC" },
            { key: "vendorDocs", label: "Vendor Docs" },
            { key: "vendorJoin", label: "Vendor Join" },
            { key: "support", label: "Support" },
            { key: "parity", label: "Parity" },
          ].map((item) => (
            <Pressable
              key={item.key}
              style={[styles.chip, tab === item.key ? styles.tabChipActive : null]}
              onPress={() => setTab(item.key as MobileTab)}
            >
              <Text style={styles.chipText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Pressable style={styles.primaryBtn} onPress={() => void refreshBookings()}>
            <Text style={styles.btnText}>Refresh Offers</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => setAppMode("web")}>
            <Text style={styles.btnText}>Full App</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={logout}>
            <Text style={styles.btnText}>Logout</Text>
          </Pressable>
        </View>

        {tab === "operations" ? (
          <>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.rowWrap}>
              {["offline", "available", "en_route_pickup", "delivering"].map((item) => (
                <Pressable
                  key={item}
                  style={[styles.chip, availability === item ? styles.chipActive : null]}
                  onPress={() => void updateAvailability(item)}
                >
                  <Text style={styles.chipText}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Live GPS</Text>
            <Pressable style={gpsEnabled ? styles.warnBtn : styles.primaryBtn} onPress={() => void toggleGps()}>
              <Text style={styles.btnText}>{gpsEnabled ? "Stop GPS" : "Start GPS"}</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>My Bookings</Text>
            {bookings.length === 0 ? <Text style={styles.small}>No bookings yet.</Text> : null}
            {bookings.map((b) => (
              <View key={b.id} style={styles.bookingCard}>
                <Text style={styles.bookingTitle}>{b.status.toUpperCase()}</Text>
                <Text style={styles.small}>Pickup: {b.pickup_address || "-"}</Text>
                <Text style={styles.small}>Delivery: {b.delivery_address || "-"}</Text>
                <Text style={styles.small}>Offer expires: {b.offer_expires_at || "-"}</Text>
                {b.status === "requested" ? (
                  <View style={styles.row}>
                    <Pressable style={styles.primaryBtn} onPress={() => void decideBooking(b.id, "accept")}>
                      <Text style={styles.btnText}>Accept</Text>
                    </Pressable>
                    <Pressable style={styles.warnBtn} onPress={() => void decideBooking(b.id, "reject")}>
                      <Text style={styles.btnText}>Reject</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        ) : null}

        {tab === "tracking" ? (
          <>
            <Text style={styles.sectionTitle}>Shipment Tracking</Text>
            <TextInput style={styles.input} value={trackingTenantId} onChangeText={setTrackingTenantId} placeholder="Tenant ID" />
            <TextInput style={styles.input} value={trackingShipmentId} onChangeText={setTrackingShipmentId} placeholder="Shipment ID" />
            <Pressable style={styles.primaryBtn} onPress={() => void loadTrackingReadModels()}>
              <Text style={styles.btnText}>Load Latest + History</Text>
            </Pressable>

            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>Latest Point</Text>
              <Text style={styles.small}>{trackingLatest ? JSON.stringify(trackingLatest) : "No data loaded"}</Text>
            </View>
            <View style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>History (last 50)</Text>
              <Text style={styles.small}>{trackingHistory.length} point(s)</Text>
            </View>
          </>
        ) : null}

        {tab === "kyc" ? (
          <>
            <Text style={styles.sectionTitle}>KYC Submission</Text>
            <TextInput style={styles.input} value={kycFullName} onChangeText={setKycFullName} placeholder="Full Name" />
            <TextInput style={styles.input} value={kycIdType} onChangeText={setKycIdType} placeholder="ID Type" />
            <TextInput style={styles.input} value={kycIdNumber} onChangeText={setKycIdNumber} placeholder="ID Number" />
            <View style={styles.rowWrap}>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setKycIdFront)}><Text style={styles.btnText}>Pick ID Front</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setKycIdBack)}><Text style={styles.btnText}>Pick ID Back</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setKycLivePhoto)}><Text style={styles.btnText}>Pick Liveness Photo</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickVideo(setKycLiveVideo)}><Text style={styles.btnText}>Pick Liveness Video</Text></Pressable>
            </View>
            <Pressable style={styles.primaryBtn} onPress={() => void submitKyc()}>
              <Text style={styles.btnText}>Submit KYC</Text>
            </Pressable>
          </>
        ) : null}

        {tab === "vendorDocs" ? (
          <>
            <Text style={styles.sectionTitle}>Vendor Documents</Text>
            <View style={styles.rowWrap}>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setVendorIdFront)}><Text style={styles.btnText}>ID Front</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setVendorIdBack)}><Text style={styles.btnText}>ID Back</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickImage(setVendorSelfie)}><Text style={styles.btnText}>Selfie</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickDocument(setVendorInsurance)}><Text style={styles.btnText}>Insurance</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void pickDocument(setVendorRoadworthy)}><Text style={styles.btnText}>Roadworthy</Text></Pressable>
            </View>
            <Pressable style={styles.primaryBtn} onPress={() => void submitVendorDocuments()}>
              <Text style={styles.btnText}>Submit Vendor Docs</Text>
            </Pressable>
          </>
        ) : null}

        {tab === "vendorJoin" ? (
          <>
            <Text style={styles.sectionTitle}>Vendor Registration</Text>
            <Text style={styles.small}>Step {vendorStep} of 4</Text>

            {vendorStep === 1 ? (
              <>
                <TextInput style={styles.input} value={vendorRegFullName} onChangeText={setVendorRegFullName} placeholder="Full Name" />
                <TextInput style={styles.input} value={vendorRegEmail} onChangeText={setVendorRegEmail} placeholder="Email" autoCapitalize="none" />
                <TextInput style={styles.input} value={vendorRegPhone} onChangeText={setVendorRegPhone} placeholder="Phone" />
                <TextInput style={styles.input} value={vendorRegIdType} onChangeText={setVendorRegIdType} placeholder="ID Type" />
                <TextInput style={styles.input} value={vendorRegIdNumber} onChangeText={setVendorRegIdNumber} placeholder="ID Number" />
              </>
            ) : null}

            {vendorStep === 2 ? (
              <>
                <Text style={styles.small}>Vehicle types</Text>
                <View style={styles.rowWrap}>
                  {["truck", "car", "motorbike", "bicycle"].map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.chip, vendorRegVehicleTypes.includes(type) ? styles.chipActive : null]}
                      onPress={() => toggleVehicleType(type)}
                    >
                      <Text style={styles.chipText}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  value={vendorRegVehicleRegNumber}
                  onChangeText={setVendorRegVehicleRegNumber}
                  placeholder="Vehicle Registration Number"
                />
                <TextInput style={styles.input} value={vendorRegVehicleModel} onChangeText={setVendorRegVehicleModel} placeholder="Vehicle Model" />
                <TextInput style={styles.input} value={vendorRegVehicleYear} onChangeText={setVendorRegVehicleYear} placeholder="Vehicle Year" />
              </>
            ) : null}

            {vendorStep === 3 ? (
              <>
                <TextInput style={styles.input} value={vendorRegBusinessName} onChangeText={setVendorRegBusinessName} placeholder="Business Name (optional)" />
                <TextInput style={styles.input} value={vendorRegBusinessType} onChangeText={setVendorRegBusinessType} placeholder="Business Type (individual/registered/fleet)" />
                <TextInput style={styles.input} value={vendorRegRegions} onChangeText={setVendorRegRegions} placeholder="Operating Regions (comma-separated)" />
                <TextInput style={styles.input} value={vendorRegYearsExperience} onChangeText={setVendorRegYearsExperience} placeholder="Years of Experience" />
              </>
            ) : null}

            {vendorStep === 4 ? (
              <>
                <Pressable style={[styles.chip, vendorRegTermsAccepted ? styles.chipActive : null]} onPress={() => setVendorRegTermsAccepted((v) => !v)}>
                  <Text style={styles.chipText}>Accept Terms</Text>
                </Pressable>
                <Pressable style={[styles.chip, vendorRegInsuranceAccepted ? styles.chipActive : null]} onPress={() => setVendorRegInsuranceAccepted((v) => !v)}>
                  <Text style={styles.chipText}>Accept Insurance Requirement</Text>
                </Pressable>
                <Pressable style={[styles.chip, vendorRegBackgroundAccepted ? styles.chipActive : null]} onPress={() => setVendorRegBackgroundAccepted((v) => !v)}>
                  <Text style={styles.chipText}>Accept Background Check</Text>
                </Pressable>
              </>
            ) : null}

            <View style={styles.row}>
              {vendorStep > 1 ? (
                <Pressable style={styles.secondaryBtn} onPress={() => setVendorStep((vendorStep - 1) as 1 | 2 | 3 | 4)}>
                  <Text style={styles.btnText}>Back</Text>
                </Pressable>
              ) : null}
              {vendorStep < 4 ? (
                <Pressable
                  style={vendorCanProceed() ? styles.primaryBtn : styles.disabledBtn}
                  onPress={() => {
                    if (!vendorCanProceed()) {
                      Alert.alert("Incomplete", "Complete current step fields before continuing.");
                      return;
                    }
                    setVendorStep((vendorStep + 1) as 1 | 2 | 3 | 4);
                  }}
                >
                  <Text style={styles.btnText}>Next</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={vendorCanProceed() ? styles.primaryBtn : styles.disabledBtn}
                  onPress={() => {
                    if (!vendorCanProceed()) {
                      Alert.alert("Incomplete", "Accept all agreements before submitting.");
                      return;
                    }
                    void submitVendorRegistration();
                  }}
                >
                  <Text style={styles.btnText}>Submit Registration</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        {tab === "support" ? (
          <>
            <Text style={styles.sectionTitle}>Help Center</Text>

            <Text style={styles.small}>Create Ticket</Text>
            <TextInput style={styles.input} value={supportTenantId} onChangeText={setSupportTenantId} placeholder="Tenant ID or slug" />
            <TextInput style={styles.input} value={supportName} onChangeText={setSupportName} placeholder="Full Name" />
            <TextInput style={styles.input} value={supportEmail} onChangeText={setSupportEmail} placeholder="Email (optional)" autoCapitalize="none" />
            <TextInput style={styles.input} value={supportCategory} onChangeText={setSupportCategory} placeholder="Category (shipment/tracking/billing...)" />
            <TextInput style={styles.input} value={supportPriority} onChangeText={setSupportPriority} placeholder="Priority (low/medium/high/urgent)" />
            <TextInput style={styles.input} value={supportShipmentRef} onChangeText={setSupportShipmentRef} placeholder="Shipment Reference (optional)" />
            <TextInput style={styles.input} value={supportTrackingRef} onChangeText={setSupportTrackingRef} placeholder="Tracking Reference (optional)" />
            <TextInput style={styles.input} value={supportSubject} onChangeText={setSupportSubject} placeholder="Subject" />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={supportDescription}
              onChangeText={setSupportDescription}
              placeholder="Describe your issue"
              multiline
            />
            <Pressable style={styles.primaryBtn} onPress={() => void createSupportTicket()}>
              <Text style={styles.btnText}>Submit Ticket</Text>
            </Pressable>

            <Text style={styles.small}>Track Ticket</Text>
            <TextInput style={styles.input} value={supportTrackToken} onChangeText={setSupportTrackToken} placeholder="Public Ticket Token" autoCapitalize="none" />
            <Pressable style={styles.secondaryBtn} onPress={() => void trackSupportTicket()}>
              <Text style={styles.btnText}>Track Ticket</Text>
            </Pressable>

            {supportTrackedTicket ? (
              <View style={styles.bookingCard}>
                <Text style={styles.bookingTitle}>{supportTrackedTicket.subject}</Text>
                <Text style={styles.small}>Status: {supportTrackedTicket.status}</Text>
                <Text style={styles.small}>Priority: {supportTrackedTicket.priority}</Text>
                <Text style={styles.small}>Token: {supportTrackedTicket.public_token}</Text>
                <Text style={styles.small}>GLPI Ticket: {supportTrackedTicket.glpi_ticket_id || "Pending sync"}</Text>
                <Text style={styles.small}>{supportTrackedTicket.description}</Text>
                <Text style={styles.small}>Public Messages: {supportTrackedMessages.length}</Text>
              </View>
            ) : null}

            {supportTrackedTicket ? (
              <>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={supportReplyBody}
                  onChangeText={setSupportReplyBody}
                  placeholder="Reply to this ticket"
                  multiline
                />
                <Pressable style={styles.primaryBtn} onPress={() => void replySupportTicket()}>
                  <Text style={styles.btnText}>Send Reply</Text>
                </Pressable>
                {supportTrackedMessages.map((msg) => (
                  <View key={msg.id} style={styles.bookingCard}>
                    <Text style={styles.small}>{msg.author_name || msg.author_type}</Text>
                    <Text style={styles.small}>{msg.body}</Text>
                  </View>
                ))}
              </>
            ) : null}

            <View style={styles.bookingCard}>
              <Text style={styles.small}>Urgent contacts</Text>
              <Pressable onPress={() => void Linking.openURL("mailto:support@afruheritage.com")}>
                <Text style={styles.linkText}>support@afruheritage.com</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL("tel:+233000000000")}>
                <Text style={styles.linkText}>+233 (0) 00 000 0000</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {tab === "parity" ? (
          <>
            <Text style={styles.sectionTitle}>Web vs Mobile Feature Parity</Text>
            <Text style={styles.small}>
              Deep-dive matrix from current code and API integrations.
            </Text>
            {parityRows.map((row) => {
              const web = statusStyle(row.web);
              const mobile = statusStyle(row.mobile);
              return (
                <View key={row.feature} style={styles.bookingCard}>
                  <Text style={styles.bookingTitle}>{row.feature}</Text>
                  <View style={styles.rowWrap}>
                    <View style={[styles.statusPill, { backgroundColor: web.bg, borderColor: web.border }]}>
                      <Text style={[styles.statusPillText, { color: web.fg }]}>Web: {row.web}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: mobile.bg, borderColor: mobile.border }]}>
                      <Text style={[styles.statusPillText, { color: mobile.fg }]}>Mobile: {row.mobile}</Text>
                    </View>
                  </View>
                  <Text style={styles.small}>{row.note}</Text>
                </View>
              );
            })}
          </>
        ) : null}

        <Text style={styles.status}>{statusMessage}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f9fa",
  },
  screen: {
    padding: 16,
    gap: 12,
  },
  loginCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    gap: 10,
  },
  webToolbar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e7ef",
    gap: 8,
  },
  webTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3a4a",
  },
  webView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webLoadingOverlay: {
    position: "absolute",
    right: 16,
    top: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a3a4a",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f4252",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d2d8e0",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: "#1a3a4a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtn: {
    backgroundColor: "#40606f",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  warnBtn: {
    backgroundColor: "#9a3c17",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  disabledBtn: {
    backgroundColor: "#8ca0ab",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  chip: {
    borderWidth: 1,
    borderColor: "#b8c2cf",
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipActive: {
    borderColor: "#d3a33f",
    backgroundColor: "#fff7df",
  },
  tabChipActive: {
    borderColor: "#1a3a4a",
    backgroundColor: "#dff1f6",
  },
  chipText: {
    color: "#253b5f",
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e1e7ef",
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a3a4a",
  },
  small: {
    color: "#3f4f67",
    fontSize: 13,
  },
  linkText: {
    color: "#1a3a4a",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  status: {
    color: "#31596a",
    fontSize: 13,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
