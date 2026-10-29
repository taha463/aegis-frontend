// config.js or constants.js
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (isLocalhost ? "http://localhost:8000" : "https://fyp-backend-lgsp.onrender.com");

export default API_URL;
