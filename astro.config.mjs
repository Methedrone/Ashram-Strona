// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap, { ChangeFreqEnum } from '@astrojs/sitemap';
import indexnow from 'astro-indexnow';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import robotsTxt from 'astro-robots-txt';
import icon from 'astro-icon';
import compress from 'astro-compress';
import 'dotenv/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://babaji.org.pl',
  trailingSlash: 'never',
  // v7 domyślnie używa 'jsx' (tnie spacje między inline elementami).
  // true = poprzednie HTML-aware zachowanie — zero ryzyka wizualnego.
  compressHTML: true,
  // ClientRouter + prefetch (v7 stable)
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // astro:env — type-safe env (GTM_CONTAINER_ID z fallbackem w Layout)
  env: {
    schema: {
      GTM_CONTAINER_ID: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
  // prerenderEnvironment: 'node' — image-sitemap.xml.ts (via image-scanner.ts)
  // czyta filesystem (fs/path) w trakcie prerenderu; workerd tego nie eksternalizuje.
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  integrations: [
    // Content authoring: allows .mdx entries alongside .md.
    mdx(),
    // Third-party scripts can be moved to a web worker by adding
    // type="text/partytown" to the script element.
    partytown({ config: { forward: ['dataLayer.push'] } }),
    // Inline SVG icons with a consistent Astro component API.
    icon(),
    // Generate robots.txt from the canonical site URL; replaces public/robots.txt.
    robotsTxt({
      policy: [{
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*.json$', '/404'],
      }],
      sitemap: [
        'https://babaji.org.pl/sitemap-index.xml',
        'https://babaji.org.pl/image-sitemap.xml',
        'https://babaji.org.pl/rss.xml',
      ],
    }),
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
            changefreq: ChangeFreqEnum.MONTHLY,
          };
        }
        
        // Events: priority 0.9, weekly (both /events and /events/xxx)
        if (url.includes('/events') || url.includes('/wydarzenia')) {
          return {
            ...item,
            priority: 0.9,
            changefreq: ChangeFreqEnum.WEEKLY,
          };
        }
        
        // Teachings: priority 0.8, weekly (both /teachings and /teachings/xxx)
        if (url.includes('/teachings') || url.includes('/nauki')) {
          return {
            ...item,
            priority: 0.8,
            changefreq: ChangeFreqEnum.WEEKLY,
          };
        }
        
        // Static pages (about, contact): priority 0.7, monthly
        if (url.includes('/about') || url.includes('/o-nas') || 
            url.includes('/contact') || url.includes('/kontakt')) {
          return {
            ...item,
            priority: 0.7,
            changefreq: ChangeFreqEnum.MONTHLY,
          };
        }
        
        // Other pages: priority 0.6, monthly
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
    // Must remain last: optimizes the final static output produced by all
    // preceding integrations (HTML, CSS, JS, SVG, JSON and images).
    // Do not recompress the 400+ MB image archive during every build;
    // Astro/image-scanner already handles image variants separately.
    compress({ Image: false }),
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
