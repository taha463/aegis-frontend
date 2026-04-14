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

/* Import Layout Components */
import { Footer } from "../../components/layout";

/* Import Assets */
import shieldLogo from "../../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";

/* Import CSS */
import "./Legal.css";

const PrivacyPolicy = () => {
  // --- HEADER LOGIC (Inlined) ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const sections = [
    { id: "welcome", title: "Welcome to Aegis" },
    { id: "info-collect", title: "Information We Collect" },
    { id: "how-use", title: "How We Use Your Information" },
    { id: "sharing", title: "Data Sharing and Disclosure" },
    { id: "security", title: "Data Security" },
    { id: "cookies", title: "Cookies Policy" },
    { id: "rights", title: "Your Rights" },
    { id: "third-party", title: "Third-Party Links" },
    { id: "updates", title: "Updates to This Policy" },
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

  // explore button code data
  const [loading, setLoading] = useState(true);

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
  const [date, setDate] = useState("");
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
        {/* Sidebar */}
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

        {/* Content */}
        <main className="legal-content">
          <h1 className="page-title">Privacy Policy</h1>
          <span className="last-updated">Last Updated: {date}</span>

          <section id="welcome" className="legal-section">
            <h2>Welcome to Aegis</h2>
            <p>
              We value your privacy and are committed to protecting your
              personal information. This Privacy Policy explains how we collect,
              use, and safeguard your data when you use our platform.
            </p>
          </section>

          <section id="info-collect" className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li>
                <strong>Personal Information:</strong> such as name, email,
                phone number, or location details when provided voluntarily.
              </li>
              <li>
                <strong>Usage Data:</strong> including pages visited, browser
                type, IP address, and device information.
              </li>
              <li>
                <strong>Cookies:</strong> small data files to enhance user
                experience and site functionality.
              </li>
            </ul>
          </section>

          <section id="how-use" className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>Your information may be used to:</p>
            <ul>
              <li>Improve our services and personalize your experience.</li>
              <li>Respond to your inquiries or feedback.</li>
              <li>
                Send important updates or alerts related to flood safety and
                community activities.
              </li>
              <li>Analyze usage patterns for service optimization.</li>
            </ul>
          </section>

          <section id="sharing" className="legal-section">
            <h2>3. Data Sharing and Disclosure</h2>
            <p>
              We do not sell or trade user information. Data may be shared only
              with:
            </p>
            <ul>
              <li>
                Authorized partners or NGOs assisting in safety or relief
                activities.
              </li>
              <li>
                Legal authorities when required by law or emergency protocols.
              </li>
            </ul>
          </section>

          <section id="security" className="legal-section">
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect personal data from unauthorized access, alteration, or
              loss. However, no system is completely secure, and users share
              data at their own discretion.
            </p>
          </section>

          <section id="cookies" className="legal-section">
            <h2>5. Cookies Policy</h2>
            <p>
              Cookies are used to remember preferences and track site
              performance. You can disable cookies through your browser
              settings, though some features may not function properly without
              them.
            </p>
          </section>

          <section id="rights" className="legal-section">
            <h2>6. Your Rights</h2>
            <p>Users have the right to:</p>
            <ul>
              <li>Access or request deletion of their personal information.</li>
              <li>Withdraw consent for data usage at any time.</li>
              <li>Contact us regarding any data-related concerns.</li>
            </ul>
          </section>

          <section id="third-party" className="legal-section">
            <h2>7. Third-Party Links</h2>
            <p>
              Our site may contain links to third-party websites. We are not
              responsible for the privacy practices or content of those sites.
            </p>
          </section>

          <section id="updates" className="legal-section">
            <h2>8. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. The revised
              version will be posted on this page with a new “Last Updated”
              date.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, you can
              contact us by sending us an email:{" "}
              <span className="contact-details">privacy@aegis.com</span>
            </p>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
