import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js lives in its own lazily loaded chunk (~590 kB, ~150 kB gzipped)
    // that only downloads when the hero's 3D room mounts.
    chunkSizeWarningLimit: 700,
  },
})
