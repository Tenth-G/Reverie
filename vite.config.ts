import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [react()],
  // Relative base so the built index.html works when loaded via file:// in Electron
  base: "./",
  define: {
    // App version injected at build time (used by About / update checker).
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: "dist",
    target: "chrome128",
    chunkSizeWarningLimit: 1500,
    // Don't wipe the output dir: a stray electron-builder artifact may lock it.
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
