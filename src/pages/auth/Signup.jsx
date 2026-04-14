import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import "./Auth.css";
import { auth, db } from "../../firebaseconfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";

// ── Local flood images ──
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

const entityOptions = [
  { value: "citizen", label: "Citizen" },
  { value: "ngo", label: "NGO" },
];

const Signup = () => {
  const navigate = useNavigate();

  // Picks new image every mount — changes on refresh and navigation
  const [bgPhoto] = useState(
    () => FLOOD_IMAGES[Math.floor(Math.random() * FLOOD_IMAGES.length)],
  );

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    entity: "",
  });
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });

  const AegisConfirm = Swal.mixin({
    customClass: {
      confirmButton: "swal-button-confirm",
      popup: "swal-popup-modern",
      title: "swal-title-modern",
    },
    buttonsStyling: false,
    color: "#333",
    background: "#fff",
  });

  const AegisToast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      entity: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = { email: "", password: "" };
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid official email address.";
      isValid = false;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%&]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      errors.password =
        "Password must be at least 8 characters, with 1 uppercase letter and 1 special icon (!@#$%&).";
      isValid = false;
    }

    setFormErrors(errors);
    if (!isValid) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        entity: formData.entity,
        uid: user.uid,
      });

      AegisConfirm.fire({
        title: "Verify Your Email",
        html: `<p style="font-family: 'Open Sans', sans-serif;">A secure link has been sent to <b>${formData.email}</b>.<br>Please check your inbox (and spam) to activate your Aegis account.</p>`,
        icon: "info",
        iconColor: "#2d5a54",
        confirmButtonText: "Proceed to Login",
      });

      navigate("/login");
    } catch (error) {
      let errorMsg = error.message;
      if (error.code === "auth/email-already-in-use")
        errorMsg = "This email is already registered.";

      AegisToast.fire({
        icon: "error",
        title: errorMsg,
        background: "#fff5f5",
        iconColor: "#e53e3e",
      });
    }
  };

  return (
    // ── Full screen container — image fills everything ──
    <div className="signup-page-adobe">
      {/* Full screen flood image background */}
      <img src={bgPhoto} alt="flood" className="adobe-bg-img" />

      {/* Dark overlay over entire screen */}
      <div className="adobe-overlay" />

      {/* Logo — top left, above everything */}
      <div className="adobe-logo" onClick={() => navigate("/")}>
        <div className="logo-mark">
          <span className="logo-letter-a">A</span>
        </div>
        <span className="logo-text-rest">egis</span>
      </div>

      {/* Floating form card — right side, doesn't touch edges */}
      <div className="adobe-form-card">
        <h2 className="stylish-title">Sign up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="custom-input"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={`custom-input ${formErrors.email ? "error-border" : ""}`}
              required
            />
            {formErrors.email && (
              <div className="error-text">{formErrors.email}</div>
            )}
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={`custom-input ${formErrors.password ? "error-border" : ""}`}
              required
            />
            {formErrors.password && (
              <div className="error-text">{formErrors.password}</div>
            )}
          </div>
          <div className="form-group">
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="custom-input"
              required
            />
          </div>
          <div className="form-group">
            <Select
              classNamePrefix="react-select"
              options={entityOptions}
              placeholder="Select Entity"
              onChange={handleSelectChange}
              value={entityOptions.find((opt) => opt.value === formData.entity)}
              isSearchable={false}
              required
            />
          </div>
          <button type="submit" className="brown-btn">
            Sign up
          </button>
        </form>
        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>

      {/* Aegis text bottom left — like Adobe's tagline */}
      <div className="adobe-tagline">
        <h1 className="adobe-brand-title">Start with Aegis</h1>
        <p className="adobe-brand-subtitle">
          Ready to begin your safe journey?
        </p>
      </div>
    </div>
  );
};

export default Signup;
