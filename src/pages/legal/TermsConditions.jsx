import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { auth, db } from "../../firebaseconfig"; // Import your firebase config
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
/* Import Icons needed for the inline Header */
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
/* Import Layout Components */
import { Footer } from "../../components/layout";

/* Import CSS */
import "./Legal.css";

const TermsConditions = () => {
  // --- HEADER LOGIC (Inlined) ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const sections = [
    { id: "welcome", title: "Welcome to Aegis" },
    { id: "using", title: "Using Aegis" },
    { id: "responsibilities", title: "User Responsibilities" },
    { id: "data", title: "Data Usage" },
    { id: "limitations", title: "Limitations of Service" },
    { id: "intellectual", title: "Intellectual Property" },
    { id: "updates", title: "Updates to These Terms" },
    { id: "contact", title: "Contact Us" },
  ];

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for login/logout changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  if (loading) return <div className="btn-explore-loading" />;

  return (
    <div className="legal-page">
      {/* ==========================
          INLINED HEADER START
         ========================== */}
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={shieldLogo} alt="Aegis Shield" className="logo-img" />
            <div className="logo-mark">
              <span className="logo-letter-a">A</span>
            </div>
            <span className="logo-text-rest">egis</span>
          </Link>

          <nav className={`nav ${isMenuOpen ? "nav-open" : ""}`}>
            <ul className="nav-list">
              <li>
                <a href="#about" className="nav-link">
                  <Info size={18} style={{ marginRight: "8px" }} /> About us
                </a>
              </li>
              <li>
                <a href="#how" className="nav-link">
                  <Settings size={18} style={{ marginRight: "8px" }} /> How it
                  Works
                </a>
              </li>
              <li>
                <a href="#contact" className="nav-link">
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
                  <LogOut size={18} style={{ marginRight: "4px" }} /> Logout
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
      {/* ==========================
          INLINED HEADER END
         ========================== */}

      <div className="legal-container">
        <aside className="legal-sidebar">
          <nav>
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="legal-content">
          <h1 className="page-title">Terms & Conditions</h1>
          <div style={{ marginBottom: "50px" }}></div>

          <section id="welcome" className="legal-section">
            <h2>Welcome to Aegis</h2>
            <p>
              By accessing or using Aegis, you agree to follow these terms. Our
              goal is to keep every user whether a citizen or NGO safe and
              informed during critical times. Please read these terms carefully
              before using our services.
            </p>
          </section>

          <section id="using" className="legal-section">
            <h2>1. Using Aegis</h2>
            <p>
              Aegis provides AI-powered flood detection, alerts, and assistance.
              You may use Aegis only for lawful and responsible purposes. Do not
              misuse, modify, or attempt to disrupt our system or data.
            </p>
          </section>

          <section id="responsibilities" className="legal-section">
            <h2>2. User Responsibilities</h2>
            <p>
              Provide accurate personal details when signing up. Keep your login
              credentials secure. Report any suspicious activity or errors you
              encounter. Respect other users and the data you access through
              Aegis.
            </p>
          </section>

          <section id="data" className="legal-section">
            <h2>3. Data Usage</h2>
            <p>
              We collect minimal data (like your location and contact number) to
              provide real-time alerts and insights. Your data is stored
              securely and managed according to our Privacy Policy.
            </p>
          </section>

          <section id="limitations" className="legal-section">
            <h2>4. Limitations of Service</h2>
            <p>
              Aegis uses AI predictions and live data to support safety
              decisions. However, it cannot guarantee absolute accuracy or
              replace official government warnings. Users should always follow
              local authorities' safety instructions.
            </p>
          </section>

          <section id="intellectual" className="legal-section">
            <h2>5. Intellectual Property</h2>
            <p>
              All content, designs, logos, and AI tools within Aegis belong to
              the Aegis team. You may not reproduce or reuse them without
              permission.
            </p>
          </section>

          <section id="updates" className="legal-section">
            <h2>6. Updates to These Terms</h2>
            <p>
              We may update these Terms occasionally to improve service or
              comply with new policies. Changes will be posted on this page with
              a "last updated" date.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>7. Contact Us</h2>
            <p>If you have any questions about these Terms, contact us at:</p>
            <p>
              <span className="contact-details">support@aegis.com</span>
              <br />
              <span className="contact-details">
                Hitec University Taxila, Pakistan
              </span>
            </p>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TermsConditions;
