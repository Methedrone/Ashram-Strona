# Ashram-Strona — Holistic Implementation Plan

## TL;DR

> **Quick Summary**: Transform the existing Astro 5.17+ scaffold into a complete, production-ready, bilingual (PL/EN) static website for Związek Wyznawców Ruchu Świadomości Babaji Haidakhandi Samaj in Mąkolno 129. Extract real content from Facebook fanpage, build all 7 pages with professional UI components, deploy to Cloudflare Pages with CI/CD.
>
> **Deliverables**:
> - 7 fully-built pages × 2 languages (14 pages total) with real content
> - ≥5 teachings + ≥3 events in content collections (PL+EN)
> - Professional UI: Hero, Daily Schedule, Location Map, Teaching/Event cards, Gallery grid
> - Deployment to Cloudflare Pages (babaji.org.pl)
> - GitHub Actions CI/CD pipeline
> - Lighthouse: Performance ≥90, Accessibility ≥90, SEO ≥95
>
> **Estimated Effort**: Medium (multi-day)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: T1 (content) → T3 (pages) → T5 (polish) → T7 (deploy) → T8 (QA)

---

## Context

### Original Request
User needs a high-quality static website for their ashram (spiritual center) in Mąkolno, Poland. Content sourced from Facebook fanpage. SEO is priority #1. Bilingual PL/EN. Future gateways for CMS and store. Domain: babaji.org.pl.

### What Already Exists (from Wave 1-7 of previous plan)
- GitHub repo: `Methedrone/Ashram-Strona` (1 commit)
- Astro 5.17+ scaffold with Cloudflare adapter + sitemap integration
- i18n configured (PL default, EN) with `prefixDefaultLocale: true`
- Content collections defined: `teachings` (title, description, date, author, lang) and `events` (title, description, date, location, lang)
- 7 pages per language (index, about, teachings, events, gallery, contact, donations) — **placeholder text only**
- Components: Header (nav + lang switcher), Footer, Hero, Schema (JSON-LD)
- Layout with SEO meta, OG/Twitter tags, ReligiousOrganization schema
- CSS variables: `--color-orange`, `--color-gold`
- sitemap-index.xml, robots.txt
- AGENTS.md, .aiignore, .ai/ context files
- Sample content: 1 teaching (kriya-yoga PL/EN), 1 event (spring retreat PL/EN)

### What Still Needs To Be Done
All pages have placeholder text like "Witamy w Ashram. To jest strona główna." — they need real content, proper sections, UI components, and professional styling.

### Interview Decisions (from prior sessions)
- **Content source**: Facebook fanpage https://www.facebook.com/haidakhandisevadham.polska.9 — AI extracts and formats
- **Translation**: AI translates PL→EN
- **Colors**: Orange #FF6B00 + Gold #FFD700, warm white bg #FFF8F0
- **Kolorystyka**: Pomarańcz + złoto (spiritual, warm)
- **SEO**: Priority #1, Schema.org (ReligiousOrganization, Event, Article)
- **Future gateways**: CMS (Decap/Keystatic-compatible frontmatter), store (price/registrationUrl fields)
- **No CMS/store now**: Only structure ready for future
- **Hosting**: Cloudflare Pages (free)
- **Domain**: babaji.org.pl (configured in astro.config.mjs)

### Metis Review
**Identified Gaps (resolved)**:
- Content responsibility → AI extracts from FB, formats into MD, translates to EN
- "UI/UX polish" scope → Defined as: responsive design, hover states, smooth transitions, proper spacing, professional typography. NO heavy animations/micro-interactions.
- Acceptance criteria → Concrete Lighthouse targets set
- Deployment access → Needs verification as first task step
- Legal/FB content rights → User provided FB link explicitly, assumed permission granted

---

## Work Objectives

### Core Objective
Deliver a production-ready, SEO-perfect, bilingual Astro static site with real content from Facebook, professional UI components, and automated deployment to Cloudflare Pages.

### Concrete Deliverables
- 14 fully-built pages (7 PL + 7 EN) with real content and proper sections
- ≥5 teachings + ≥3 events as Markdown content collection entries (both languages)
- Compressed local images (<200KB, WebP preferred)
- Professional UI components: Hero, DailySchedule, LocationMap, TeachingCard, EventCard, GalleryGrid
- CI/CD via GitHub Actions → Cloudflare Pages
- Live site at babaji.org.pl

