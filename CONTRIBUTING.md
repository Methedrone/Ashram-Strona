# Contributing to Ashram-Strona

Thank you for helping maintain the Ashram Babaji website (`babaji.org.pl`).

---

## Branching Model

- **`dev`** — integration branch for day-to-day work
- **`master`** — production branch (auto-deploys to Cloudflare Pages)
- **Do not push directly to `master`.** All changes reach `master` via a Pull Request.
- The final release is a **single large PR** from `dev` to `master`. Never fast-forward `dev` into `master`.

```
feature/*  ─┐
            ├─►  dev  ──►  release PR (dev → master)  ──►  master  ──►  prod
fix/*      ─┘
```

### Recommended workflow

1. Branch off `dev`: `git checkout -b feat/your-feature dev`
2. Open a **PR into `dev`** — CI runs `astro check`, `npm run build`, and Playwright
3. Once the PR is reviewed and green, merge into `dev`
4. Periodically, when a coherent batch of work is ready, open a **release PR from `dev` to `master`**
5. Merging into `master` triggers production deploy via `.github/workflows/deploy.yml`

---

## Local Guardrail — Pre-push Hook

This repo ships a shared git hook that blocks direct pushes to `master`. Enable it once after cloning:

```bash
git config core.hooksPath .githooks
```

You can still push to `dev` and to feature branches normally.

---

## Local Setup

```bash
git clone https://github.com/Methedrone/Ashram-Strona.git
cd Ashram-Strona
nvm use            # Node 24 (see .nvmrc)
npm install
npm run dev        # http://localhost:4321
```

If you don't use `nvm`, install Node **≥ 22.12** manually.

---

## Code Conventions

### Astro

- Use `.astro` for static UI; avoid `client:` directives unless truly necessary (we are zero-JS by default)
- Define `interface Props` for every component that takes props
- Use `src/components/` for reusable UI, `src/layouts/` for page wrappers
- Prefer Astro's built-in helpers over external libraries

### TypeScript

- Extends `astro/tsconfigs/strict` — keep `strict: true` honored
- Never use `any` — define a real type (use `CollectionEntry<'…'>` for content entries)
- Prefer `interface` for object shapes, `type` for unions/aliases
- Run `npm run check` before pushing

### Styling

- Component-scoped styles via `<style>` blocks in `.astro` files
- Global styles in `src/styles/global.css` only for variables and resets
- No Tailwind, no CSS-in-JS — the project uses custom scoped CSS

### Content

- Frontmatter must match the Zod schemas in `src/content.config.ts`
- ISO dates in frontmatter (`date: 2026-02-06`)
- Maintain bilingual parity: every PL entry needs its EN counterpart
- Use the `relatedTeachings` field to cross-link content; do not hardcode slugs in Markdown

### i18n

- Translatable strings live in `src/i18n/ui.ts`
- Use `t('key.path')` from `useTranslations(lang)` in components
- For URL paths, use `translatePath()` from `src/i18n/utils.ts`

---

## Testing

```bash
npm test           # full Playwright suite (42 tests, ~45–60s)
npm run check      # astro check (TypeScript + content schemas)
npm run axe-local  # axe-core against local build
```

Before opening a PR, at minimum run `npm test` and `npm run check`. CI will run them again on every push.

When you add a new page or change a route:

1. Add a `Verify page: /your/path` entry to `tests/site-verification.spec.ts`
2. If the page is bilingual, add a `language switching` test case
3. If you add structured data, add a `Schema.org verification` assertion

---

## Common Tasks

### Add a new event

1. Create `src/content/events/pl/<slug>.md` and `src/content/events/en/<slug>.md`
2. Fill in frontmatter matching the `events` Zod schema
3. Run `npm test` and verify the new page renders in both languages
4. `git add` and commit on your feature branch

### Update the site URL or canonical domain

The canonical URL is set in `astro.config.mjs` as `site: 'https://babaji.org.pl'`. If you change it:

- Update `astro.config.mjs` (used by sitemap and RSS)
- Update the `policy.sitemap` list inside the same config
- Update any hardcoded `siteUrl` references in `src/pages/*` (search with `rg siteUrl src`)

### Modify the GTM container

The container ID is read from `GTM_CONTAINER_ID` via `astro:env`. Set it in `.env` locally; set it as a Cloudflare Pages environment variable in production. The default fallback in `src/layouts/Layout.astro` is `GTM-5J4NL66W`.

---

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(seo): add FAQPage schema to event detail pages
fix(footer): correct alignment on mobile breakpoints
chore(deps): bump @astrojs/cloudflare to 14.1.7
docs(readme): document the Cloudflare deployment pipeline
```

Common scopes: `seo`, `i18n`, `cms`, `images`, `analytics`, `ci`, `deps`, `docs`.

---

## Pull Request Checklist

- [ ] Branch is based on `dev`
- [ ] `npm run check` is clean
- [ ] `npm test` passes locally
- [ ] CI is green on the PR
- [ ] No secrets (API keys, tokens, passwords) in the diff
- [ ] Bilingual parity preserved if you touched content
- [ ] CHANGELOG-worthy change? Mention it in the PR description

---

## Notes

- Build output (`dist/`, `test-results/`, `.wrangler/`) is intentionally not committed
- Cloudflare Pages Functions live in `functions/api/` and are copied to `dist/client/functions/` by `scripts/copy-functions.mjs` during `npm run build`
- Sveltia CMS is configured separately under `public/admin/` and authenticates against `/api/*` — see `public/admin/config.yml`
