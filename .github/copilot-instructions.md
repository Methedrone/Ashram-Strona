# Ashram Babaji — babaji.org.pl

**Project Type:** Astro static site
**Languages:** TypeScript
**Version:** 1.0.0
**Domain:** https://babaji.org.pl

A multilingual (PL/EN) static site for the Ashram Babaji community in Mąkolno, Poland, built with Astro 7 and deployed to Cloudflare Pages.

## Technology Stack

### Framework
- **Astro** 7.1.6 — static site generator with islands architecture
- **@astrojs/cloudflare** v14 — Cloudflare Pages adapter (static output + two Pages Functions)
- **@astrojs/rss** v4 — RSS feed for events and teachings
- **@astrojs/sitemap** v3 — XML sitemap generation

### Integrations
- **astro-seo** — structured SEO meta tags
- **astro-lightgallery** — image gallery component
- **astro-indexnow** — IndexNow search engine notifications (optional, requires `INDEXNOW_KEY`)

### Content
- **Content Layer** — `glob` loaders + Zod schemas in `src/content.config.ts`
- **Two collections:** `events` and `teachings`, each split per language under `pl/` and `en/`
- **Sveltia CMS** — Git-based CMS at `/admin/` (separate package)

### Testing & Audit
- **Playwright** — E2E browser tests (42 tests)
- **axe-core** — accessibility auditing
- **Lighthouse** — performance/SEO/accessibility scoring
- **sharp** — image optimization
- **astro check** — TypeScript + content schema validation

### Package Manager
- npm (Node ≥ 22.12, `.nvmrc` pins 24)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production (writes dist/client/)
npm run build

# Preview production build
npm run preview

# Run Playwright E2E tests
npm test

# Type and content validation
npm run check

# Generate optimized images
npm run generate-images

# Run accessibility audit
npm run axe-local

# Fail CI on axe violations
npm run axe-check

# Quick audit pipeline (images + JSON-LD + axe)
npm run audit:quick

# Full CI audit pipeline
npm run audit:ci
```

## Deployment

- **Platform:** Cloudflare Pages
- **Adapter:** `@astrojs/cloudflare` v14
- **Build command:** `npm run build`
- **Build output:** `dist/client/`
- **Deploy command:** `wrangler pages deploy dist/client --project-name=ashram-makolno`
- **Branch policy:** `master` auto-deploys on push; `dev` does not
- **Required secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
- **Optional:** `INDEXNOW_KEY` (Bing/Yandex), `GTM_CONTAINER_ID` (Google Tag Manager)

## Branching Model

- `dev` — integration branch for daily work
- `master` — production branch (protected, deploys automatically)
- A shared git hook blocks direct pushes to `master` (enable with `git config core.hooksPath .githooks`)
- Releases go through a single large PR from `dev` into `master` — never fast-forward

## CI/CD Workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | push to `dev`, PR to `dev` or `master` | install, `astro check`, build, Playwright |
| `deploy.yml` | push to `master` | `wrangler pages deploy dist/client` |
| `audit.yml` | PR to `master`, manual | image gen, build, JSON-LD, axe, Lighthouse |
| `diagnose-deployments.yml` | manual | Wrangler / Pages diagnostics |
| `force-delete-deployment.yml` | manual | recovery |

## i18n

- **Default locale:** Polish (`pl`) — served at root paths (no `/pl/` prefix)
- **Secondary locale:** English (`en`) — served under `/en/`
- **Middleware:** Redirects `/pl/*` to root to avoid duplicate content
- **UI strings:** `src/i18n/ui.ts` and `src/i18n/utils.ts`
- **`i18n.routing.redirectToDefaultLocale` is OFF on purpose** — turning it on creates a redirect loop with the custom middleware
