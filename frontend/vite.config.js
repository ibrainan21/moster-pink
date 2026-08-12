import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // En desarrollo, el frontend (http://localhost:5173) y el backend
  // (http://localhost:3000) son dos servidores distintos. En vez de
  // llamar a "http://localhost:3000/api/..." desde el código (lo que
  // obligaría a configurar CORS con cuidado y a cambiar URLs para
  // producción), el código del frontend siempre llama a "/api/...".
  // Vite intercepta esas rutas aquí y las reenvía al backend real.
  // El navegador nunca sabe que hay dos servidores: para él, todo viene
  // del mismo origen (http://localhost:5173), así que no hay problema de
  // CORS en desarrollo.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
