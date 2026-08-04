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
  // v7 domyślnie używa 'jsx' (tnie spacje między inline elementami).
  // true = poprzednie HTML-aware zachowanie — zero ryzyka wizualnego.
  compressHTML: true,
  // prerenderEnvironment: 'node' — image-sitemap.xml.ts (via image-scanner.ts)
  // czyta filesystem (fs/path) w trakcie prerenderu; workerd tego nie eksternalizuje.
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: {
        defaultLocale: 'pl',
        locales: {
          pl: 'pl-PL',
          en: 'en-US',
        },
      },
      serialize: (item) => {
        const url = item.url;
        
        // Homepage: priority 1.0, monthly
        // Handle /, empty string, /en, /en/, and base URL
        if (url === '/' || url === '' || url === '/en' || url === '/en/' || 
            url === 'https://babaji.org.pl' || url === 'https://babaji.org.pl/' ||
            url === 'https://babaji.org.pl/en') {
          return {
            ...item,
            priority: 1.0,
            changefreq: 'monthly',
          };
        }
        
        // Events: priority 0.9, weekly (both /events and /events/xxx)
        if (url.includes('/events') || url.includes('/wydarzenia')) {
          return {
            ...item,
            priority: 0.9,
            changefreq: 'weekly',
          };
        }
        
        // Teachings: priority 0.8, weekly (both /teachings and /teachings/xxx)
        if (url.includes('/teachings') || url.includes('/nauki')) {
          return {
            ...item,
            priority: 0.8,
            changefreq: 'weekly',
          };
        }
        
        // Static pages (about, contact): priority 0.7, monthly
        if (url.includes('/about') || url.includes('/o-nas') || 
            url.includes('/contact') || url.includes('/kontakt')) {
          return {
            ...item,
            priority: 0.7,
            changefreq: 'monthly',
          };
        }
        
        // Other pages: priority 0.6, monthly
        return {
          ...item,
          priority: 0.6,
          changefreq: 'monthly',
        };
      },
    }),
    ...(process.env.INDEXNOW_KEY ? [indexnow({
      key: process.env.INDEXNOW_KEY,
    })] : []),
  ],
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: {
      prefixDefaultLocale: false,
      // v6+: redirectToDefaultLocale domyślnie false; ręczny middleware w src/middleware.ts
      // obsługuje /pl/* → 301 do root. NIE włączać redirectToDefaultLocale (konflikt = pętla).
    },
  },
});
