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
      "@oceanprotocol/ddo-js": "/src/shims/ddo-js.ts",
    },
  },
  optimizeDeps: {
    exclude: ["@oceanprotocol/lib", "@oceanprotocol/ddo-js"],
    force: true,
  },
  build: {
    commonjsOptions: { include: [/node_modules/] },
  },
});
