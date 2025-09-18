import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'savenbiteportal-f5ggcpczf5f2f8b4.southafricanorth-01.azurewebsites.net',
      '.azurewebsites.net',
      'localhost'
    ],
    hmr: {
      overlay: false 
    }
  }
})