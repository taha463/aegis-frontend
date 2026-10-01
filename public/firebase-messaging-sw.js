importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD-uwp07GURrHOqzVpKgPsNXkmejzH5bto",
  authDomain: "aegis-app-950c8.firebaseapp.com",
  projectId: "aegis-app-950c8",
  storageBucket: "aegis-app-950c8.firebasestorage.app",
  messagingSenderId: "115047939600",
  appId: "1:115047939600:web:6aa87cda50d5d923725495",
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