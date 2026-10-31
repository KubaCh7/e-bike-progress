import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const base = env.VITE_BASE || '/'
  return {
    // GitHub Pages: VITE_BASE=/e-bike-progress/ ; Vercel: /
    base,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      // PWA – instalacja na komputerze / telefonie, działanie offline (powłoka aplikacji)
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'ride_pro_sr_placeholder.svg'],
        manifest: {
          name: 'e-bike progress',
          short_name: 'e-bike',
          description: 'Odkładaj na wymarzony rower elektryczny – e-ride pro SR i Twoje własne cele.',
          lang: 'pl',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#f8f8f8',
          theme_color: '#f8f8f8',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: `${base}index.html`,
          // dane z Supabase zawsze z sieci (nie cache'ujemy API)
          navigateFallbackDenylist: [/^\/auth/, /^\/rest/, /^\/storage/],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 900,
    },
  }
})
