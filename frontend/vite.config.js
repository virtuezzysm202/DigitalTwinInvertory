import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {
        //  Ganti localhost jadi IP angka IPv4 langsung
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true,
        secure: false
      }
    }
  }
})