import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [react(), tailwind()],
	vite: {
		plugins: [VitePWA({})],
	},
});
