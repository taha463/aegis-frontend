import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import DatePicker from "react-datepicker";
import Swal from "sweetalert2";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import {
  LayoutDashboard,
  Map,
  HelpCircle,
  LogOut,
  MapPin,
  Clock,
  ArrowUpRight,
  Calendar,
  User,
  X,
} from "lucide-react";

import "./DashboardNGO.css";

// Firebase
import { db } from "../../firebaseconfig";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#fafafa",
    borderRadius: "12px",
    border: state.isFocused ? "1px solid #8d5e3c" : "1px solid #ddd",
    boxShadow: "none",
    padding: "5px",
    fontSize: "14px",
    fontFamily: '"Open Sans", sans-serif',
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": { borderColor: "#8d5e3c", backgroundColor: "#fff" },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#8d5e3c"
      : state.isFocused
        ? "#f4e9e2"
        : "#fff",
    color: state.isSelected ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: '"Open Sans", sans-serif',
    "&:active": { backgroundColor: "#8d5e3c" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  placeholder: (provided) => ({ ...provided, color: "#999" }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333",
    fontWeight: "500",
  }),
};

const DashboardNGO = () => {
  const { profile } = useOutletContext(); // from NGOLayout

  const [requests, setRequests] = useState([]);
  const [cities, setCities] = useState([]); // for the city dropdown in form
  const [date, setDate] = useState("");

  // SOS dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Working Progress form state
  const initialFormState = {
    operationName: "",
    organizationName: "",
    city: "",
    alertLevel: "Monitoring",
    isWorking: "Yes",
    progress: 50,
    startDate: "",
    endDate: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Shelter Management form state
  const initialShelterState = {
    shelterId: "",
    Latitude: "",
    Longitude: "",
    currentCapacity: "",
    occupied: "",
    facilities: { food: false, medical: false, clothes: false },
    notes: "",
  };
  const [shelterData, setShelterData] = useState(initialShelterState);

  // Fetch cities for form dropdown
  useEffect(() => {
    fetch("http://localhost:8000/cities")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch((err) => console.error("API error:", err));
  }, []);

  // Real-time Emergency Requests Listener
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
  }, []);

  // Click outside handler for SOS dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleDeleteRequest = async (e, id) => {
    e.stopPropagation();
    try {
      // Deletes the document directly from Firestore.
      // Because you are using onSnapshot, the UI will update instantly!
      const requestRef = doc(db, "emergency_requests", id);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error("Error deleting request:", error);
      Swal.fire({
        icon: "error",
        title: "Deletion Failed",
        text: "Could not remove the request. Please try again.",
        confirmButtonColor: "#8d5e3c",
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.city) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please enter the Organization Name and select a Target City.",
        confirmButtonColor: "#8d5e3c",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/submit-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Ground report broadcasted to Citizen Dashboard.",
          icon: "success",
          confirmButtonColor: "#2d5a27",
          timer: 3000,
          showConfirmButton: false,
          position: "center",
        });
        setFormData(initialFormState);
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: errorData.detail || "Something went wrong on the server.",
        });
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not connect to the Aegis server. Please check if your backend is running.",
      });
    }
  };

  const handleShelterChange = (e) => {
    const { name, value } = e.target;
    setShelterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setShelterData((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [name]: checked },
    }));
  };

  const handleShelterUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      shelterId: shelterData.shelterId,
      Latitude: parseFloat(shelterData.Latitude) || 0,
      Longitude: parseFloat(shelterData.Longitude) || 0,
      currentCapacity: parseInt(shelterData.currentCapacity) || 0,
      occupied: parseInt(shelterData.occupied) || 0,
      facilities: shelterData.facilities,
      notes: shelterData.notes,
    };

    try {
      const response = await fetch("http://localhost:8000/update-shelter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: "Shelter data and coordinates saved successfully!",
          icon: "success",
          confirmButtonColor: "#2d5a54",
          timer: 2500,
          showConfirmButton: false,
          position: "center",
        });
        setShelterData(initialShelterState);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

  const visibleRequests = requests.slice(0, 2);
  const hiddenRequests = requests.slice(2);

  return (
    <>
      <div className="Main-Card">
        <div className="header-row">
          <div>
            <h1 className="dashboard-title-h1">NGO Dashboard</h1>
            <p style={{ color: "#7b7b7b", marginTop: "5px" }}>
              Hello,{" "}
              <span style={{ fontWeight: "700", color: "#333" }}>
                {profile?.fullName || profile?.name}!
              </span>{" "}
              Here's today's flood status in your area.
            </p>
          </div>
          <div className="dashboard-date">{date}</div>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-left-col">
            {/* LIVE SOS REQUESTS SECTION */}
            <div
              className="card"
              style={{ marginBottom: "30px", position: "relative" }}
              ref={dropdownRef}
            >
              <div className="shape-request-top-left"></div>
              <div className="shape-request-bottom-right"></div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3
                  style={{
                    fontWeight: "600",
                    fontSize: "20px",
                    fontFamily: "Open Sans, sans-serif",
                    margin: 0,
                  }}
                >
                  Live Emergency Requests
                </h3>

                {hiddenRequests.length > 0 && (
                  <div
                    style={{
                      background: "#0163355d",
                      height: "35px",
                      width: "35px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#016335",
                      cursor: "pointer",
                      transition: "transform 0.3s ease",
                      transform: isDropdownOpen
                        ? "rotate(75deg)"
                        : "rotate(7deg)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <ArrowUpRight size={20} />
                  </div>
                )}
              </div>

              {requests.length > 0 ? (
                <>
                  {visibleRequests.map((req, idx) => (
                    <div
                      key={req.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom:
                          idx === visibleRequests.length - 1 && !isDropdownOpen
                            ? "0"
                            : "25px",
                        borderBottom:
                          idx === visibleRequests.length - 1 && !isDropdownOpen
                            ? "none"
                            : "1px solid #eee",
                        paddingBottom: "15px",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      <div style={{ display: "flex", gap: "15px" }}>
                        <span style={{ fontWeight: "bold" }}>{idx + 1}.</span>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: "600" }}>
                            👤 {req.name} —{" "}
                            <span style={{ color: "#b91c1c" }}>{req.need}</span>
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#666",
                              margin: "4px 0",
                            }}
                          >
                            <MapPin
                              size={14}
                              style={{ verticalAlign: "middle" }}
                            />
                            Location: {req.lat.toFixed(4)}, {req.lng.toFixed(4)}
                          </div>
                          <div style={{ fontSize: "13px", color: "#999" }}>
                            <Clock
                              size={14}
                              style={{ verticalAlign: "middle" }}
                            />
                            {req.timeFormatted} — Status:{" "}
                            <span
                              style={{
                                color:
                                  req.status === "Pending"
                                    ? "#8d5e3c"
                                    : "#065F46",
                                fontWeight: "bold",
                              }}
                            >
                              {req.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Right Side: Delete Button */}
                      <button
                        onClick={(e) => handleDeleteRequest(e, req.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          height: "fit-content",
                          borderRadius: "50%",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#fee2e2")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                        title="Dismiss Request"
                      >
                        <X size={18} color="#9CA3AF" />
                      </button>
                    </div>
                  ))}

                  {isDropdownOpen && hiddenRequests.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "60px",
                        right: "20px",
                        width: "90%",
                        backgroundColor: "white",
                        borderRadius: "20px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                        padding: "20px",
                        zIndex: 100,
                        border: "1px solid #f0f0f0",
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      {hiddenRequests.map((req, idx) => (
                        <div
                          key={req.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom:
                              idx === hiddenRequests.length - 1 ? "0" : "20px",
                            borderBottom:
                              idx === hiddenRequests.length - 1
                                ? "none"
                                : "1px solid #eee",
                            paddingBottom: "15px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "15px" }}>
                            <span style={{ fontWeight: "bold" }}>
                              {idx + 3}.
                            </span>
                            <div>
                              <div
                                style={{ fontSize: "14px", fontWeight: "600" }}
                              >
                                👤 {req.name} —{" "}
                                <span style={{ color: "#b91c1c" }}>
                                  {req.need}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#666",
                                  margin: "4px 0",
                                }}
                              >
                                <MapPin
                                  size={14}
                                  style={{ verticalAlign: "middle" }}
                                />
                                Location: {req.lat.toFixed(4)},{" "}
                                {req.lng.toFixed(4)}
                              </div>
                              <div style={{ fontSize: "13px", color: "#999" }}>
                                <Clock
                                  size={14}
                                  style={{ verticalAlign: "middle" }}
                                />
                                {req.timeFormatted} — Status:{" "}
                                <span
                                  style={{
                                    color:
                                      req.status === "Pending"
                                        ? "#8d5e3c"
                                        : "#065F46",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {req.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Right Side: Delete Button */}
                          <button
                            onClick={(e) => handleDeleteRequest(e, req.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              height: "fit-content",
                              borderRadius: "50%",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#fee2e2")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                            title="Dismiss Request"
                          >
                            <X size={18} color="#9CA3AF" />
                          </button>
                          ))
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p
                  style={{
                    textAlign: "center",
                    color: "#999",
                    padding: "20px",
                  }}
                >
                  No active emergency requests.
                </p>
              )}
            </div>

            {/* SHELTER MANAGEMENT FORM */}
            <div className="card">
              <div className="shape-shelter-top"></div>
              <h3
                style={{
                  marginBottom: "20px",
                  fontFamily: "Open Sans",
                  fontSize: "20px",
                  fontWeight: "600",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Shelter Management
              </h3>

              <div className="form-group">
                <label>Shelter Name</label>
                <input
                  name="shelterId"
                  className="input-field"
                  placeholder="Name"
                  value={shelterData.shelterId}
                  onChange={handleShelterChange}
                />
              </div>

              <div className="form-group">
                <label>Shelter Latitude</label>
                <input
                  name="Latitude"
                  className="input-field"
                  placeholder="Latitude e.g. 31.5204"
                  value={shelterData.Latitude}
                  onChange={handleShelterChange}
                />
              </div>

              <div className="form-group">
                <label>Shelter Longitude</label>
                <input
                  name="Longitude"
                  className="input-field"
                  placeholder="Longitude e.g. 74.3587"
                  value={shelterData.Longitude}
                  onChange={handleShelterChange}
                />
              </div>

              <div className="form-group">
                <label>Current Capacity</label>
                <input
                  type="number"
                  name="currentCapacity"
                  className="input-field"
                  placeholder="e.g. 500"
                  value={shelterData.currentCapacity}
                  onChange={handleShelterChange}
                />
              </div>

              <div className="form-group">
                <label>Occupied</label>
                <input
                  type="number"
                  name="occupied"
                  className="input-field"
                  placeholder="e.g. 100"
                  value={shelterData.occupied}
                  onChange={handleShelterChange}
                />
              </div>

              <div className="form-group">
                <label>Facilities</label>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    marginTop: "10px",
                  }}
                >
                  {["food", "medical", "clothes"].map((f) => (
                    <label
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name={f}
                        checked={shelterData.facilities[f]}
                        onChange={handleCheckboxChange}
                      />{" "}
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </label>
                  ))}
                </div>

                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label>Notes/Updates</label>
                  <textarea
                    name="notes"
                    className="input-field"
                    style={{ height: "100px", padding: "12px" }}
                    placeholder="Extra details..."
                    value={shelterData.notes}
                    onChange={handleShelterChange}
                  ></textarea>
                </div>
              </div>

              <button
                className="btn-primary-btn"
                style={{ width: "150px", marginLeft: "100px" }}
                onClick={handleShelterUpdate}
              >
                Update Info
              </button>
            </div>
          </section>

          <section className="dashboard-right-col">
            <form className="card working" onSubmit={handleSubmit}>
              <div className="shape-working-left"></div>
              <div className="shape-working-bottom"></div>

              <h3
                style={{
                  marginBottom: "20px",
                  fontFamily: "Open Sans",
                  fontSize: "20px",
                  fontWeight: "600",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Working Progress Form
              </h3>

              <div className="form-group">
                <label>Current Operation</label>
                <input
                  name="operationName"
                  className="input-field"
                  placeholder="e.g. Rescue Mission"
                  value={formData.operationName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Organization Working</label>
                <input
                  name="organizationName"
                  className="input-field"
                  placeholder="Organization Name"
                  value={formData.organizationName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div
                className="form-group"
                style={{ position: "relative", zIndex: 1000 }}
              >
                <label>Target City</label>
                <Select
                  options={cities.map((city) => ({ value: city, label: city }))}
                  onChange={(selected) =>
                    handleManualChange("city", selected.value)
                  }
                  placeholder="Search Location..."
                  styles={customSelectStyles}
                  className="modern-select-container"
                />
              </div>

              <div className="form-group">
                <label>Flood Alert Level</label>
                <div className="alert-segmented-control">
                  {["Monitoring", "Medium Alert", "High Alert"].map((level) => (
                    <label key={level} className="segment-item">
                      <input
                        type="radio"
                        name="alertLevel"
                        value={level}
                        checked={formData.alertLevel === level}
                        onChange={handleChange}
                      />
                      <div
                        className={`segment-box ${level.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>NGO Working Status</label>
                <div className="status-toggle-pill">
                  <button
                    type="button"
                    className={`status-btn ${formData.isWorking === "Yes" ? "active-working" : ""}`}
                    onClick={() => handleManualChange("isWorking", "Yes")}
                  >
                    Working
                  </button>
                  <button
                    type="button"
                    className={`status-btn ${formData.isWorking === "No" ? "active-not-working" : ""}`}
                    onClick={() => handleManualChange("isWorking", "No")}
                  >
                    Not Working
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Status Progress: <strong>{formData.progress}%</strong>
                </label>
                <div className="progress-container-box">
                  <div
                    className="slider-wrapper"
                    style={{ "--progress": `${formData.progress}%` }}
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) =>
                        handleManualChange("progress", e.target.value)
                      }
                      className="aegis-range"
                    />
                  </div>
                  <div className="progress-labels">
                    <span>Planned</span>
                    <span>Ongoing</span>
                    <span>Complete</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <div className="custom-datepicker-container">
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => handleManualChange("startDate", date)}
                    placeholderText="Select Date"
                    portalId="root-portal"
                    className="input-field modern-date-picker"
                  />
                  <Calendar
                    className="custom-calendar-icon"
                    strokeWidth={3}
                    size={18}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>End Date</label>
                <div className="custom-datepicker-container">
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => handleManualChange("endDate", date)}
                    placeholderText="Select Date"
                    portalId="root-portal"
                    className="input-field modern-date-picker"
                  />
                  <Calendar
                    className="custom-calendar-icon"
                    strokeWidth={3}
                    size={18}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  className="input-field"
                  style={{ height: "80px", padding: "12px" }}
                  placeholder="Extra details..."
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-primary-btn"
                style={{ width: "150px", marginLeft: "0" }}
              >
                Submit Report
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default DashboardNGO;
