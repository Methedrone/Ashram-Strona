# PageSpeed Insights API v5

**Cel:** Lighthouse + CrUX (real-user Core Web Vitals) dla każdego URL-a. Działa z samym **API key** — jedyny z całego stosu, który nie wymaga OAuth.

**Status:** ✅ działający w `scripts/psi-snapshot.mjs`.

---

## 1. Endpoint i auth

```
Base URL:    https://www.googleapis.com/pagespeedonline/v5/runPagespeed
Method:      GET
Auth:        API key as query param: ?key=${ASHRAM_GOOGLE_API_KEY}
```

⚠ **Nie wymaga OAuth!** Wystarczy klucz API z `.env` (`ASHRAM_GOOGLE_API_KEY`).

---

## 2. Parametry

| Parametr | Wymagany | Wartości | Domyślnie |
|---|---|---|---|
| `url` | ✅ | URL strony (encoded) | — |
| `key` | ✅ (chyba że OAuth) | API key | — |
| `strategy` | — | `mobile` \| `desktop` \| `unspecified` | `desktop` |
| `locale` | — | `pl`, `en`, `de`, `en_US`, ... | `en_US` |
| `category` | — (multi) | `performance`, `accessibility`, `best-practices`, `seo`, `pwa` | `["performance", "accessibility", "best-practices", "seo"]` |
| `filter_third_party_resources` | — | `true` \| `false` | `false` |
| `rule` | — | jedna reguła PageSpeed (np. `SPEED`) | wszystkie |
| `utm_campaign`, `utm_source` | — | dla raportowania Google | — |
| `captchaToken` | — | gdy weryfikacja captcha | — |

> 📌 **Nowe (potwierdzone w context7 2025):** `filter_third_party_resources` (izoluje Twoje zasoby od zewnętrznych — przydatne do audytu własnego kodu), `rule` (uruchamia tylko jedną regułę Lighthouse — szybsze i tańsze).

### Przykład

```bash
API_KEY=$(grep ASHRAM_GOOGLE_API_KEY .env | cut -d= -f2)
curl -sS "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://babaji.org.pl&key=${API_KEY}&strategy=mobile&locale=pl" -o /tmp/psi.json
```

---

## 3. Struktura odpowiedzi (wyciąg)

```json
{
  "id": "https://babaji.org.pl/",
  "loadingExperience": {
    "overall_category": "FAST|AVERAGE|SLOW|null",
    "metrics": {
      "largest_contentful_paint": { "category": "FAST", "percentile": 2500 },
      "first_input_delay": { "category": "FAST" },
      "cumulative_layout_shift": { "category": "FAST" },
      "interaction_to_next_paint": { "category": "FAST" }
    }
  },
  "lighthouseResult": {
    "lighthouseVersion": "13.4.1",
    "fetchTime": "2026-08-03T05:37:35.563Z",
    "finalUrl": "https://babaji.org.pl/",
    "userAgent": "Mozilla/5.0 (X11; Linux x86_64) ...",
    "categories": {
      "performance": { "score": 0.71, "title": "Performance" },
      "accessibility": { "score": 1.0, "title": "Accessibility" },
      "best-practices": { "score": 1.0, "title": "Best Practices" },
      "seo": { "score": 1.0, "title": "SEO" }
    },
    "audits": {
      "first-contentful-paint": { "numericValue": 3700, "displayValue": "3.7 s", "score": 0.4 },
      "largest-contentful-paint": { "numericValue": 5000, "displayValue": "5.0 s", "score": 0.5 },
      "cumulative-layout-shift": { "numericValue": 0.018, "displayValue": "0.019", "score": 1.0 },
      "total-blocking-time": { "numericValue": 50, "displayValue": "50 ms", "score": 1.0 },
      "speed-index": { "numericValue": 5000, "displayValue": "5.0 s", "score": 0.5 }
    }
  }
}
```

---

## 4. CrUX — prawdziwe dane użytkowników

⚠ Pole `loadingExperience.overall_category`:
- `null` (brak danych — strona ma za mało odwiedzin, próg CrUX to ~10k/month dla origin)
- `FAST` / `AVERAGE` / `SLOW`

Dla `babaji.org.pl` aktualnie `null` (za mały ruch). Po uzyskaniu ~10k visitors/miesiąc dostaniesz:

