import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@flexy/types": path.resolve(__dirname, "../../packages/types/src"),
      "@flexy/api-client": path.resolve(__dirname, "../../packages/api-client/src"),
      "@flexy/player": path.resolve(__dirname, "../../packages/player/src"),
      "@flexy/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          query: ["@tanstack/react-query"],
          motion: ["framer-motion"],
          router: ["react-router-dom"],
        },
      },
    },
  },
  server: { port: 5173, host: true },
});
