import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Vercel provides the commit SHA; locally read it from git
function commitId() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// BNM has no CORS headers; proxy it same-origin (mirrors the vercel.json rewrite)
const bnmProxy = {
  '/api/bnm': {
    target: 'https://api.bnm.gov.my',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/bnm/, '/public'),
  },
}

export default defineConfig({
  server: { proxy: bnmProxy },
  preview: { proxy: bnmProxy },
  define: {
    __APP_VERSION__: JSON.stringify(commitId()),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        name: 'Rate Monitor',
        short_name: 'Rate Monitor',
        description: 'Gold price in MYR and currency converter',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'api.gold-api.com' ||
              url.hostname === 'cdn.jsdelivr.net' ||
              url.hostname.endsWith('currency-api.pages.dev'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gold-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
