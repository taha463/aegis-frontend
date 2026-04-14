import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { auth, db } from "../../firebaseconfig";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Swal from "sweetalert2";

// ── Same flood images as Signup ──────────────────────────────
import image1 from "../../assets/images/image1.jpg";
import image2 from "../../assets/images/image2.jpg";
import image3 from "../../assets/images/image3.jpg";
import image4 from "../../assets/images/image4.jpg";
import image5 from "../../assets/images/image5.jpg";
import image6 from "../../assets/images/image6.jpg";
import image7 from "../../assets/images/image7.webp";
import image8 from "../../assets/images/image8.webp";
import image9 from "../../assets/images/image9.jpg";
import image10 from "../../assets/images/image10.jpg";
import image11 from "../../assets/images/image11.jpg";
import image12 from "../../assets/images/image12.jpg";
import image13 from "../../assets/images/image13.jpg";
import image14 from "../../assets/images/image14.jpg";
import image15 from "../../assets/images/image15.jpg";
import image16 from "../../assets/images/image16.jpg";
import image17 from "../../assets/images/image17.jpg";
import image18 from "../../assets/images/image18.jpg";
import image19 from "../../assets/images/image19.jpg";
import image20 from "../../assets/images/image20.jpg";
import image21 from "../../assets/images/image21.jpg";
import image22 from "../../assets/images/image22.jpg";
import image23 from "../../assets/images/image23.jpg";
import image24 from "../../assets/images/image24.jpg";
import image25 from "../../assets/images/image25.jpg";
import image26 from "../../assets/images/image26.jpg";
import image27 from "../../assets/images/image27.jpg";
import image28 from "../../assets/images/image28.jpg";
import image29 from "../../assets/images/image29.jpg";
import image30 from "../../assets/images/image30.jpg";
import image31 from "../../assets/images/image31.jpg";
import image32 from "../../assets/images/image32.webp";
import image33 from "../../assets/images/image33.jpg";
import image34 from "../../assets/images/image34.avif";
import image35 from "../../assets/images/image35.avif";
import image36 from "../../assets/images/image36.webp";
import image37 from "../../assets/images/image37.jpg";

const FLOOD_IMAGES = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12,
  image13,
  image14,
  image15,
  image16,
  image17,
  image18,
  image19,
  image20,
  image21,
  image22,
  image23,
  image24,
  image25,
  image26,
  image27,
  image28,
  image29,
  image30,
  image31,
  image32,
  image33,
  image34,
  image35,
  image36,
  image37,
];

const Login = () => {
  const navigate = useNavigate();

  // New image every mount
  const [bgPhoto] = useState(
    () => FLOOD_IMAGES[Math.floor(Math.random() * FLOOD_IMAGES.length)],
  );

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });

  const AegisToast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#fff",
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      AegisToast.fire({
        icon: "warning",
        title: "Please enter your email address first.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      Swal.fire({
        title: "Check Your Gmail",
        text: "A secure password reset link has been sent to your inbox.",
        icon: "success",
        confirmButtonColor: "#2d5a54",
        customClass: { popup: "swal-popup-modern" },
      });
    } catch (error) {
      AegisToast.fire({ icon: "error", title: error.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({ email: "", password: "" });

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        Swal.fire({
          title: "Email Not Verified",
          text: "Please verify your account using the link sent to your Gmail inbox.",
          icon: "warning",
          confirmButtonColor: "#2d5a54",
          background: "#fffbeb",
          customClass: { popup: "swal-popup-modern" },
        });
        return;
      }

      const idToken = await user.getIdToken();
      localStorage.setItem("aegis_token", idToken);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.entity === "ngo") {
          navigate("/DashboardNGO");
        } else {
          navigate("/DashboardCitizen");
        }
      } else {
        AegisToast.fire({ icon: "error", title: "User profile not found." });
      }
    } catch (error) {
      let errorMsg = "Login Failed. Please check your credentials.";
      if (error.code === "auth/wrong-password")
        errorMsg = "Incorrect password.";
      if (error.code === "auth/user-not-found") errorMsg = "Account not found.";

      AegisToast.fire({
        icon: "error",
        title: errorMsg,
        background: "#fff5f5",
        iconColor: "#e53e3e",
      });
    }
  };

  return (
    <div className="login-page-adobe">
      {/* Full screen flood image */}
      <img src={bgPhoto} alt="flood" className="login-bg-img" />

      {/* Cinematic overlay */}
      <div className="login-overlay" />

      {/* Logo — top left */}
      <div className="login-logo" onClick={() => navigate("/")}>
        <div className="logo-mark">
          <span className="logo-letter-a">A</span>
        </div>
        <span className="logo-text-rest">egis</span>
      </div>

      {/* Tagline — left side, center vertically */}
      <div className="login-tagline">
        <h1 className="login-brand-title">
          Welcome back
          <br />
          to Aegis
        </h1>
        <p className="login-brand-subtitle">
          Resume to begin your safe journey.
        </p>
      </div>

      {/* Form card — right side */}
      <div className="login-form-card">
        <h2 className="login-form-title">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? "error-border" : ""}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? "error-border" : ""}
              required
            />
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="forgot-password-btn"
          >
            Forgot Password?
          </button>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p className="signup-text">
          Does not have an account?{" "}
          <Link to="/Signup" className="auth-link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
