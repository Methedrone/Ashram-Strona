# SEO + GEO + AEO Roadmap dla babaji.org.pl

**Cel:** pełen plan wykorzystania Google API + sąsiadujących narzędzi do **pozycjonowania, widoczności w AI (AEO/GEO), lokalnego SEO**.

**Trzy warstwy:**

1. **SEO (Search Engine Optimization)** — klasyczne pozycjonowanie w Google/Bing
2. **GEO (Generative Engine Optimization)** — optymalizacja pod AI Overviews, ChatGPT, Perplexity, Claude citations
3. **AEO (Answer Engine Optimization)** — featured snippets, "People also ask", zero-click answers

---

## 1. SEO — klasyczne fundamenty

### 1.1 Audit (już zrobione)

`reports/psi_*.json` — Lighthouse + CWV snapshot:
- Performance: 0.71 (mobile), 0.78 (events)
- SEO: 1.00 (✅)
- Accessibility: 1.00 (✅)
- Best Practices: 1.00 (✅)
- LCP: 4.4-6.2s (❌ > 2.5s progu "Good")
- CLS: 0.107 na `/teachings` (❌ > 0.1 progu)

### 1.2 Akcje (priorytet 1)

| Akcja | Narzędzie | Deadline |
|---|---|---|
| Napraw CLS > 0.1 na `/teachings` | Astro `<img width height>` + `aspect-ratio` CSS | ten tydzień |
| Zmniejsz LCP (hero image WebP + preload) | `astro:assets` `<Image>` + `<link rel=preload>` | ten tydzień |
| Submit sitemap do GSC | `gsc-searchanalytics.mjs --submit-sitemap` | po setupie SA |
| Wdróż `INDEXNOW_KEY` | `public/{key}.txt` + env | 10 min |
| Dodaj GSC top-queries do cotygodniowego raportu | `gsc-searchanalytics.mjs` cron | po setupie |

### 1.3 Akcje (priorytet 2)

| Akcja | Narzędzie | Efekt |
|---|---|---|
| Schema.org `Event` na `/events/*` | `EventSchema.astro` | rich snippets w SERP |
| Schema.org `Article` na `/teachings/*` | `ArticleSchema.astro` | j.w. |
| `BreadcrumbList` schema | w Layout | nawigacja w SERP |
| Canonical URL z `<link rel=canonical>` | w Layout | unik duplikacji pl/en |
| `hreflang` pl/en | w Layout | j.w. |
| Open Graph + Twitter Card | masz `astro-seo` | social shares |

### 1.4 Akcje (priorytet 3)

| Akcja | Narzędzie | Efekt |
|---|---|---|
| Internal linking audit | `scripts/internal-link-audit.mjs` | link equity flow |
| Backlink monitoring | Ahrefs API (albo ręcznie) | off-page SEO |
| Core Web Vitals tracking (real user) | PSI `loadingExperience` | CWV trend |

---

## 2. GEO — Generative Engine Optimization (AI Overviews, ChatGPT, Perplexity)

### 2.1 Czym jest GEO

Optymalizacja pod:
- **Google AI Overviews** (SGE — Search Generative Experience)
- **ChatGPT browse mode** (czaty polecające strony)
- **Perplexity AI** (citation engine)
- **Claude (Anthropic)** — tryb web search
- **Microsoft Copilot** (Bing-backed)

Klucz: **być cytowanym**, nie tylko linkowanym.

### 2.2 Strategia cytowalności

| Czynnik | Działanie | API / tool |
|---|---|---|
| **Strukturyzowane fakty** | Schema.org `Organization`, `Person`, `FAQPage`, `HowTo` | w Layout |
| **Cytowalne zdania** | Każdy akapit zaczyna się od konkretnej odpowiedzi | ręcznie |
| **Unikalne dane** | Daty, godziny, miejsca havan w JSON-LD | auto |
| **Aktualność** | Daty `datePublished`, `dateModified` w Article | `astro-seo` |
| **`llms.txt`** | Plik `/llms.txt` z opisem strony dla crawlerów AI | w `public/` |
| **`llms-full.txt`** | Pełna treść w jednym pliku markdown dla AI | w `public/` |

### 2.3 Implementacja `llms.txt` (Format: https://llmstxt.org)

