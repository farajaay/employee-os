import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// M-20 consumes `dist/` as the Capacitor web dir.
export default defineConfig({
  plugins: [
    VitePWA({
      // M-12 adds the Arabic "تحديث متاح" prompt. 'prompt' keeps a waiting worker
      // waiting rather than reloading the page under the user mid-edit.
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Employee OS',
        short_name: 'Employee OS',
        description:
          'مساحة شخصية تجمع شغل الشركة، المشاريع، التصوير، العمل المستقل والإنجازات المهنية.',
        // The interface is Arabic and right-to-left; the manifest must say so or
        // the install prompt and app-switcher entry render left-to-right.
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // Both are #fbf7f2 deliberately. It matches the existing
        // <meta name="theme-color"> and the StatusBar background the plan
        // specifies for Capacitor, so the web, PWA and native chrome agree.
        // #a46b75 is the accent, and appears in the icon glyph, not the chrome.
        background_color: '#fbf7f2',
        theme_color: '#fbf7f2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            // Cropped to a platform-chosen shape, so the glyph sits inside the
            // inner 80% safe zone. Without this Android renders a letterboxed
            // square inside the circle.
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          { src: 'icons/icon-1024.png', sizes: '1024x1024', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // M-11 strategies.
        runtimeCaching: [
          {
            // Supabase REST and Storage reads: serve fresh when the network is
            // there, fall back to the last good response when it is not.
            //
            // AUTH IS DELIBERATELY EXCLUDED — see the negative lookahead. Tokens
            // and session responses must never be written to the Cache API,
            // where they would outlive sign-out and be readable by anything with
            // access to the origin's storage. Auth failing loudly offline is the
            // correct behaviour.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/(?!auth\/)(rest|storage)\/v1\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-read',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              // Only 200s. Caching an RLS-denied 4xx would pin an empty result.
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: ({ request }) =>
              ['style', 'script', 'image', 'font'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022'
  },
  server: {
    port: 5173
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
