import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During development React runs on :5173 and the API on :5000.
// The proxy forwards /api and /uploads to the API, so the React code
// can simply call fetch("/api/items") with no CORS setup.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:5000",
            "/uploads": "http://localhost:5000"
        }
    }
});
