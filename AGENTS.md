# ashram-strona

**Project Type:** Astro static site
**Languages:** TypeScript
**Version:** 0.0.1
**Domain:** https://babaji.org.pl

## Technology Stack

### Framework
- **Astro** 5.17.1 — static site generator with islands architecture
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
- **Branch:** `master` (auto-deploy on push)
- **Build output:** `dist/`
- **Required secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PROJECT_NAME`
- **Optional:** `INDEXNOW_KEY` for search engine notifications

## Internationalization (i18n)

- **Default locale:** Polish (`pl`) — served at root paths (no `/pl/` prefix)
- **Secondary locale:** English (`en`) — served under `/en/`
- **Middleware:** Redirects `/pl/*` paths to root to avoid duplicate content
- **Content:** Events and teachings are duplicated under `src/content/events/` and `src/content/teachings/` with `pl/` and `en/` subdirectories
- **UI strings:** Managed in `src/i18n/ui.ts` and `src/i18n/utils.ts`

## Content Collections

Two typed content collections defined in `src/content/config.ts`:

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
│   │   └── config.ts       # Content collection schemas
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
- Markdown frontmatter must match `src/content/config.ts` schemas
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
- `master` — production branch (protected, deploys automatically)
- Changes reach `master` only via Pull Requests
- Shared git hook blocks direct pushes to `master` (enable with `git config core.hooksPath .githooks`)

<!-- SKILLKIT_START -->
# Skills

The following skills are available to help complete tasks:

<skills>
<skill>
<name>astro</name>
<description>Build content-focused websites with Astro — zero JS by default, islands architecture, multi-framework components, and Markdown/MDX support.</description>
<location>project</location>
</skill>

<skill>
<name>astrowind</name>
<description>Astro 5.0 + Tailwind CSS landing page with blog, dark mode, and perfect PageSpeed scores.</description>
<location>project</location>
</skill>

<skill>
<name>design-taste-frontend</name>
<description>Senior UI/UX Engineer. Architect digital interfaces overriding default LLM biases. Enforces metric-based rules, strict component architecture, CSS hardware acceleration, and balanced design engineering.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-accessibility</name>
<description>Implement WCAG compliance using semantic HTML, ARIA, keyboard navigation, and screen reader support. Use when building inclusive applications for all users.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-architecture</name>
<description>Component architecture, design patterns, state management strategies, module systems, build tools, and scalable application structure</description>
<location>project</location>
</skill>

<skill>
<name>frontend-code-review</name>
<description>Trigger when the user requests a review of frontend files (e.g., `.tsx`, `.ts`, `.js`). Support both pending-change reviews and focused file reviews while applying the checklist rules.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-dev-guidelines</name>
<description>You are a senior frontend engineer operating under strict architectural and performance standards. Use when creating components or pages, adding new features, or fetching or mutating data.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-development</name>
<description>Multi-framework frontend development. Frameworks: React 18+, Vue 3, Svelte 5, Angular. Common: TypeScript, state management, routing, data fetching, performance optimization, component patterns.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-engineer</name>
<description>Frontend development guidelines for React/TypeScript applications. Modern patterns including Suspense, lazy loading, useSuspenseQuery, file organization with features directory, MUI v7 styling, TanStack Router, performance optimization, and TypeScript best practices.</description>
<location>project</location>
</skill>

<skill>
<name>high-end-visual-design</name>
<description>Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive. Blocks all the common defaults that make AI designs look cheap or generic.</description>
<location>project</location>
</skill>

<skill>
<name>minimalist-ui</name>
<description>Clean editorial-style interfaces. Warm monochrome palette, typographic contrast, flat bento grids, muted pastels. No gradients, no heavy shadows.</description>
<location>project</location>
</skill>

<skill>
<name>industrial-brutalist-ui</name>
<description>Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extreme type scale contrast, utilitarian color, analog degradation effects. For data-heavy dashboards, portfolios, or editorial sites that need to feel like declassified blueprints.</description>
<location>project</location>
</skill>

<skill>
<name>playwright</name>
<description>Playwright testing best practices for Next.js applications. This skill should be used when writing, reviewing, or debugging E2E tests with Playwright.</description>
<location>project</location>
</skill>

<skill>
<name>playwright-best-practices</name>
<description>Use when writing or modifying Playwright tests (.spec.ts, .test.ts with @playwright/test imports).</description>
<location>project</location>
</skill>

<skill>
<name>playwright-expert</name>
<description>Use when writing E2E tests with Playwright, setting up test infrastructure, or debugging flaky browser tests. Invoke to write test scripts, create page objects, configure test fixtures, set up reporters, add CI integration, implement API mocking, or perform visual regression testing.</description>
<location>project</location>
</skill>

<skill>
<name>playwright-testing</name>
<description>E2E testing with Playwright - Page Objects, cross-browser, CI/CD</description>
<location>project</location>
</skill>

<skill>
<name>playwright-tests</name>
<description>End-to-end browser testing with Playwright. Test user interactions, form validation, navigation, and visual feedback with full browser automation.</description>
<location>project</location>
</skill>

<skill>
<name>seo</name>
<description>Optimize for search engine visibility and ranking. Use when auditing, improving, or implementing on-page SEO, technical SEO, content optimization, and search performance strategies.</description>
<location>project</location>
</skill>

<skill>
<name>seo-audit</name>
<description>When the user wants to audit, review, or diagnose SEO issues on a website. Covers technical SEO, on-page SEO, structured data, performance, and accessibility.</description>
<location>project</location>
</skill>

<skill>
<name>schema-markup</name>
<description>When the user wants to add, fix, or optimize schema markup (structured data) for rich snippets and SEO. Covers Schema.org, JSON-LD, and validation.</description>
<location>project</location>
</skill>

<skill>
<name>site-architecture</name>
<description>When the user wants to plan, map, or restructure their website's architecture, navigation, URL structure, internal linking, and content hierarchy.</description>
<location>project</location>
</skill>

<skill>
<name>content-strategy</name>
<description>When the user wants to plan a content strategy, decide what content to create, or organize existing content for better UX and SEO.</description>
<location>project</location>
</skill>

<skill>
<name>copywriting</name>
<description>When the user wants to write, rewrite, or improve marketing copy, headlines, CTAs, product descriptions, or any persuasive text for web or ads.</description>
<location>project</location>
</skill>

<skill>
<name>typescript</name>
<description>Type-safe development patterns for JARVIS AI Assistant</description>
<location>project</location>
</skill>

<skill>
<name>typescript-best-practices</name>
<description>Use when reading or writing TypeScript or JavaScript files (.ts, .tsx, .js, tsconfig.json).</description>
<location>project</location>
</skill>

<skill>
<name>typescript-conventions</name>
<description>Use this skill when writing or reviewing TypeScript code in the frontend to follow project conventions. Covers naming standards (kebab-case files), import patterns, error handling, type safety (no any), and ESLint/Prettier configuration.</description>
<location>project</location>
</skill>

<skill>
<name>typescript-strict-mode</name>
<description>Guide for strict TypeScript practices including avoiding any, using proper type annotations, and leveraging TypeScript's type system effectively. Use when working with TypeScript codebases that enforce strict type checking.</description>
<location>project</location>
</skill>

<skill>
<name>full-output-enforcement</name>
<description>Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any task requiring exhaustive, unabridged output.</description>
<location>project</location>
</skill>

<skill>
<name>redesign-existing-projects</name>
<description>Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS.</description>
<location>project</location>
</skill>

<skill>
<name>gpt-taste</name>
<description>Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typography, gapless bento grids, strict GSAP ScrollTriggers, inline micro-images, and massive section spacing.</description>
<location>project</location>
</skill>

<skill>
<name>stitch-design-taste</name>
<description>Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, calibrated color, asymmetric layouts, perpetual micro-motion, and hardware-accelerated performance.</description>
<location>project</location>
</skill>
</skills>

## How to Use

When a task matches a skill's description:

```bash
skillkit read <skill-name>
```

This loads the skill's instructions into context.

<!-- SKILLKIT_END -->
