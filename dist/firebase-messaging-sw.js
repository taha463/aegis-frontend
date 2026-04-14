// public/firebase-messaging-sw.js

// Import Firebase libraries for background workers
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
);

// Initialize Firebase (Replace these with your actual Firebase config values!)
firebase.initializeApp({
  apiKey: "AIzaSyD-uwp07GURrHOqzVpKgPsNXkmejzH5bto",
  authDomain: "aegis-app-950c8.firebaseapp.com",
  projectId: "aegis-app-950c8",
  storageBucket: "aegis-app-950c8.firebasestorage.app",
  messagingSenderId: "115047939600",
  appId: "1:115047939600:web:6aa87cda50d5d923725495",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png", // Ensure you have your Aegis logo here
    badge: "/logo192.png", // Small icon for mobile status bar
    vibrate: [200, 100, 200, 100, 200], // Professional alert vibration
    requireInteraction: payload.notification.title.includes("🚨")
      ? true
      : false, // Forces user to dismiss if it's Danger
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicking the notification when app is closed
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/"), // Opens your Aegis Dashboard when clicked
  );
});
