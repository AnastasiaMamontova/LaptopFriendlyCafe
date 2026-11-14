import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: { rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'], supabase: ['@supabase/supabase-js'] } } } },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.png', 'icons/*.png', 'demo/*.jpg'],
    manifest: {
      name: 'Café Berlin', short_name: 'Café Berlin',
      description: 'Your collection of laptop-friendly Berlin cafes',
      lang: 'en', start_url: '/', scope: '/', display: 'standalone',
      background_color: '#fffaf7', theme_color: '#fffaf7',
      icons: [
        { src: '/icons/cappuccino-cat-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/cappuccino-cat-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/cappuccino-cat-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf}'],
      navigateFallback: '/index.html',
      // Cafe data is cached explicitly by the application, never cache API writes.
      runtimeCaching: [{
        urlPattern: /^https:\/\/[^/]*\.supabase\.co\/storage\/v1\/object\/public\//,
        handler: 'CacheFirst', options: { cacheName: 'cafe-photos', expiration: { maxEntries: 100, maxAgeSeconds: 604800 } },
      }],
    },
  })],
})
