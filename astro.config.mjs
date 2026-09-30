// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
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
