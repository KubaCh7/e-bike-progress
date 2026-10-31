import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    // GitHub Pages: VITE_BASE=/e-bike-progress/ ; Vercel: /
    base: env.VITE_BASE || '/',
    plugins: [react()],
  }
})
