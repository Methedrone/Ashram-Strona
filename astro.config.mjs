// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://babaji.org.pl',
	adapter: cloudflare(),
	integrations: [sitemap()],
	i18n: {
		defaultLocale: 'pl',
		locales: ['pl', 'en'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
