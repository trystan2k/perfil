// @ts-check
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [react(), tailwind()],
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es', 'pt-BR'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
