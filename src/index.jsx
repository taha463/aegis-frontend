import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
// 🟢 The PWA import must be here
import { registerSW } from "virtual:pwa-register";

// 🟢 Register the Service Worker immediately
if ("serviceWorker" in navigator) {
  registerSW({
    onNeedRefresh() {
      // You can add a toast notification here later
      console.log("New content available, please refresh.");
    },
    onOfflineReady() {
      console.log("🚀 Aegis is now ready to work offline!");
    },
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportWebVitals();
