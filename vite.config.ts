import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BUILD_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  Date.now().toString()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({
            version: BUILD_VERSION,
            builtAt: new Date().toISOString(),
          }),
        })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // Esto te permite probar la PWA localmente
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globIgnores: ['**/version.json'],
        navigateFallbackDenylist: [/^\/version\.json$/],
      },
      manifest: {
        name: 'Toptex Tejeduría',
        short_name: 'Toptex',
        description: 'Sistema de control de OTs y novedades',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Esto oculta la barra del navegador
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})