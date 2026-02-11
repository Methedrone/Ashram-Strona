# Ashram-Strona

Modern multilingual static site built with **Astro 5.x** and **Full Site Editing** support.

- **Technologies**: Astro 5.17+, Cloudflare Adapter
- **Languages**: Polish (pl) & English (en) with i18n routing
- **Output**: Static HTML prerendered for production deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+ or your preferred package manager

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Open in browser at http://localhost:3000
```

## 📋 Project Structure

```
Ashram-Strona/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Root redirect (handles localization)
│   │   ├── pl/                      # Polish locale pages
│   │   │   ├── index.astro          # /pl/ home
│   │   │   ├── teachings.astro      # /pl/teachings
│   │   │   ├── about.astro          # /pl/about
│   │   │   ├── contact.astro        # /pl/contact
│   │   │   ├── gallery.astro        # /pl/gallery
│   │   │   ├── events.astro         # /pl/events
│   │   │   └── donations.astro      # /pl/donations
│   │   └── en/                      # English locale pages
│   │       └── [mirrors pl structure]
│   ├── components/                  # Reusable UI components
│   ├── layouts/                     # Page layouts (header, footer, SEO)
│   └── utils/                       # Helper functions and utilities
├── public/                          # Static assets (robots.txt, favicon.svg, etc.)
├── dist/                            # Built output (generated on `npm run build`)
├── astro.config.mjs                 # Astro configuration with i18n settings
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Dependencies and build scripts
```

## 🧞 Commands

All commands run from the project root:

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server (hot reload) at `http://localhost:3000` |
| `npm run build` | Build static site to `./dist/` for production |
| `npm run preview` | Preview the built site locally before deployment |
| `npm run astro ...` | Run Astro CLI commands (e.g., `npm run astro add`, `npm run astro check`) |

### Development Workflow

```bash
# Start development
npm run dev

# Make changes to pages or components
# Changes auto-refresh in browser (Fast Refresh enabled)

# When ready to deploy:
npm run build
npm run preview  # Test production build locally

# Verify generated routes:
ls dist/pl/      # Polish locale routes
ls dist/en/      # English locale routes
```

## 🌍 Internationalization (i18n)

The site uses Astro's built-in i18n routing with two locales:
- **pl** - Polish (default locale)
- **en** - English

### URL Pattern
- Polish: `/pl/teachings`, `/pl/about`, etc.
- English: `/en/teachings`, `/en/about`, etc.
- Root `/` → Redirects based on browser language or defaults to Polish

### Using Locale in Pages
In any `.astro` page, access the current locale:

```astro
---
const locale = Astro.currentLocale; // 'pl' or 'en'
---

{locale === 'pl' && <p>Polska wersja</p>}
{locale === 'en' && <p>English version</p>}
```

## 🔧 Configuration

### Key Files
- **astro.config.mjs**: Astro & Cloudflare adapter settings; i18n routing configured here
- **tsconfig.json**: TypeScript strict mode enabled
- **public/**: Assets served at root (robots.txt, favicon.svg, manifest.json)

## 📚 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Astro i18n Guide](https://docs.astro.build/en/guides/internationalization/)
- [Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

## 📦 Dependencies

- **astro**: ^5.17.1 - Static site generator
- **@astrojs/cloudflare**: ^12.6.12 - Cloudflare deployment adapter

## ⚠️ Important Notes

- **Static Output**: This project uses Astro's static mode (not hybrid). All pages are prerendered at build time.
- **No Hybrid Mode**: Astro 5.17+ removed the `output: "hybrid"` option. The static adapter handles all use cases.
- **i18n Prefix**: `prefixDefaultLocale: true` in astro.config.mjs means Polish locale is prefixed as `/pl/` (not hidden)
- **Build Verification**: Always run `npm run build` to verify all locale routes prerender correctly before deployment

## 🚢 Deployment

The built site is ready for deployment to any static hosting:

```bash
# Build production bundle
npm run build

# Deploy the ./dist/ directory to your host
# (Cloudflare, Netlify, Vercel, GitHub Pages, etc.)
```

For Cloudflare Workers deployment, use the included adapter configuration in `astro.config.mjs`.
