import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // In dev, forward /api/* to the Express server (server/), so the app
    // can call fetch('/api/...') with no CORS setup or hard-coded host.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