```bash
# public/llms.txt
# babaji.org.pl
> Duchowa strona Ashramu Babaji w Kłodzku. Wydarzenia (havan, medytacja, satsang), nauki, lokalizacja.

## Wydarzenia
- [Havan 30.06.2026, Kłodzko](https://babaji.org.pl/events/havan-30-06): ogniowa ceremonia, godz. 7:00-11:00
- [Medytacja poranna](https://babaji.org.pl/events/medytacja-poranek): każdy wtorek 6:00

## Nauki
- [Wprowadzenie do medytacji](https://babaji.org.pl/teachings/medytacja-wprowadzenie)
- [Filozofia Babaji](https://babaji.org.pl/teachings/babaji-filozofia)
```

### 2.4 Implementacja `llms-full.txt`

Pełna treść strony (bez nawigacji) w jednym pliku markdown. AI crawlers to kochają.

```js
// scripts/build-llms-full.mjs (do uruchomienia po astro build)
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';

const contents = [];
// wczytaj wszystkie strony .astro (po build → HTML)
// z każdej wyciągnij <main>...</main>, zostaw tylko tekst
// złóż w jeden markdown
```

### 2.5 JSON-LD dla AI

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ashram Babaji",
  "url": "https://babaji.org.pl",
  "logo": "https://babaji.org.pl/logo.png",
  "description": "Duchowy ośrodek medytacji i havan w Kłodzku",
  "foundingDate": "2005-01-01",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Kłodzko",
    "addressRegion": "Dolnośląskie",
    "addressCountry": "PL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 50.4354,
    "longitude": 16.6614
  },
  "sameAs": [
    "https://www.facebook.com/ashram.babaji",
    "https://www.youtube.com/@babaji-klodzko"
  ]
}
```

---

## 3. AEO — Answer Engine Optimization

### 3.1 Czym jest AEO

Optymalizacja pod:
- **Google Featured Snippets** (pozycja 0)
- **"People also ask"** (PAA)
- **Knowledge Graph** (panel po prawej)
- **Voice search** (Alexa, Google Assistant)

### 3.2 Pattern: "Answer first, explain second"

Każdy artykuł / wydarzenie:

1. **H1** = pytanie (np. "Kiedy odbędzie się następny havan w Kłodzku?")
2. **Pierwszy akapit** = 1-zdaniowa odpowiedź (40-60 słów)
3. **H2** = szczegóły
4. **Lista punktowana** = kolejne aspekty
5. **Schema.org `FAQPage`** = 5 pytań na dole

### 3.3 Przykład (havan event)

```astro
---
// src/content/events/pl/havan-30-06.md
title: "Havan 30 czerwca 2026"
description: "Tradycyjna ceremonia ognia w Kłodzku."
date: 2026-06-30
time: "07:00-11:00"
location: "Ashram Babaji, Kłodzko"
faqs:
  - q: "O której zaczyna się havan 30 czerwca?"
    a: "Havan zaczyna się o 7:00 rano, kończy około 11:00."
  - q: "Czy mogę przyjść bez zapowiedzi?"
    a: "Zalecamy rejestrację, ale nie jest wymagana."
  - q: "Co zabrać?"
    a: "Wygodne ubranie, woda butelkowana. Jedzenie zapewniamy."
---
```

W Schema JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Havan 30 czerwca 2026",
  "startDate": "2026-06-30T07:00:00+02:00",
  "endDate": "2026-06-30T11:00:00+02:00",
  "location": { "@type": "Place", "name": "Ashram Babaji", "address": "Kłodzko, Polska" },
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "mainEntity": {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O której zaczyna się havan?",
        "acceptedAnswer": { "@type": "Answer", "text": "Havan zaczyna się o 7:00 rano, kończy około 11:00." }
      }
    ]
  }
}
```

### 3.4 Voice search (PL)

Ludzie pytają asystentów:
- "Hej Google, kiedy jest następny havan w Kłodzku?"
- "Alexa, ile trwa medytacja w ashramie?"

Żeby to działało:
- Schema.org `Event` z `startDate` ✅
- Schema.org `FAQPage` z Q&A ✅
- `Speakable` schema (opcjonalnie) — wskazuje które sekcje nadają się do głosowego odczytu

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "xpath": ["/html/head/title", "/html/body/main/h1", "//*[@class='answer']"]
  }
}
```

---

## 4. Local SEO (Kłodzko + Dolny Śląsk)

### 4.1 Google Business Profile (BING + Google Maps)

1. https://business.google.com → utwórz profil
2. Nazwa: **Ashram Babaji**
3. Kategoria: **Religious organization** + **Spiritual center**
4. Adres: Kłodzko
5. Godziny: zgodne z `/events`
6. Zdjęcia: logo + wnętrze
7. Posty: co tydzień (nowe wydarzenia automatycznie)

### 4.2 Schema.org LocalBusiness / Place

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://babaji.org.pl/#localbusiness",
  "name": "Ashram Babaji",
  "image": "https://babaji.org.pl/og-image.png",
  "telephone": "+48-XXX-XXX-XXX",
  "priceRange": "Free",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ul. ... ",
    "addressLocality": "Kłodzko",
    "postalCode": "57-300",
    "addressCountry": "PL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 50.4354,
    "longitude": 16.6614
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Tuesday", "Thursday", "Saturday"],
      "opens": "06:00",
      "closes": "20:00"
    }
  ]
}
```