### Definition of Done
- [ ] `npm run build` exits 0
- [ ] 14 pages render without errors (7 PL + 7 EN)
- [ ] ≥5 teachings + ≥3 events exist in content collections
- [ ] All images local and <200KB
- [ ] Language switcher works on every page
- [ ] Lighthouse: Performance ≥90, Accessibility ≥90, SEO ≥95
- [ ] Schema.org validates without errors
- [ ] Site deployed and accessible at babaji.org.pl
- [ ] CI/CD pipeline runs on push to main

### Must Have
- Real content from FB (not placeholder text)
- Both PL and EN for all pages
- ReligiousOrganization schema site-wide
- Event schema on event pages
- Article schema on teaching pages
- Responsive: 375px, 768px, 1280px
- Sitemap with both locale URLs
- hreflang tags

### Must NOT Have (Guardrails)
- No CMS admin interface
- No e-commerce/checkout functionality
- No heavy JavaScript animations
- No external font loading without preload
- No hardcoded strings (everything via i18n `useTranslations`)
- No images hotlinked from Facebook (download + compress locally)
- No automated FB scraping tools (manual extraction by AI agent)
- No more than 0 runtime JS dependencies (Astro zero-JS default)

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: NO (new project, no test framework)
- **Automated tests**: NO (static presentation site)
- **Framework**: N/A
- **Agent-Executed QA**: YES — mandatory for all tasks (Playwright + bash)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Content extraction from Facebook (PL)
└── Task 2: UI component library (Hero, cards, schedule, map, gallery)

Wave 2 (After Wave 1):
├── Task 3: Build all 7 pages with real content (PL)
└── Task 4: Translate content + build EN pages

Wave 3 (After Wave 2):
├── Task 5: UI/UX polish + responsive verification
└── Task 6: SEO hardening (Schema per page, hreflang, OG images)

Wave 4 (After Wave 3):
├── Task 7: CI/CD + Cloudflare Pages deployment
└── Task 8: Final QA (Playwright + Lighthouse)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4 | 2 |
| 2 | None | 3, 4 | 1 |
| 3 | 1, 2 | 5, 6 | 4 |
| 4 | 1, 2 | 5, 6 | 3 |
| 5 | 3, 4 | 8 | 6 |
| 6 | 3, 4 | 8 | 5 |
| 7 | 5, 6 | 8 | None |
| 8 | 7 | None | None (final) |

---

## TODOs

