import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [react(), tailwind()],
	vite: {
		plugins: [
			VitePWA({
				registerType: 'autoUpdate',
				manifest: {
					name: 'Perfil - Trivia Game',
					short_name: 'Perfil',
					description: 'A multiplayer trivia game where players guess profiles through clues',
					theme_color: '#0d1322',
					background_color: '#ffffff',
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
			}),
		],
	},
});
