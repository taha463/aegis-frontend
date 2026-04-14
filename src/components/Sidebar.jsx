import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map as MapIcon,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { auth } from "../firebaseconfig"; // Ensure this path is correct
import { signOut } from "firebase/auth";
// IMPORTS
import shieldLogo from "../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";
import chatbot from "../assets/images/chat-bot 1.png";

// Import the Chatbot Overlay Component
import AegisAssist from "./layout/AegisAssist";

const Sidebar = ({ isOpen, onClose }) => {
  const [showAssist, setShowAssist] = useState(false);
  const location = useLocation(); // Get current path
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear any local storage data you might have (like your map data)
      localStorage.removeItem("aegis_dashboard_data");
      localStorage.removeItem("aegis_map_location");

      // Redirect to login page
      navigate("/Login");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };
  return (
    <>
      {showAssist && <AegisAssist onClose={() => setShowAssist(false)} />}

      {/* Mobile Background Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 40,
          display: isOpen ? "block" : "none",
          backdropFilter: "blur(4px)",
          fontFamily: "Open Sans, sans-serif",
        }}
        className="mobile-overlay"
      />

      <aside
        className={isOpen ? "sidebar open" : "sidebar"}
        style={{
          width: "260px",
          backgroundColor: "#fbfbfb",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          border: "1px solid #f8f8f8",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
        }}
      >
        <div
          className="mobile-close-btn"
          style={{ position: "absolute", top: "1rem", right: "1rem" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUSTOM LOGO SECTION */}
        <div
          style={{
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Link
            to="/"
            className="logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <img src={shieldLogo} alt="Aegis Shield" className="logo-img" />
            <div className="logo-mark">
              <span className="logo-letter-a">A</span>
            </div>
            <span className="logo-text-rest">egis</span>
          </Link>
        </div>

        <div
          className="hide-on-mobile"
          style={{ padding: "0 2rem", marginBottom: "1.5rem" }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              color: "#6B7280",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Open Sans, sans-serif",
            }}
          ></button>
        </div>

        <div style={{ padding: "0 2rem", marginBottom: "1rem" }}>
          <span
            style={{
              color: "#9CA3AF",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Open Sans, sans-serif",
            }}
          >
            Menu
          </span>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "0 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            fontFamily: "Open Sans, sans-serif",
          }}
        >
          {/* DASHBOARD BUTTON */}
          <Link
            to="/DashboardCitizen"
            className={`sidebar-btn ${location.pathname === "/DashboardCitizen" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          {/* MAP BUTTON */}
          <Link
            to="/Aegismap"
            className={`sidebar-btn ${location.pathname === "/Aegismap" ? "active" : ""}`}
            onClick={() => {
              const stored = localStorage.getItem("aegis_dashboard_data");
              if (stored) {
                localStorage.setItem("aegis_map_location", stored);
              }
            }}
          >
            <MapIcon size={20} />
            Map
          </Link>

          {/* CHATBOT IMAGE SECTION */}
          <div style={{ marginTop: "1.5rem", padding: "0 1rem" }}>
            <div
              onClick={() => setShowAssist(true)}
              style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "50%",
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                overflow: "hidden",
                padding: "0.5rem",
                transition: "transform 0.2s ease",
                fontFamily: "Open Sans, sans-serif",
              }}
              className="chatbot-trigger"
            >
              <img
                src={chatbot}
                alt="Chatbot"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </nav>

        <div
          style={{
            padding: "0 2rem",
            marginBottom: "1rem",
            marginTop: "1rem",
          }}
        >
          <span
            style={{
              color: "#9CA3AF",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "Open Sans, sans-serif",
            }}
          >
            General
          </span>
        </div>

        <div
          style={{
            padding: "0 1rem 1.5rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            fontFamily: "Open Sans, sans-serif",
          }}
        >
          {/* HELP BUTTON */}
          <Link
            to="/Forhelp"
            state={{ from: "citizen" }}
            className={`sidebar-btn ${location.pathname === "/Forhelp" ? "active" : ""}`}
          >
            <HelpCircle size={20} />
            Help
          </Link>

          {/* LOGOUT BUTTON */}
          {/* LOGOUT BUTTON */}
          <button
            className="sidebar-btn"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            <LogOut size={22} />
            Logout
          </button>
        </div>
      </aside>

      <style>{`
        /* --- LOGO STYLES --- */
        .logo {
          display: flex;
          align-items: center;
          gap: 1px;
          text-decoration: none;
          fontFamily: "Open Sans, sans-serif",
        }
        .logo-img { height: 35px; }
        .sidebar .logo-text-rest {
          color: #000000 !important;
          font-family: "McLaren", cursive;
          font-size: 1.5rem;
          margin-top: 2px;
        }
        .sidebar .logo-mark .logo-letter-a {
          color: #000000 !important;
          font-family: "Major Mono Display", monospace;
          font-size: 1.6rem;
          font-weight: 700;
        }

        /* --- NEW BUTTON STYLES WITH HOVER --- */
        .sidebar-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 500;
          color: #6B7280;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s ease-in-out;
        }

        .sidebar-btn.active {
          background-color: #e6e6e667;
          color: #000000e2;
        }

        .sidebar-btn:hover {
          background-color: #e4e4e46e !important;
          color: #00838a !important;
        }
        
        .sidebar-btn:hover svg {
          stroke: #00838a; 
        }

        .chatbot-trigger:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .sidebar { 
          transform: translateX(-100%); 
          visibility: hidden; 
        }
        .sidebar.open { 
          transform: translateX(0); 
          visibility: visible; 
        }
        .mobile-overlay { display: none; }
        .mobile-close-btn { display: block; }
        .hide-on-mobile { display: none; }

        @media (min-width: 840px) {
          .sidebar { 
            transform: translateX(0) !important;
            visibility: visible !important;
            height: calc(100vh - 2rem) !important; 
            margin: 1rem !important;               
            border-radius: 1.5rem !important;      
            box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
            border-right: 1px solid #d9d9d970 !important;
          }
          .mobile-overlay { display: none !important; }
          .mobile-close-btn { display: none !important; }
          .hide-on-mobile { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
