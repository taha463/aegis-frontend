import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Layers, Waves, MapPin, User } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Assets
import chatbot from "../../assets/images/chat-bot 1.png";

// Components & Firebase
import { db } from "../../firebaseconfig";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const Mapview = () => {
  // Get shared state from layout
  const {
    profile,
    notifications,
    unreadCount,
    handleMarkAllAsRead,
    isNotificationVisible,
    setIsNotificationVisible,
    notificationRef,
    searchTerm,
    setSearchTerm,
    isDropdownVisible,
    setIsDropdownVisible,
    filteredCities,
    dropdownRef,
    locationName, // cityName from layout (if available)
  } = useOutletContext();

  // Map‑specific state
  const [requests, setRequests] = useState([]);
  const [riverGates, setRiverGates] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
  const [showFloods, setShowFloods] = useState(true);
  const [showNormalLayer, setShowNormalLayer] = useState(true);
  const viewOptionsRef = useRef(null);

  // Map settings
  const pakistanBounds = [
    [23.6345, 60.8728],
    [37.0841, 77.8375],
  ];
  const pakistanCenter = [30.3753, 69.3451];
  const [cityName, setCityName] = useState(locationName || "Pakistan View");

  // Icons
  const DefaultIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  const shelterIcon = L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Date
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      const day = today.getDate().toString().padStart(2, "0");
      const month = today.toLocaleString("en-GB", { month: "long" });
      const year = today.getFullYear();
      setDate(`${day} ${month}, ${year}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  // Fetch emergency requests (optional – might be used for markers)
  useEffect(() => {
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
  }, []);

  // Fetch shelters
  useEffect(() => {
    const fetchShelters = async () => {
      try {
        const response = await fetch("http://localhost:8000/get-shelters");
        if (!response.ok) throw new Error("Failed to fetch shelters");
        const data = await response.json();
        setShelters(data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading shelters:", error);
        setLoading(false);
      }
    };
    fetchShelters();
  }, []);

  // Fetch river gates from AI model
  useEffect(() => {
    fetch("http://localhost:8000/update-from-chip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: 30.3753,
        lon: 69.3451,
        city: "NGO Map View",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.river_network_status) {
          setRiverGates(data.river_network_status);
        }
      })
      .catch((err) => console.error("Failed to fetch river gates", err));
  }, []);

  // Click outside for view options
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewOptionsRef.current &&
        !viewOptionsRef.current.contains(event.target)
      ) {
        setIsViewOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isViewOptionsOpen]);

  // Legend item component
  const LegendItem = ({ color, label, hasSwitch, checked, onChange }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          color: "#444",
        }}
      >
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: color,
          }}
        ></div>
        <span>{label}</span>
      </div>
      {hasSwitch && (
        <label className="aegis-switch">
          <input type="checkbox" checked={checked} onChange={onChange} />
          <span className="slider round"></span>
        </label>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* CSS for the modern switch */}
      <style>{`
        .aegis-switch {
          position: relative;
          display: inline-block;
          width: 34px;
          height: 20px;
        }
        .aegis-switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #059669;
        }
        input:checked + .slider:before {
          transform: translateX(14px);
        }
        .slider.round {
          border-radius: 20px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>

      {/* Page Content – Header and Sidebar are provided by Layout */}
      <div className="content-body">
        <div
          className="map-content-wrapper"
          style={{
            backgroundColor: "#fbfbfb",
            padding: "1.5rem",
            borderRadius: "1.5rem",
          }}
        >
          {/* Welcome header with date */}
          <div
            className="welcome-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2 className="page-title">Map Overview</h2>
              <p className="sub-text">
                Hello, <b>{profile?.name}</b>! Here's the detailed result you
                need.
              </p>
            </div>
            <div
              className="date-pill"
              style={{
                padding: "8px 16px",
                borderRadius: "9999px",
                border: "1px solid #016335",
                fontsize: "0.875rem",
                fontWeight: "600",
                color: "#111827",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {date}
            </div>
          </div>

          <div className="map-section-inner">
            <div
              className="map-wrapper"
              style={{
                position: "relative",
                height: "500px",
                minHeight: "65vh",
                width: "100%",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <MapContainer
                center={pakistanCenter}
                zoom={6}
                minZoom={5}
                maxZoom={18}
                scrollWheelZoom={true}
                maxBounds={pakistanBounds}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Plot AI river gates */}
                {riverGates.map((gate, idx) => {
                  const isSafe = gate.status.includes("SAFE");
                  const isWarning = gate.status.includes("WARNING");
                  const isDanger = gate.status.includes("DANGER");
                  const isExtreme = gate.status.includes("SURGE");

                  // Apply layer visibility
                  if (isSafe && !showNormalLayer) return null;
                  if (!isSafe && !showFloods) return null;

                  let colorCode = "#a19595"; // no data default
                  if (isSafe) colorCode = "#0c7426";
                  if (isWarning) colorCode = "#ffb812";
                  if (isDanger) colorCode = "#ea7900";
                  if (isExtreme) colorCode = "#c62a03";

                  return (
                    <CircleMarker
                      key={idx}
                      center={[gate.lat, gate.lon]}
                      pathOptions={{
                        color: "white",
                        weight: 2,
                        fillColor: colorCode,
                        fillOpacity: 1,
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
                              fontWeight: 400,
                              textTransform: "capitalize",
                              color: "#111827",
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
                              fontWeight: "500",
                              fontSize: "14px",
                            }}
                          >
                            <span>{gate.status}</span>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {/* Shelters */}
                {shelters &&
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
                          <b style={{ color: "#037551", fontSize: "14px" }}>
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
              </MapContainer>

              {/* Modern floating options panel */}
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
                  className="view-options-trigger"
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
                            fontFamily: "'Open Sans', sans-serif",
                          }}
                        >
                          Flood Risk Layers
                        </span>
                      </div>
                      <label className="aegis-switch">
                        <input
                          type="checkbox"
                          checked={showFloods}
                          onChange={() => setShowFloods(!showFloods)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: "16px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          marginBottom: "12px",
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            fontFamily: "'Open Sans', sans-serif",
                            color: "#334155",
                          }}
                        >
                          Riverine floods
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          Expected severity
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
                        <LegendItem color="#991b1b" label="Extreme" />
                        <LegendItem color="#d88037" label="Danger" />
                        <LegendItem color="#e2ea15" label="Warning" />
                        <LegendItem color="#a19595" label="No data" />
                        <LegendItem
                          color="#0c7426"
                          label="Normal"
                          hasSwitch={true}
                          checked={showNormalLayer}
                          onChange={() => setShowNormalLayer(!showNormalLayer)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "12px",
                color: "#6b7280",
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              Flood conditions are approximate and are for informational
              purposes only. Check official sources for more information.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Mapview;
