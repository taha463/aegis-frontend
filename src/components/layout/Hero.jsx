import React, { useState } from "react";
import "./Hero.css";
import AegisAssist from "./AegisAssist";
import Onee from "../onee-avatar/Onee";

const Hero = () => {
  const [showAssist, setShowAssist] = useState(false);
  const [avatarAnim, setAvatarAnim] = useState("idle");

  // Helper function to wrap letters in spans with animation delays
  const animatedText = (text, startDelay = 0) => {
    return text.split("").map((char, index) => (
      <span
        key={index}
        className="falling-char"
        style={{ animationDelay: `${startDelay + index * 0.03}s` }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  return (
    <>
      {showAssist && <AegisAssist onClose={() => setShowAssist(false)} />}

      <section id="hero" className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="hero-left">
            <span className="awareness-tag">Awareness of the Day</span>
            <h2 className="hero-subtitle">
              Because prevention <br />
              starts with awareness
            </h2>
          </div>

          <div className="hero-right">
            <h1 className="hero-title">
              <div className="line-1">
                {animatedText("When every drop counts,")}
              </div>
              <div className="line-2">
                {animatedText("intelligence saves lives.", 0.8)}
              </div>
            </h1>
          </div>

          <div
            className="hero-chat-trigger"
            onClick={() => setShowAssist(true)}
            onMouseEnter={() => setAvatarAnim("excited")}
            onMouseLeave={() => setAvatarAnim("idle")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Onee size={64} animation={avatarAnim} playing={true} loop={true} />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
