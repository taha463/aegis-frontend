import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Minus, Plus } from "lucide-react"; // only used in FAQ

// Shared Components
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

// Components & Firebase
import AegisAssist from "../../components/layout/AegisAssist";
import { auth } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";

// Import CSS
import "./Forhelp.css";

const Forhelp = () => {
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState("Locating...");
  const [date, setDate] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // FAQ toggle
  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Date updater
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = today.toLocaleString("en-GB", { month: "long" });
      const year = today.getFullYear();
      setDate(`${day} ${month}, ${year}`);
    };
    updateDate();
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );
    const timeout = setTimeout(updateDate, nextMidnight - now);
    return () => clearTimeout(timeout);
  }, []);

  // Profile fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("http://localhost:8000/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setProfile(data);
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Geolocation for city name (passed to Header)
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

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // User object for Header
  const user = {
    name: profile?.fullName || profile?.name || "User",
    email: profile?.email || "",
    location: cityName || "Locating...",
  };

  return (
    <div className="dashboard-container citizen-help">
      {" "}
      {/* added citizen-help class */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="Main-Card">
          <div className="header-row">
            <div>
              <h1 className="dashboard-title-h1">
                What can we <span style={{ color: "#244d4d" }}>help</span> you
                find?
              </h1>
              <p className="dashboard-title-p">
                Hello, <span>{profile?.fullName || profile?.name}</span>! Here
                are some questions that might help you!
              </p>
            </div>
            <div className="dashboard-date">{date}</div>
          </div>

          <div className="faq-section">
            {/* FAQ items (unchanged) */}
            <div
              className={`faq-item ${openFaqIndex === 0 ? "active" : ""}`}
              onClick={() => toggleFaq(0)}
            >
              <div className="faq-header">
                <span className="faq-title">What this app does?</span>
                {openFaqIndex === 0 ? <Minus size={20} /> : <Plus size={20} />}
              </div>
              {openFaqIndex === 0 && (
                <div className="faq-content">
                  This app shows flood alerts, weather updates, safe shelters,
                  and emergency guidance. It helps you stay informed and safe
                  during heavy rain and flood situations.
                </div>
              )}
            </div>

            <div
              className={`faq-item ${openFaqIndex === 1 ? "active" : ""}`}
              onClick={() => toggleFaq(1)}
            >
              <div className="faq-header">
                <span className="faq-title">How to use?</span>
                {openFaqIndex === 1 ? <Minus size={20} /> : <Plus size={20} />}
              </div>
              {openFaqIndex === 1 && (
                <div className="faq-content">
                  <ul className="faq-list">
                    <li>Check alerts on the dashboard</li>
                    <li>See today's weather</li>
                    <li>Follow safe route if flood alert appears</li>
                    <li>Use the emergency button if you need help</li>
                  </ul>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${openFaqIndex === 2 ? "active" : ""}`}
              onClick={() => toggleFaq(2)}
            >
              <div className="faq-header">
                <span className="faq-title">Some Common Questions</span>
                {openFaqIndex === 2 ? <Minus size={20} /> : <Plus size={20} />}
              </div>
              {openFaqIndex === 2 && (
                <div className="faq-content">
                  <div className="qa-block">
                    <span className="qa-question">
                      Q: Why did I get a flood alert?
                    </span>
                    <p>
                      You received a flood alert because the system detected
                      heavy rain or rising water levels.
                    </p>
                  </div>
                  <div className="qa-block">
                    <span className="qa-question">
                      Q: How do I change my city?
                    </span>
                    <p>
                      You can change your city by tapping the city name shown at
                      the top of the dashboard.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${openFaqIndex === 3 ? "active" : ""}`}
              style={{ borderBottom: "none" }}
              onClick={() => toggleFaq(3)}
            >
              <div className="faq-header">
                <span className="faq-title">Contact & Support</span>
                {openFaqIndex === 3 ? <Minus size={20} /> : <Plus size={20} />}
              </div>
              {openFaqIndex === 3 && (
                <div className="faq-content">
                  <ul className="faq-list">
                    <li>
                      <strong>Emergency Helpline:</strong> 1122
                    </li>
                    <li>
                      <strong>Email Support:</strong> support@aegis-app.com
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Forhelp;
