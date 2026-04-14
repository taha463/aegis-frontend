import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  MapPin,
  Menu,
  X,
  User,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
} from "lucide-react";
import { getMessaging, onMessage } from "firebase/messaging";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseconfig";

// Assets
import shieldLogo from "../../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";

// Firebase
import { auth } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";

// AegisAssist chatbot
import chatbotIcon from "../../assets/images/chat-bot 1.png";
import AegisAssist from "../../components/layout/AegisAssist";

// CSS — shared layout styles used by all NGO pages
import "../../pages/Dashboard/DashboardNGO.css";

// ─────────────────────────────────────────────
// Helper: avatar background color from name
// ─────────────────────────────────────────────
const getAvatarColor = (name) => {
  const colors = [
    "#CC4400",
    "#8c035e",
    "#0f3853",
    "#134d2b",
    "#bd0b0b",
    "#3d0356",
    "#ff7272",
    "#2C3E50",
    "#C0392B",
    "#624e11",
  ];
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// ─────────────────────────────────────────────
// NGOLayout — sidebar + header shared by all NGO pages
// Child pages rendered via <Outlet context={{ profile }} />
// ─────────────────────────────────────────────
const NGOLayout = () => {
  const location = useLocation();

  // ── Sidebar toggle ──────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Chatbot ─────────────────────────────────
  const [showChat, setShowChat] = useState(false);
  const toggleChat = () => setShowChat((prev) => !prev);

  // ── Profile ─────────────────────────────────
  const [profile, setProfile] = useState(null);

  // ── City search ─────────────────────────────
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchDropdownRef = useRef(null);

  // ── Notifications ───────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // ── Fetch cities ────────────────────────────
  useEffect(() => {
    fetch("http://localhost:8000/cities")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.error("API error:", err));
  }, []);

  // ── Close city search dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── NEW: Dynamic NGO Notification Engine ──────────────────
  useEffect(() => {
    let systemAlerts = [];

    // 1. Fetch only Aegis System Alerts from Python
    const fetchSystemAlerts = async () => {
      try {
        const response = await fetch("http://localhost:8000/ngo-alerts");
        let data = await response.json();

        // Remove 2-day old alerts AND filter out citizen contact forms
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        systemAlerts = data.filter((notif) => {
          const isRecent =
            !notif.created_at || new Date(notif.created_at) >= twoDaysAgo;
          const isSystemAlert = notif.fullName === "Aegis System";
          return isRecent && isSystemAlert;
        });
      } catch (error) {
        console.error("Error fetching system alerts:", error);
      }
    };

    // 2. Listen to Live SOS Requests from Firestore
    const q = query(
      collection(db, "emergency_requests"),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      await fetchSystemAlerts(); // Grab the latest system alerts

      const sosAlerts = snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: ` SOS: ${data.name || "Citizen"}`,
          message: `Needs ${data.need} at Location: ${data.lat?.toFixed(3)}, ${data.lng?.toFixed(3)}`,
          is_read: data.status !== "Pending", // If an NGO marked it active, remove red badge
          created_at:
            data.timestamp?.toDate().toISOString() || new Date().toISOString(),
          isSos: true, // Flag to know how to delete it later
        };
      });

      // 3. Merge and Sort newest to oldest
      const combined = [...systemAlerts, ...sosAlerts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setNotifications(combined);
      setUnreadCount(combined.filter((n) => !n.is_read).length);
    });

    return () => unsubscribe();
  }, []);

  // ── FCM Foreground Listener (For live Python broadcasts) ──
  useEffect(() => {
    const setupFCM = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const messaging = getMessaging();
          const unsubscribe = onMessage(messaging, (payload) => {
            const systemAlert = {
              id: "sys_" + Date.now(),
              name: payload.notification?.title || "System Alert",
              message: payload.notification?.body || "New update",
              is_read: false,
              created_at: new Date().toISOString(),
              isSos: false,
            };
            setNotifications((prev) => [systemAlert, ...prev]);
            setUnreadCount((prev) => prev + 1);
          });
          return () => unsubscribe();
        }
      } catch (error) {
        console.log("FCM foreground listener blocked:", error);
      }
    };
    setupFCM();
  }, []);

  // ── Smart Delete Function ('X' Button) ──
  const handleDeleteNotification = async (e, id, isSos) => {
    e.stopPropagation();

    // Remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const removed = notifications.find((n) => n.id === id);
      return removed && !removed.is_read ? Math.max(0, prev - 1) : prev;
    });

    if (String(id).startsWith("sys_")) return; // Skip temporary live alerts

    try {
      if (isSos) {
        // Delete SOS directly from Firebase
        await deleteDoc(doc(db, "emergency_requests", id));
      } else {
        // Delete System alert from Python backend${id}\`, { method: "DELETE" });`
        await fetch(`http://localhost:8000/ngo-alerts/${id}`, {
          method: "DELETE",
        });
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };
  // ── Mark All As Read ────────────────────────
  const handleMarkAllAsRead = async () => {
    setUnreadCount(0); // Instantly clear the red badge
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);

      // 1. Update UI immediately so the blue unread dots disappear
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true })),
      );

      // 2. Tell Python backend to mark ONLY System Alerts as read
      await Promise.all(
        unreadNotifications.map((notif) => {
          // Ignore SOS alerts (Firebase) and temporary live alerts ("sys_")
          if (!notif.isSos && !String(notif.id).startsWith("sys_")) {
            return fetch(`http://localhost:8000/ngo-alerts/${notif.id}/read`, {
              method: "PUT",
            });
          }
          return Promise.resolve();
        }),
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };
  // ── Dynamic Icons ──
  const getNotificationIcon = (title) => {
    const lowerTitle = (title || "").toLowerCase();
    if (lowerTitle.includes("sos"))
      return (
        <AlertOctagon
          size={16}
          style={{ marginRight: "12px", color: "#a50000" }}
        />
      );
    if (lowerTitle.includes("critical") || lowerTitle.includes("danger"))
      return (
        <AlertOctagon
          size={16}
          style={{ marginRight: "12px", color: "#b70000" }}
        />
      );
    if (lowerTitle.includes("elevated") || lowerTitle.includes("warning"))
      return (
        <AlertTriangle
          size={16}
          style={{ marginRight: "12px", color: "#ffb12a" }}
        />
      );
    if (lowerTitle.includes("safe") || lowerTitle.includes("normal"))
      return (
        <CheckCircle
          size={16}
          style={{ marginRight: "12px", color: "#00852c" }}
        />
      );
    return <User size={16} style={{ marginRight: "12px", color: "#6B7280" }} />;
  };

  // ── Close notification dropdown on outside click ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isNotificationVisible &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationVisible]);

  // ── Fetch profile via Firebase Auth ────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch("http://localhost:8000/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setProfile(data);
        } catch (err) {
          console.error("Fetch error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      {/* ── AegisAssist Chatbot ── */}
      {showChat && <AegisAssist onClose={() => setShowChat(false)} />}

      {/* ── Sidebar Overlay (mobile) ── */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="logo-section">
          <Link to="/" className="logo">
            <img src={shieldLogo} alt="Aegis Shield" className="logo-img" />
            <div className="logo-mark">
              <span className="logo-letter-a">A</span>
            </div>
            <span className="logo-text-rest">egis</span>
          </Link>

          {/* Close button (mobile/tablet) */}
          <button
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav items */}
        <div className="nav-label1">Menu</div>

        <div
          className={`nav-item ${location.pathname === "/DashboardNGO" ? "active" : ""}`}
        >
          <LayoutDashboard size={18} />
          <Link to="/DashboardNGO" className="ngo-auth-link">
            Dashboard
          </Link>
        </div>

        <div
          className={`nav-item ${location.pathname === "/mapview" ? "active" : ""}`}
        >
          <Map size={18} />
          <Link to="/mapview" className="ngo-auth-link">
            Map View
          </Link>
        </div>

        <div className="nav-label2">General</div>

        <div
          className={`nav-item ${location.pathname === "/NGOHelp" ? "active" : ""}`}
        >
          <HelpCircle size={18} />
          <Link to="/NGOHelp" className="ngo-auth-link">
            Help
          </Link>
        </div>

        <div className="nav-item">
          <LogOut size={18} />
          <Link to="/Login" className="ngo-auth-link">
            Logout
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════ */}
      <main className="main-content">
        {/* ── HEADER ── */}
        <header
          className="floating-header-box"
          style={{
            background: "#fbfbfb",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "10px 16px",
            borderRadius: "14px",
            border: "1px solid #f0f0f0",
            marginBottom: "30px",
            gap: "12px",
            minHeight: "58px",
            width: "100%",
            position: "relative",
            zIndex: 1000,
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
        >
          {/* Hamburger — mobile/tablet only via CSS */}
          <button
            className="menu-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: "#f5f5f5",
              border: "1px solid #e8e8e8",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: "38px",
              height: "38px",
              padding: 0,
            }}
          >
            <Menu size={20} color="#333" />
          </button>

          {/* ── City Search ── */}
          <div
            className="ngo-search-wrapper"
            ref={searchDropdownRef}
            style={{ flex: 1, minWidth: 0, position: "relative" }}
          >
            <div
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <Search size={16} color="#9CA3AF" />
            </div>

            <input
              type="text"
              placeholder="Search location..."
              value={searchTerm}
              onFocus={() => setIsDropdownVisible(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 16px 0 40px",
                borderRadius: "12px",
                border: "1px solid #fafafa",
                background: "#ffffff",
                outline: "none",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: "13.5px",
                color: "#111827",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
            />

            {isDropdownVisible && searchTerm && (
              <ul className="search-dropdown-list">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setSearchTerm(city);
                        setIsDropdownVisible(false);
                      }}
                    >
                      <MapPin
                        size={14}
                        style={{ marginRight: "8px", flexShrink: 0 }}
                      />
                      {city}
                    </li>
                  ))
                ) : (
                  <li className="no-result">No cities found</li>
                )}
              </ul>
            )}
          </div>

          {/* ── Right cluster: Bell + Divider + Profile ── */}
          <div
            className="header-right"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            {/* Bell / Notifications */}
            <div
              className="notification-container"
              ref={notificationRef}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const nextState = !isNotificationVisible;
                  setIsNotificationVisible(nextState);
                  if (nextState) handleMarkAllAsRead();
                }}
                style={{
                  cursor: "pointer",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid #E5E7EB",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  flexShrink: 0,
                  transition: "box-shadow 0.2s ease",
                }}
              >
                <Bell size={20} color="#4B5563" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#b50000",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 5px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      lineHeight: 1,
                      border: "2px solid #fff",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Notification dropdown */}
              {isNotificationVisible && (
                <ul className="notification-dropdown">
                  <li className="dropdown-header">Notifications</li>
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                      <li
                        key={notif.id || index}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          padding: "12px 20px",
                          borderBottom: "1px solid #f9f9f9",
                          backgroundColor: notif.is_read
                            ? "transparent"
                            : "#f0f7ff",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", flex: 1 }}>
                          <div
                            style={{
                              position: "relative",
                              marginTop: "2px",
                              flexShrink: 0,
                            }}
                          >
                            {!notif.is_read && (
                              <span
                                style={{
                                  position: "absolute",
                                  left: "-12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: "8px",
                                  height: "8px",
                                  backgroundColor: "#3B82F6",
                                  borderRadius: "50%",
                                }}
                              />
                            )}
                            {/* Inject dynamic icon here */}
                            {getNotificationIcon(notif.name)}
                          </div>
                          <div style={{ paddingRight: "10px" }}>
                            <span
                              style={{
                                fontWeight: "700",
                                display: "block",
                                fontSize: "13.5px",
                                color: "#111827",
                                marginBottom: "2px",
                              }}
                            >
                              {notif.name}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#4B5563",
                                lineHeight: 1.4,
                              }}
                            >
                              {notif.message}
                            </span>
                          </div>
                        </div>

                        {/* The 'X' Delete Button */}
                        <button
                          onClick={(e) =>
                            handleDeleteNotification(e, notif.id, notif.isSos)
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#fee2e2")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          title="Dismiss"
                        >
                          <X size={16} color="#9CA3AF" />
                        </button>
                      </li>
                    ))
                  ) : (
                    <li
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: "13px",
                      }}
                    >
                      No new notifications
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Divider — hidden on mobile via CSS */}
            <div
              className="header-divider"
              style={{
                width: "1px",
                height: "24px",
                backgroundColor: "#E5E7EB",
              }}
            />

            {/* Profile pill */}
            <div
              className="user-profile-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  minWidth: "36px",
                  borderRadius: "10px",
                  backgroundColor: getAvatarColor(profile?.fullName),
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "14px",
                  flexShrink: 0,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {profile?.fullName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div
                className="profile-text-col"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "600",
                    color: "#111827",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile?.fullName || "User"}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#6B7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile?.email || ""}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════
            ✅ KEY FIX: context={{ profile }} passes
            profile to DashboardNGO, NGOHelp, Mapview
            so they can call useOutletContext()
        ════════════════════════════════════════ */}
        <Outlet context={{ profile }} />

        {/* ── AegisAssist Chat Widget Button ── */}
        <div className="chat-widget" onClick={toggleChat}>
          <img src={chatbotIcon} alt="Support" className="chat-icon" />
        </div>
      </main>
    </div>
  );
};

export default NGOLayout;
