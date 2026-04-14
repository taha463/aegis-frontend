import React, { useState, useEffect, useRef } from "react";
import { db as offlineDB } from "../db"; // We use offlineDB to avoid conflict with Firestore 'db'
import { Send } from "lucide-react"; // Optional: for a nice SMS icon

import { getMessaging, getToken } from "firebase/messaging";

import {
  AlertTriangle,
  CloudRain,
  Wind,
  RefreshCw,
  CheckCircle,
  Navigation,
  MapPin,
  ArrowRight,
  Sun,
  Moon,
  Cloud,
  CloudLightning,
  CloudSnow,
  Shield,
  Info,
  Home,
  AlertCircle,
  Droplets,
  Thermometer,
  Building2,
  Users,
  Clock,
  Brain,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";

import { useNavigate, useLocation } from "react-router-dom";

import { db, auth } from "../firebaseconfig";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import Lottie from "lottie-react";

import successAnimation from "../assets/Emailsent!.json";

const DashboardCitizen = ({ weather, forecast, alert, shelters }) => {
  const navigate = useNavigate();

  const locationUrl = useLocation();

  const styles = `

/* --- Layout & Typography --- */

.dashboard-panel { background-color: #fbfbfb; border-radius: 1.5rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(239, 239, 239, 0.1); height: 100%;border: 1px solid #ffffff; font-family: 'Open Sans', sans-serif; }

@media (min-width: 768px) { .dashboard-panel { padding: 2rem; } }

.dashboard-header { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }

@media (min-width: 768px) { .dashboard-header { flex-direction: row; align-items: flex-end; justify-content: space-between; } }

.header-title h1 { font-size: 3rem; color: #111827; margin: 0 0 0.25rem 0; font-family: "League Gothic", sans-serif; font-weight: 400; text-transform: uppercase; letter-spacing: 0.02em; }

.header-title p { color: #6B7280; font-size: 0.95rem; margin: 0; font-family: "Open Sans", sans-serif; }

.header-title span { font-weight: 700; color: #111827; }

.date-badge { padding: 0.5rem 1.5rem; background-color: #F9FAFB; border: 1px solid #016335; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; color: #111827; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-family: "Open Sans", sans-serif; }

.main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }

@media (min-width: 1024px) { .main-grid { grid-template-columns: repeat(12, 1fr); } }

.col-left { display: flex; flex-direction: column; gap: 1.5rem; }

@media (min-width: 1024px) { .col-left { grid-column: span 8; } }

.col-right { display: flex; flex-direction: column; gap: 1.5rem; }

@media (min-width: 1024px) { .col-right { grid-column: span 4; } }

.card { border-radius: 1.5rem; padding: 1.75rem; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); font-family: "Open Sans", sans-serif; }

.card-gray { background-color: #FFFFFF; border: 1px solid #F3F4F6; }

.card-title { font-size: 1.15rem; font-weight: 800; color: #111827; margin-bottom: 1.25rem; position: relative; z-index: 10; margin-top: 0; font-family: "Open Sans", sans-serif; }

.wave-shape-1 { position: absolute; top: -60%; right: -20%; width: 150%; height: 150%; border-radius: 40%; transform: rotate(-10deg); pointer-events: none; z-index: 1; }

.wave-shape-2 { position: absolute; top: -40%; right: -10%; width: 100%; height: 100%; border-radius: 45%; transform: rotate(-20deg); pointer-events: none; z-index: 1; }

.wave-shape-3 { position: absolute; bottom: -40%; left: -20%; width: 100%; height: 100%; border-radius: 40%; transform: rotate(10deg); pointer-events: none; z-index: 1; }

.card-gray .wave-shape-1, .card-gray .wave-shape-2, .card-gray .wave-shape-3 { background: rgba(41, 41, 41, 0.02); }

.alert-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }

@media (min-width: 768px) { .alert-grid { grid-template-columns: repeat(5, 1fr); } }

.main-alert-card { grid-column: span 1; }

@media (min-width: 768px) { .main-alert-card { grid-column: span 3; } }

.card-alert-danger { background: linear-gradient(135deg, #9f1239 0%, #7f1d1d 100%) !important; color: white; box-shadow: 0 10px 20px -5px rgba(153, 27, 27, 0.3); }

.card-alert-danger .wave-shape-1 { background: #771413ff; }

.card-alert-danger .wave-shape-2 { background: #8c0200ff; }

.card-alert-danger .wave-shape-3 { background: #791614ff; }

.card-alert-warning { background-color: #FDE4B9 !important; color: #111827; box-shadow: 0 10px 20px -5px rgba(253, 228, 185, 0.5); }

.card-alert-warning .wave-shape-1 { background: #f9d699b8; }

.card-alert-warning .wave-shape-2 { background: #fddfab86; }

.card-alert-warning .wave-shape-3 { background: #ead1a2dc; }

.card-alert-safe { background-color: #016335 !important; color: white; box-shadow: 0 10px 20px -5px rgba(1, 99, 53, 0.3); }

.card-alert-safe .wave-shape-1 { background: #01502b; }

.card-alert-safe .wave-shape-2 { background: #024526; }

.card-alert-safe .wave-shape-3 { background: #014a28; }

.alert-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; position: relative; z-index: 20; }

.icon-circle-bg { padding: 0.6rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }

.alert-content { position: relative; z-index: 10; display: flex; flex-direction: column; }

.alert-footer { display: flex; justify-content: space-between; font-size: 0.8rem; opacity: 0.8; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.15); margin-top: 1.5rem; }

.card-weather { background-color: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #F3F4F6; }

@media (min-width: 768px) { .card-weather { grid-column: span 2; } }

.weather-content { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }

.weather-temp { font-size: 2.25rem; font-weight: 700; color: #111827; display: block; line-height: 1; margin-bottom: 0.25rem; }

.forecast-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }

@media (min-width: 768px) { .forecast-grid { grid-template-columns: repeat(4, 1fr); } }

.forecast-item { border-radius: 1rem; padding: 1rem; display: flex; flex-direction: column; height: 100%; transition: transform 0.2s ease; align-items: center; text-align: center; }

.bg-heavy { background-color: #FDE4B9; border: 1px solid #FFEDD5; } .txt-heavy { color: #d89b4bff; }

.bg-vheavy { background-color: #FEE4DF; border: 1px solid #FEE2E2; } .txt-vheavy { color: #dc7878ff; }

.bg-mod { background-color: #FDFFCD; border: 1px solid #FEF9C3; } .txt-mod { color: #c8be50ff; }

.bg-norm { background-color: #E1EFDD; border: 1px solid #DCFCE7; } .txt-norm { color: #5bca84ff; }

.card-aware { background-color: rgba(1, 99, 53, 0.20); border: 1px solid #8db29fff; }

.aware-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; position: relative; z-index: 10; }

@media (min-width: 640px) { .aware-grid { grid-template-columns: repeat(2, 1fr); } }

.btn-action { width: 100%; padding: 1rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; color: white; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.025em; border: none; cursor: pointer; transition: all 0.2s; font-family: "Open Sans", sans-serif; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.btn-red { background-color: #8A0909; }

.btn-green { background-color: #03552F; }

.flex-center { display: flex; align-items: center; }

.gap-2 { gap: 0.5rem; }

@keyframes spin { 100% { transform: rotate(360deg); } }

.spin-anim { animation: spin 1s linear infinite; }

.loader-container { display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; position: relative; background-color: #fbfbfb; }

.spinner { position: relative; width: 2.5em; height: 2.5em; transform: rotate(165deg); }

.spinner:before, .spinner:after { content: ""; position: absolute; top: 50%; left: 50%; display: block; width: 0.5em; height: 0.5em; border-radius: 0.25em; transform: translate(-50%, -50%); }

.spinner:before { animation: before8 2s infinite; }

.spinner:after { animation: after6 2s infinite; }

@keyframes before8 {

  0% { width: 0.5em; box-shadow: 1em -0.5em rgba(225, 20, 98, 0.75), -1em 0.5em rgba(111, 202, 220, 0.75); }

  35% { width: 2.5em; box-shadow: 0 -0.5em rgba(225, 20, 98, 0.75), 0 0.5em rgba(111, 202, 220, 0.75); }

  70% { width: 0.5em; box-shadow: -1em -0.5em rgba(225, 20, 98, 0.75), 1em 0.5em rgba(111, 202, 220, 0.75); }

  100% { box-shadow: 1em -0.5em rgba(225, 20, 98, 0.75), -1em 0.5em rgba(111, 202, 220, 0.75); }

}

@keyframes after6 {

  0% { height: 0.5em; box-shadow: 0.5em 1em rgba(61, 184, 143, 0.75), -0.5em -1em rgba(233, 169, 32, 0.75); }

  35% { height: 2.5em; box-shadow: 0.5em 0 rgba(61, 184, 143, 0.75), -0.5em 0 rgba(233, 169, 32, 0.75); }

  70% { height: 0.5em; box-shadow: 0.5em -1em rgba(61, 184, 143, 0.75), -0.5em 1em rgba(233, 169, 32, 0.75); }

  100% { box-shadow: 0.5em 1em rgba(61, 184, 143, 0.75), -0.5em -1em rgba(233, 169, 32, 0.75); }

}

/* Shelter Card Styles */

.shelter-item { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6; }

.shelter-item:last-child { border-bottom: none; }

.shelter-icon { margin-top: 0.2rem; }

.shelter-icon-open { color: #059669; }

.shelter-icon-limited { color: #d97706; }

.shelter-icon-full { color: #dc2626; }

.shelter-name { font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0; }

.shelter-info { font-size: 0.85rem; color: #4B5563; margin: 0.25rem 0 0 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.shelter-capacity { font-size: 0.8rem; color: #6B7280; margin: 0.25rem 0 0 0; font-weight: 500; }

/* No Shelter State */

.no-shelter-container { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 0; }

.no-shelter-icon { width: 48px; height: 48px; margin-bottom: 1rem; color: #9ca3af; }

.no-shelter-text { font-size: 1rem; color: #4b5563; font-weight: 500; line-height: 1.5; max-width: 90%; }

.custom-status-scrollbar::-webkit-scrollbar { 

  width: 4px; 

}

.custom-status-scrollbar::-webkit-scrollbar-track { 

  background: #f9fafb; 

  border-radius: 10px; 

}

.custom-status-scrollbar::-webkit-scrollbar-thumb { 

  background: #e5e7eb; 

  border-radius: 10px; 

}

.custom-status-scrollbar::-webkit-scrollbar-thumb:hover { 

  background: #d1d5db; 

}

`;

  // 1. MEMORY MANAGEMENT
  const [apiData, setApiData] = useState(() => {
    const saved = localStorage.getItem("aegis_last_snapshot");
    return saved ? JSON.parse(saved).data : null;
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("aegis_user_profile");
    return saved ? JSON.parse(saved) : null;
  });

  // 🟢 LOADER LOGIC: Force cache priority
  const [isFetchingData, setIsFetchingData] = useState(() => {
    const saved = localStorage.getItem("aegis_last_snapshot");
    if (saved) return false; // If we have ANY cache, skip the full-screen loader
    return true; // Only show full-screen loader on a fresh install with no data
  });

  // ... (Keep your other states: userLocation, geoCityName, etc.)

  const [userLocation, setUserLocation] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  useEffect(() => {
    const profileTimer = setTimeout(() => {
      console.log("⏱️ Profile check hung. Bypassing Firebase blocker.");
      setLoadingProfile(false);
    }, 6000);
    return () => clearTimeout(profileTimer);
  }, []);

  const [geoCityName, setGeoCityName] = useState("Locating...");

  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const [parsedAlertDetail, setParsedAlertDetail] = useState("");

  const [parsedAlertExpected, setParsedAlertExpected] = useState("");

  const [date, setDate] = useState("");

  const [currentTime, setCurrentTime] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [refreshCount, setRefreshCount] = useState(0);

  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(Date.now());

  const [timeSinceRefresh, setTimeSinceRefresh] = useState("Just Now");

  const [prevCityName, setPrevCityName] = useState("");

  const originalLocationRef = useRef(null);

  // 🚨 ULTIMATE OFFLINE FAILSAFE 🚨
  // If the network is a "black hole" and requests hang infinitely,
  // this forces the loader to stop after 3.5 seconds so the dashboard can render.
  // 🚨 THE ULTIMATE KILL SWITCH 🚨
  // If the browser lies about being online and requests hang,
  // this forces the loader to die after 3 seconds so the UI can load.
  useEffect(() => {
    let failsafeTimer;
    if (isFetchingData) {
      failsafeTimer = setTimeout(() => {
        console.log("⏱️ Request timed out. Forcing dashboard to render.");
        setIsFetchingData(false);
      }, 6000);
    }
    return () => clearTimeout(failsafeTimer);
  }, [isFetchingData]);

  // --- Inside DashboardCitizen Component ---

  // --- 1. Add this State and Effect at the top of DashboardCitizen component ---

  const [ngoStatuses, setNgoStatuses] = useState([]);

  useEffect(() => {
    const fetchNgoData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/get-operations?t=${Date.now()}`,
        );

        if (!response.ok) throw new Error("Backend not responding");

        const data = await response.json();

        console.log("Fetched NGO Data:", data);

        if (Array.isArray(data)) {
          // Filter and reverse

          setNgoStatuses(data.filter((item) => item.city).reverse());
        } else {
          setNgoStatuses([]);
        }
      } catch (err) {
        console.error("Error fetching NGO status:", err);
      }
    };

    fetchNgoData();

    // ❌ REMOVED the setInterval line here so it doesn't loop forever
  }, []); // Empty dependency array means it runs ONLY ONCE on load
  useEffect(() => {
    const syncSOSQueue = async () => {
      if (!navigator.onLine) return;

      const pendingSOS = await offlineDB.sosQueue.toArray();
      if (pendingSOS.length === 0) return;

      console.log(`🔄 Syncing ${pendingSOS.length} pending SOS requests...`);

      for (const sos of pendingSOS) {
        try {
          await addDoc(collection(db, "emergency_requests"), {
            ...sos,
            accuracyType: "Offline Latched GPS",
            timestamp: serverTimestamp(),
          });
          // Remove from local queue after successful sync
          await offlineDB.sosQueue.delete(sos.id);
        } catch (err) {
          console.error("Sync failed for item:", sos.id);
        }
      }
      console.log("✅ All offline SOS requests synced!");
    };

    // Run sync when coming back online
    window.addEventListener("online", syncSOSQueue);
    return () => window.removeEventListener("online", syncSOSQueue);
  }, []);
  const handleNavigateToMap = () => {
    if (userLocation && geoCityName) {
      localStorage.setItem(
        "aegis_map_location",

        JSON.stringify({
          lat: userLocation[0],

          lon: userLocation[1],

          city: geoCityName,

          // ✅ Pass evacuation target so map shows the route immediately

          evacTarget: apiData?.evacuation_plan?.target_lat
            ? {
                lat: apiData.evacuation_plan.target_lat,

                lon: apiData.evacuation_plan.target_lon,

                message: apiData.evacuation_plan.message,

                compassDir: apiData.evacuation_plan.compass_direction,
              }
            : null,

          alertStatus: apiData?.status || "SAFE",
        }),
      );
    }

    navigate("/Aegismap");
  };
  // Helper to calculate distance without internet
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSafetyNavigation = async () => {
    const evacStatus = apiData?.evacuation_plan?.status || "MONITOR_SITUATION";
    const isSafeStatus = evacStatus === "MONITOR_SITUATION";

    // ✅ ONLINE: Always go to map regardless of safe/danger status
    if (navigator.onLine) {
      handleNavigateToMap();
      return;
    }

    // ✅ OFFLINE + SAFE: Show backend message in Urdu
    if (isSafeStatus) {
      window.alert(
        "✅ آگس: ابھی کوئی خطرہ نہیں ہے۔ حالات معمول کے مطابق ہیں۔ انخلاء کی ضرورت نہیں۔",
      );
      return;
    }

    // ✅ OFFLINE + DANGER: Calculate nearest shelter
    if (!userLocation || !userLocation[0]) {
      window.alert("GPS معلوم نہیں ہو سکا۔ براہ کرم لوکیشن آن کریں۔");
      return;
    }

    const uLat = userLocation[0];
    const uLon = userLocation[1];

    const shelters = await offlineDB.shelters.toArray();
    const safePoints = await offlineDB.safePoints.toArray();
    const allSafety = [...shelters, ...safePoints];

    if (allSafety.length === 0) {
      window.alert("آف لائن ڈیٹا موجود نہیں ہے۔ براہ کرم اونچی جگہ منتقل ہوں۔");
      return;
    }

    const nearest = allSafety
      .map((loc) => ({
        ...loc,
        dist: calculateDistance(uLat, uLon, loc.lat, loc.lng),
      }))
      .sort((a, b) => a.dist - b.dist)[0];

    const urduMsg = `آگس الرٹ: قریب ترین محفوظ جگہ '${nearest.name}' ہے۔ فاصلہ: ${nearest.dist.toFixed(1)} کلومیٹر۔ فورا وہاں منتقل ہو جائیں۔`;
    window.location.href = `sms:?body=${encodeURIComponent(urduMsg)}`;
    setTimeout(() => window.alert(`🚀 AEGIS:\n\n${urduMsg}`), 500);
  };

  const handleCombinedSOS = async () => {
    const pushToFirebase = async (lat, lng) => {
      try {
        await addDoc(collection(db, "emergency_requests"), {
          userId: auth.currentUser?.uid || "Anonymous",
          name: profile?.fullName || "Citizen",
          lat,
          lng,
          timestamp: serverTimestamp(),
          status: "Pending",
          entity: "citizen",
        });
        setShowSuccessAnim(true);
      } catch (error) {
        await offlineDB.sosQueue.add({
          lat,
          lng,
          timestamp: Date.now(),
          name: profile?.fullName || "Citizen",
          status: "Pending",
        });
        window.alert("آگس: انٹرنیٹ کمزور ہے۔ آپ کی لوکیشن محفوظ کر لی گئی ہے۔");
      }
    };

    // ✅ FIX: Use already-fetched userLocation from state first
    if (userLocation && userLocation[0] && userLocation[1]) {
      const lat = userLocation[0];
      const lng = userLocation[1];
      if (navigator.onLine) {
        await pushToFirebase(lat, lng);
      } else {
        await offlineDB.sosQueue.add({
          lat,
          lng,
          timestamp: Date.now(),
          name: profile?.fullName || "Citizen",
          status: "Pending",
        });
        window.alert("آف لائن موڈ: آپ کی ہنگامی لوکیشن محفوظ کر لی گئی ہے۔");
      }
      return; // ✅ Stop here, don't call GPS again
    }

    // Fallback: only reach here if userLocation wasn't available
    if (!navigator.geolocation) {
      window.alert("Your browser does not support GPS features.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await pushToFirebase(pos.coords.latitude, pos.coords.longitude);
      },
      () => window.alert("GPS معلوم نہیں ہو سکا۔ براہ کرم لوکیشن آن کریں۔"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );

    // 2. Decide if we use pre-fetched location or fresh GPS
    const finalLat = userLocation ? userLocation[0] : null;
    const finalLon = userLocation ? userLocation[1] : null;

    if (finalLat && finalLon && navigator.onLine) {
      // If we have a fresh location and internet, just send it!
      await pushToFirebase(finalLat, finalLon, "Dashboard Sync GPS");
    } else {
      // 3. Otherwise, get fresh GPS (Works offline too)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (navigator.onLine) {
            await pushToFirebase(lat, lng, "High Precision GPS");
          } else {
            // OFFLINE: Save to Dexie
            await offlineDB.sosQueue.add({
              userId: auth.currentUser?.uid || "Anonymous",
              name: profile?.fullName || "Citizen",
              lat,
              lng,
              timestamp: Date.now(),
              status: "Pending",
              entity: profile?.entity || "citizen",
            });
            window.alert(
              "آف لائن موڈ: لوکیشن محفوظ کر لی گئی۔ انٹرنیٹ آتے ہی بھیج دی جائے گی۔",
            );
          }
        },
        (err) =>
          window.alert("GPS معلوم نہیں ہو سکا۔ براہ کرم لوکیشن آن کریں۔"),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }

    if (!navigator.geolocation) {
      window.alert("Your browser does not support GPS features.");

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        sendSOSToFirebase(
          pos.coords.latitude,

          pos.coords.longitude,

          "High Precision GPS",
        ),

      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            sendSOSToFirebase(
              pos.coords.latitude,

              pos.coords.longitude,

              "Standard Accuracy",
            ),

          () =>
            window.alert(
              "Could not determine location. Please check your device location settings.",
            ),

          { enableHighAccuracy: false, timeout: 10000 },
        );
      },

      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // ✅ Location Setup - FIXED: Updates timestamp on new city

  useEffect(() => {
    const searchParams = new URLSearchParams(locationUrl.search);
    const searchedCity = searchParams.get("city");
    const searchedLat = searchParams.get("lat");
    const searchedLon = searchParams.get("lon");

    // ✅ OFFLINE EARLY ESCAPE: GPS won't work, use cache immediately
    if (!navigator.onLine) {
      // ✅ Read persisted location from localStorage, not the ref
      const savedLoc = localStorage.getItem("aegis_last_location");
      const lastLoc = savedLoc ? JSON.parse(savedLoc) : null;

      if (lastLoc) {
        originalLocationRef.current = lastLoc;
        setUserLocation([lastLoc.lat, lastLoc.lon]);
        setGeoCityName(lastLoc.city);
      } else {
        // Absolute last resort - no location ever saved
        const cachedProfile = localStorage.getItem("aegis_user_profile");
        const savedProfile = cachedProfile ? JSON.parse(cachedProfile) : null;
        const fallbackCity =
          savedProfile?.location || savedProfile?.city || "Last Known Location";
        setUserLocation([31.5204, 74.3587]);
        setGeoCityName(fallbackCity);
        originalLocationRef.current = {
          lat: 31.5204,
          lon: 74.3587,
          city: fallbackCity,
        };
      }
      setIsFetchingData(false);
      return;
    }

    if (searchedCity && searchedCity !== prevCityName) {
      console.log(`🔄 New city detected: ${searchedCity}`);
      setLastRefreshTimestamp(Date.now());
      setTimeSinceRefresh("Just Now");
      setPrevCityName(searchedCity);
      setIsFetchingData(true); // Only here, only for new city search
    }

    if (searchedCity && searchedLat && searchedLon) {
      setUserLocation([parseFloat(searchedLat), parseFloat(searchedLon)]);

      setGeoCityName(searchedCity);

      if (!originalLocationRef.current && "geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;

            const lon = pos.coords.longitude;

            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            )
              .then((res) => res.json())

              .then((data) => {
                if (data && data.address) {
                  const city =
                    data.address.city ||
                    data.address.town ||
                    data.address.county ||
                    "Local Area";

                  originalLocationRef.current = { lat, lon, city };
                }
              })

              .catch(() => {});
          },

          () => {},

          { enableHighAccuracy: false, timeout: 10000 },
        );
      }

      return;
    }

    if (originalLocationRef.current) {
      setUserLocation([
        originalLocationRef.current.lat,

        originalLocationRef.current.lon,
      ]);

      setGeoCityName(originalLocationRef.current.city);

      return;
    }

    const handleFallback = () => {
      const fallbackCity = profile?.location || profile?.city || "Lahore";
      const fallbackLat = 31.5204;
      const fallbackLon = 74.3587;

      originalLocationRef.current = {
        lat: fallbackLat,
        lon: fallbackLon,
        city: fallbackCity,
      };

      setUserLocation([fallbackLat, fallbackLon]);
      setGeoCityName(fallbackCity);

      // ✅ ADD THIS: Stop loader when falling back offline
      if (!navigator.onLine) {
        setIsFetchingData(false);
      }
    };

    if ("geolocation" in navigator) {
      const applyGpsData = (lat, lon) => {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        )
          .then((res) => res.json())
          .then((data) => {
            let city = "Local Area";
            if (data && data.address) {
              city =
                data.address.city ||
                data.address.town ||
                data.address.county ||
                "Local Area";
            }
            originalLocationRef.current = { lat, lon, city };
            // ✅ ADD THIS: Persist so offline load can use it
            localStorage.setItem(
              "aegis_last_location",
              JSON.stringify({ lat, lon, city }),
            );
            setUserLocation([lat, lon]);
            setGeoCityName(city);
          })
          .catch(() => {
            originalLocationRef.current = { lat, lon, city: "Local Area" };
            localStorage.setItem(
              "aegis_last_location",
              JSON.stringify({ lat, lon, city: "Local Area" }),
            );
            setUserLocation([lat, lon]);
            setGeoCityName("Local Area");
            setIsFetchingData(false);
          });
      };
      navigator.geolocation.getCurrentPosition(
        (pos) => applyGpsData(pos.coords.latitude, pos.coords.longitude),

        () => {
          navigator.geolocation.getCurrentPosition(
            (pos) => applyGpsData(pos.coords.latitude, pos.coords.longitude),

            () => handleFallback(),

            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
          );
        },

        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 },
      );
    } else {
      handleFallback();
    }
  }, [locationUrl.search, profile, prevCityName]);

  // ✅ FIXED: Refresh Handler

  const handleRefresh = () => {
    console.log("🔄 Global refresh triggered");

    // 1. Immediately show the global loader
    setIsFetchingData(true);

    // 2. Clear old data to ensure fresh fetch
    setApiData(null);

    // 3. Increment refreshCount to trigger the main useEffect
    setRefreshCount((prev) => prev + 1);

    // 4. Reset the visual timestamp
    setLastRefreshTimestamp(Date.now());
    setTimeSinceRefresh("Just Now");
  };
  // 2. PASTE THE NEW LOGIC HERE:
  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - lastRefreshTimestamp) / 1000);

      if (seconds < 60) {
        setTimeSinceRefresh("Just Now");
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        setTimeSinceRefresh(`${mins} min${mins > 1 ? "s" : ""} ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeSinceRefresh(`${hours} hour${hours > 1 ? "s" : ""} ago`);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [lastRefreshTimestamp]);

  // ✅ Auto-refresh every 1 hour (3600000 ms)

  useEffect(() => {
    const intervalId = setInterval(
      () => {
        console.log("⏰ Auto-refresh triggered (1 hour)");

        handleRefresh();
      },

      60 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, []);

  // ✅ THE "STALE-WHILE-REVALIDATE" FETCH LOGIC (Optimized for 'E' and 'H' networks)
  useEffect(() => {
    let isMounted = true;
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    // 1. Check the vault first
    const savedEntry = localStorage.getItem("aegis_last_snapshot");
    let hasValidCache = false;

    if (savedEntry) {
      const { data, timestamp } = JSON.parse(savedEntry);
      const age = Date.now() - timestamp;

      // If data is less than 3 hours old, SHOW IT IMMEDIATELY.
      if (age < THREE_HOURS) {
        setApiData(data);
        setIsFetchingData(false); // Kill full-screen loader instantly
        hasValidCache = true;
        console.log(
          "⚡ Dashboard loaded instantly from cache (Under 3 hours old).",
        );
      }
    }

    // 2. If we don't have location yet, stop here.
    if (
      !userLocation ||
      userLocation.length !== 2 ||
      geoCityName === "Locating..."
    ) {
      return;
    }

    // 3. BACKGROUND FETCH
    // We always try to get fresh data, but we do it quietly if they already have cache.
    console.log(`📡 Attempting background sync on current network...`);

    // If they have NO cache or it's older than 3 hours, we show the subtle "Refreshing..." state
    if (!hasValidCache) {
      setIsRefreshing(true);
    }

    // Set a timeout specifically for the fetch. If 'E' network takes longer than 10 seconds, give up.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch("http://localhost:8000/update-from-chip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: userLocation[0],
        lon: userLocation[1],
        city: geoCityName,
      }),
      signal: controller.signal, // Connect the timeout to the fetch
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId);
        if (!isMounted) return;

        // Save fresh data to the vault
        setApiData(data);
        localStorage.setItem(
          "aegis_last_snapshot",
          JSON.stringify({ data, timestamp: Date.now() }),
        );

        // Parse human alerts...
        if (data.human_alert) {
          const cleanAlert = data.human_alert.replace(
            /Line\s*\d+\s*:\s*/gi,
            "",
          );
          const lines = cleanAlert
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          if (lines.length > 0) {
            setParsedAlertDetail(lines.slice(0, 2).join(" "));
            setParsedAlertExpected(
              lines.length >= 3 ? lines.slice(2).join(" ") : "",
            );
          } else {
            setParsedAlertDetail(cleanAlert);
          }
        }

        // Sync offline safety points...
        const syncOfflineData = async () => {
          try {
            if (data.evacuation_plan?.nearest_shelters) {
              await offlineDB.shelters.clear();
              await offlineDB.shelters.bulkPut(
                data.evacuation_plan.nearest_shelters.map((s) => ({
                  id: s.id || Math.random(),
                  name: s.name,
                  lat: s.lat,
                  lng: s.lng,
                })),
              );
            }
          } catch (err) {
            console.error("Offline DB sync failed");
          }
        };
        syncOfflineData();

        setLastRefreshTimestamp(Date.now());
        setTimeSinceRefresh("Just Now");
        setIsFetchingData(false);
        setIsRefreshing(false);
        console.log("✅ Fresh data applied successfully.");
      })
      .catch((err) => {
        // If the 'E' network drops or times out after 10 seconds, we land here quietly.
        clearTimeout(timeoutId);
        if (!isMounted) return;

        console.log(
          "⚠️ Network too slow or dropped. Keeping UI on cached data.",
        );
        setIsFetchingData(false);
        setIsRefreshing(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort(); // Clean up if user leaves page
    };
  }, [userLocation, geoCityName, refreshCount]);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const messaging = getMessaging();

          const registration = await navigator.serviceWorker.ready;

          const currentToken = await getToken(messaging, {
            vapidKey:
              "BEgRlWmHSJz8_LHeHCPdMnqq0LpxNu-t5w7by9-jwaDpJr8HDAeuraEHYW5L0xspnTov_-4qu6c7Uvw1NQwYRHI",
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            await fetch("http://localhost:8000/subscribe", {
              method: "POST",

              headers: { "Content-Type": "application/json" },

              body: JSON.stringify({ token: currentToken }),
            });

            console.log("Device securely subscribed to Aegis Flood Alerts.");
          }
        }
      } catch (err) {
        console.error(
          "An error occurred while setting up push notifications:",

          err,
        );
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      setDate(
        now.toLocaleDateString("en-GB", {
          weekday: "long",

          year: "numeric",

          month: "long",

          day: "numeric",
        }),
      );

      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",

          minute: "2-digit",
        }),
      );
    };

    updateDateTime();

    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  // ✅ Auth — MUST also be before the early return

  // ✅ Auth — SECURE OFFLINE FIX
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (navigator.onLine) {
          try {
            const token = await user.getIdToken();
            const response = await fetch("http://localhost:8000/user/profile", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setProfile(data);
            localStorage.setItem("aegis_user_profile", JSON.stringify(data));
          } catch (err) {
            console.log("Online fetch failed, using cache.");
          }
        }
      } else {
        // 🚨 THE LOGIN TRAP FIX 🚨
        // Do NOT use navigator.onLine here. Ghost networks will trick it and kick you out!
        // Instead, check the vault. If they have a profile, let them stay on the dashboard.
        const vaultProfile = localStorage.getItem("aegis_user_profile");
        if (!vaultProfile) {
          console.log("No user and no cache. Redirecting to login.");
          navigate("/login");
        } else {
          console.log(
            "Auth failed or offline, but cache exists. Keeping user on dashboard.",
          );
        }
      }
      setLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 1. First, check if the profile is still loading (The most basic info)

  if (loadingProfile && !profile) {
    return (
      <div className="loader-container">
        <style>{styles}</style>
        <div className="spinner"></div>
      </div>
    );
  }

  // 2. If the user is known but API data (flood info) is still coming,

  // we could either show a loader or just let the dashboard render

  // with "Loading..." placeholders.

  // --- THE GATEKEEPER ---
  // If we are still loading and have no memory, show the spinner.
  if (isFetchingData && !apiData) {
    return (
      <div className="loader-container">
        <style>{styles}</style>
        <div className="spinner"></div>
      </div>
    );
  }

  const alertStatus = apiData?.status || "SAFE";

  const isSafe = alertStatus.includes("SAFE");

  const isWarning =
    alertStatus.includes("WARNING") ||
    alertStatus.includes("PRE-EMPTIVE") ||
    alertStatus.includes("MEDIUM");

  const isDanger = alertStatus.includes("DANGER") && !isWarning;

  const isRainAlert = alertStatus.includes("RAIN_");

  const isRiverAlert = alertStatus.includes("RIVER_");

  const alertClass = isDanger
    ? "card-alert-danger"
    : isWarning
      ? "card-alert-warning"
      : "card-alert-safe";

  const alertTextColor = isWarning ? "#111827" : "white";

  const alertSubTextColor = isWarning
    ? "rgba(17, 24, 39, 0.8)"
    : "rgba(255, 255, 255, 0.9)";

  const alertBorderColor = isWarning
    ? "rgba(17, 24, 39, 0.3)"
    : "rgba(255, 255, 255, 0.4)";

  const alertIconBg = isWarning
    ? "rgba(17, 24, 39, 0.1)"
    : isSafe
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(113, 0, 0, 0.2)";

  const AlertStatusIcon = isSafe ? CheckCircle : AlertTriangle;

  let riverArea = "Local";

  let specificRiverName = "";

  // ✅ FIXED: Use terrain_type and river_name from backend

  if (apiData?.scientific_intel) {
    const terrainType = apiData.scientific_intel.terrain_type || "plain";

    specificRiverName = apiData.scientific_intel.nearest_river_name || "";

    // ✅ Show terrain-specific area name

    if (terrainType === "mountain") {
      riverArea = "Mountain";
    } else if (terrainType === "desert") {
      riverArea = "Desert";
    } else if (terrainType === "coastal") {
      riverArea = "Coastal";
    } else if (terrainType === "river") {
      riverArea = specificRiverName || "River";
    } else if (!apiData.scientific_intel.is_safe_from_river) {
      // ✅ Only show river name if actually close to that river

      const distKm = apiData.scientific_intel.distance_km || 999;

      riverArea = distKm < 50 ? specificRiverName || "River" : "Plain";
    } else {
      riverArea = "Plain";
    }
  }

  // ✅ FIXED: Show terrain context always (removed Non-Flooded override)

  const alertLocationText = `${geoCityName} (${riverArea} Area):`;

  const alertHeading = isDanger
    ? isRainAlert
      ? "HEAVY RAIN DANGER!"
      : "CRITICAL FLOOD ALERT!"
    : isWarning
      ? isRainAlert
        ? "HEAVY RAIN WARNING"
        : "FLOOD WARNING"
      : "SAFE CONDITION";

  const displayWeather = apiData?.current_weather || weather;

  const WeatherIcon = ({ condition, size, color }) => {
    const cond = (condition || "").toLowerCase();

    const currentHour = new Date().getHours();

    const isNight = currentHour >= 18 || currentHour < 6;

    if (cond.includes("thunder") || cond.includes("storm"))
      return <CloudLightning size={size} color={color} />;

    if (cond.includes("snow") || cond.includes("ice"))
      return <CloudSnow size={size} color={color} />;

    if (cond.includes("rain") || cond.includes("drizzle"))
      return <CloudRain size={size} color={color} />;

    if (
      cond.includes("cloud") ||
      cond.includes("overcast") ||
      cond.includes("fog")
    )
      return <Cloud size={size} color={color} />;

    return isNight ? (
      <Moon size={size} color={color} />
    ) : (
      <Sun size={size} color={color} />
    );
  };

  // ✅ PROFESSIONAL THRESHOLDS - PMD & NDMA Standards

  const displayForecast =
    apiData && apiData["4_day_analysis"]
      ? Object.entries(apiData["4_day_analysis"]).map(([key, val], idx) => {
          const d = new Date();

          d.setDate(d.getDate() + idx + 1);

          const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });

          const dateStr = d.toLocaleDateString("en-GB", {
            day: "2-digit",

            month: "2-digit",
          });

          const m3sValue = (val.Cusecs / 35.3147).toFixed(1);

          let level = "Normal";

          let bgClass = "bg-norm";

          let txtClass = "txt-norm";

          const isSafeFromRiver = apiData?.scientific_intel?.is_safe_from_river;

          if (isSafeFromRiver) {
            // 🌧️ URBAN/RAIN AREA THRESHOLDS (PMD Standards)

            if (val.Rain_mm > 60) {
              level = "Very Heavy";

              bgClass = "bg-vheavy";

              txtClass = "txt-vheavy";
            } else if (val.Rain_mm > 30) {
              level = "Heavy";

              bgClass = "bg-heavy";

              txtClass = "txt-heavy";
            } else if (val.Rain_mm > 15) {
              level = "Moderate";

              bgClass = "bg-mod";

              txtClass = "txt-mod";
            }
          } else {
            // 🌊 RIVER FLOOD AREA THRESHOLDS (IRSA & PMD)

            const flowCusecs = val.Cusecs;

            const rainMm = val.Rain_mm;

            const localGate = apiData?.scientific_intel?.risk_source || "";

            let warningThreshold = 150000;

            let dangerThreshold = 450000;

            if (localGate.includes("Indus")) {
              warningThreshold = 400000;

              dangerThreshold = 650000;
            } else if (
              localGate.includes("Chenab") ||
              localGate.includes("Jhelum")
            ) {
              warningThreshold = 150000;

              dangerThreshold = 450000;
            } else if (
              localGate.includes("Ravi") ||
              localGate.includes("Sutlej")
            ) {
              warningThreshold = 65000;

              dangerThreshold = 135000;
            } else if (localGate.includes("Kabul")) {
              warningThreshold = 100000;

              dangerThreshold = 200000;
            }

            const flowRatio = flowCusecs / warningThreshold;

            const isHighRain = rainMm > 30;

            if (
              flowCusecs > dangerThreshold ||
              (flowRatio > 0.9 && isHighRain)
            ) {
              level = "Very Heavy";

              bgClass = "bg-vheavy";

              txtClass = "txt-vheavy";
            } else if (flowCusecs > warningThreshold || flowRatio > 0.7) {
              level = "Heavy";

              bgClass = "bg-heavy";

              txtClass = "txt-heavy";
            } else if (flowRatio > 0.5 || (rainMm > 20 && rainMm <= 30)) {
              level = "Moderate";

              bgClass = "bg-mod";

              txtClass = "txt-mod";
            }
          }

          return {
            date: dateStr,

            dayName: dayName,

            m3s: m3sValue,

            rain: val.Rain_mm + " mm",

            level: level,
          };
        })
      : forecast;

  const limitStr = (str, max) =>
    str && str.length > max ? str.substring(0, max).trim() + "..." : str;

  let aw1 = "Planting native trees absorbs excess water to stop flash floods.";

  let aw2 = "Just 6 inches of fast water can easily knock a person down.";

  let aw3 = "Driving through flooded streets is deadly and must be avoided.";

  if (apiData?.awareness_msg) {
    let facts = apiData.awareness_msg

      .replace(/[\r\n]+/g, " ")

      .split(". ")

      .map((f) => f.trim() + (f.endsWith(".") ? "" : "."))

      .filter((f) => f.length > 10);

    if (facts.length >= 3) {
      aw1 = facts[0];

      aw2 = facts[1];

      aw3 = facts[2];
    }
  }

  const awarenessFacts = [aw1, aw2, aw3];

  const zoneTitle = isSafe
    ? "SAFE ZONE CONFIRMED"
    : isWarning
      ? isRainAlert
        ? "RAIN ALERT ZONE"
        : "ELEVATED RISK ZONE"
      : "FLOOD-PRONE ZONE WARNING";

  const rawContext = isSafe
    ? "You live in a safe area; historical data confirms low flood risk."
    : `You are located in an active floodplain near the ${riverArea} river.`;

  let zoneContext = apiData?.zoning_warning?.context || rawContext;

  let zoneAction =
    apiData?.zoning_warning?.action ||
    (isSafe
      ? "If building nearby, ensure standard safety codes are followed."
      : "Avoid building houses or permanent structures in this high-risk zone.");

  let zoneRecs = isSafe
    ? [
        "Monitor local weather updates.",

        "Keep street drains clear.",

        "Stay educated on flood safety.",
      ]
    : [
        "Use elevated foundations.",

        "Avoid ground-level rooms.",

        "Keep an evacuation plan ready.",
      ];

  if (apiData?.zoning_warning?.recommendations?.length >= 3) {
    zoneRecs = apiData.zoning_warning.recommendations.slice(0, 3);
  }

  const safeEvacMessages = [
    "All clear. You are outside the active danger radius and no evacuation is required at this time.",

    "Status is normal. Your location is safe from riverine flooding, so no evacuation is necessary.",

    "No threats detected. You are in a secure zone, so please continue with your daily routine.",

    "Conditions are stable. There is no need to evacuate as your area is currently safe.",

    "Safety confirmed. You are far from the danger zone, so no movement is required.",
  ];

  // ✅ FIXED: Evacuation Steps - Now properly checks evacuation_plan.status

  console.log("🚨 EVAC DEBUG:", {
    evacStatus: apiData?.evacuation_plan?.status,

    evacMessage: apiData?.evacuation_plan?.message,

    isSafeFromRiver: apiData?.scientific_intel?.is_safe_from_river,

    alertStatus: apiData?.status,
  });

  // ✅ FIXED: Comprehensive Evacuation Guidance logic
  const evacSteps = apiData?.evacuation_plan
    ? [
        {
          id: 1,
          text: `Status: ${apiData.evacuation_plan.status.replace(/_/g, " ")}`,
        },
        {
          id: 2,
          text:
            apiData.evacuation_plan.status.includes("EVACUATE") ||
            apiData.evacuation_plan.status.includes("PREPARE")
              ? apiData.evacuation_plan.message // This shows "Move 15km away" or the shelter name
              : `Conditions are stable. ${geoCityName} is outside the active danger radius.`,
        },
        {
          id: 3,
          text: apiData.evacuation_plan.status.includes("EVACUATE")
            ? apiData.evacuation_plan.target_lat
              ? `Target: Proceed to Coordinates ${apiData.evacuation_plan.target_lat}, ${apiData.evacuation_plan.target_lon}`
              : `Guidance: Follow ${geoCityName} emergency protocols immediately.`
            : "Guidance: No immediate movement required. Monitor local updates.",
        },
        // ✅ Show compass direction only when evacuation is active
        ...(apiData.evacuation_plan.compass_direction &&
        (apiData.evacuation_plan.status.includes("EVACUATE") ||
          apiData.evacuation_plan.status.includes("PREPARE"))
          ? [
              {
                id: 4,
                text: `Compass Direction: Head ${apiData.evacuation_plan.compass_direction} away from the river.`,
              },
            ]
          : []),
      ]
    : [
        { id: 1, text: "Calculating status..." },
        { id: 2, text: "Waiting for backend response..." },
        { id: 3, text: "Checking local routes..." },
      ];
  return (
    <>
      <style>{styles}</style>

      {showSuccessAnim && (
        <div
          style={{
            position: "fixed",

            top: 0,

            left: 0,

            width: "100vw",

            height: "100vh",

            backgroundColor: "rgba(0,0,0,0.6)",

            zIndex: 99999,

            display: "flex",

            justifyContent: "center",

            alignItems: "center",

            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "white",

              padding: "2rem 3rem",

              borderRadius: "1.5rem",

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <Lottie
              animationData={successAnimation}
              loop={false}
              style={{ width: 180, height: 180 }}
              onComplete={() => setShowSuccessAnim(false)}
            />

            <h2
              style={{
                margin: 0,

                color: "#111827",

                fontFamily: "'Open Sans', sans-serif",

                fontSize: "1.5rem",

                fontWeight: "800",
              }}
            >
              SOS Sent Successfully!
            </h2>

            <p
              style={{
                margin: "0.5rem 0 0 0",

                color: "#4B5563",

                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              Location sent to NGO.
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-panel">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Dashboard</h1>

            <p>
              Hello,{" "}
              <span>{profile?.fullName || profile?.name || "Citizen"}</span>{" "}
              Here's today's flood status in your area.
            </p>
          </div>

          <div className="date-badge">{date}</div>
        </div>

        <div className="main-grid">
          <div className="col-left">
            <div className="alert-grid">
              <div className={`card main-alert-card ${alertClass}`}>
                <div className="wave-shape-1"></div>

                <div className="wave-shape-2"></div>

                <div className="wave-shape-3"></div>

                <div className="alert-header">
                  <div
                    className="icon-circle-bg"
                    style={{ backgroundColor: alertIconBg }}
                  >
                    <AlertStatusIcon size={24} color={alertTextColor} />
                  </div>

                  <h2
                    style={{
                      fontSize: "1.25rem",

                      fontWeight: 800,

                      letterSpacing: "0.05em",

                      textTransform: "uppercase",

                      margin: 0,

                      fontFamily: "Open Sans, sans-serif",

                      color: alertTextColor,
                    }}
                  >
                    {alertHeading}
                  </h2>
                </div>

                <div className="alert-content">
                  <div>
                    <p
                      style={{
                        fontWeight: 700,

                        fontSize: "1.25rem",

                        marginBottom: "0.25rem",

                        color: alertTextColor,
                      }}
                    >
                      {alertLocationText}
                    </p>

                    <p
                      style={{
                        fontSize: "0.9rem",

                        opacity: 0.9,

                        paddingLeft: "0.75rem",

                        borderLeft: `3px solid ${alertBorderColor}`,

                        margin: 0,

                        color: alertSubTextColor,

                        whiteSpace: "pre-line",
                      }}
                    >
                      {parsedAlertDetail}
                    </p>
                  </div>

                  <p
                    style={{
                      fontSize: "0.9rem",

                      fontWeight: 600,

                      margin: "0.75rem 0 0 0",

                      color: alertTextColor,
                    }}
                  >
                    {parsedAlertExpected}
                  </p>

                  {/* ✅ ARRIVAL TIME BANNER */}

                  {apiData?.scientific_intel?.arrival_time_text && (
                    <div
                      style={{
                        marginTop: "0.75rem",

                        padding: "0.6rem 0.9rem",

                        borderRadius: "0.6rem",

                        backgroundColor: isWarning
                          ? "rgba(17,24,39,0.1)"
                          : "rgba(255,255,255,0.15)",

                        display: "flex",

                        alignItems: "center",

                        gap: "0.5rem",
                      }}
                    >
                      <Clock size={15} color={alertTextColor} />

                      <p
                        style={{
                          margin: 0,

                          fontSize: "0.85rem",

                          fontWeight: 700,

                          color: alertTextColor,
                        }}
                      >
                        Flood from{" "}
                        {apiData.scientific_intel.arrival_source_gate} arrives
                        in{" "}
                        <span style={{ textDecoration: "underline" }}>
                          {apiData.scientific_intel.arrival_time_text}
                        </span>{" "}
                        (approx.)
                      </p>
                    </div>
                  )}

                  <div className="alert-footer">
                    <span style={{ color: alertSubTextColor }}>
                      {currentTime}
                    </span>

                    <div
                      className="flex-center gap-2"
                      style={{ color: alertSubTextColor, cursor: "pointer" }}
                      onClick={handleRefresh}
                    >
                      <RefreshCw
                        size={14}
                        className={isRefreshing ? "spin-anim" : ""}
                      />

                      <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-weather">
                <div className="wave-shape-1"></div>

                <div className="wave-shape-3"></div>

                <div style={{ position: "relative", zIndex: 10 }}>
                  <h3 className="card-title">Current Weather</h3>

                  <div className="weather-content">
                    <WeatherIcon
                      condition={displayWeather?.condition}
                      size={52}
                      color="#043381ff"
                    />

                    <div>
                      <span className="weather-temp">
                        {displayWeather?.temp}°C
                      </span>

                      <p
                        style={{
                          color: "#085a63ff",

                          fontWeight: 600,

                          fontSize: "1.1rem",

                          margin: 0,
                        }}
                      >
                        {displayWeather?.condition}
                      </p>

                      <div
                        className="flex-center gap-2"
                        style={{
                          color: "#6B7280",

                          marginTop: "0.5rem",

                          fontSize: "0.85rem",
                        }}
                      >
                        <Wind size={16} />

                        <span>Wind: {displayWeather?.windSpeed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="flex-center gap-2"
                  onClick={handleRefresh}
                  style={{
                    fontSize: "0.75rem",

                    color: "#9CA3AF",

                    position: "relative",

                    zIndex: 10,

                    cursor: "pointer",

                    opacity: isRefreshing ? 0.5 : 1,
                  }}
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshing ? "spin-anim" : ""}
                  />

                  <span>
                    {isRefreshing
                      ? "Refreshing..."
                      : `Updated: ${timeSinceRefresh}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="card card-gray">
              <div className="wave-shape-2"></div>

              <h3 className="card-title">
                Forecast Overview ({riverArea} Area Basin)
              </h3>

              <div className="forecast-grid">
                {displayForecast &&
                  displayForecast.map((day, idx) => {
                    let bgClass = "bg-norm";

                    let txtClass = "txt-norm";

                    if (day.level === "Heavy") {
                      bgClass = "bg-heavy";

                      txtClass = "txt-heavy";
                    }

                    if (day.level === "Very Heavy") {
                      bgClass = "bg-vheavy";

                      txtClass = "txt-vheavy";
                    }

                    if (day.level === "Moderate") {
                      bgClass = "bg-mod";

                      txtClass = "txt-mod";
                    }

                    return (
                      <div key={idx} className={`forecast-item ${bgClass}`}>
                        <div
                          style={{
                            display: "flex",

                            justifyContent: "space-between",

                            width: "100%",

                            marginBottom: "0.75rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.75rem",

                              fontWeight: 700,

                              color: "#111827",
                            }}
                          >
                            {day.date}
                          </span>

                          <span
                            style={{
                              fontSize: "0.75rem",

                              fontWeight: 600,

                              color: "#6B7280",
                            }}
                          >
                            {day.dayName}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",

                            flexDirection: "column",

                            gap: "0.25rem",

                            marginBottom: "0.75rem",
                          }}
                        >
                          <div
                            className="flex-center gap-2"
                            style={{ fontSize: "0.75rem", color: "#4B5563" }}
                          >
                            <Wind size={12} />

                            <span>{day.m3s} m³/s</span>
                          </div>

                          <div
                            className="flex-center gap-2"
                            style={{ fontSize: "0.75rem", color: "#4B5563" }}
                          >
                            <CloudRain size={12} />

                            <span>{day.rain}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: "auto" }}>
                          <span
                            className={txtClass}
                            style={{
                              fontSize: "0.7rem",

                              fontWeight: 800,

                              textTransform: "uppercase",

                              letterSpacing: "0.05em",
                            }}
                          >
                            {day.level}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              style={{
                display: "grid",

                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",

                gap: "1.5rem",
              }}
            >
              <div className="card card-gray">
                <div className="wave-shape-1"></div>

                <h3 className="card-title">
                  NGO or Government Shelter Updates
                </h3>

                <div style={{ position: "relative", zIndex: 10 }}>
                  {apiData?.evacuation_plan?.nearest_shelters?.length > 0 ? (
                    apiData.evacuation_plan.nearest_shelters.map((s, idx) => {
                      // ✅ UPDATED ICON: Green Flower Tick from external source

                      const iconColor =
                        s.status === "OPEN"
                          ? "#059669"
                          : s.status === "LIMITED"
                            ? "#d97706"
                            : "#dc2626";

                      return (
                        <div key={idx} className="shelter-item">
                          <div className="shelter-icon">
                            {s.status === "OPEN" ? (
                              <img
                                src="https://img.icons8.com/color/48/verified-badge.png"
                                alt="Verified"
                                style={{ width: "20px", height: "20px" }}
                              />
                            ) : (
                              <CheckCircle size={20} fill={iconColor} />
                            )}
                          </div>

                          <div style={{ flex: 1 }}>
                            <p className="shelter-name">{s.name}</p>

                            <p className="shelter-info">
                              <MapPin size={14} color="#6B7280" />

                              <span>{s.distance_km} km away</span>

                              <span>•</span>

                              <span
                                style={{
                                  fontWeight: 600,

                                  color: iconColor,
                                }}
                              >
                                {s.status}
                              </span>
                            </p>

                            <p className="shelter-capacity">
                              Capacity: {s.occupied}/{s.capacity} people
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-shelter-container">
                      <Building2 className="no-shelter-icon" />

                      <p className="no-shelter-text">
                        {apiData?.evacuation_plan?.shelter_message ||
                          "There is no shelter active in 50 km radius from your location. Stay tuned for further updates."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card card-gray">
                <div className="wave-shape-2"></div>

                <h3 className="card-title">{zoneTitle}</h3>

                <div
                  style={{
                    position: "relative",

                    zIndex: 10,

                    display: "flex",

                    flexDirection: "column",

                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      gap: "0.75rem",

                      alignItems: "flex-start",
                    }}
                  >
                    <ArrowRight
                      size={18}
                      color="#111827"
                      style={{ marginTop: "0.2rem", flexShrink: 0 }}
                    />

                    <p
                      style={{
                        fontSize: "0.9rem",

                        color: "#4B5563",

                        margin: 0,

                        lineHeight: 1.5,
                      }}
                    >
                      {zoneContext}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",

                      gap: "0.75rem",

                      alignItems: "flex-start",
                    }}
                  >
                    <ArrowRight
                      size={18}
                      color="#111827"
                      style={{ marginTop: "0.2rem", flexShrink: 0 }}
                    />

                    <p
                      style={{
                        fontSize: "0.9rem",

                        color: "#4B5563",

                        margin: 0,

                        lineHeight: 1.5,
                      }}
                    >
                      {zoneAction}
                    </p>
                  </div>

                  <div style={{ paddingTop: "0.5rem" }}>
                    <p
                      style={{
                        fontSize: "0.9rem",

                        fontWeight: 700,

                        color: "#111827",

                        margin: "0 0 0.5rem 0",
                      }}
                    >
                      Recommendation:
                    </p>

                    <ul
                      style={{
                        fontSize: "0.9rem",

                        color: "#4B5563",

                        paddingLeft: "1.25rem",

                        margin: 0,

                        listStyleType: "disc",

                        lineHeight: 1.6,
                      }}
                    >
                      {zoneRecs.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div
                  className="flex-center gap-2"
                  onClick={handleRefresh}
                  style={{
                    marginTop: "1.5rem",

                    fontSize: "0.75rem",

                    color: "#9CA3AF",

                    cursor: "pointer",

                    opacity: isRefreshing ? 0.5 : 1,
                  }}
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshing ? "spin-anim" : ""}
                  />

                  <span>
                    {isRefreshing
                      ? "Refreshing..."
                      : `Updated: ${timeSinceRefresh}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="card card-aware">
              <div
                className="wave-shape-1"
                style={{ background: "#aed8c590" }}
              ></div>

              <div
                className="wave-shape-3"
                style={{ background: "rgba(149, 202, 177, 28)" }}
              ></div>

              <div
                className="flex-center gap-2"
                style={{
                  marginBottom: "1rem",

                  position: "relative",

                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    backgroundColor: "#F97316",

                    padding: "0.3rem",

                    borderRadius: "50%",

                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: "0.4rem",

                      height: "0.4rem",

                      backgroundColor: "white",

                      borderRadius: "50%",
                    }}
                  ></div>
                </div>

                <h3
                  style={{
                    fontSize: "1.1rem",

                    fontWeight: 800,

                    color: "#111827",

                    textTransform: "uppercase",

                    letterSpacing: "0.05em",

                    margin: 0,

                    fontFamily: "Open Sans, sans-serif",
                  }}
                >
                  FLOOD AWARENESS
                </h3>
              </div>

              <div className="aware-grid">
                <div
                  style={{
                    display: "flex",

                    flexDirection: "column",

                    gap: "0.75rem",
                  }}
                >
                  {awarenessFacts.slice(0, 2).map((fact, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",

                        gap: "0.75rem",

                        alignItems: "flex-start",
                      }}
                    >
                      <ArrowRight
                        size={16}
                        style={{
                          marginTop: "0.25rem",

                          color: "#374151",

                          flexShrink: 0,
                        }}
                      />

                      <p
                        style={{
                          fontSize: "0.9rem",

                          color: "#374151",

                          margin: 0,

                          fontWeight: 500,
                        }}
                      >
                        {fact}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",

                    flexDirection: "column",

                    gap: "0.75rem",
                  }}
                >
                  {awarenessFacts.slice(2, 3).map((fact, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",

                        gap: "0.75rem",

                        alignItems: "flex-start",
                      }}
                    >
                      <ArrowRight
                        size={16}
                        style={{
                          marginTop: "0.25rem",

                          color: "#374151",

                          flexShrink: 0,
                        }}
                      />

                      <p
                        style={{
                          fontSize: "0.9rem",

                          color: "#374151",

                          margin: 0,

                          fontWeight: 500,
                        }}
                      >
                        {fact}
                      </p>
                    </div>
                  ))}

                  <p
                    style={{
                      fontSize: "0.75rem",

                      color: "#6B7280",

                      fontStyle: "italic",

                      textAlign: "right",

                      marginTop: "0.5rem",

                      marginRight: "0.5rem",
                    }}
                  >
                    Source: NDMA / AI Educator
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-right">
            <div className="card card-gray">
              <div className="wave-shape-1"></div>

              <h3 className="card-title">Flood Monitoring Status</h3>

              {/* SCROLLABLE CONTAINER */}

              <div
                style={{
                  position: "relative",

                  zIndex: 10,

                  display: "flex",

                  flexDirection: "column",

                  gap: "1.25rem",

                  maxHeight: "300px",

                  overflowY: "auto",

                  paddingRight: "8px",
                }}
                className="custom-status-scrollbar"
              >
                {/* CRITICAL CHANGE: We filter the data first. 

       If no report has a .city field, it counts as ZERO data.

    */}

                {ngoStatuses &&
                ngoStatuses.filter((report) => report.city).length > 0 ? (
                  ngoStatuses

                    .filter((report) => report.city) // This removes the empty (Not working) lines

                    .map((report, idx) => {
                      const isHigh = report.alertLevel === "High Alert";

                      const isMed = report.alertLevel === "Medium Alert";

                      const alertColor = isHigh
                        ? "#DC2626"
                        : isMed
                          ? "#EA580C"
                          : "#CA8A04";

                      const workingColor =
                        report.isWorking === "Yes" ? "#059669" : "#DC2626";

                      return (
                        <div
                          key={idx}
                          style={{
                            paddingBottom: "0.75rem",

                            borderBottom: "1px solid #F3F4F6",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.95rem",

                              color: "#111827",

                              margin: 0,

                              display: "flex",

                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>
                              {report.city}
                            </span>

                            <span
                              style={{ color: alertColor, fontWeight: 600 }}
                            >
                              {report.alertLevel}
                            </span>
                          </p>

                          <p
                            style={{
                              fontSize: "0.8rem",

                              color: workingColor,

                              textAlign: "right",

                              margin: "0.25rem 0 0 0",

                              fontWeight: 500,
                            }}
                          >
                            (
                            {report.isWorking === "Yes"
                              ? `${report.organizationName} is working`
                              : "Not working"}
                            )
                          </p>
                        </div>
                      );
                    })
                ) : (
                  /* --- THIS WILL NOW SHOW PROPERLY --- */

                  <div style={{ textAlign: "center", padding: "30px 10px" }}>
                    <AlertCircle
                      size={32}
                      color="#9CA3AF"
                      style={{
                        marginBottom: "10px",

                        display: "block",

                        margin: "0 auto 10px",
                      }}
                    />

                    <p
                      style={{
                        color: "#6B7280",

                        fontSize: "0.95rem",

                        fontWeight: 600,

                        lineHeight: "1.5",

                        margin: 0,
                      }}
                    >
                      There is no current status right now.
                    </p>

                    <p
                      style={{
                        color: "#9ca3af",

                        fontSize: "0.85rem",

                        marginTop: "5px",
                      }}
                    >
                      Stay tuned for further updates!!
                    </p>
                  </div>
                )}
              </div>

              <div
                className="flex-center gap-2"
                onClick={handleRefresh}
                style={{
                  marginTop: "1.5rem",

                  fontSize: "0.75rem",

                  color: "#9CA3AF",

                  cursor: "pointer",
                }}
              >
                <RefreshCw
                  size={12}
                  className={isRefreshing ? "spin-anim" : ""}
                />

                <span>Updated: {timeSinceRefresh}</span>
              </div>
            </div>

            <div className="card card-gray">
              <div className="wave-shape-3"></div>

              <div
                className="flex-center gap-2"
                style={{
                  marginBottom: "1.5rem",

                  position: "relative",

                  zIndex: 10,
                }}
              >
                {/* ✅ UPDATED ICON: Running Person with Wind from external source */}

                <img
                  src="https://img.icons8.com/ios-filled/50/111827/running.png"
                  alt="Running"
                  style={{ width: "24px", height: "24px" }}
                />

                <h3 className="card-title" style={{ margin: 0 }}>
                  Evacuation Guidance
                </h3>
              </div>

              <div
                style={{
                  position: "relative",

                  zIndex: 10,

                  display: "flex",

                  flexDirection: "column",

                  gap: "1.25rem",
                }}
              >
                {evacSteps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      display: "flex",

                      gap: "0.75rem",

                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,

                        color: "#111827",

                        fontSize: "1.1rem",

                        lineHeight: 1,
                      }}
                    >
                      {step.id}.
                    </span>

                    <p
                      style={{
                        fontSize: "0.95rem",

                        color: "#374151",

                        margin: 0,

                        lineHeight: 1.4,

                        fontWeight: 500,
                      }}
                    >
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-gray">
              <div className="wave-shape-1"></div>

              <h3 className="card-title">Action & Guidance Panel</h3>

              <div
                style={{
                  display: "flex",

                  flexDirection: "column",

                  gap: "1rem",

                  position: "relative",

                  zIndex: 10,
                }}
              >
                <button
                  className="btn-action btn-red"
                  onClick={handleCombinedSOS}
                >
                  <div
                    className="icon-circle-bg"
                    style={{ width: "1.5rem", height: "1.5rem", padding: 0 }}
                  >
                    <MapPin size={16} color="white" />
                  </div>

                  <span
                    style={{
                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      gap: "3px",

                      color: "white",

                      fontWeight: "bold",

                      transition: "0.2s",

                      fontSize: "18px",

                      lineHeight: "1.2",

                      textAlign: "center",
                    }}
                  >
                    Live Location share (SOS)
                  </span>
                </button>

                <button
                  className="btn-action btn-green"
                  onClick={handleSafetyNavigation}
                >
                  <div
                    className="icon-circle-bg"
                    style={{ width: "1.5rem", height: "1.5rem", padding: 0 }}
                  >
                    <Navigation size={16} color="white" fill="white" />
                  </div>

                  <span>Navigate to Nearest Shelter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  ); // This closes the return (
};

export default DashboardCitizen;
