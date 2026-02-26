# Ashram-Strona

Modern multilingual static site built with **Astro 5.x** and **Full Site Editing** support.

- **Technologies**: Astro 5.17+, Cloudflare Adapter, Playwright, Lighthouse, Custom Scoped CSS
- **Languages**: Polish (pl) & English (en) with i18n routing
- **Output**: Static HTML prerendered for production deployment
- **Domain**: [babaji.org.pl](https://babaji.org.pl)

##  Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or your preferred package manager

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Open in browser at http://localhost:4321
```

##  Project Structure

```
Ashram-Strona/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Polish home page
│   │   └── en/                      # English locale pages
│   ├── components/                  # Reusable UI components
│   ├── layouts/                     # Page layouts (header, footer, SEO)
│   ├── content/                     # Markdown/MDX content (events, teachings)
│   ├── i18n/                        # Internationalization config and utils
│   └── utils/                       # Helper functions
├── public/                          # Static assets (images, fonts, robots.txt)
├── dist/                            # Built output (generated on `npm run build`)
├── astro.config.mjs                 # Astro configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and build scripts
```

##  Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server at `http://localhost:4321` |
| `npm run build` | Build static site to `./dist/` for production |
| `npm run preview` | Preview built site (if supported by adapter) |
| `npm run test` | Run Playwright E2E tests |

##  Internationalization (i18n)

The site uses Astro's built-in i18n routing:
- **Default Locale**: Polish (`/pl/`)
- **Secondary Locale**: English (`/en/`)
- **Prefix**: All locales are prefixed.

##  Deployment

Deployed to **Cloudflare Pages** using the `@astrojs/cloudflare` adapter.
Automatic deployments are triggered on push to the `master` branch.

##  Development Workflow

- Work happens on `dev`.
- `master` receives changes only via Pull Requests.

##  Project Status

- [x] Multilingual support (PL/EN)
- [x] Dynamic Events and Teachings via Content Collections
- [x] Responsive Design (Mobile/Tablet/Desktop)
- [x] SEO Optimization (Schema.org, OpenGraph, Sitemap)
- [x] Performance optimized (100/100 Lighthouse)
- [x] E2E Testing with Playwright

---
Built with  for the Ashram Community.
