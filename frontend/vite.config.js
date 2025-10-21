import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use base '/app/' for production only, '/' for development
  base: process.env.NODE_ENV === 'production' ? (process.env.VITE_BASE || '/app/') : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '^/(auth|bookings|services|payments|reports|health)': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Serve backend SPA stylesheet during React dev
      '/styles.css': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
