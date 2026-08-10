# ashram-strona

**Project Type:** Astro static site
**Languages:** TypeScript
**Version:** 0.0.1
**Domain:** https://babaji.org.pl

## Technology Stack

### Framework
- **Astro** 7.2.0 — static site generator with islands architecture
- **@astrojs/cloudflare** — Cloudflare Pages adapter
- **@astrojs/sitemap** — automatic sitemap generation
- **@astrojs/rss** — RSS feed generation

### Integrations
- **astro-seo** — structured SEO meta tags
- **astro-lightgallery** — image gallery component
- **astro-indexnow** — search engine index notification (optional, requires INDEXNOW_KEY)

### Testing & Audit
- **Playwright** — E2E browser testing
- **axe-core** — accessibility auditing
- **Lighthouse** — performance/SEO/accessibility scoring
- **sharp** — image optimization

### Package Manager
- npm

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run Playwright E2E tests
npm run test

# Generate optimized images
npm run generate-images

# Run accessibility audit (requires built site or running server)
npm run axe-local

# Fail CI on axe violations
npm run axe-check

# Quick audit pipeline (images + JSON-LD + axe)
npm run audit:quick

# Full CI audit pipeline (images + build + JSON-LD + axe + axe-check)
npm run audit:ci
```

## Deployment

- **Platform:** Cloudflare Pages
- **Adapter:** `@astrojs/cloudflare`
- **Branch:** `master` — deploy via GitHub Actions (`deploy.yml`); CF auto-deployments are disabled
- **Build output:** `dist/client/` (+ `functions/` copied by `copy-functions.mjs`)
- **GTM:** `GTM-5J4NL66W` via `astro:env` (`GTM_CONTAINER_ID`); first-party endpoint `/lhsi` (Google Tag Gateway)
- **Required secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
- **Optional:** `INDEXNOW_KEY` for search engine notifications

## Internationalization (i18n)

- **Default locale:** Polish (`pl`) — served at root paths (no `/pl/` prefix)
- **Secondary locale:** English (`en`) — served under `/en/`
- **Middleware:** Redirects `/pl/*` paths to root to avoid duplicate content
- **Content:** Events and teachings are duplicated under `src/content/events/` and `src/content/teachings/` with `pl/` and `en/` subdirectories
- **UI strings:** Managed in `src/i18n/ui.ts` and `src/i18n/utils.ts`

## Content Collections

Two typed content collections defined in `src/content.config.ts`:

- **events** — spiritual events and festivals
  - Fields: title, description, date, endDate, time, location, lang, featuredImage, tags, faqs, registrationUrl, isOnline, featured
  - Slug-based routing at `/events/[...slug]` and `/en/events/[...slug]`

- **teachings** — articles and spiritual teachings
  - Fields: title, description, date, author, lang, featuredImage, tags, faqs, relatedTeachings, difficulty, duration
  - Slug-based routing at `/teachings/[...slug]` and `/en/teachings/[...slug]`

## Project Structure

```
Ashram-Strona/
├── src/
│   ├── pages/              # Astro pages (file-based routing)
│   │   ├── index.astro     # Polish homepage
│   │   ├── en/             # English pages
│   │   ├── events/         # Event list + dynamic routes
│   │   ├── teachings/      # Teaching list + dynamic routes
│   │   ├── about.astro, contact.astro, faq.astro, ...
│   │   ├── rss.xml.ts      # RSS feed endpoint
│   │   └── image-sitemap.xml.ts  # Image sitemap endpoint
│   ├── components/         # Reusable Astro components
│   │   ├── Header.astro, Footer.astro, Hero.astro
│   │   ├── EventCard.astro, TeachingCard.astro
│   │   ├── Schema.astro, FAQSchema.astro
│   │   └── schemas/        # Structured data components
│   ├── layouts/
│   │   └── Layout.astro    # Base layout (SEO, Header, Footer)
│   ├── content/
│   │   ├── events/pl/, events/en/
│   │   ├── teachings/pl/, teachings/en/
│   │   └── content.config.ts # Content collection schemas
│   ├── i18n/
│   │   ├── ui.ts           # Translation dictionaries
│   │   └── utils.ts        # i18n helpers
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── image-scanner.ts
│   └── middleware.ts       # /pl/* → root redirect
├── public/                 # Static assets (favicon, og-image, manifest, robots.txt)
├── scripts/                # Audit and utility scripts
│   ├── axe-run.mjs         # Accessibility audit runner
│   ├── axe-check.mjs       # CI violation checker
│   ├── image-gen.mjs       # Sharp-based image optimization
│   └── jsonld-validate.mjs # Schema.org JSON-LD validator
├── tests/
│   └── site-verification.spec.ts
├── dist/                   # Build output (gitignored)
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── README.md
└── CONTRIBUTING.md
```

## Code Conventions

### Astro
- Use `.astro` components for static UI; keep client-side JS minimal
- Pass props via `Astro.props` with explicit `interface Props`
- Use `src/components/` for UI pieces, `src/layouts/` for page wrappers
- Prefer Astro's built-in features over external frameworks

### TypeScript
- Extends `astro/tsconfigs/strict`
- Use strict typing; avoid `any`
- Prefer `interface` for object shapes, `type` for unions

### Styling
- Global styles in `src/styles/global.css`
- Component-scoped styles via `<style>` blocks in `.astro` files
- No CSS-in-JS or Tailwind (project uses custom scoped CSS)

### Content
- Markdown frontmatter must match `src/content.config.ts` schemas
- Use ISO dates in frontmatter
- Keep content bilingual: maintain parity between `pl/` and `en/` directories

### SEO & Accessibility
- Every page uses `<SEO>` from `astro-seo` + `Schema.astro` for structured data
- Images must have descriptive `alt` text
- Maintain axe-core compliance (zero violations target)

### General
- Follow existing file naming: PascalCase for components, kebab-case for pages
- Keep functions small and focused
- Add tests for new interactive features

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push to `dev`, PR to `master` | Build + Playwright tests |
| `deploy.yml` | push to `master` | Build + deploy to Cloudflare Pages |
| `audit.yml` | PR to `master`, manual | Image gen + build + axe + JSON-LD + Lighthouse |

## Branching Model

- `dev` — integration branch for daily work
- `master` — production branch (protected, deploys via Actions on push)
- Changes reach `master` only via Pull Requests
- Shared git hook blocks direct pushes to `master` (enable with `git config core.hooksPath .githooks`)
