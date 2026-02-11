# Ashram-Strona Architecture Context

## Project Overview
**Ashram-Strona** is a static Astro 5.x website for Ashram Babaji in Poland.
- **Stack**: Astro 5.17+, TypeScript, Cloudflare Adapter.
- **Languages**: Polish (`pl` - default) and English (`en`).
- **Styling**: Scoped CSS with CSS variables (`--color-orange`, `--color-gold`).

## Directory Structure
- `src/content/`: Content Collections (Markdown/MDX).
  - `teachings/`: Spiritual teachings.
  - `events/`: Upcoming events.
- `src/components/`: Reusable UI components.
  - `Header.astro`: Navigation & Language Switcher.
  - `Footer.astro`: Copyright & Links.
  - `Hero.astro`: Homepage hero section.
  - `Schema.astro`: JSON-LD injection.
- `src/layouts/`:
  - `Layout.astro`: Main shell with SEO and i18n logic.
- `src/i18n/`:
  - `ui.ts`: UI translation strings.
  - `utils.ts`: Helper functions (`getLangFromUrl`, `useTranslations`).

## Data Models (Content Collections)
Defined in `src/content/config.ts`.

### Teachings
- `title` (string)
- `description` (string)
- `date` (Date)
- `author` (string, default: 'Babaji')
- `lang` ('pl' | 'en')

### Events
- `title` (string)
- `description` (string)
- `date` (Date)
- `location` (string, default: 'Ashram Babaji, Mąkolno 129')
- `lang` ('pl' | 'en')

## Key Patterns
- **i18n**: URL-based routing (`/pl/...`, `/en/...`).
- **SEO**: `ReligiousOrganization` schema on all pages. `Event` schema on event pages.
- **Components**: Functional, stateless components preferred.
