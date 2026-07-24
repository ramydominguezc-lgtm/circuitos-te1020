import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración mínima: React + build estático para Vercel.
export default defineConfig({
  plugins: [react()],
})
