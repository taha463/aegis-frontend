import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Add this inside the export default defineConfig({ ... })
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // 🟢 Forces everything into one bundle
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Include assets that aren't picked up by the glob pattern
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "masked-icon.svg",
        "copy-removebg-preview.png",
      ],
      manifest: {
        name: "Aegis - Flood Safety",
        short_name: "Aegis",
        description: "AI-powered flood detection and safety assistant.",
        theme_color: "#016335", // Updated to your Aegis Green
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: "copy-removebg-preview.png", // Using your logo
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "copy-removebg-preview.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // 1. Pre-cache all static build assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

        // 2. Handle Single Page App (SPA) routing
        // This ensures if you refresh on /dashboard while offline, it still loads
        navigateFallback: "index.html",

        // 3. Runtime Caching for dynamic content
        runtimeCaching: [
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache your actual API data (the "Notifications" and "Shelters")
            // This allows the app to show the LAST KNOWN data when offline
            urlPattern: /^http:\/\/localhost:8000\/.*/i,
            handler: "NetworkFirst", // Try network, fallback to cache
            options: {
              cacheName: "api-data-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    allowedHosts: true,
  },
});