- [x] 1. Extract Real Content from Facebook Fanpage

  **What to do**:
  - Visit https://www.facebook.com/haidakhandisevadham.polska.9 via browser
  - Extract ≥5 teachings (spiritual posts, ceremonies, philosophy texts)
  - Extract ≥3 events (retreats, ceremonies, gatherings with dates)
  - Extract ≥10 gallery images (ashram photos, ceremonies, nature)
  - For each teaching: create `src/content/teachings/pl/{slug}.md` with frontmatter (title, description ≤150 chars, date, author: "Babaji", lang: "pl")
  - For each event: create `src/content/events/pl/{slug}.md` with frontmatter (title, description ≤150 chars, date, location: "Ashram Babaji, Mąkolno 129", lang: "pl")
  - Download images, compress to <200KB WebP, save to `public/images/{teachings,events,gallery}/`
  - Extract ashram info: address, daily schedule times, contact details, donation bank info
  - If FB access blocked: research ashram Babaji Mąkolno from public web sources and write authentic content

  **Must NOT do**:
  - Do NOT use automated scraping tools
  - Do NOT hotlink images from Facebook
  - Do NOT create fictional events with past dates — use reasonable future/ongoing dates
  - Do NOT write more than 500 words per teaching (concise, spiritual)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Content extraction + research + writing, needs browser access and creative writing
  - **Skills**: [`playwright`, `article-extractor`]
    - `playwright`: Browse FB fanpage, capture content
    - `article-extractor`: Extract clean text from web sources

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:
  **Pattern References**:
  - `src/content/config.ts` — Content collection schemas (teachings: title, description, date, author, lang; events: title, description, date, location, lang)
  - `src/content/teachings/pl/kriya-yoga.md` — Example teaching format
  - `src/content/events/pl/wiosenny-retreat.md` — Example event format
  - `.ai/content-guide.md` — Step-by-step content creation guide with templates

  **External References**:
  - Facebook fanpage: https://www.facebook.com/haidakhandisevadham.polska.9
  - Babaji Haidakhandi info: https://en.wikipedia.org/wiki/Hairakhan_Baba

  **Acceptance Criteria**:
  - [ ] `find src/content/teachings/pl -name "*.md" | wc -l` → ≥5
  - [ ] `find src/content/events/pl -name "*.md" | wc -l` → ≥3
  - [ ] `find public/images -name "*.webp" -o -name "*.jpg" -o -name "*.png" | wc -l` → ≥10
  - [ ] All images < 200KB: `find public/images -size +200k | wc -l` → 0
  - [ ] Each teaching MD has valid frontmatter: `grep -l "^title:" src/content/teachings/pl/*.md | wc -l` → ≥5
  - [ ] Each event MD has valid frontmatter with date: `grep -l "^date:" src/content/events/pl/*.md | wc -l` → ≥3
  - [ ] `npm run build` → exit 0 (content collections parse correctly)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Content collections parse without errors
    Tool: Bash
    Preconditions: Content files created in src/content/
    Steps:
      1. Run: npm run build
      2. Assert: Exit code 0
      3. Assert: No "ZodError" or "schema" errors in output
    Expected Result: Build succeeds with all content parsed
    Evidence: Build output captured

  Scenario: Images are optimized
    Tool: Bash
    Preconditions: Images saved to public/images/
    Steps:
      1. Run: find public/images -type f -size +200k
      2. Assert: No files returned (all <200KB)
      3. Run: find public/images -type f | wc -l
      4. Assert: ≥10 images
    Expected Result: All images under 200KB, minimum 10 images
    Evidence: File listing with sizes
  ```

  **Commit**: YES
  - Message: `content(ashram): extract real teachings, events, and images from Facebook`
  - Files: `src/content/**, public/images/**`
  - Pre-commit: `npm run build`

---

- [x] 2. Build UI Component Library

  **What to do**:
  - Create `src/components/DailySchedule.astro` — Timeline/cards showing daily ashram schedule (morning meditation, aarti, meals, evening ceremony). Use i18n for labels. Accept `schedule` prop as array of {time, activity} objects.
  - Create `src/components/LocationMap.astro` — OpenStreetMap embed (NOT Google Maps, no API key needed) centered on Mąkolno 129, Poland (GPS: ~53.35°N, 17.82°E). Styled card with address text alongside.
  - Create `src/components/TeachingCard.astro` — Card for teaching preview: title, description, date, "Read more" link. Accept teaching collection entry as prop.
  - Create `src/components/EventCard.astro` — Card for event preview: title, description, date, location. Show "upcoming" badge if future date. Accept event collection entry as prop.
  - Create `src/components/GalleryGrid.astro` — Responsive image grid with lazy loading. Accept array of image paths. CSS Grid: 1 col mobile, 2 cols tablet, 3 cols desktop.
  - Create `src/components/SectionHeading.astro` — Reusable section heading with decorative gold line underneath
  - Update `src/components/Hero.astro` — Add background image support, overlay gradient, CTA buttons
  - All components use scoped CSS with existing CSS variables (--color-orange, --color-gold)
  - All text via `useTranslations` from `src/i18n/ui.ts`
  - Add all new translation keys to `ui.ts` for both PL and EN

  **Must NOT do**:
  - No JavaScript for components (pure Astro/HTML/CSS)
  - No external CSS libraries (no Tailwind, no Bootstrap)
  - No Google Maps embed (use OpenStreetMap/Leaflet static)
  - No `any` types in TypeScript

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI components, CSS styling, responsive design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Component design, visual hierarchy, responsive patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Tasks 3, 4
  - **Blocked By**: None

  **References**:
  **Pattern References**:
  - `src/components/Hero.astro` — Existing component pattern (scoped CSS, frontmatter imports)
  - `src/components/Header.astro` — Navigation and lang switcher pattern
  - `src/components/Schema.astro` — JSON-LD injection pattern
  - `src/i18n/ui.ts` — Translation keys structure (nested by language)
  - `src/i18n/utils.ts` — `getLangFromUrl()`, `useTranslations()` helper functions
  - `src/layouts/Layout.astro` — Main layout with SEO/meta/OG pattern
  - `src/content/config.ts` — Content collection schemas for prop typing

  **External References**:
  - Astro components: https://docs.astro.build/en/basics/astro-components/
  - Astro content collections: https://docs.astro.build/en/guides/content-collections/
  - OpenStreetMap embed: https://www.openstreetmap.org/export#map (iframe embed)

  **Acceptance Criteria**:
  - [ ] `ls src/components/{DailySchedule,LocationMap,TeachingCard,EventCard,GalleryGrid,SectionHeading}.astro | wc -l` → 6
  - [ ] `grep -r "useTranslations" src/components/ | wc -l` → ≥3 (components use i18n)
  - [ ] `npm run build` → exit 0
  - [ ] No `any` types: `grep -r ": any" src/components/ | wc -l` → 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All components render without errors
    Tool: Bash
    Preconditions: Components created
    Steps:
      1. Run: npm run build
      2. Assert: Exit code 0
      3. Assert: No TypeScript errors in output
    Expected Result: Clean build with all components
    Evidence: Build output

  Scenario: Components are properly typed
    Tool: Bash
    Preconditions: Components created
    Steps:
      1. Run: grep -r ": any" src/components/
      2. Assert: No results (zero any types)
    Expected Result: Strict TypeScript throughout
    Evidence: Grep output
  ```

  **Commit**: YES
  - Message: `feat(ashram): add UI component library (schedule, map, cards, gallery)`
  - Files: `src/components/**, src/i18n/ui.ts`
  - Pre-commit: `npm run build`

---

- [ ] 3. Build All 7 Pages with Real Content (Polish)

  **What to do**:
  - **Home** (`src/pages/pl/index.astro`): Hero with ashram photo + CTA, Daily Schedule section, latest 3 events preview (EventCard), latest 3 teachings preview (TeachingCard), Location Map section, donation CTA
  - **About** (`src/pages/pl/about.astro`): Mission statement, Babaji introduction, ashram description, address block, photo
  - **Teachings** (`src/pages/pl/teachings.astro`): List all teachings from content collection (filtered by lang=pl), TeachingCard grid. Add individual teaching pages: `src/pages/pl/teachings/[...slug].astro` with dynamic routing
  - **Events** (`src/pages/pl/events.astro`): List all events (filtered by lang=pl), EventCard grid, upcoming events first. Add individual event pages: `src/pages/pl/events/[...slug].astro`
  - **Gallery** (`src/pages/pl/gallery.astro`): GalleryGrid with all images from public/images/gallery/
  - **Contact** (`src/pages/pl/contact.astro`): Address, phone, email, Location Map embed. Optional: simple Formspree form with GDPR note
  - **Donations** (`src/pages/pl/donations.astro`): Bank transfer info (IBAN/BIC placeholder), purpose statement, spiritual motivation text
  - Use semantic HTML throughout (`<main>`, `<article>`, `<section>`, `<h1>`-`<h6>`)
  - Each page gets appropriate `<title>` and `<meta description>` via Layout props

  **Must NOT do**:
  - No hardcoded Polish strings — all via useTranslations
  - No placeholder "Lorem ipsum" text — use real extracted content
  - No JavaScript for page interactivity
  - No external API calls (pure static)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Page composition, content integration, semantic HTML
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Page layout, content hierarchy, UX flow

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Tasks 1, 2

  **References**:
  **Pattern References**:
  - `src/pages/pl/index.astro` — Current placeholder (replace entirely)
  - `src/layouts/Layout.astro` — Layout accepts title, description props for SEO
  - `src/components/*.astro` — All UI components from Task 2
  - `src/content/config.ts` — Content collection querying patterns
  - `src/i18n/utils.ts` — `getLangFromUrl()` for locale-aware content filtering
  - `.ai/rules.md` — Coding standards (strict TS, scoped CSS, semantic HTML, useTranslations)

  **External References**:
  - Astro content collections querying: https://docs.astro.build/en/guides/content-collections/#querying-collections
  - Astro dynamic routes: https://docs.astro.build/en/guides/routing/#dynamic-routes
  - Formspree: https://formspree.io/ (optional contact form)

  **Acceptance Criteria**:
  - [ ] `ls src/pages/pl/*.astro | wc -l` → 7 (index, about, teachings, events, gallery, contact, donations)
  - [ ] `npm run build` → exit 0
  - [ ] `ls dist/pl/ | wc -l` → ≥7 directories/files
  - [ ] No hardcoded Polish strings: `grep -rn '"Witamy\|"Kontakt\|"Nauki' src/pages/pl/ | wc -l` → 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: All Polish pages render correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:4321
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Assert: h1 exists and is not empty
      3. Assert: No "placeholder" or "Lorem" text visible
      4. Navigate to: http://localhost:4321/pl/teachings
      5. Assert: ≥5 TeachingCard elements visible
      6. Navigate to: http://localhost:4321/pl/events
      7. Assert: ≥3 EventCard elements visible
      8. Navigate to: http://localhost:4321/pl/gallery
      9. Assert: ≥10 img elements with lazy loading
      10. Navigate to: http://localhost:4321/pl/contact
      11. Assert: Address text visible, map iframe/embed exists
      12. Navigate to: http://localhost:4321/pl/donations
      13. Assert: Bank info section exists
      14. Screenshot each page: .sisyphus/evidence/task-3-pl-{page}.png
    Expected Result: All 7 pages render with real content
    Evidence: Screenshots in .sisyphus/evidence/

  Scenario: Navigation links all work
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Query: nav a elements
      3. Assert: ≥6 navigation links
      4. Click each nav link
      5. Assert: Each loads without 404
    Expected Result: All nav links functional
    Evidence: Console output captured
  ```

  **Commit**: YES
  - Message: `feat(ashram): build all 7 Polish pages with real content and components`
  - Files: `src/pages/pl/**`
  - Pre-commit: `npm run build`

---

- [ ] 4. Translate Content + Build English Pages

  **What to do**:
  - Translate all teaching MD files: create `src/content/teachings/en/{slug}.md` for each PL teaching
  - Translate all event MD files: create `src/content/events/en/{slug}.md` for each PL event
  - Ensure all translation keys in `src/i18n/ui.ts` have EN values (verify completeness)
  - Build/update all 7 EN pages mirroring PL structure
  - Add teaching/event detail pages for EN: `src/pages/en/teachings/[...slug].astro`, `src/pages/en/events/[...slug].astro`
  - Verify language switcher links correctly between PLEN counterpart pages

  **Must NOT do**:
  - Do NOT use machine translation without natural-sounding adjustment
  - Do NOT leave any PL text in EN pages
  - Do NOT create different page structure for EN vs PL (must mirror)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Translation work + content writing + page building
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Page structure consistency

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Tasks 1, 2

  **References**:
  **Pattern References**:
  - `src/content/teachings/en/kriya-yoga.md` — Existing EN teaching example
  - `src/content/events/en/spring-retreat.md` — Existing EN event example
  - `src/i18n/ui.ts` — All UI translation keys (check EN completeness)
  - `src/pages/pl/*.astro` — PL pages to mirror for EN

  **Acceptance Criteria**:
  - [ ] EN teachings count matches PL: `diff <(ls src/content/teachings/pl/) <(ls src/content/teachings/en/)` → identical file lists
  - [ ] EN events count matches PL: `diff <(ls src/content/events/pl/) <(ls src/content/events/en/)` → identical file lists
  - [ ] `ls src/pages/en/*.astro | wc -l` → 7
  - [ ] `npm run build` → exit 0
  - [ ] No PL text in EN pages: build and check `grep -r "Witamy\|Nauki\|Kontakt" dist/en/ | wc -l` → 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Language switcher works correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Click: Language switcher to EN
      3. Assert: URL is /en/
      4. Assert: Page content is in English
      5. Click: Language switcher to PL
      6. Assert: URL is /pl/
      7. Repeat for /pl/teachings → /en/teachings
      8. Screenshot: .sisyphus/evidence/task-4-lang-switch.png
    Expected Result: Seamless language switching on all pages
    Evidence: .sisyphus/evidence/task-4-lang-switch.png
  ```

  **Commit**: YES
  - Message: `feat(ashram): add English translations and EN pages for full bilingual support`
  - Files: `src/content/**/en/**, src/pages/en/**, src/i18n/ui.ts`
  - Pre-commit: `npm run build`

---

- [ ] 5. UI/UX Polish + Responsive Verification

  **What to do**:
  - **Responsive fixes**: Test and fix layout at 375px (mobile), 768px (tablet), 1280px (desktop)
  - **Typography**: Ensure consistent heading hierarchy, readable line-height (1.6+), proper font sizes
  - **Color consistency**: Verify orange/gold CSS variables applied consistently across all components
  - **Hover states**: Add hover effects on all interactive elements (links, buttons, cards)
  - **Transitions**: Smooth transitions on hover/focus (0.2s ease)
  - **Touch targets**: Ensure all interactive elements ≥44px
  - **Mobile menu**: If hamburger menu needed, implement CSS-only (no JS)
  - **Image optimization**: Ensure all images have `width`, `height` attributes (CLS prevention) and `loading="lazy"` on below-fold images
  - **Focus styles**: Visible focus indicators for keyboard navigation
  - **Contrast**: Ensure text passes WCAG AA contrast ratio (4.5:1 normal, 3:1 large)

  **Must NOT do**:
  - No JavaScript for interactions (CSS-only animations/transitions)
  - No heavy animations (parallax, scroll effects, etc.)
  - No external animation libraries
  - No layout changes beyond responsive fixes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS polish, responsive design, accessibility basics
  - **Skills**: [`frontend-ui-ux`, `accessibility-audit`]
    - `frontend-ui-ux`: Visual polish, responsive patterns
    - `accessibility-audit`: Contrast, focus, touch targets

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 3, 4

  **References**:
  **Pattern References**:
  - `src/components/*.astro` — All components to polish
  - `src/layouts/Layout.astro` — Global styles
  - `.ai/rules.md` — Scoped CSS preference, semantic HTML

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit 0
  - [ ] No images without dimensions: `grep -r "<img" dist/ | grep -v "width=" | wc -l` → 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Responsive design at 3 breakpoints
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport: 375×667 (mobile)
      2. Navigate to: http://localhost:4321/pl/
      3. Assert: No horizontal scroll
      4. Assert: Navigation is mobile-friendly (hamburger or stacked)
      5. Screenshot: .sisyphus/evidence/task-5-mobile.png
      6. Set viewport: 768×1024 (tablet)
      7. Navigate to: http://localhost:4321/pl/
      8. Screenshot: .sisyphus/evidence/task-5-tablet.png
      9. Set viewport: 1280×720 (desktop)
      10. Navigate to: http://localhost:4321/pl/
      11. Screenshot: .sisyphus/evidence/task-5-desktop.png
    Expected Result: Clean layout at all breakpoints
    Evidence: Screenshots at 3 breakpoints

  Scenario: Touch targets and focus styles
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Tab through all interactive elements
      3. Assert: Each focused element has visible focus indicator
      4. Query: All a, button elements
      5. Assert: Each has min-height ≥44px or min-width ≥44px via computed styles
    Expected Result: Accessible touch targets and focus styles
    Evidence: Console output
  ```

  **Commit**: YES
  - Message: `style(ashram): responsive polish, hover states, accessibility improvements`
  - Files: `src/components/**, src/layouts/**`
  - Pre-commit: `npm run build`

---

- [ ] 6. SEO Hardening

  **What to do**:
  - **Schema.org per page type**:
    - Home: ReligiousOrganization (already exists, verify completeness)
    - Teachings list: CollectionPage
    - Teaching detail: Article with author (Babaji)
    - Events list: CollectionPage
    - Event detail: Event with startDate, location, organizer
    - About: AboutPage
    - Contact: ContactPage with ContactPoint
    - Donations: WebPage
  - **hreflang tags**: Add `<link rel="alternate" hreflang="pl"...>` and `<link rel="alternate" hreflang="en"...>` on every page
  - **Canonical URLs**: Add `<link rel="canonical"...>` on every page
  - **OG image**: Create/add a default OG image (1200×630px) for social sharing
  - **Meta descriptions**: Unique, keyword-rich description for each page (≤160 chars)
  - **robots.txt**: Verify allows all, references sitemap
  - **Sitemap**: Verify sitemap-index.xml includes all 14 pages with correct hreflang

  **Must NOT do**:
  - No keyword stuffing
  - No duplicate meta descriptions
  - No missing alt text on images

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: SEO-specific technical work, Schema.org implementation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Meta tags, structured data integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 3, 4

  **References**:
  **Pattern References**:
  - `src/components/Schema.astro` — Existing JSON-LD injection component
  - `src/layouts/Layout.astro` — Meta/OG tag injection point
  - `astro.config.mjs` — site URL and sitemap config

  **External References**:
  - Schema.org ReligiousOrganization: https://schema.org/ReligiousOrganization
  - Schema.org Event: https://schema.org/Event
  - Schema.org Article: https://schema.org/Article
  - Google Rich Results Test: https://search.google.com/test/rich-results
  - Astro SEO guide: https://docs.astro.build/en/guides/seo/

  **Acceptance Criteria**:
  - [ ] Schema.org on every page: `curl -s http://localhost:4321/pl/ | grep -c "application/ld+json"` → ≥1
  - [ ] hreflang on every page: `curl -s http://localhost:4321/pl/ | grep -c 'hreflang='` → ≥2
  - [ ] Canonical on every page: `curl -s http://localhost:4321/pl/ | grep -c 'rel="canonical"'` → 1
  - [ ] sitemap includes all pages: `curl -s http://localhost:4321/sitemap-index.xml | grep -c "<loc>"` → ≥1
  - [ ] OG image exists: `curl -s http://localhost:4321/pl/ | grep -c 'og:image'` → 1
  - [ ] No images without alt: `grep -r "<img" dist/ | grep -v "alt=" | wc -l` → 0
  - [ ] `npm run build` → exit 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Schema.org validates for each page type
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s http://localhost:4321/pl/ | grep "application/ld+json" -A 20
      2. Assert: Contains "ReligiousOrganization"
      3. curl -s http://localhost:4321/pl/teachings/ | grep "application/ld+json" -A 10
      4. Assert: Contains "CollectionPage" or similar
      5. curl -s http://localhost:4321/pl/events/ | grep "application/ld+json" -A 10
      6. Assert: Contains "CollectionPage" or similar
    Expected Result: Correct Schema.org type per page
    Evidence: curl output captured

  Scenario: hreflang cross-references are bidirectional
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s http://localhost:4321/pl/ | grep hreflang
      2. Assert: Contains hreflang="en" pointing to /en/
      3. curl -s http://localhost:4321/en/ | grep hreflang
      4. Assert: Contains hreflang="pl" pointing to /pl/
    Expected Result: Bidirectional hreflang tags
    Evidence: curl output
  ```

  **Commit**: YES
  - Message: `seo(ashram): add per-page Schema.org, hreflang, canonical, OG images`
  - Files: `src/components/Schema.astro, src/layouts/Layout.astro, src/pages/**, public/images/og-*.{png,jpg}`
  - Pre-commit: `npm run build`

---

- [ ] 7. CI/CD + Cloudflare Pages Deployment

  **What to do**:
  - Create `.github/workflows/deploy.yml` — GitHub Actions workflow:
    - Trigger: push to `main`
    - Steps: checkout, setup Node 20, install deps, build, deploy to Cloudflare Pages
    - Use `cloudflare/pages-action@v1` or `wrangler-action`
  - Add deployment secrets documentation (CF_API_TOKEN, CF_ACCOUNT_ID) — user must add to GitHub repo secrets
  - Test build locally one final time: `npm run build`
  - If Cloudflare Pages project doesn't exist: document creation steps
  - Verify `astro.config.mjs` has correct `site: 'https://babaji.org.pl'`

  **Must NOT do**:
  - Do NOT hardcode secrets in workflow file
  - Do NOT add preview deployments (keep simple)
  - Do NOT add complex test gates (just build → deploy)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard CI/CD setup, well-documented pattern
  - **Skills**: [`devops-pipeline`]
    - `devops-pipeline`: GitHub Actions, Cloudflare deployment

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 5, 6

  **References**:
  **Pattern References**:
  - `astro.config.mjs` — site URL config (line 8: `site: 'https://babaji.org.pl'`)
  - `package.json` — build script

  **External References**:
  - Cloudflare Pages GitHub Action: https://github.com/cloudflare/pages-action
  - Astro Cloudflare deploy: https://docs.astro.build/en/guides/deploy/cloudflare/
  - GitHub Actions secrets: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

  **Acceptance Criteria**:
  - [ ] `.github/workflows/deploy.yml` exists
  - [ ] Workflow YAML is valid: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` → exit 0
  - [ ] `npm run build` → exit 0 (final pre-deploy verification)
  - [ ] No secrets in workflow: `grep -r "CF_API_TOKEN\|wrangler_token" .github/ | grep -v 'secrets\.' | wc -l` → 0

  **Commit**: YES
  - Message: `ci(ashram): add GitHub Actions workflow for Cloudflare Pages deployment`
  - Files: `.github/workflows/deploy.yml`
  - Pre-commit: `npm run build`

---

- [ ] 8. Final QA — End-to-End Verification

  **What to do**:
  - Run full Playwright test suite across all pages (PL + EN)
  - Run Lighthouse audits (Performance, Accessibility, SEO, Best Practices)
  - Verify all navigation links work (no 404s)
  - Verify mobile/tablet/desktop responsive
  - Verify language switcher on every page
  - Verify Schema.org on every page
  - Verify sitemap completeness
  - Verify images load (no broken images)
  - Update README.md with final project documentation
  - Final build: `npm run build`

  **Must NOT do**:
  - No new features
  - No refactoring
  - No content changes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification only, no new code
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for comprehensive testing

  **Parallelization**:
  - **Can Run In Parallel**: NO (final task)
  - **Parallel Group**: Wave 4 (after Task 7)
  - **Blocks**: None (final)
  - **Blocked By**: Task 7

  **References**:
  **Verification Checklist**:
  - All 14 pages render (7 PL + 7 EN)
  - Language switcher works on each page
  - ≥5 teachings, ≥3 events visible
  - Gallery shows ≥10 images
  - Contact page has address + map
  - Donations page has bank info
  - No console errors

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit 0

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Full site navigation (PL)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:4321
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Assert: Page loads, h1 exists
      3. Click through all 6 navigation links
      4. Assert: Each page returns 200, has h1, no console errors
      5. Screenshot each: .sisyphus/evidence/task-8-pl-{page}.png
    Expected Result: All PL pages functional
    Evidence: 7 screenshots in .sisyphus/evidence/

  Scenario: Full site navigation (EN)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:4321/en/
      2. Repeat same checks as PL scenario
      3. Screenshot each: .sisyphus/evidence/task-8-en-{page}.png
    Expected Result: All EN pages functional
    Evidence: 7 screenshots

  Scenario: Lighthouse audit
    Tool: Bash
    Preconditions: Site built, preview server or dev server running
    Steps:
      1. Run: npx lighthouse http://localhost:4321/pl/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=.sisyphus/evidence/lighthouse-pl.json --chrome-flags="--headless --no-sandbox"
      2. Assert: jq '.categories.performance.score' → ≥0.90
      3. Assert: jq '.categories.accessibility.score' → ≥0.90
      4. Assert: jq '.categories.seo.score' → ≥0.95
      5. Assert: jq '.categories["best-practices"].score' → ≥0.90
    Expected Result: All Lighthouse scores meet targets
    Evidence: .sisyphus/evidence/lighthouse-pl.json

  Scenario: Responsive verification at 3 breakpoints
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Set viewport: 375×667 → Navigate /pl/ → Screenshot .sisyphus/evidence/task-8-mobile.png
      2. Set viewport: 768×1024 → Navigate /pl/ → Screenshot .sisyphus/evidence/task-8-tablet.png
      3. Set viewport: 1280×720 → Navigate /pl/ → Screenshot .sisyphus/evidence/task-8-desktop.png
      4. Assert: No horizontal scroll at any breakpoint
    Expected Result: Clean responsive design
    Evidence: 3 screenshots

  Scenario: No broken images or links
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running
    Steps:
      1. Navigate to: http://localhost:4321/pl/
      2. Query all img elements
      3. Assert: Each has naturalWidth > 0 (loaded successfully)
      4. Query all a[href] elements
      5. Assert: No href contains "undefined" or "null"
    Expected Result: All assets load correctly
    Evidence: Console output
  ```

  **Commit**: YES
  - Message: `docs(ashram): final QA passed, update README with project documentation`
  - Files: `README.md`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `content(ashram): extract real teachings, events, and images from Facebook` | `src/content/**, public/images/**` | `npm run build` |
| 2 | `feat(ashram): add UI component library (schedule, map, cards, gallery)` | `src/components/**, src/i18n/ui.ts` | `npm run build` |
| 3 | `feat(ashram): build all 7 Polish pages with real content and components` | `src/pages/pl/**` | `npm run build` |
| 4 | `feat(ashram): add English translations and EN pages for full bilingual support` | `src/content/**/en/**, src/pages/en/**, src/i18n/ui.ts` | `npm run build` |
| 5 | `style(ashram): responsive polish, hover states, accessibility improvements` | `src/components/**, src/layouts/**` | `npm run build` |
| 6 | `seo(ashram): add per-page Schema.org, hreflang, canonical, OG images` | `src/components/**, src/layouts/**, src/pages/**, public/**` | `npm run build` |
| 7 | `ci(ashram): add GitHub Actions workflow for Cloudflare Pages deployment` | `.github/workflows/deploy.yml` | `npm run build` |
| 8 | `docs(ashram): final QA passed, update README with project documentation` | `README.md` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
npm run build                    # Expected: exit 0
find src/content/teachings -name "*.md" | wc -l  # Expected: ≥10 (5 PL + 5 EN)
find src/content/events -name "*.md" | wc -l     # Expected: ≥6 (3 PL + 3 EN)
find public/images -type f | wc -l               # Expected: ≥10
ls dist/pl/ | wc -l                              # Expected: ≥7
ls dist/en/ | wc -l                              # Expected: ≥7
cat .github/workflows/deploy.yml | head -5       # Expected: valid YAML
```

### Final Checklist
- [ ] All 14 pages render (7 PL + 7 EN)
- [ ] ≥5 teachings + ≥3 events (both languages)
- [ ] Language switcher works on every page
- [ ] All images local, <200KB, with alt text
- [ ] Schema.org on every page (correct type per page)
- [ ] hreflang + canonical on every page
- [ ] Lighthouse: Performance ≥90, Accessibility ≥90, SEO ≥95
- [ ] Responsive: 375px, 768px, 1280px
- [ ] CI/CD workflow exists
- [ ] No console errors
- [ ] No broken links or images
- [ ] README has project documentation
