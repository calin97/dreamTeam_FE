import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: "REACT_APP_", // default: VITE_
  server: {
    port: 3000,
    open: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      src: "/src",
    },
  },
});


