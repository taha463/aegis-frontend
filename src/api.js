import axios from "axios";
import { auth } from "./firebaseconfig";

// Create a reusable connection to your Render URL
const api = axios.create({
  baseURL: "https://your-backend.onrender.com",
});

// Automatically add the Firebase Token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // Get the secure ID token
    config.headers.Authorization = `Bearer ${token}`; // Send it as a Bearer token
  }
  return config;
});

export default api;