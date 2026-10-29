import React, { useState, useEffect, useRef } from "react";
import Dashboard from "../../components/Dashboard";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { db } from "../../firebaseconfig";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import API_BASE_URL from "../../config.js";
import { normalizeCoords } from "../../utils/location.js";

// Domain Hooks (Conforms to Aegis System Design v1 - Section 17)
import { useProfile } from "../../hooks/useProfile.js";
import { useWeather } from "../../hooks/useWeather.js";
import { useFloodRisk, useFloodForecast } from "../../hooks/useFloodRisk.js";
import { useShelters } from "../../hooks/useShelters.js";
import { useAlerts } from "../../hooks/useAlerts.js";

const DashboardCitizen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState("Locating...");
  const [requests, setRequests] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // 1. Resilient Domain Data Layer Hooks (3-Hour In-Memory Cache)
  const { profile, status: profileStatus } = useProfile();
  const { weather, status: weatherStatus, relativeTime: weatherTime, ageMinutes: weatherAge } = useWeather(userLocation);
  const { floodRisk, status: floodStatus, relativeTime: floodTime, ageMinutes: floodAge } = useFloodRisk(userLocation);
  const { forecast, status: forecastStatus, relativeTime: forecastTime, ageMinutes: forecastAge } = useFloodForecast(userLocation);
  const { shelters, status: sheltersStatus, relativeTime: sheltersTime, ageMinutes: sheltersAge } = useShelters(userLocation);
  const { alert: activeAlert, status: alertStatus } = useAlerts(floodRisk, cityName);

  const user = {
    name: profile?.fullName || "Citizen",
    email: profile?.email || "",
    location: cityName || "Locating...",
  };

  // 2. Geolocation with Coordinate Normalization (Section 8)
  useEffect(() => {
    let watchId = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy < 2000) {
            const norm = normalizeCoords(latitude, longitude);
            setUserLocation([norm.latitude, norm.longitude]);

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${norm.latitude}&lon=${norm.longitude}`,
              );
              const data = await res.json();
              setCityName(data.address.city || data.address.town || data.address.county || "Taxila");
            } catch (e) {
              setCityName("Local Area");
            }
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 },
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 3. Search Bar Cities
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const toggleChat = () => setShowChat(!showChat);

  useEffect(() => {
    fetch(`${API_BASE_URL}/cities`)
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.warn("[Cities] API unavailable:", err.message));
  }, []);

  // 4. Real-time Emergency Requests Listener (Firestore)
  useEffect(() => {
    try {
      const q = query(
        collection(db, "emergency_requests"),
        orderBy("timestamp", "desc"),
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveAlerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timeFormatted: doc.data().timestamp?.toDate()
            ? doc
              .data()
              .timestamp.toDate()
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Just now",
        }));
        setRequests(liveAlerts);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("[Firestore] Emergency listener offline fallback:", err.message);
    }
  }, []);

  // 5. Outside Click for Search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main
        style={{ flex: 1, transition: "margin-left 0.3s", width: "100%" }}
        className="main-content-area"
      >
        <div className="content-container">
          <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
          <Dashboard
            weather={weather}
            alert={activeAlert}
            forecast={forecast}
            shelters={shelters}
            floodRisk={floodRisk}
            statuses={{
              weather: weatherStatus,
              flood: floodStatus,
              forecast: forecastStatus,
              shelters: sheltersStatus,
              profile: profileStatus,
            }}
            relativeTimes={{
              weather: weatherTime,
              flood: floodTime,
              forecast: forecastTime,
              shelters: sheltersTime,
            }}
            ageMinutes={{
              weather: weatherAge,
              flood: floodAge,
              forecast: forecastAge,
              shelters: sheltersAge,
            }}
          />
        </div>
      </main>

      <style>{`
        .content-container {
          padding: 1rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        @media (min-width: 840px) {
          .main-content-area {
            margin-left: 290px;
          }
          .content-container {
            padding: 20px 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardCitizen;
