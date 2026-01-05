import cloudflare from '@astrojs/cloudflare';
// import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';
import { defineConfig } from 'astro/config';

import { PRIMARY_COLORS, THEME_COLORS } from './src/lib/theme-colors.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://perfil-dzz.pages.dev/',
  output: 'server',
  server: {
    port: Number(process.env.PORT_NUMBER) || 4321,
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  // adapter: node({
  //   mode: 'standalone',
  // }),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt-BR'],
    routing: {
      prefixDefaultLocale: true, // Always use locale prefix: /en/about, /es/about, /pt-BR/about
      redirectToDefaultLocale: true, // Redirect / to /en/
      fallbackType: 'rewrite', // Prevent 404s with fallback content
    },
    fallback: {
      es: 'en',
      'pt-BR': 'en',
    },
  },
  integrations: [
    react(),
    tailwind(),
    AstroPWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Perfil - Trivia Game',
        short_name: 'Perfil',
        description: 'A multiplayer trivia game where players guess profiles through clues',
        theme_color: PRIMARY_COLORS.light,
        background_color: THEME_COLORS.light,
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        importScripts: ['/sw-cleanup.js'],
        navigateFallback: null,
        // Explicitly define which files to precache (excludes SSR-generated content)
        globPatterns: ['**/*.{js,css,ico,png,svg,webp,woff,woff2,json}'],
        // Exclude Cloudflare worker files and their paths from precaching
        globIgnores: [
          '**/node_modules/**/*',
          '_worker.js/**/*',
          '**/_worker.js*',
          '**/workbox-*.js',
        ],
        // Don't cache bust Astro build assets (they have content hashes)
        dontCacheBustURLsMatching: /\/_astro\//,
        // Clean up outdated caches automatically
        cleanupOutdatedCaches: true,
        // Don't try to precache HTML files (they're SSR-generated)
        globDirectory: 'dist',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Category-based profile data files: /data/{category}/{locale}/data-1.json
            urlPattern: /\/data\/[^/]+\/[^/]+\/data-\d+\.json$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'profile-data-v2',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100, // Increased to allow caching more category files
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Global manifest file: /data/manifest.json
            urlPattern: /\/data\/manifest\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'manifest-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/locales\/.*\/translation\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'translations-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Favicon and app icons: very aggressive caching
            // These are requested on almost every navigation but rarely change
            urlPattern: /\/(favicon\.png|icons\/icon-.*\.(?:png|webp))$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-icons-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
