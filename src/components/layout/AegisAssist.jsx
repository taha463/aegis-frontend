import React, { useState, useRef, useEffect } from "react";
import { X, Send, Mic, Loader2 } from "lucide-react";
import "./AegisAssist.css";
import { auth } from "../../firebaseconfig";

// Assets
import shieldLogo from "../../assets/images/Screenshot_2025-12-16_183438-removebg-preview.png";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "GOOD MORNING";
  if (hour >= 12 && hour < 17) return "GOOD AFTERNOON";
  if (hour >= 17 && hour < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
};

const SUGGESTIONS = [
  "What is the flood prediction today?",
  "How can I send my location to NGO?",
  "Show me the nearest shelter.",
];

// Web Speech API STT
function startListening(onResult, onEnd) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition not supported in this browser.");
    onEnd();
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    onResult(transcript);
  };
  recognition.onerror = () => onEnd();
  recognition.onend = () => onEnd();
  recognition.start();
  return recognition;
}

const AegisAssist = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const chatStarted = messages.length > 0;

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [inputValue]);

  const sendMessage = async (text) => {
    const userText = (text || inputValue).trim();
    if (!userText || isStreaming) return;
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setMessages((prev) => [...prev, { role: "ai", text: "", thinking: true }]);
    setIsStreaming(true);

    let fullResponse = "";

    try {
      // Get user location (fallback to Gujranwala)
      // ✅ FIX: Read the exact location the Dashboard already figured out
      let lat = 31.5204; // Default fallback
      let lon = 74.3587;
      let city = "Local Area";

      const savedLoc = localStorage.getItem("aegis_last_location");
      if (savedLoc) {
        const parsedLoc = JSON.parse(savedLoc);
        lat = parsedLoc.lat;
        lon = parsedLoc.lon;
        city = parsedLoc.city; // This will correctly grab "Taxila"!
      } else {
        // Ultimate fallback if no location was ever saved
        const savedProfile = localStorage.getItem("aegis_user_profile");
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          city = parsedProfile.city || parsedProfile.location || "Local Area";
        }
      }

      // Get token the same way your interceptor does
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";

      const response = await fetch("http://localhost:8000/ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText, lat, lon, city }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Switch thinking bubble to streaming bubble
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", text: "", thinking: false };
        return updated;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        // Parse SSE properly — each line is "data: <token>"
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const token = line.slice(6); // strip "data: " prefix exactly
          if (!token) continue;
          fullResponse += token;
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ai",
            text: fullResponse,
            thinking: false,
          };
          return updated;
        });
      }
    } catch (err) {
      fullResponse =
        "Connection error. Please check your network and try again.";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: fullResponse,
          thinking: false,
        };
        return updated;
      });
    }

    setIsStreaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    recognitionRef.current = startListening(
      (transcript) => {
        setInputValue(transcript);
        setIsListening(false);
      },
      () => setIsListening(false),
    );
  };

  return (
    <div className="aegis-assist-scope">
      <div className="aegis-wrapper">
        <div className="aegis-container">
          {/* HEADER */}
          <header className="aegis-header">
            <div className="logo-group">
              <img
                src={shieldLogo}
                alt="Aegis Logo"
                className="header-logo-img"
              />
              <div className="logo-text-wrapper">
                <span className="logo-mark">A</span>
                <span className="logo-text">egis Assist</span>
              </div>
            </div>
            <button className="close-icon-btn" onClick={onClose}>
              <X size={28} />
            </button>
          </header>

          <main className="aegis-main">
            {/* HERO — hidden after chat starts */}
            {!chatStarted && (
              <>
                <div className="hero-content">
                  <div className="hero-row">
                    <img
                      src={shieldLogo}
                      alt="AI Icon"
                      className="hero-icon-img"
                    />
                    <div className="hero-text-col">
                      <h1 className="greeting-text">{getGreeting()}, Taha!</h1>
                      <h1 className="greeting-text">
                        HOW CAN I{" "}
                        <span className="highlight-green">
                          ASSIST YOU TODAY?
                        </span>
                      </h1>
                    </div>
                  </div>
                </div>

                <div className="suggestions-group">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="suggestion-bubble"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* CHAT BUBBLES */}
            {chatStarted && (
              <div className="chat-messages">
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="bubble-row bubble-row--user">
                      <div className="bubble bubble--user">{msg.text}</div>
                    </div>
                  ) : (
                    <div key={i} className="bubble-row bubble-row--ai">
                      <img
                        src={shieldLogo}
                        alt="Aegis"
                        className="bubble-avatar"
                      />
                      <div
                        className={`bubble bubble--ai${
                          msg.thinking ? " bubble--thinking" : ""
                        }`}
                      >
                        {msg.thinking ? (
                          <span className="thinking-text">
                            <Loader2 size={14} className="thinking-spinner" />
                            Aegis is thinking...
                          </span>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ),
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* INPUT */}
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask me anything"
                  className="chat-input-field"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="input-actions-group">
                  <button
                    className={`voice-btn${isListening ? " voice-btn--active" : ""}`}
                    title="Voice Search"
                    onClick={handleMic}
                  >
                    <Mic size={20} color={isListening ? "#2d5a54" : "#555"} />
                  </button>
                  <button
                    className="send-btn"
                    title="Send Message"
                    onClick={() => sendMessage()}
                    disabled={isStreaming}
                  >
                    {isStreaming ? (
                      <Loader2
                        size={20}
                        color="#2d5a54"
                        className="spin-icon"
                      />
                    ) : (
                      <Send size={20} color="#555" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AegisAssist;
