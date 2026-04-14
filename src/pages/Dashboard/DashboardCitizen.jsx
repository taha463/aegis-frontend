import React, { useState, useEffect, useRef } from "react";
import Dashboard from "../../components/Dashboard";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { auth, db } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const MapController = ({ position }) => {
  // FIX: useMap comes from react-leaflet, not L
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return null;
};

const DashboardCitizen = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState("Locating...");
  // Add these right below your other useStates!
  const [requests, setRequests] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const user = {
    name: profile?.fullName || "User", // ← fix this
    email: profile?.email || "",
    location: cityName || "Locating...",
  };

  const mockData = {
    weather: {
      temp: 30,
      condition: "Heavy Rain",
      windSpeed: "11 km/h",
      lastUpdated: "2 min ago",
    },
    alert: {
      location: "Lahore (Shahdara Area):",
      details: "Heavy rainfall and rising river levels detected.",
      action: "Evacuate Now and move to nearest safe shelter immediately.",
      timestamp: "04:45 pm",
      timeEstimate: "15 min ago",
    },
    forecast: [
      {
        date: "10/11",
        dayName: "Mon",
        volume: "145k m³/s",
        rain: "38.9 mm",
        level: "Heavy",
      },
      {
        date: "11/11",
        dayName: "Tue",
        volume: "168k m³/s",
        rain: "45.6 mm",
        level: "Very Heavy",
      },
      {
        date: "12/11",
        dayName: "Wed",
        volume: "190k m³/s",
        rain: "47.3 mm",
        level: "Moderate",
      },
      {
        date: "13/11",
        dayName: "Thu",
        volume: "190k m³/s",
        rain: "47.3 mm",
        level: "Normal",
      },
    ],
    shelters: [
      { name: "Govt: Primary School", distance: "3.2 km", status: "OPEN" },
      { name: "Shelter: Jamia Masjid", distance: "5.2 km", status: "OPEN" },
    ],
  };

  //profile data
  useEffect(() => {
    // const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch("http://localhost:8000/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setProfile(data);
          // console.log(profile)
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let watchId = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (accuracy < 1000) {
            setUserLocation([latitude, longitude]);
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              );
              const data = await res.json();
              setCityName(data.address.city || data.address.town || "Taxila");
            } catch (e) {}
          }
        },
        null,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // search bar data
  // --- NEW STATES FOR SEARCH ---
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleChat = () => setShowChat(!showChat);

  // 1. Fetch cities
  useEffect(() => {
    fetch("http://localhost:8000/cities")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.error("API error:", err));
  }, []);

  // 2. Real-time Emergency Requests Listener
  useEffect(() => {
    // Reference the collection created by the Citizen SOS button
    const q = query(
      collection(db, "emergency_requests"),
      orderBy("timestamp", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveAlerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firebase timestamp to readable string
        timeFormatted: doc.data().timestamp?.toDate()
          ? doc
              .data()
              .timestamp.toDate()
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
      }));
      setRequests(liveAlerts);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // 3. Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }
  return (
    <div
      style={{
        backgroundColor: "#ffffffff",
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
            weather={mockData.weather}
            alert={mockData.alert}
            forecast={mockData.forecast}
            shelters={mockData.shelters}
          />
        </div>
      </main>

      <style>{`
        .content-container {
          padding: 1rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* ONLY add left margin if screen is wider than 840px */
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
