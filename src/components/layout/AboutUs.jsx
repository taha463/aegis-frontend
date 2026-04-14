import React from "react";
import "./AboutUs.css";
import { useScrollReveal } from "../../hooks/useScrollReveal";

// 👉 IMPORT YOUR IMAGES
import img1 from "../../assets/images/flood-sign.png";
import img2 from "../../assets/images/flood-lamp.png";
import img3 from "../../assets/images/flood-trees.png";
import img4 from "../../assets/images/flood-rescue.png";

const AboutUs = () => {
  // 1. Call the scroll reveal hook
  useScrollReveal();

  const features = [
    {
      number: "1.",
      title: "Who We Are",
      description: "We are a dedicated team of experts in flood prediction.",
    },
    {
      number: "2.",
      title: "What Do We Do",
      description:
        "We provide real-time flood monitoring, early warning systems.",
    },
    {
      number: "3.",
      title: "How Do We Help",
      description: "Our platform analyzes weather data, river levels.",
    },
    {
      number: "4.",
      title: "Our Vision",
      description: "To create a world where no community is caught off guard.",
    },
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        {/* 2. Added 'reveal' to the header */}
        <div className="about-header reveal">
          <h2 className="about-title">About Us</h2>
          <p className="about-subtitle">
            Because every life deserves protection.
          </p>
        </div>

        <div className="about-content">
          {/* LEFT SIDE — TEXT */}
          <div className="features-grid">
            {features.map((feature, index) => (
              /* 3. Added 'reveal' to each card */
              <div key={index} className="feature-card reveal">
                <span className="feature-number">{feature.number}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* RIGHT SIDE — PINTEREST IMAGE STACK */}
          {/* 4. Added 'reveal' to the image wrapper */}
          <div className="pinterest-wrapper reveal">
            <div className="pinterest-grid">
              <div className="pin-col">
                <img
                  src={img1}
                  alt="Flood Sign"
                  className="pin-img size-short"
                />
                <img
                  src={img2}
                  alt="Street Lamp"
                  className="pin-img size-tall"
                />
              </div>

              <div className="pin-col offset">
                <img
                  src={img3}
                  alt="Flooded Trees"
                  className="pin-img size-very-tall"
                />
                <img
                  src={img4}
                  alt="Rescue Operation"
                  className="pin-img size-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
