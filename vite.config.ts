import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the built index.html works when loaded via file:// in Electron
  base: './',
  build: {
    outDir: 'dist',
    target: 'chrome128',
    chunkSizeWarningLimit: 1500,
    // Don't wipe the output dir: a stray electron-builder artifact may lock it.
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
