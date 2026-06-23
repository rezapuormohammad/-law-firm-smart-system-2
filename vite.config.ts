import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'سیستم هوشمند موسسه حقوقی',
        short_name: 'مدیریت حقوقی',
        description: 'سامانه هوشمند مدیریت پرونده‌های حقوقی و کیفری',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135671.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
