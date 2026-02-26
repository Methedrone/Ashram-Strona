// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import indexnow from 'astro-indexnow';
import 'dotenv/config';
// https://astro.build/config
export default defineConfig({
  site: 'https://babaji.org.pl',
  trailingSlash: 'never',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
    indexnow({
      key: process.env.INDEXNOW_KEY,
    }),
  ],
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
