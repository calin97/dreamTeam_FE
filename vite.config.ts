import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envPrefix: "REACT_APP_",
  server: { port: 3000, open: true },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      src: "/src",
      // ⬇️ aliasăm importurile spre shim-ul local
    },
  },
});

