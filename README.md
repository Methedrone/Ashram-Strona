# Ashram Babaji — babaji.org.pl

Modern multilingual static site for the Ashram Babaji community, built with **Astro 7** and deployed to **Cloudflare Pages**.

- **Stack:** Astro 7.2.0, `@astrojs/cloudflare` 14, TypeScript (strict), Playwright, sharp
- **Languages:** Polish (`pl`, default, served at root) & English (`en`, served under `/en/`)
- **Output:** Fully static HTML for 71 prerendered routes, with two Cloudflare Pages Functions (`/api/auth`, `/api/callback`)
- **Domain:** [babaji.org.pl](https://babaji.org.pl)
- **Sitemaps:** `/sitemap-index.xml`, `/image-sitemap.xml`, `/rss.xml`

---

## Quick Start

### Prerequisites

- **Node.js ≥ 22.12** (Astro 7 requirement) — `.nvmrc` pins `24`
- npm 10+
- A `CLOUDFLARE_*` token only for production deploys; local dev works without any secrets

### Install & run

```bash
# Clone and install
git clone https://github.com/Methedrone/Ashram-Strona.git
cd Ashram-Strona
npm install

# Local dev server → http://localhost:4321
npm run dev

# Production build (output: dist/client/)
npm run build

# E2E tests (Playwright)
npm test

# Type and content validation
npm run check
```

### Optional — generate optimized images

```bash
npm run generate-images   # writes public/images/optimized/*
```

---

## What's in the box

- **Static-first architecture** — every page is prerendered; Cloudflare Pages only serves HTML and images from cache
- **Two API endpoints** under `/api/*` for the Sveltia CMS GitHub OAuth flow
- **SEO** — `astro-seo`, full Schema.org graph (ReligiousOrganization + WebSite + Article/Event + TouristAttraction on the home page), OpenGraph, hreflang, JSON-LD breadcrumb
- **Accessibility** — semantic HTML, `astro-lightgallery`, WCAG 2.1 AA target, `axe-core` runner
- **Search** — IndexNow + Bing WMT for fast indexing
- **Analytics** — GTM + a typed `dataLayer` event schema (`page_view`, `data-event`, outbound links, scroll depth, downloads, language switch)
- **CI** — `build` + Playwright on every PR to `dev` or `master`; Codacy + Cloudflare Pages preview

---

## Project Structure

```
Ashram-Strona/
├── src/
│   ├── content.config.ts          # Content Layer (glob loaders, Zod schemas)
│   ├── content/
│   │   ├── events/{pl,en}/        # Event markdown entries
│   │   └── teachings/{pl,en}/     # Teaching markdown entries
│   ├── pages/                     # File-based routing
│   │   ├── index.astro            # Polish home
│   │   ├── en/                    # English routes
│   │   ├── events/[...slug].astro # Dynamic event pages
│   │   ├── teachings/[...slug].astro
│   │   ├── rss.xml.ts
│   │   └── image-sitemap.xml.ts
│   ├── components/                # Header, Footer, Schema, EventCard, …
│   ├── layouts/Layout.astro       # Base layout (SEO, ClientRouter, GTM)
│   ├── i18n/                      # ui.ts, utils.ts
│   ├── styles/global.css
│   ├── utils/image-scanner.ts     # Reads public/images during prerender
│   └── middleware.ts              # /pl/* → root 301 (avoids i18n duplicate)
├── public/                        # Static assets (favicon, manifest, robots.txt)
├── functions/api/                 # Cloudflare Pages Functions (OAuth)
│   ├── auth.ts                    # Initiates GitHub OAuth
│   └── callback.ts                # Completes OAuth + sets session cookie
├── scripts/
│   ├── copy-functions.mjs         # Copies functions/ → dist/client/functions/
│   ├── image-gen.mjs              # sharp-based image optimization
│   ├── axe-run.mjs / axe-check.mjs
│   └── jsonld-validate.mjs
├── tests/site-verification.spec.ts  # 42 Playwright tests
├── .github/workflows/             # ci, deploy, audit, …
├── astro.config.mjs
├── tsconfig.json                  # astro/tsconfigs/strict + .astro types
├── package.json
├── .nvmrc                         # Node 24
└── .wrangler/                     # local-only, gitignored
```

---

## Available Commands

| Script | What it does |
| --- | --- |
| `npm run dev` | Astro dev server on `http://localhost:4321` |
| `npm run build` | `astro build` then copies `functions/` and patches `_routes.json` so `/api/*` is routed to Pages Functions |
| `npm run preview` | Preview the production build |
| `npm test` | Run the Playwright suite (42 tests, ~45–60s) |
| `npm run check` | `astro check` — TypeScript + Zod content schema validation |
| `npm run generate-images` | Regenerate optimized images with sharp |
| `npm run axe-local` | Run axe-core against the local build |
| `npm run axe-check` | Fail CI on axe violations |
| `npm run audit:quick` | `generate-images` + JSON-LD validator + axe |
| `npm run audit:ci` | Full pipeline: images + build + JSON-LD + axe + axe-check |
| `npm run llms-full` | Build `llms-full.txt` snapshot for AI crawlers |

---

## Internationalization (i18n)

- `defaultLocale: 'pl'` is served at root paths (`/about`, `/events/…`)
- `en` is served under `/en/…`
- A middleware (`src/middleware.ts`) 301-redirects `/pl/*` to root to avoid duplicate content
- The `i18n.routing.redirectToDefaultLocale` option is **off** on purpose — turning it on creates a redirect loop with the custom middleware
- All translatable strings live in `src/i18n/ui.ts`; `src/i18n/utils.ts` exports `useTranslations`, `getLangFromUrl`, `translatePath`

---

## Content Collections (Content Layer)

Two collections are defined in `src/content.config.ts` using `glob` loaders:

- **events** — `title`, `description`, `date`, `endDate?`, `time?`, `location`, `lang`, `featuredImage?`, `tags?`, `faqs?`, `registrationUrl?`, `isOnline`, `featured`, `eventType?`, `updatedAt?`
- **teachings** — `title`, `description`, `date`, `author`, `lang`, `featuredImage?`, `tags?`, `faqs?`, `relatedTeachings?`, `difficulty?`, `duration?`, `updatedAt?`

Each collection's entries live under `src/content/{collection}/{pl|en}/` as Markdown. Schema validation runs at build time via Zod — `npm run check` will surface any mismatch.

---

## Cloudflare Pages Deployment

- **Adapter:** `@astrojs/cloudflare` v14 (static output, two API functions)
- **Build output:** `dist/client/`
- **Functions output:** `dist/client/functions/api/{auth,callback}.ts`, registered via `dist/client/_routes.json`
- **Deploy command:** `wrangler pages deploy dist/client --project-name=ashram-makolno`
- **Branch policy:** `master` deploys automatically; `dev` does not
- **Required secrets in GitHub Actions:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
- **Optional:** `INDEXNOW_KEY` (Bing/Yandex indexing)

### What the `copy-functions.mjs` script does

The Astro Cloudflare adapter v14 writes only the static output to `dist/client/`. It does **not** copy the `functions/` directory. The script:

1. Copies `functions/` to `dist/client/functions/`
2. Moves `dist/client/functions/_routes.json` to `dist/client/_routes.json` (Pages expects it at the build-output root)
3. Patches the `include` array in `_routes.json` to add `/api/*` so the Functions are triggered instead of the static handler

### Why `prerenderEnvironment: 'node'`?

`image-sitemap.xml.ts` calls `image-scanner.ts`, which reads the filesystem during the build. The default workerd prerender environment does not expose Node `fs` and `path`; switching to `'node'` keeps the rest of the deploy on workerd at runtime.

---

## Branching & Release Model

```
feature/*  ─┐
            ├─►  dev  ──►  release PR (dev → master)  ──►  master  ──►  prod
fix/*      ─┘
```

- `dev` is the day-to-day integration branch
- `master` is production and **only** receives changes via Pull Requests
- A shared `githooks/pre-push` block blocks direct pushes to `master`; enable it with `git config core.hooksPath .githooks`
- The final release is a single large PR from `dev` to `master` — never merge `dev` directly

---

## CI Workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | push to `dev`, PR to `dev` or `master` | install, `astro check`, build, Playwright |
| `deploy.yml` | push to `master` | `wrangler pages deploy dist/client` |
| `audit.yml` | PR to `master`, manual | image gen, build, JSON-LD, axe, Lighthouse |

---

## Project Status

- [x] Multilingual support (PL/EN, hreflang, no duplicate content)
- [x] Content Layer + Content Collections (events, teachings)
- [x] Astro 7.2.0 + Cloudflare adapter v14 + correct Pages output layout
- [x] Schema.org graph (ReligiousOrganization, WebSite, Article/Event, TouristAttraction, BreadcrumbList, FAQPage)
- [x] Image sitemap, RSS feed, IndexNow, OG/Twitter cards
- [x] Playwright E2E (42 tests, all routes, language switching, schema verification)
- [x] axe-core accessibility audit
- [x] GTM with typed `dataLayer` (page_view, scroll depth, outbound, downloads, language switch, CTA clicks)
- [x] Sveltia CMS with GitHub OAuth via Cloudflare Pages Functions

---

## License & Credits

Built for the Ashram Babaji community in Mąkolno, Poland. Haidakhan Babaji's teachings — `karma yoga`, `kriya yoga`, traditional ceremonies.

Maintained by the Ashram tech team. Contributions welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
