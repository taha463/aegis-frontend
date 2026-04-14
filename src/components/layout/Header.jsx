/* Import Icons */
import {
  Menu,
  X,
  ArrowUpRight,
  Info,
  Settings,
  PhoneCall,
  UserPlus,
  Compass,
} from "lucide-react";

/* --- IMPORT YOUR UPLOADED IMAGE --- */
import shieldLogo from "../../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";

import "./Header.css";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { auth, db } from "../../firebaseconfig"; // Import your firebase config
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = (open) => {
    // Check if 'open' is actually a boolean. If it's an event object, just flip the current state.
    const next = typeof open === "boolean" ? open : !isMenuOpen;
    setIsMenuOpen(next);
    document.body.style.overflow = next ? "hidden" : ""; // prevents page scroll
  };

  const [userName, setUserName] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- SINGLE, BULLETPROOF SCROLL LISTENER ---
  const [scrolled, setScrolled] = useState(false);

  // --- SUPER-CHARGED SCROLL LISTENER ---
  useEffect(() => {
    const handleScroll = (e) => {
      // 1. Check if the main window is scrolling
      let scrollPos = window.scrollY || document.documentElement.scrollTop;

      // 2. If window is 0, check if an inner wrapper <div> is scrolling instead!
      if (scrollPos === 0 && e.target && e.target.scrollTop > 0) {
        scrollPos = e.target.scrollTop;
      }

      setScrolled(scrollPos > 50);
    };

    // Listen to the window
    window.addEventListener("scroll", handleScroll);
    // CRITICAL: Listen to ALL scroll events on the document (the 'true' makes it capture inner divs)
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // ✅ FIX 2: use backend API just like NGOLayout does
          const token = await currentUser.getIdToken();
          const response = await fetch("http://localhost:8000/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          setUserName(data.fullName || "");
        } catch (err) {
          console.error("Could not fetch user name:", err);
        }
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- NEW: scroll event listener ---
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50); // change colour after scrolling 50px
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out successfully");
      navigate("/"); // Redirect after logout
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  const handleExploreClick = async (e) => {
    if (e) e.preventDefault();

    // 1. Get the Raw Auth State (The "Clear" way)
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error(
        "BACKEND LOG: No Auth Identity found. Redirecting to login.",
      );
      navigate("/Login");
      return;
    }

    try {
      console.log("BACKEND LOG: Fetching data for UID:", currentUser.uid);

      // 2. Reference the exact document path
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      // ... inside userSnapshot.exists() block
      const data = userSnapshot.data();
      console.log("BACKEND LOG: Data retrieved successfully:", data);

      // CHANGE THIS LINE: use data.entity instead of data.role
      const userRole = data.entity ? data.entity.toLowerCase().trim() : "";

      if (userRole === "ngo") {
        navigate("/DashboardNGO");
      } else if (userRole === "citizen") {
        navigate("/DashboardCitizen");
      } else {
        console.warn("BACKEND LOG: Role (entity) unrecognized:", userRole);
        alert("User role not recognized. Value found: " + userRole);
      }
    } catch (error) {
      console.error(
        "BACKEND LOG: Critical Fetch Error:",
        error.code,
        error.message,
      );
    }
  };

  return (
    // --- added dynamic class "scrolled" ---
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        {/* --- FIXED LOGO HTML --- */}
        <Link to="#hero" className="logo">
          <img src={shieldLogo} alt="Aegis Shield" className="logo-img" />
          <div className="logo-mark">
            <span className="logo-letter-a"> {/* <-- Changed to span */}A</span>
          </div>
          <span className="logo-text-rest">
            {" "}
            {/* <-- Changed to span */}
            egis
          </span>
        </Link>

        <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
          <ul className="nav-list">
            <li>
              <a
                href="#about"
                className="nav-link"
                onClick={() => toggleMenu(false)}
              >
                <Info size={18} style={{ marginRight: "8px" }} /> About us
              </a>
            </li>
            <li>
              <a
                href="#how"
                className="nav-link"
                onClick={() => toggleMenu(false)}
              >
                <Settings size={18} style={{ marginRight: "8px" }} /> How it
                Works
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="nav-link"
                onClick={() => toggleMenu(false)}
              >
                <PhoneCall size={18} style={{ marginRight: "8px" }} /> Contact
                us
              </a>
            </li>
          </ul>

          <div className="header-actions">
            {user ? (
              /* LOGOUT STATE */
              <button
                onClick={handleLogout}
                className="btn-signup"
                style={{ border: "none", cursor: "pointer" }}
              >
                <LogOut size={18} style={{ marginRight: "4px" }} />
                {userName ? `Hi, ${userName}` : "Logout"}
                <div className="signup-circle-icon">
                  <ArrowUpRight size={20} strokeWidth={2.5} />
                </div>
              </button>
            ) : (
              /* SIGN UP STATE */
              <Link to="/signup" className="btn-signup">
                <UserPlus size={18} style={{ marginRight: "4px" }} /> Sign up
                <div className="signup-circle-icon">
                  <ArrowUpRight size={20} strokeWidth={2.5} />
                </div>
              </Link>
            )}

            {/* CHANGED: Swapped <Link> for <button> to prevent navigation glitches */}
            <button onClick={handleExploreClick} className="btn-explore">
              <Compass size={18} style={{ marginRight: "4px" }} />
              Explore now
              <ArrowUpRight
                size={20}
                strokeWidth={2}
                style={{ marginLeft: "8px" }}
              />
            </button>
          </div>
        </nav>

        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
