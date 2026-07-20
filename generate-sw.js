console.log("🔥🔥🔥 GENERATE-SW.JS STARTED 🔥🔥🔥");

import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const swContent = `
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "${process.env.VITE_FIREBASE_API_KEY}",
  authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.VITE_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.VITE_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const severity = payload.data?.severity || "SAFE";
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: severity === "DANGER" ? [200, 100, 200, 100, 200] : [100],
    requireInteraction: severity === "DANGER",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
`;

fs.writeFileSync("public/firebase-messaging-sw.js", swContent.trim());
console.log("✅✅✅ firebase-messaging-sw.js generated from env vars ✅✅✅");
