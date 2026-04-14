import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getMessaging, onMessage } from "firebase/messaging";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../src/firebaseconfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  Search,
  MapPin,
  Bell,
  Menu,
  LocateFixed,
  User,
  X,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
} from "lucide-react";

const Header = ({ user, onMenuClick }) => {
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const locationUrl = useLocation();

  // 1. ROBUST CITIES FETCH
  // --- 1. ROBUST CITIES FETCH (With Long-Term Cache) ---
  const fetchCities = async () => {
    try {
      // Check if we have cities saved in memory first
      const cachedCities = localStorage.getItem("aegis_cities_list");
      if (cachedCities) {
        setCities(JSON.parse(cachedCities));
        console.log("⚡ Cities loaded instantly from cache.");
        // We don't return here; we can still update in background if needed
      }

      const querySnapshot = await getDocs(collection(db, "cities"));
      let cityList = querySnapshot.docs
        .map((doc) => doc.data().name)
        .filter(Boolean);

      if (cityList.length === 0) {
        const res = await fetch("http://localhost:8000/cities");
        cityList = await res.json();
      }

      const sortedCities = cityList.sort();
      setCities(sortedCities);

      // Save to localStorage so it's instant next time
      localStorage.setItem("aegis_cities_list", JSON.stringify(sortedCities));
    } catch (err) {
      console.error("Cities fetch failed", err);
    }
  };

  // --- 2. NOTIFICATIONS FETCH (With 3-Hour Cache Logic) ---
  const fetchNotifications = async () => {
    try {
      // 1. Show old notifications from cache first
      const cachedNotifs = localStorage.getItem("aegis_notifications_snapshot");
      if (cachedNotifs) {
        const { data } = JSON.parse(cachedNotifs);
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }

      // 2. Fetch fresh ones from server
      const response = await fetch("http://localhost:8000/notifications");
      let data = await response.json();

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      data = data.filter((notif) => {
        if (!notif.created_at) return true;
        return new Date(notif.created_at) >= twoDaysAgo;
      });

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);

      // 3. Update cache for next time
      localStorage.setItem(
        "aegis_notifications_snapshot",
        JSON.stringify({
          data: data,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // --- 3. THE "ROAD LANE" TRAFFIC CONTROL ---
  useEffect(() => {
    // Give the Dashboard Lane 5 seconds to finish its heavy sync first
    const laneTimer = setTimeout(() => {
      console.log(
        "🚦 Header Lane: Dashboard is likely done. Starting background sync...",
      );
      fetchCities();
      fetchNotifications();
    }, 5000);

    return () => clearTimeout(laneTimer);
  }, []); // Runs once on load

  // 2. Read URL to keep Search Bar text synced
  useEffect(() => {
    const searchParams = new URLSearchParams(locationUrl.search);
    const cityParam = searchParams.get("city");
    if (cityParam) {
      setSearchTerm(cityParam);
    } else {
      setSearchTerm("");
    }
  }, [locationUrl]);

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

  const filteredCities = cities.filter(
    (city) => city && city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCitySelect = async (selectedCity) => {
    setSearchTerm(selectedCity);
    setIsDropdownVisible(false);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${selectedCity}, Pakistan`,
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;
        navigate(
          `?city=${encodeURIComponent(selectedCity)}&lat=${lat}&lon=${lon}`,
        );
      }
    } catch (err) {
      console.error("Failed to geocode searched city", err);
    }
    handleDashboardRedirect(
      `?city=${encodeURIComponent(selectedCity)}&lat=${lat}&lon=${lon}`,
    );
  };

  const handleUseMyLocation = (e) => {
    e.stopPropagation();
    setSearchTerm("");
    setIsDropdownVisible(false);
    navigate(window.location.pathname);
  };

  // Bell data
  const [notifications, setNotifications] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // 2. LISTEN FOR FOREGROUND SYSTEM ALERTS (With Duplicate Protection)
  useEffect(() => {
    let unsubscribeFCM = null;

    const setupFCM = async () => {
      try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          const messaging = getMessaging();

          // Store the unsubscribe function to clean up later
          unsubscribeFCM = onMessage(messaging, (payload) => {
            console.log("Foreground system alert received:", payload);

            const newTitle = payload.notification?.title || "System Alert";
            const newBody = payload.notification?.body || "";

            setNotifications((prev) => {
              // 🟢 THE FIX: Check if this message body already exists in the current list
              // This prevents System A (FCM) and System B (Manual Fetch) from showing the same alert twice.
              const isDuplicate = prev.some(
                (n) => n.message === newBody && n.name === newTitle,
              );

              if (isDuplicate) {
                console.log("🚫 Duplicate notification blocked in UI.");
                return prev;
              }

              const systemAlert = {
                id: "sys_" + Date.now(),
                name: newTitle,
                message: newBody || "New critical update available.",
                is_read: false,
                created_at: new Date().toISOString(),
              };

              // Increase unread count only for unique messages
              setUnreadCount((count) => count + 1);

              return [systemAlert, ...prev];
            });
          });
        } else {
          console.warn("User denied notification permissions.");
        }
      } catch (error) {
        console.error("FCM foreground listener failed:", error);
      }
    };

    setupFCM();

    // 🚨 CRITICAL CLEANUP: Kill the listener when Header unmounts or refreshes
    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
        console.log("🗑️ FCM Listener cleaned up.");
      }
    };
  }, []);

  // 3. DELETE SPECIFIC NOTIFICATION (With Backend Verification)
  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();

    // Save current state in case the backend fails and we need to revert
    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    // Optimistically remove from UI
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => {
      const removedNotif = notifications.find((n) => n.id === id);
      return removedNotif && !removedNotif.is_read
        ? Math.max(0, prev - 1)
        : prev;
    });

    if (!String(id).startsWith("sys_")) {
      try {
        const response = await fetch(
          `http://localhost:8000/notifications/${id}`,
          {
            method: "DELETE",
          },
        );

        // If the backend refuses to delete it (e.g., 404 or 500 error)
        if (!response.ok) {
          console.error(
            "Backend failed to delete notification. Status:",
            response.status,
          );
          // Revert the UI so the user knows it didn't actually delete
          setNotifications(previousNotifications);
          setUnreadCount(previousUnread);
        }
      } catch (error) {
        console.error("Network error trying to delete:", error);
        // Revert the UI on network failure
        setNotifications(previousNotifications);
        setUnreadCount(previousUnread);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setUnreadCount(0);
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unreadNotifications.map((notif) =>
          !String(notif.id).startsWith("sys_")
            ? fetch(`http://localhost:8000/notifications/${notif.id}/read`, {
                method: "PUT",
              })
            : Promise.resolve(),
        ),
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationVisible]);

  const getUserInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };
  const getAvatarColor = (name) => {
    if (!name) return "#6B7280";

    const colors = [
      "#CC4400", // blue
      "#70000f", // red
      "#420f5b", // yellow
      "#931049", // green
      "#500040", // purple
      "#b10000", // orange
      "#5d2a00", // teal
      "rgb(0, 99, 82)", // indigo
      "#2C3E50",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const handleDashboardRedirect = (queryPath = "") => {
    const cachedProfile = localStorage.getItem("aegis_user_profile");
    const savedData = cachedProfile ? JSON.parse(cachedProfile) : null;

    const role = savedData?.entity?.toLowerCase() || "citizen";
    const targetBase = role === "ngo" ? "/DashboardNGO" : "/DashboardCitizen";

    if (!navigator.onLine && savedData) {
      navigate(targetBase + queryPath);
    } else if (auth.currentUser || savedData) {
      navigate(targetBase + queryPath);
    } else {
      navigate("/Login");
    }
  };
  // --- NEW: DYNAMIC NOTIFICATION ICONS ---
  const getNotificationIcon = (title) => {
    const lowerTitle = (title || "").toLowerCase();

    // Danger / Critical Alerts -> Red Stop Sign
    if (lowerTitle.includes("critical") || lowerTitle.includes("danger")) {
      return (
        <AlertOctagon
          size={16}
          style={{ marginRight: "12px", color: "#a10303" }}
        />
      );
    }
    // Warning / Elevated Alerts -> Orange Triangle
    else if (
      lowerTitle.includes("elevated") ||
      lowerTitle.includes("warning")
    ) {
      return (
        <AlertTriangle
          size={16}
          style={{ marginRight: "12px", color: "#F59E0B" }}
        />
      );
    }
    // Safe Alerts -> Green Checkmark
    else if (lowerTitle.includes("safe") || lowerTitle.includes("normal")) {
      return (
        <CheckCircle
          size={16}
          style={{ marginRight: "12px", color: "#047622" }}
        />
      );
    }

    // Default -> Gray User Icon (for regular contact form submissions)
    return <User size={16} style={{ marginRight: "12px", color: "#6B7280" }} />;
  };
  return (
    <header
      style={{
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        fontFamily: "'Open Sans', sans-serif",
      }}
    >
      <button
        onClick={onMenuClick}
        className="mobile-menu-btn"
        style={{
          padding: "0.6rem",
          backgroundColor: "#fbfbfb",
          borderRadius: "0.75rem",
          border: "1px solid rgb(240, 240, 240)",
          boxShadow: "0 1px 2px rgba(228, 228, 228, 0.51)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Menu size={24} color="#4B5563" />
      </button>

      <div
        style={{
          flex: 1,
          backgroundColor: "#fbfbfb",
          borderRadius: "1rem",
          padding: "0.85rem 1.25rem",
          boxShadow: "0 1px 3px #d9d9d90d",
          border: "1px solid rgb(240, 240, 240)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          minWidth: 0,
          position: "relative",
        }}
      >
        {/* --- SEARCH CONTAINER --- */}
        <div
          ref={dropdownRef}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            maxWidth: "25rem",
            position: "relative",
            zIndex: 10, // FIXED: Lowered z-index so it hides under mobile sidebar
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "0.8rem",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <Search size={18} color="#9CA3AF" />
            </div>

            <input
              type="text"
              placeholder="Search city in Pakistan..."
              value={searchTerm}
              onFocus={() => setIsDropdownVisible(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 2.5rem",
                borderRadius: "12px",
                border: "1px solid #f8f8f8",
                backgroundColor: "#FFFFFF",
                outline: "none",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: "0.8rem",
                color: "rgba(0, 0, 0, 0.81)",
                fontWeight: "600",
                boxSizing: "border-box",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
              }}
            />

            <div
              style={{
                position: "absolute",
                right: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
                borderRadius: "20%",
                backgroundColor: searchTerm ? "#f0fdf4" : "transparent",
              }}
              onClick={handleUseMyLocation}
              title="Return to my GPS location"
            >
              <LocateFixed
                size={18}
                color={searchTerm ? "#016335" : "#9CA3AF"}
              />
            </div>
          </div>

          {isDropdownVisible && searchTerm && (
            <ul
              className="search-dropdown-list"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                borderRadius: "0.75rem",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                zIndex: 50, // FIXED: Lowered z-index so it hides under mobile sidebar
                listStyle: "none",
                padding: "5px 0",
                margin: 0,
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #E5E7EB",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <li
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    style={{
                      padding: "10px 15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "0.9rem",
                      color: "#374151",
                      borderBottom: "1px solid #f9f9f9",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#f3f4f6")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <MapPin
                      size={14}
                      style={{ marginRight: "8px", color: "#6B7280" }}
                    />
                    {city}
                  </li>
                ))
              ) : (
                <li
                  style={{
                    padding: "15px",
                    textAlign: "center",
                    color: "#9CA3AF",
                    fontSize: "0.9rem",
                  }}
                >
                  No cities found
                </li>
              )}
            </ul>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexShrink: 0,
          }}
        >
          <div
            className="location-pill hidden-on-mobile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              padding: "0 1rem",
              height: "36px",
              borderRadius: "9999px",
            }}
          >
            <MapPin size={16} color="#4B5563" />
            <span
              style={{
                fontWeight: "500",
                fontSize: "0.875rem",
                color: "#111827db",
              }}
            >
              {user?.location || "Locating..."}
            </span>
          </div>

          <div
            className="notification-container"
            ref={notificationRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              zIndex: 10,
            }}
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
                padding: "6px",
                position: "relative",
                display: "flex",
              }}
            >
              <Bell size={22} color="#4B5563" />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    backgroundColor: "#aa0000",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {isNotificationVisible && (
              <ul
                style={{
                  position: "absolute",
                  right: 0,
                  top: "45px",
                  width: "320px",
                  backgroundColor: "white",
                  borderRadius: "1rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  zIndex: 50,
                  border: "1px solid #E5E7EB",
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  maxHeight: "350px",
                  overflowY: "auto",
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                <li
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "white",
                    zIndex: 1,
                    padding: "15px 20px",
                    fontWeight: "bold",
                    borderBottom: "1px solid #f0f0f0",
                    color: "#111827",
                    fontSize: "0.95rem",
                  }}
                >
                  Notifications
                </li>

                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <li
                      key={notif.id || index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between", // Pushes the X to the right
                        padding: "12px 20px",
                        borderBottom: "1px solid #f9f9f9",
                        backgroundColor: notif.is_read
                          ? "transparent"
                          : "#f0f7ff",
                        transition: "background-color 0.2s",
                      }}
                    >
                      {/* --- LEFT SIDE: Notification Icon and Text --- */}
                      <div style={{ display: "flex", flex: 1 }}>
                        <div style={{ position: "relative", marginTop: "2px" }}>
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
                            ></span>
                          )}
                          {getNotificationIcon(notif.name)}
                        </div>
                        <div style={{ paddingRight: "10px" }}>
                          <span
                            style={{
                              fontWeight: "700",
                              display: "block",
                              fontSize: "0.85rem",
                              color: "#111827",
                              marginBottom: "2px",
                            }}
                          >
                            {notif.name}
                          </span>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#4B5563",
                              lineHeight: 1.4,
                            }}
                          >
                            {notif.message}
                          </span>
                        </div>
                      </div>

                      {/* --- RIGHT SIDE: Delete 'X' Button --- */}
                      <button
                        onClick={(e) => handleDeleteNotification(e, notif.id)}
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
                        title="Remove Notification"
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
                      fontSize: "0.9rem",
                    }}
                  >
                    No new notifications
                  </li>
                )}
              </ul>
            )}
          </div>

          <div
            style={{
              height: "1.5rem",
              width: "1px",
              backgroundColor: "#E5E7EB",
            }}
            className="hidden-on-mobile"
          ></div>

          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "17%",
                backgroundColor: getAvatarColor(user?.name),
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "15px",
                lineHeight: "1",
                flexShrink: 0,
                boxShadow: "0 2px 4px rgba(1, 99, 53, 0.2)",
              }}
            >
              {getUserInitial(user?.name)}
            </div>

            <div
              className="hidden-on-mobile"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  color: "#111827",
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "User"}
              </p>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#6B7280",
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email || "user@aegis.com"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 840px) {
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 839px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .hidden-on-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
