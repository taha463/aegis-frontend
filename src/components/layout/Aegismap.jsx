import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  CircleMarker,
  Polyline,
  Tooltip,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Layers, Info, Check, Waves } from "lucide-react";

// Shared Components
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

// Assets
import chatbot from "../../assets/images/chat-bot 1.png";

// Components & Firebase
import AegisAssist from "./AegisAssist";
import { auth, db } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";

// CSS
import "./Aegismap.css";

// --- PROFESSIONAL CSS-RENDERED ICONS ---
const blueDotIcon = new L.DivIcon({
  className: "custom-user-marker",
  html: `<div style="width: 18px; height: 18px; background-color: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8); position: relative;">
    <div style="position: absolute; top: -3px; left: -3px; right: -3px; bottom: -3px; border-radius: 50%; background-color: #2563eb; opacity: 0.4; animation: bluePulse 2s ease-out infinite;"></div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const shelterIcon = new L.DivIcon({
  className: "custom-shelter-marker",
  html: `<div style="background-color: #10B981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ZoomHandler = ({ setZoom }) => {
  const map = useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return null;
};

const MapController = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      // UPGRADED: Zoom level 15 provides the best street-level detail
      map.flyTo(position, 15, { animate: true, duration: 2.0 });
    }
  }, [position, map]);
  return null;
};

// --- DYNAMIC AVATAR COLOR GENERATOR (kept for completeness)
const getAvatarColor = (name) => {
  if (!name) return "#047857";
  const char = name.charAt(0).toUpperCase();
  const colorMap = {
    A: "#ef4444",
    B: "#f97316",
    C: "#f59e0b",
    D: "#84cc16",
    E: "#22c55e",
    F: "#10b981",
    G: "#14b8a6",
    H: "#06b6d4",
    I: "#0ea5e9",
    J: "#3b82f6",
    K: "#6366f1",
    L: "#8b5cf6",
    M: "#047857",
    N: "#d946ef",
    O: "#f43f5e",
    P: "#e11d48",
    Q: "#ef4444",
    R: "#f97316",
    S: "#f59e0b",
    T: "#3b82f6",
    U: "#22c55e",
    V: "#10b981",
    W: "#14b8a6",
    X: "#06b6d4",
    Y: "#0ea5e9",
    Z: "#8b5cf6",
  };
  return colorMap[char] || "#047857";
};

const LegendItem = ({ color, label, hasSwitch, checked, onChange }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 0",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: color,
        }}
      ></div>
      <span style={{ fontFamily: "'Open Sans', sans-serif" }}>{label}</span>
    </div>
    {hasSwitch && (
      <label className="aegis-switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="slider round"></span>
      </label>
    )}
  </div>
);

