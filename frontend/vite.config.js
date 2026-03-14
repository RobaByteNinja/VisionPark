import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Binds to all network interfaces
    port: 5173,
    strictPort: true, 
    cors: true, // ✅ Allows the Codespaces proxy to connect
    allowedHosts: 'all', // ✅ CRITICAL: Stops Vite from blocking the Codespaces URL
    hmr: {
      clientPort: 443, // Routes WebSocket through the secure proxy
    },
    watch: {
      usePolling: true,
      interval: 100,
    }
  }
})