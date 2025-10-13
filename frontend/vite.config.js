import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use base '/app/' for production so assets resolve under Express mount
  base: process.env.VITE_BASE || '/app/',
  server: {
    port: 5173,
    proxy: {
      '^/(auth|bookings|services|payments|reports|health)': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