const Aegismap = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAssist, setShowAssist] = useState(false);
  const [preloadedEvacTarget, setPreloadedEvacTarget] = useState(null);
  const [preloadedStatus, setPreloadedStatus] = useState("SAFE");
  const [profile, setProfile] = useState();
  const [loading, setLoading] = useState(true);
  const [gatesLoaded, setGatesLoaded] = useState(false); // NEW: track gate data readiness
  const pakistanCenter = [30.3753, 69.3451];
  const [userLocation, setUserLocation] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [cityName, setCityName] = useState("Locating...");
  const [date, setDate] = useState("");
  const [zoomLevel, setZoomLevel] = useState(6);
  const navigate = useNavigate();
  const locationUrl = useLocation();
  const [riverGates, setRiverGates] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [cities, setCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
  const [roadRoute, setRoadRoute] = useState(null);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const pakistanBounds = [
    // <-- ADD THIS LINE
    [23.6345, 60.8728],
    [37.0841, 77.8375],
  ];
  const [routeDetails, setRouteDetails] = useState({
    distance: 0,
    duration: 0,
  });

  // --- FETCH DATE ---
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      setDate(
        `${today.getDate().toString().padStart(2, "0")} ${today.toLocaleString("en-GB", { month: "long" })}, ${today.getFullYear()}`,
      );
    };
    updateDate();
  }, []);

  // --- FETCH CITIES FOR SEARCH (with cache) ---
  useEffect(() => {
    const cachedCities = localStorage.getItem("aegis_cities_list");
    if (cachedCities) {
      setCities(JSON.parse(cachedCities));
    } else {
      fetch("http://localhost:8000/cities")
        .then((res) => res.json())
        .then((data) => {
          setCities(data);
          localStorage.setItem("aegis_cities_list", JSON.stringify(data));
        });
    }
  }, []);

  // --- CLOSE SEARCH DROPDOWN ON OUTSIDE CLICK ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsDropdownVisible(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- FETCH USER PROFILE ---
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
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- FETCH SHELTERS (with cache) ---
  useEffect(() => {
    const cachedShelters = localStorage.getItem("aegis_shelters_list");
    if (cachedShelters) {
      setShelters(JSON.parse(cachedShelters));
    }

    // Always update in background after a 2-second delay
    setTimeout(() => {
      fetch("http://localhost:8000/get-shelters")
        .then((response) => response.json())
        .then((data) => {
          setShelters(data);
          localStorage.setItem("aegis_shelters_list", JSON.stringify(data));
        });
    }, 2000);
  }, []);
  // --- GET USER GPS LOCATION ---
  const getUserGPSLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          )
            .then((res) => res.json())
            .then((data) => {
              setCityName(
                data.address.city || data.address.town || "Locating...",
              );
              setSearchTerm("");
            })
            .catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true },
      );
    }
  };

  // --- HANDLE LOCATION FROM URL OR LOCALSTORAGE ---
  // --- UNIFIED DATA INITIALIZATION ---
  useEffect(() => {
    const initializeMap = async () => {
      const THREE_HOURS = 3 * 60 * 60 * 1000;

      // --- 1. INSTANT SNAPSHOT LOAD ---
      const cachedMap = localStorage.getItem("aegis_map_snapshot");
      let hasFreshCache = false;

      if (cachedMap) {
        const { gates, userLoc, city, timestamp } = JSON.parse(cachedMap);
        const age = Date.now() - timestamp;

        if (age < THREE_HOURS) {
          setRiverGates(gates);
          setUserLocation(userLoc);
          setCityName(city);
          setGatesLoaded(true);
          setLoading(false); // STOP the loader immediately!
          hasFreshCache = true;
          console.log("⚡ Map snapshot loaded instantly from memory.");
        }
      }

      // Only show full-screen loader if we DON'T have fresh data
      if (!hasFreshCache) {
        setLoading(true);
      }

      // --- 2. DETERMINE TARGET COORDINATES ---
      let targetLat = 30.3753;
      let targetLon = 69.3451;
      let targetCity = "Pakistan";

      const searchParams = new URLSearchParams(locationUrl.search);
      const dashboardRedirect = localStorage.getItem("aegis_map_location");

      // A. Priority: URL Search Params
      if (searchParams.get("lat")) {
        targetLat = parseFloat(searchParams.get("lat"));
        targetLon = parseFloat(searchParams.get("lon"));
        targetCity = searchParams.get("city") || "Searched Area";
      }
      // B. Priority: Redirect from Dashboard
      else if (dashboardRedirect) {
        const locData = JSON.parse(dashboardRedirect);
        targetLat = locData.lat;
        targetLon = locData.lon;
        targetCity = locData.city;
        if (locData.evacTarget) setPreloadedEvacTarget(locData.evacTarget);
      }
      // C. Priority: Live GPS
      else if ("geolocation" in navigator) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            });
          });
          targetLat = position.coords.latitude;
          targetLon = position.coords.longitude;

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${targetLat}&lon=${targetLon}`,
          );
          const geoData = await geoRes.json();
          targetCity =
            geoData.address.city || geoData.address.town || "My Neighborhood";
        } catch (error) {
          console.log("GPS Timeout, using defaults.");
        }
      }

      // --- 3. BACKGROUND SYNC (The "Road Lane" Logic) ---
      try {
        console.log("🚦 Background Lane: Syncing map data...");
        const res = await fetch("http://localhost:8000/update-from-chip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: targetLat,
            lon: targetLon,
            city: targetCity,
          }),
        });

        const data = await res.json();

        if (data) {
          setApiData(data);
          if (data.river_network_status) {
            setRiverGates(data.river_network_status);

            // UPDATE SNAPSHOT
            localStorage.setItem(
              "aegis_map_snapshot",
              JSON.stringify({
                gates: data.river_network_status,
                userLoc: [targetLat, targetLon],
                city: targetCity,
                timestamp: Date.now(),
              }),
            );
          }
          setUserLocation([targetLat, targetLon]);
          setCityName(targetCity);
          setGatesLoaded(true);
        }
      } catch (err) {
        console.error("❌ Map background sync failed:", err);
        // Ensure loader disappears even if network fails
        setGatesLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup dashboard redirect trigger after 3 seconds
    const timer = setTimeout(
      () => localStorage.removeItem("aegis_map_location"),
      3000,
    );
    return () => clearTimeout(timer);
  }, [locationUrl.search]);

  // --- FETCH ROUTE (OSRM) - FIXED Persistence ---
  useEffect(() => {
    const fetchRoute = async () => {
      // 1. Check if we have a location to start from
      if (!userLocation) return;

      // 2. Identify the target (Priority: Live API > Preloaded Storage)
      const plan = apiData?.evacuation_plan;
      const targetLat = plan?.target_lat || preloadedEvacTarget?.lat;
      const targetLon = plan?.target_lon || preloadedEvacTarget?.lon;

      // 3. Logic Sync: If status is Danger OR we have a preloaded target, SHOW ROUTE
      const shouldShowRoute =
        apiData?.status?.includes("DANGER") ||
        apiData?.status?.includes("WARNING") ||
        preloadedStatus?.includes("DANGER") ||
        preloadedStatus?.includes("WARNING") ||
        preloadedEvacTarget !== null;

      if (shouldShowRoute && targetLat && targetLon) {
        const [uLat, uLon] = userLocation;
        try {
          // International Standard: OSRM provides the 'Safest' road route
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${uLon},${uLat};${targetLon},${targetLat}?overview=full&geometries=geojson`,
          );
          const data = await response.json();
          if (data.code === "Ok" && data.routes?.length > 0) {
            const roadCoords = data.routes[0].geometry.coordinates.map((c) => [
              c[1],
              c[0],
            ]);
            setRoadRoute(roadCoords);
            setRouteDetails({
              distance: (data.routes[0].distance / 1000).toFixed(1),
              duration: Math.ceil(data.routes[0].duration / 60),
            });
          }
        } catch (error) {
          console.error("Routing Error:", error);
        }
      }
    };
    fetchRoute();
    // Dependency includes riverGates to ensure it re-checks when map features change
  }, [userLocation, apiData, preloadedEvacTarget, riverGates]);

  // --- NOTIFICATION LOGIC ---
  const [notifications, setNotifications] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    fetch("http://localhost:8000/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      })
      .catch(() => {});
  }, []);

  const handleMarkAllAsRead = async () => {
    setUnreadCount(0);
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      await Promise.all(
        unreadNotifications.map((notif) =>
          fetch(`http://localhost:8000/notifications/${notif.id}/read`, {
            method: "PUT",
          }),
        ),
      );
      const res = await fetch("http://localhost:8000/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {}
  };

  const notificationRef = useRef(null);
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

  // --- VIEW OPTIONS DROPDOWN ---
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
  const [showFloods, setShowFloods] = useState(true);
  const [showNormalLayer, setShowNormalLayer] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const viewOptionsRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewOptionsRef.current &&
        !viewOptionsRef.current.contains(event.target)
      )
        setIsViewOptionsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isViewOptionsOpen]);

  // --- COMBINED LOADING STATE: both profile and gates must be ready ---
  if ((loading || !gatesLoaded) && riverGates.length === 0) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const user = {
    name: profile?.fullName || profile?.name || "User",
    email: profile?.email || "",
    location: cityName || "Locating...",
  };

  return (
    <div className="aegis-map-page">
      {showAssist && <AegisAssist onClose={() => setShowAssist(false)} />}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="map-main-content">
        <Header user={user} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="content-body">
          <div className="map-content-wrapper">
            <div className="welcome-header">
              <div>
                <h2 className="page-title">Map Overview</h2>
                <p className="sub-text">
                  Hello, <b>{profile?.fullName || profile?.name}</b>! Here's the
                  detailed result you need.
                </p>
              </div>
              <div className="date-pill">{date}</div>
            </div>
            <div className="map-section-inner">
              <div
                className="map-wrapper"
                style={{
                  position: "relative",
                  height: "60vh",
                  minHeight: "500px",
                  width: "100%",
                  borderRadius: "24px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              >
                {/* STABLE KEY – map mounts only once */}
                <MapContainer
                  key="aegis-stable-map"
                  center={userLocation || pakistanCenter}
                  zoom={6}
                  minZoom={5} // Prevents looking at the whole world
                  maxZoom={20}
                  scrollWheelZoom={true}
                  // The "Invisible Wall" - Keeps the user inside Pakistan
                  maxBounds={[
                    [23.6345, 60.8728],
                    [37.0841, 77.8375],
                  ]}
                  maxBoundsViscosity={1.0}
                  style={{ height: "100%", width: "100%", zIndex: 1 }}
                >
                   
                  <>
                    {/* Layer 1: The beautiful Voyager background (No Labels) */}
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      subdomains="abcd"
                      maxZoom={20}
                      // --- ADD THESE THREE LINES FOR SPEED ---
                      keepBuffer={8}
                      updateWhenIdle={true}
                      updateWhenZooming={false}
                    />

                    {/* Layer 2: The "Only Labels" layer - Transparent and Sharp */}
                    {/* Note: This renders labels clearly. OSM data in Pakistan automatically 
      shows Urdu names for major cities and districts! */}
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                      subdomains="abcd"
                      maxZoom={20}
                      zIndex={10} // Ensures labels stay on top of flood markers
                      keepBuffer={8}
                      updateWhenIdle={true}
                      updateWhenZooming={false}
                      className="map-tiles-optimized"
                    />
                  </>
                  <ZoomHandler setZoom={setZoomLevel} />
                  <MapController position={userLocation} />
                  {riverGates.map((gate, idx) => {
                    const isSafe = gate.status.includes("SAFE");
                    const isWarning = gate.status.includes("WARNING");
                    const isDanger = gate.status.includes("DANGER");
                    const isExtreme = gate.status.includes("SURGE");
                    if (isSafe && !showNormalLayer) return null;
                    if (!isSafe && !showFloods) return null;
                    let colorCode = "#94a3b8";
                    if (isSafe) colorCode = "#00700b";
                    if (isWarning) colorCode = "#f97316";
                    if (isDanger) colorCode = "#d70f0f";
                    if (isExtreme) colorCode = "#991b1b";
                    return (
                      <CircleMarker
                        key={idx}
                        center={[gate.lat, gate.lon]}
                        pathOptions={{
                          color: "white",
                          weight: 2,
                          fillColor: colorCode,
                          fillOpacity: 1,
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                        radius={8}
                      >
                        <Popup>
                          <div
                            style={{
                              fontFamily: "'Open Sans', sans-serif",
                              minWidth: "150px",
                              textAlign: "center",
                            }}
                          >
                            <h4
                              style={{
                                margin: "0 0 8px 0",
                                borderBottom: "1px solid #E5E7EB",
                                paddingBottom: "4px",
                                fontSize: "14px",
                                textTransform: "capitalize",
                                color: "#000000",
                                fontWeight: "400",
                                fontFamily: "'Open Sans', sans-serif",
                              }}
                            >
                              {gate.gate_name.replace(/_/g, " ")}
                            </h4>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                color: colorCode,
                                fontWeight: "600",
                              }}
                            >
                              <span>{gate.status}</span>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                  {showFloods &&
                    riverGates.map((gate, idx) => {
                      if (
                        gate.status.includes("DANGER") ||
                        gate.status.includes("SURGE")
                      ) {
                        return (
                          <Circle
                            key={`danger-${idx}`}
                            center={[gate.lat, gate.lon]}
                            pathOptions={{
                              color: "#c30e14",
                              fillColor: "#e01919",
                              fillOpacity: 0.3,
                            }}
                            radius={
                              gate.status.includes("SURGE")
                                ? 15000
                                : gate.status.includes("DANGER")
                                  ? 8000
                                  : 5000
                            }
                          >
                            <Popup>
                              <div
                                style={{
                                  fontFamily: "'Open Sans', sans-serif",
                                }}
                              >
                                <b style={{ color: "#ce1212" }}>
                                  Active Flood Zone
                                </b>
                                <br />
                                30km hazard radius near{" "}
                                {gate.gate_name.replace(/_/g, " ")}
                              </div>
                            </Popup>
                          </Circle>
                        );
                      }
                      return null;
                    })}
                  {showRoutes &&
                    roadRoute &&
                    (apiData?.status?.includes("DANGER") ||
                      apiData?.status?.includes("WARNING") ||
                      preloadedStatus?.includes("DANGER") ||
                      preloadedStatus?.includes("WARNING")) && (
                      <Polyline
                        positions={roadRoute}
                        color="#2563eb"
                        weight={6}
                        opacity={0.8}
                        lineCap="round"
                        lineJoin="round"
                      >
                        <Tooltip sticky direction="top">
                          <div
                            style={{
                              fontFamily: "'Open Sans', sans-serif",
                              fontSize: "13px",
                            }}
                          >
                            <b style={{ color: "#2574eb" }}>
                              ✓ Safest Evacuation Route
                            </b>
                            <br />
                            {apiData?.evacuation_plan?.message ||
                              preloadedEvacTarget?.message ||
                              "Proceed to safe zone"}
                            <br />
                            Distance: {routeDetails.distance} km
                            <br />
                            Est. Drive Time: {routeDetails.duration} mins
                          </div>
                        </Tooltip>
                      </Polyline>
                    )}
                  {zoomLevel >= 7 &&
                    shelters.map((shelter) => (
                      <Marker
                        key={shelter.id}
                        position={[shelter.lat, shelter.lng]}
                        icon={shelterIcon}
                      >
                        <Popup>
                          <div
                            style={{
                              minWidth: "150px",
                              fontFamily: "'Open Sans', sans-serif",
                            }}
                          >
                            <b style={{ color: "#148423", fontSize: "14px" }}>
                              🏠 {shelter.name}
                            </b>
                            <br />
                            <span style={{ fontSize: "12px" }}>
                              Capacity: {shelter.capacity} people
                              <br />
                              Occupied: {shelter.occupied || 0}
                            </span>
                            <hr />
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  {userLocation && (
                    <Marker position={userLocation} icon={blueDotIcon}>
                      <Popup>
                        <div
                          style={{
                            padding: "5px",
                            fontFamily: "'Open Sans', sans-serif",
                          }}
                        >
                          <strong style={{ color: "#2563eb" }}>
                            Your Current Location
                          </strong>
                          <br />
                          {cityName}
                          <br />
                          <hr />
                          <span
                            style={{
                              fontSize: "11px",
                              color:
                                apiData?.status?.includes("DANGER") ||
                                apiData?.status?.includes("WARNING")
                                  ? "#c30909"
                                  : "#009f28",
                              fontWeight: "bold",
                              fontFamily: "'Open Sans', sans-serif",
                            }}
                          >
                            {apiData?.status?.includes("DANGER") ||
                            apiData?.status?.includes("WARNING")
                              ? " EMERGENCY EVACUATION TRIGGERED"
                              : "✓ Outside active flood radius"}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>

                {/* VIEW OPTIONS BUTTON */}
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setIsViewOptionsOpen(!isViewOptionsOpen)}
                    style={{
                      width: "48px",
                      height: "48px",
                      backgroundColor: "white",
                      borderRadius: "14px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Layers size={24} color="#1e293b" />
                  </button>
                  {isViewOptionsOpen && (
                    <div
                      ref={viewOptionsRef}
                      style={{
                        width: "300px",
                        backgroundColor: "white",
                        borderRadius: "20px",
                        marginTop: "12px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "20px",
                        border: "1px solid #f1f5f9",
                        fontFamily: "'Open Sans', sans-serif",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <Waves size={20} color="#64748b" />
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#0f172a",
                            }}
                          >
                            Map Overlays
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "16px",
                          padding: "16px",
                        }}
                      >
                        <div style={{ marginBottom: "12px" }}>
                          <span
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#334155",
                            }}
                          >
                            Riverine floods
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <LegendItem color="#760000" label="Extreme" />
                          <LegendItem color="#c00505" label="Danger" />
                          <LegendItem color="#ff6a00" label="Warning" />
                          <LegendItem color="#96a6bb" label="No data" />
                          <hr
                            style={{
                              margin: "10px 0",
                              border: "none",
                              borderTop: "1px solid #e2e8f0",
                            }}
                          />
                          <LegendItem
                            color="#059633"
                            label="Safe Zones"
                            hasSwitch={true}
                            checked={showNormalLayer}
                            onChange={() =>
                              setShowNormalLayer(!showNormalLayer)
                            }
                          />
                          <LegendItem
                            color="#203cad"
                            label="Evacuation Routes"
                            hasSwitch={true}
                            checked={showRoutes}
                            onChange={() => setShowRoutes(!showRoutes)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI CHAT BUTTON */}
                <div
                  className="chat-widget"
                  onClick={() => setShowAssist(true)}
                  style={{
                    position: "absolute",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 1000,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={chatbot}
                    alt="AI Chat"
                    style={{
                      width: "56px",
                      height: "56px",
                      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: "16px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#6b7280",
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                Flood conditions and routing are approximate and for
                informational purposes only. Check official NDMA sources.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Aegismap;