### 4.3 GSC — sprawdź lokalne queries

```bash
# Top queries z PL (filtr)
gsc-searchanalytics.mjs --dimension-filter country=POL
```

Jeśli widzisz "medytacja kłodzko" na pozycji 4-10 → dodaj tę frazę do title/h1 najbliższego eventu.

---

## 5. Monitoring (cron co tydzień)

### 5.1 PSI snapshot

```bash
node .ashram-google-api-usage/scripts/psi-snapshot.mjs
# → raporty w .ashram-google-api-usage/reports/
# alert: jeśli perf < 0.7 lub LCP > 5s
```

### 5.2 GSC top queries (po setupie SA)

```bash
node .ashram-google-api-usage/scripts/gsc-searchanalytics.mjs \
  --site https://babaji.org.pl/ \
  --days 7 \
  --dimensions query \
  --row-limit 50
```

### 5.3 GA4 traffic overview (po setupie SA)

```bash
node .ashram-google-api-usage/scripts/ga4-run-report.mjs \
  --property $GA4_PROPERTY_ID \
  --days 7 \
  --metrics sessions,totalUsers,engagedSessions,conversions
```

### 5.4 IndexNow / sitemap verify

```bash
# Po build → IndexNow batch
node .ashram-google-api-usage/scripts/indexnow-batch.mjs

# Sitemap submit (opcjonalnie, jeśli nowe URL-e)
node .ashram-google-api-usage/scripts/gsc-searchanalytics.mjs --submit-sitemap
```

---

## 6. KPI dashboard (Looker Studio — darmowe)

1. https://lookerstudio.google.com → Blank report
2. Add data → Google Analytics 4 → property `babaji.org.pl`
3. Add data → Google Search Console → `https://babaji.org.pl/`
4. Add data → Sheets → upload PSI `compare_*.json` co tydzień

Wykresy:
- Sessions / users / page views (GA4)
- Top 20 pages (GA4 + GSC)
- Avg position, CTR (GSC)
- PSI performance trend (Sheets)
- Konwersje (sign_up_havan) (GA4)

---

## 7. Checklist (z priorytetami)

### 🟢 Tydzień 1 (niskie wisienki)

- [x] PSI snapshot script
- [ ] Napraw CLS na `/teachings` (width/height na img)
- [ ] Wdróż `INDEXNOW_KEY` + `public/{key}.txt`
- [ ] Dodaj `npm run psi` do package.json
- [ ] Cron: co tydzień PSI snapshot

### 🟡 Tygodnie 2-4 (setup Google Cloud)

- [ ] Google Cloud project + service account
- [ ] GA4 property + SA Viewer
- [ ] GSC verify + SA Owner
- [ ] `ga4-run-report.mjs` działający
- [ ] `gsc-searchanalytics.mjs` działający
- [ ] Looker Studio dashboard

### 🔴 Miesiąc 2+ (advanced)

- [ ] `llms.txt` + `llms-full.txt`
- [ ] Schema.org LocalBusiness / Event
- [ ] Google Business Profile
- [ ] GSC URL Inspection w CI
- [ ] Indexing API dla livestreamów (kiedy wprowadzisz)

---

## 8. Narzędzia zewnętrzne (bonus)

| Narzędzie | Do czego | Darmowe? |
|---|---|---|
| **Ahrefs Webmaster Tools** | backlinki, audit | ✅ dla właścicieli |
| **Bing Webmaster Tools** | Bing indexing | ✅ |
| **Yandex Webmaster** | Yandex indexing | ✅ |
| **Schema.org Validator** | walidacja JSON-LD | ✅ |
| **Google Rich Results Test** | rich snippets preview | ✅ |
| **CrUX** (https://cruxvis.com) | real-user CWV | ✅ |
| **Looker Studio** | dashboard | ✅ |
| **Screaming Frog** (1000 URL free) | crawl audit | ✅ limited |
| **Ahrefs Analytics** (już masz) | tracking | ✅ |
