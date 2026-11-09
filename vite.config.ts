import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Esto te permite probar la PWA localmente
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
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})