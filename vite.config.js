import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Expose the dev server on the LAN so the site can be opened on a phone.
  // Note: hand control needs a secure context, and a plain-http LAN address is
  // not one — use a tunnel (`npx localtunnel --port 5173`) or the deployed URL
  // to test the camera on a phone.
  server: { host: true },
})
