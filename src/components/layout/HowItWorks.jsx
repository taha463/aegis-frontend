import React, { useState, useRef } from "react";
import "./HowItWorks.css";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  CloudRain,
  Waves,
  FileText,
} from "lucide-react";

import walkthroughVid from "../../assets/images/Video Project.mp4";

const HowItWorks = () => {
  useScrollReveal();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleProgressClick = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skip = (amount) => {
    videoRef.current.currentTime += amount;
  };

  const handleFullscreen = () => {
    if (containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    } else if (containerRef.current.webkitRequestFullscreen) {
      containerRef.current.webkitRequestFullscreen();
    } else if (containerRef.current.msRequestFullscreen) {
      containerRef.current.msRequestFullscreen();
    }
  };

  return (
    <section id="how" className="how-it-works-section">
      <div className="aegis-container">
        <div className="content-wrapper">
          <div className="left-column reveal slide-left">
            <div className="sticky-wrapper">
              <h2 className="main-title">How it Works</h2>
              <p className="main-description">
                We believe no one should face disaster unprepared. That’s why
                AEGIS acts in 4 simple steps — Detect, Analyze, Alert, and
                Protect.
              </p>

              <div className="video-player-frame" ref={containerRef}>
                <video
                  ref={videoRef}
                  preload="metadata"
                  autoPlay
                  loop
                  muted
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="walkthrough-video"
                  onClick={togglePlay}
                >
                  <source src={walkthroughVid} type="video/mp4" />
                </video>

                <div className="video-controls-overlay">
                  <div
                    className="progress-hitbox"
                    onClick={handleProgressClick}
                  >
                    <div className="progress-bar-bg">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="progress-knob"></div>
                      </div>
                    </div>
                  </div>

                  <div className="controls-row">
                    <button onClick={() => skip(-5)} className="vid-btn-small">
                      <RotateCcw size={20} />
                    </button>
                    <button onClick={togglePlay} className="play-pause-main">
                      {isPlaying ? (
                        <Pause size={24} fill="white" />
                      ) : (
                        <Play size={24} fill="white" />
                      )}
                    </button>
                    <button onClick={() => skip(5)} className="vid-btn-small">
                      <RotateCw size={20} />
                    </button>
                    <button
                      onClick={handleFullscreen}
                      className="vid-btn-small fullscreen-btn"
                    >
                      <Maximize size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* CLEAN PROFESSIONAL FOOTER */}
              <div className="video-source-footer">
                <div className="footer-header">
                  <span className="source-label">OUR SMART SOURCES</span>
                  <div className="system-status-pill">
                    <div className="live-dot"></div>
                    <span>LIVE SYSTEM</span>
                  </div>
                </div>

                <div className="source-row">
                  <div className="source-item">
                    <CloudRain size={22} strokeWidth={1.5} />
                    <span>NASA Weather</span>
                  </div>
                  <div className="source-item">
                    <Waves size={22} strokeWidth={1.5} />
                    <span>River Levels</span>
                  </div>
                  <div className="source-item">
                    <FileText size={22} strokeWidth={1.5} />
                    <span>Safety Alerts</span>
                  </div>
                </div>

                <div className="footer-info-text">
                  Aegis connects with global satellites and local water sensors
                  to give you the most accurate warnings in real-time.
                </div>
              </div>
            </div>
          </div>

          <div className="steps-column">
            <div className="step-wrapper step-1 reveal">
              <StepCard
                number="01"
                title="Detect Your Location"
                desc="Aegis automatically identifies your area to connect you with real-time regional data."
              />
            </div>
            <div className="step-wrapper step-2 reveal">
              <CurvedArrow />
              <StepCard
                number="02"
                title="Analyze Live Conditions"
                desc="AI processes rainfall, satellite, and river-level data to predict potential flood risks."
              />
            </div>
            <div className="step-wrapper step-3 reveal">
              <CurvedArrow />
              <StepCard
                number="03"
                title="Deliver Smart Insights"
                desc="You get a clear dashboard showing local risk levels and key safety indicators."
              />
            </div>
            <div className="step-wrapper step-4 reveal">
              <CurvedArrow />
              <StepCard
                number="04"
                title="Alert and Assist Instantly"
                desc="If danger rises, Aegis sends instant alerts with safety tips and nearby shelter info."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StepCard = ({ number, title, desc }) => (
  <div className="step-card">
    <div className="card-left">
      <span className="step-number">{number}</span>
      <h3 className="card-title">{title}</h3>
    </div>
    <div className="card-right">
      <div className="green-dash"></div>
      <p className="card-desc">{desc}</p>
    </div>
  </div>
);

const CurvedArrow = () => (
  <div className="arrow-wrapper">
    <svg
      viewBox="0 0 100 100"
      fill="none"
      style={{ width: "100%", height: "100%" }}
    >
      <path
        d="M 15 0 C 15 50, 15 60, 85 85"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 78 80 L 85 85 L 76 91"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  </div>
);

export default HowItWorks;
