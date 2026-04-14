import React, { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import "./Contact.css";
import { useScrollReveal } from "../../hooks/useScrollReveal"; // 1. Hook Imported
import Swal from 'sweetalert2';
const Contact = () => {
  // 2. Initialize the hook
  useScrollReveal();

  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContactData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Backend logic untouched
  const submitContactForm = async (e) => {
    e.preventDefault();
    try {
      console.log("📤 Sending:", contactData);
      const res = await fetch("http://localhost:8000/submit", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contactData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Backend error:", errorData);
        alert("Validation failed. Check console.");
        return;
      }

      const data = await res.json();
      console.log("✅ Response:", data);
      Swal.fire({
              title: 'Success!',
              text: 'Message Sent Successfully!',
              icon: 'success',
              confirmButtonColor: '#2d5a54', // Matches your Aegis theme color
              timer: 2500,
              showConfirmButton: false,
              position: 'center'
            });
      
      setContactData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("❌ Network error:", err);
      Swal.fire("Error in Sending Message");
    }
  };

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <div className="contact-grid">
          
          {/* 3. LEFT INFO — Added 'reveal' and 'slide-left' */}
          <div className="contact-info reveal slide-left">
            <h2 className="contact-title">
              Let's Build a<br />Safer Tomorrow
            </h2>

            <div className="contact-details">
              <div className="contact-item">
                <MapPin size={18} />
                <span>Hitec University, Taxila</span>
              </div>
              <div className="contact-item">
                <Mail size={18} />
                <span>contact@aegis.com</span>
              </div>
              <div className="contact-item">
                <Phone size={18} />
                <span>+92 321 1234567</span>
              </div>
            </div>
          </div>

          {/* 4. FORM — Added 'reveal' and 'slide-right' */}
          <div className="contact-form-wrapper reveal slide-right">
            <h3 className="form-title">Get in Touch</h3>

            <form onSubmit={submitContactForm} className="contact-form">
              <div className="form-group">
                <label><strong>Full Name</strong></label>
                <input
                  type="text"
                  name="name"
                  value={contactData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label><strong>Email Address</strong></label>
                <input
                  type="email"
                  name="email"
                  value={contactData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label><strong>Message</strong></label>
                <textarea
                  name="message"
                  rows="4"
                  value={contactData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary submit-btn">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;