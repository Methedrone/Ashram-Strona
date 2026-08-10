// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import indexnow from 'astro-indexnow';
import 'dotenv/config';

export default defineConfig({
  site: 'https://babaji.org.pl',
  trailingSlash: 'never',
  // v7 domyślnie używa 'jsx' (tnie spacje między inline elementami).
  // true = poprzednie HTML-aware zachowanie — zero ryzyka wizualnego.
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  env: {
    schema: {
      GTM_CONTAINER_ID: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
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

        // Handle /, empty string, /en, /en/, and bare base URL
        if (url === '/' || url === '' || url === '/en' || url === '/en/' ||
            url === 'https://babaji.org.pl' || url === 'https://babaji.org.pl/' ||
            url === 'https://babaji.org.pl/en') {
          return {
            ...item,
            priority: 1.0,
            changefreq: ChangeFreqEnum.MONTHLY,
          };
        }

        if (url.includes('/events')) {
          return {
            ...item,
            priority: 0.9,
            changefreq: ChangeFreqEnum.WEEKLY,
          };
        }

        if (url.includes('/teachings')) {
          return {
            ...item,
            priority: 0.8,
            changefreq: ChangeFreqEnum.WEEKLY,
          };
        }

        if (url.includes('/about') || url.includes('/contact')) {
          return {
            ...item,
            priority: 0.7,
            changefreq: ChangeFreqEnum.MONTHLY,
          };
        }

        return {
          ...item,
          priority: 0.6,
          changefreq: ChangeFreqEnum.MONTHLY,
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