```json
{
  "loadingExperience": {
    "overall_category": "AVERAGE",
    "metrics": {
      "largest_contentful_paint": { "category": "AVERAGE", "percentile": 3200 }
    }
  }
}
```

---

## 5. Limity

| Zasób | Limit |
|---|---|
| Requesty / dzień / project (free) | 25 000 |
| Requesty / 100s / user | 400 |
| Czas trwania jednego audytu | 30-90s |
| Cache odpowiedzi | 30-60s (na serwerach Google) |
| Max URL length | 2048 |

---

## 6. Kategorie Lighthouse

| Kategoria | Co mierzy | Progi score |
|---|---|---|
| **performance** | FCP, LCP, CLS, TBT, SI, TTI | 0.9+ good, 0.5+ average, <0.5 poor |
| **accessibility** | aria, kontrast, semantyka | 1.0 cel |
| **best-practices** | HTTPS, console errors, deprecated APIs | 1.0 cel |
| **seo** | meta tags, mobile-friendly, structured data | 1.0 cel |
| **pwa** | service worker, manifest, install | opcjonalne |

---

## 7. Skrypt istniejący

`scripts/psi-snapshot.mjs` — działa, używa się:

```bash
node .ashram-google-api-usage/scripts/psi-snapshot.mjs
# → mobile+desktop dla / /en /events /teachings

# custom URL list:
node .ashram-google-api-usage/scripts/psi-snapshot.mjs --urls "https://babaji.org.pl/,https://babaji.org.pl/en,https://babaji.org.pl/events/havan-30-06"

# tylko mobile:
node .ashram-google-api-usage/scripts/psi-snapshot.mjs --strategy mobile

# po polsku:
node .ashram-google-api-usage/scripts/psi-snapshot.mjs --locale pl
```

Wyniki w `reports/psi_<url>_<strategy>.json` + `reports/compare_<timestamp>.json` (diff vs poprzedni).

---

## 8. CI/CD integracja (Cloudflare Pages deploy hook)

W `astro.config.mjs` po build → wyślij POST do Cloudflare Pages deploy hook URL.
CF Pages → Settings → Builds → **Deploy hooks** → utwórz hook.

Webhook URL → zapisz w `.env`:
```
CF_DEPLOY_HOOK_URL=https://api.cloudflare.com/client/v4/pages/webhooks/...
```

GitHub Action (`.github/workflows/psi-post-deploy.yml`):

```yaml
name: PSI snapshot post-deploy
on:
  workflow_dispatch:
  repository_dispatch:
    types: [cf_deployed]

jobs:
  psi:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Run PSI snapshot
        env:
          ASHRAM_GOOGLE_API_KEY: ${{ secrets.ASHRAM_GOOGLE_API_KEY }}
        run: |
          mkdir -p .ashram-google-api-usage/reports
          node .ashram-google-api-usage/scripts/psi-snapshot.mjs \
            --urls "https://babaji.org.pl/,https://babaji.org.pl/en,https://babaji.org.pl/events,https://babaji.org.pl/teachings"

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: psi-report
          path: .ashram-google-api-usage/reports/compare_*.json
```

---

## 9. Optymalizacja na podstawie PSI

Aktualne wyniki (`reports/compare_2026-08-03T05-37-32-862Z.json`):

| URL | Performance | LCP | CLS | Rekomendacja |
|---|---|---|---|---|
| `/` (PL) | 0.71 | 5.0s | 0.018 | LCP > 2.5s — hero image preload + WebP |
| `/en` | 0.72 | 5.6s | 0.011 | j.w. + lang switch hydration |
| `/events` | 0.78 | 4.4s | 0.055 | OK, ale list images potrzebują `width`/`height` |
| `/teachings` | 0.72 | 4.9s | **0.107** | **CLS > 0.1 — krytyczne** — ustaw `width`+`height` na wszystkich `<img>` |

### Konkretne fixy w Astro

```astro
---
// src/components/EventCard.astro
const { event } = Astro.props;
const ratio = 16 / 9; // stały aspect ratio
---
<img
  src={event.featuredImage}
  alt={event.title}
  width={800}
  height={Math.round(800 / ratio)}
  loading="lazy"
  decoding="async"
/>
```

Stały `aspect-ratio` na kontenerze eliminuje CLS nawet gdy obrazek się jeszcze nie załadował.
