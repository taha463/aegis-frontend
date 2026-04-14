import React, { useState, useEffect } from "react"; // Added useState and useEffect
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { Linkedin, Triangle, Menu, X, ArrowUpRight } from "lucide-react";
import { FaQuora, FaDiscord } from "react-icons/fa";
import "./Footer.css";
import shieldLogo from "../../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";
import { auth, db } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Footer = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Listen for auth changes to keep 'user' state synced
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExploreClick = async (e) => {
    if (e) e.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error(
        "BACKEND LOG: No Auth Identity found. Redirecting to login.",
      );
      navigate("/Login");
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();

        // Match the database field 'entity' as seen in your screenshot
        const userRole = data.entity ? data.entity.toLowerCase().trim() : "";

        if (userRole === "ngo") {
          navigate("/DashboardNGO");
        } else if (userRole === "citizen") {
          navigate("/DashboardCitizen");
        } else {
          alert("User role not recognized: " + userRole);
        }
      } else {
        alert("Profile data not found in Firestore.");
      }
    } catch (error) {
      console.error("BACKEND LOG: Fetch Error:", error.message);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <img src={shieldLogo} alt="Aegis Shield" className="logo-img" />
              <div className="logo-mark">
                <span className="logo-letter-a">A</span>
              </div>
              <span className="logo-text-rest">egis</span>
            </Link>
            <p className="footer-tagline">
              Together, we build a safer tomorrow.
            </p>
            <div className="social-links">
              <button className="social-link" aria-label="FaDiscord">
                <FaDiscord size={18} />
              </button>
              <button className="social-link" aria-label="FaQuora">
                <FaQuora size={18} />
              </button>
              <button className="social-link" aria-label="Linkeden">
                <Linkedin size={18} />
              </button>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-list">
                <li>
                  <a href="#hero">Home</a>
                </li>
                <li>
                  <a href="#about">About us</a>
                </li>
                <li>
                  <a href="#how">How it Works</a>
                </li>
                <li>
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-list">
                <li>
                  {/* Using a button for the Dashboard link to trigger the logic */}
                  <button
                    onClick={handleExploreClick}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      font: "inherit",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <Link to="/signup">Sign up</Link>
                </li>
                <li>
                  <Link to="/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms">Terms & Conditions</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© 2026 Aegis. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
