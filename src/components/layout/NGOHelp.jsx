import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import "./NGOHelp.css"; // only FAQ styles

const NGOHelp = () => {
  const { profile } = useOutletContext(); // from NGOLayout
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
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
    const timer = setInterval(updateDate, 1000 * 60 * 60); // update every hour
    return () => clearInterval(timer);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="Main-Card">
      <div className="header-row">
        <div>
          <h1 className="dashboard-title-h1">
            What can we <span style={{ color: "#244d4d" }}>help</span> you find?
          </h1>
          <p className="dashboard-title-p">
            Hello, <span>{profile?.fullName || profile?.name || "User"}</span>!
            Here are some questions that might help you!
          </p>
        </div>
        <div className="dashboard-date">{date}</div>
      </div>

      <div className="faq-section">
        {/* 1. What this app does? */}
        <div
          className={`faq-item ${openFaqIndex === 0 ? "active" : ""}`}
          onClick={() => toggleFaq(0)}
        >
          <div className="faq-header">
            <span className="faq-title">What this app does?</span>
            {openFaqIndex === 0 ? <Minus size={20} /> : <Plus size={20} />}
          </div>
          {openFaqIndex === 0 && (
            <div className="faq-content">
              This app shows flood alerts, weather updates, safe shelters, and
              emergency guidance. It helps you stay informed and safe during
              heavy rain and flood situations.
            </div>
          )}
        </div>

        {/* 2. How to use? */}
        <div
          className={`faq-item ${openFaqIndex === 1 ? "active" : ""}`}
          onClick={() => toggleFaq(1)}
        >
          <div className="faq-header">
            <span className="faq-title">How to use?</span>
            {openFaqIndex === 1 ? <Minus size={20} /> : <Plus size={20} />}
          </div>
          {openFaqIndex === 1 && (
            <div className="faq-content">
              <ul className="faq-list">
                <li>Check alerts on the dashboard</li>
                <li>See today's weather</li>
                <li>Follow safe route if flood alert appears</li>
                <li>Use the emergency button if you need help</li>
              </ul>
            </div>
          )}
        </div>

        {/* 3. Some Common Questions */}
        <div
          className={`faq-item ${openFaqIndex === 2 ? "active" : ""}`}
          onClick={() => toggleFaq(2)}
        >
          <div className="faq-header">
            <span className="faq-title">Some Common Questions</span>
            {openFaqIndex === 2 ? <Minus size={20} /> : <Plus size={20} />}
          </div>
          {openFaqIndex === 2 && (
            <div className="faq-content">
              <div className="qa-block">
                <span className="qa-question">
                  Q: Why did I get a flood alert?
                </span>
                <p>
                  You received a flood alert because the system detected heavy
                  rain or rising water levels.
                </p>
              </div>
              <div className="qa-block">
                <span className="qa-question">Q: How do I change my city?</span>
                <p>
                  You can change your city by tapping the city name shown at the
                  top of the dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Contact & Support */}
        <div
          className={`faq-item ${openFaqIndex === 3 ? "active" : ""}`}
          style={{ borderBottom: "none" }}
          onClick={() => toggleFaq(3)}
        >
          <div className="faq-header">
            <span className="faq-title">Contact & Support</span>
            {openFaqIndex === 3 ? <Minus size={20} /> : <Plus size={20} />}
          </div>
          {openFaqIndex === 3 && (
            <div className="faq-content">
              <ul className="faq-list">
                <li>
                  <strong>Emergency Helpline:</strong> 1122
                </li>
                <li>
                  <strong>Email Support:</strong> support@aegis-app.com
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NGOHelp;
