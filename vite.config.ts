import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "행복루틴",
        short_name: "행복루틴",
        description: "미션·인증·선물로 이어가는 행복 루틴",
        start_url: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#fff6e1",
        theme_color: "#7b5400",
        lang: "ko",
        icons: [
          {
            src: "icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
        // TF.js + 모델 번들이 2 MiB를 넘음; 오프라인 인증 캐시를 위해 상한 확대
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@tensorflow") || id.includes("tfjs")) return "tf";
          if (id.includes("react-router")) return "router";
          if (id.includes("react-dom") || id.includes("/react/")) return "react";
          if (id.includes("@capacitor")) return "capacitor";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "@tensorflow/tfjs",
      "@tensorflow-models/face-landmarks-detection",
      "@tensorflow-models/pose-detection",
    ],
  },
});
