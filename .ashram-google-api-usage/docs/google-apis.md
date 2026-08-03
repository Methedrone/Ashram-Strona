# PageSpeed Insights API v5 i Web Search Indexing API v3

Dokumentacja techniczna pod **babaji.org.pl** (Astro 5 + Cloudflare Pages).
Źródła: developers.google.com/speed/docs/insights/v5, developers.google.com/search/apis/indexing-api/v3,
indexnow.org/documentation, www.bing.com/indexnow.

W projekcie już działa:
- `scripts/psi-snapshot.mjs` → `.ashram-google-api-usage/scripts/psi-snapshot.mjs` (PSI, uruchamiany ręcznie, snapshot per URL do `reports/`)
- `.github/workflows/audit.yml` → lokalny Lighthouse na PR (bez quota)
- `.github/workflows/deploy.yml` → deploy na `master` przez `wrangler pages deploy`
- `astro-indexnow` w `astro.config.mjs` → automatyczne powiadomienie Bing+Yandex po buildzie (gdy `INDEXNOW_KEY`)

Brakuje: **CI hook po deployu CF Pages** (PSI snap na produkcji) oraz **Indexing API** (OAuth 2.0, push URL do Google).

---

## (A) PageSpeed Insights API v5

### A.1 Endpoint i parametry

```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
```

| Parametr | Wymagany | Wartości | Domyślnie | Uwagi |
|---|---|---|---|---|
| `url` | **tak** | URL (pełny, zakodowany) | — | Strona do analizy |
| `key` | rekomendowany | Twój API key | brak | Bez klucza działa, ale przy wielu requestach dostaniesz CAPTCHA / rate limit |
| `strategy` | nie | `mobile` \| `desktop` | `desktop` | Emulowane urządzenie + sieć |
| `locale` | nie | np. `pl`, `en-US` | `en` | Lokalizuje etykiety wyniku |
| `category` | nie (repeat) | `performance` \| `accessibility` \| `best-practices` \| `seo` | tylko `performance` | Powtórz parametr, by dostać kilka kategorii |

Przykład z istniejącego skryptu (`psi-snapshot.mjs:104-117`):

```js
const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
u.searchParams.set('url', 'https://babaji.org.pl/');
u.searchParams.set('key', process.env.ASHRAM_GOOGLE_API_KEY);
u.searchParams.set('strategy', 'mobile');
u.searchParams.set('locale', 'pl');
for (const c of ['performance','accessibility','best-practices','seo'])
  u.searchParams.append('category', c);
const res = await fetch(u.toString());
const json = await res.json();
```

`category` przyjmuje też bez `-` (`best_practices`), ale oficjalna dokumentacja używa myślnika.

### A.2 Struktura odpowiedzi

Najwyższy poziom JSON:

```jsonc
{
  "captchaResult": "CAPTCHA_NOT_NEEDED",
  "kind": "pagespeedonline#result",
  "id": "https://babaji.org.pl/",
  "loadingExperience": { /* real-user CrUX, patrz A.2.2 */ },
  "originLoadingExperience": { /* to samo ale dla całego origin (fallback) */ },
  "lighthouseResult": { /* lab data, patrz A.2.1 */ },
  "analysisUTCTimestamp": "2026-08-03T05:37:35.563Z"
}
```

#### A.2.1 `lighthouseResult` (lab data)

Kluczowe pola (zgodnie z `psi-snapshot.mjs:52-101`):

- `requestedUrl`, `finalUrl` — wejściowy i po redirectach URL.
- `lighthouseVersion` (np. `"13.4.1"`), `userAgent`, `fetchTime` — kontekst biegu.
- `configSettings` — emulated form factor, locale, lista kategorii.
- `audits` — słownik `id → audit`. Dla każdego: `score` (0–1 lub `null`), `scoreDisplayMode`,
  `displayValue` (lokalizowany string np. `"3,0 s"`), `numericValue` (ms, waga, …),
  `details` (z `overallSavingsMs` dla opportunity). Ważne audyty:
  - `first-contentful-paint` (FCP)
  - `largest-contentful-paint` (LCP)
  - `cumulative-layout-shift` (CLS)
  - `total-blocking-time` (TBT)
  - `speed-index`, `interactive` (TTI), `first-meaningful-paint`
- `categories` — słownik `id → { score, title, auditRefs[] }`. `score` ∈ [0, 1].
  Wagi per-audit w `auditRefs[i].weight`; `group` określa grupę wizualną (`metrics` / a11y-group / …).
- `categoryGroups` — grupowanie a11y do „elements have discernible names" itd.
- `runtimeError` (opcjonalnie), `timing.total`, `i18n.rendererFormattedStrings`.

**Skala score Lighthouse (0–1):** 0.9+ = Good, 0.5–0.9 = Needs Improvement, <0.5 = Poor.
Nasz aktualny stan z `reports/psi_https_babaji_org_pl_mobile.json`:
`performance 0.71, accessibility 1, best_practices 1, seo 1` — CrUX jeszcze puste (nowa domena, brak 28-dniowych danych w CrUX).

#### A.2.2 `loadingExperience` (real-user CrUX)

```jsonc
{
  "id": "https://babaji.org.pl/",
  "overall_category": "SLOW",        // lub "FAST" / "AVERAGE"; null = brak danych
  "initial_url": "https://babaji.org.pl/",
  "metrics": {
    "FIRST_CONTENTFUL_PAINT_MS": {
      "percentile": 3482,            // 75. percentyl
      "category": "SLOW",
      "distributions": [ { "min": 0, "max": 1000, "proportion": 0.37 }, … ]
    },
    "LARGEST_CONTENTFUL_PAINT_MS": { … },
    "CUMULATIVE_LAYOUT_SHIFT": { … },
    "INTERACTION_TO_NEXT_PAINT": { … },
    "FIRST_INPUT_DELAY_MS": { … },   // legacy, nadal raportowany
    "EXPERIMENTAL_TIME_TO_FIRST_BYTE": { … }  // experimental
  }
}
```

Każda metryka ma `category` ∈ `FAST|SLOW|AVERAGE` i rozkład. W JS camelCase to
`largest_contentful_paint`, `cumulative_layout_shift`, `first_contentful_paint`,
`first_input_delay`, `interaction_to_next_paint` (tak czyta to `psi-snapshot.mjs:86-94`).

CrUX zwraca dane tylko gdy URL ma wystarczającą liczbę odwiedzin (>28 dni, próg popularności).
Jeśli brak → pole jest `null`, albo cały `loadingExperience` jest obiektem z pustymi metrykami —
wtedy skrypt loguje `CrUX=no` (`psi-snapshot.mjs:167-169`).

`originLoadingExperience` to ten sam schemat, ale dla całego origin (np. cały `babaji.org.pl`)
— PSI używa go jako fallbacku gdy URL ma za mało danych.

### A.3 Autoryzacja i limity

- **API key bez OAuth.** Tworzysz w Google Cloud Console → APIs & Services → Credentials → API key.
  Klucz dodajesz do `.env` jako `ASHRAM_GOOGLE_API_KEY` (już jest).
- Key jest bezpieczny do umieszczenia w URL (`?key=…`), nie trzeba go dodatkowo kodować.
- **Free tier:** oficjalna strona PSI nie podaje dziś sztywnego limitu liczbowego; historycznie
  dokumentacja i community wymieniały **25 000 zapytań/dzień** na projekt oraz **~400 QPM** (queries
  per minute). Przy ręcznym/local snapshot wystarczy; przy masowych odpytaniach (np. PSI każdej
  podstrony po deployu) limitem szybciej stanie się **dzienny counter niż 200/dzień Indexing API**.
- W razie przekroczenia: `captchaResult: "CAPTCHA_NEEDED"` lub `HTTP 429`. Skrypt ma fallback
  do erroru w wierszu raportu (`psi-snapshot.mjs:155-159`).

### A.4 CI/CD po deployu — Cloudflare Pages deploy hook + PSI

**Cel:** po każdym deployu na `master` uruchomić PSI snapshot na produkcyjnych URL-ach i zapisać
raport do artifact. Porównanie z poprzednim buildem = regresja performance.

**Schemat:**

1. **Cloudflare Pages Deploy Hook** (opcjonalnie, alternatywa dla triggera w GH Actions).
   W dashboardzie CF Pages → Settings → Build → Deploy hooks → „Add hook" → wybierz branch
   `master`. CF wyśle POST na podany URL **po zakończeniu deployu** (nie przed).
   Niestety CF nie wstrzykuje URL-a deploya do hooka, więc lepiej użyć wariantu 2.

2. **Rekomendowane: dedykowany GitHub Action `psi-prod.yml`** uruchamiany po `workflow_run`
   na `deploy.yml` (sukces) — daje dostęp do `github.event.workflow_run.head_branch` itp.
   Alternatywa: trigger przez `repository_dispatch` z `deploy.yml` na końcu jobsa.

Szkic `psi-prod.yml`:

```yaml
name: PSI snapshot (prod)
on:
  workflow_run:
    workflows: ["Deploy to Cloudflare Pages"]
    types: [completed]
  workflow_dispatch:

jobs:
  psi:
    if: >-
      github.event.workflow_run.conclusion == 'success' &&
      github.event.workflow_run.head_branch == 'master'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Sleep (CDN propagation)
        run: sleep 30   # daj CF 30s na propagację przed pomiarem
      - name: Run PSI snapshot
        env:
          ASHRAM_GOOGLE_API_KEY: ${{ secrets.ASHRAM_GOOGLE_API_KEY }}
        run: node .ashram-google-api-usage/scripts/psi-snapshot.mjs \
              --urls https://babaji.org.pl,https://babaji.org.pl/en,https://babaji.org.pl/events,https://babaji.org.pl/teachings \
              --strategy mobile,desktop
      - uses: actions/upload-artifact@v4
        with:
          name: psi-snapshot
          path: .ashram-google-api-usage/reports/
```

**Quota impact:** 4 URLe × 2 strategie = **8 zapytań / deploy**. Przy kilku deployach dziennie
to < 0.05% dziennego limitu 25k.

**Cloudflare Pages Deploy Hook jako alternatywa:** jeśli wolisz nie czekać na GH Actions,
możesz postawić prosty Cloudflare Worker pod `/api/psi-hook`, który na POST od CF odpala
`fetch()` do PSI. Ale: a) Worker nie ma Twojego API key bez sekretu w `wrangler.toml`;
b) worker jest dłuższy w utrzymaniu; **wersja z GH Action jest prostsza** i spina się z
artifact/log.

### A.5 Przykłady wywołań

**curl:**

```bash
curl -sS "https://www.googleapis.com/pagespeedonline/v5/runPagespeed\
?url=https%3A%2F%2Fbabaji.org.pl%2F\
&key=$ASHRAM_GOOGLE_API_KEY\
&strategy=mobile\
&locale=pl\
&category=performance\
&category=accessibility\
&category=best-practices\
&category=seo" | jq '.lighthouseResult.categories, .loadingExperience.overall_category'
```

**Node (już działa w projekcie):**

```bash
# pełen domyślny przebieg (4 URL-e × mobile+desktop = 8 zapytań)
node .ashram-google-api-usage/scripts/psi-snapshot.mjs

# tylko homepage, mobile
node .ashram-google-api-usage/scripts/psi-snapshot.mjs \
  --urls https://babaji.org.pl --strategy mobile

# konkretne kategorie
node .ashram-google-api-usage/scripts/psi-snapshot.mjs \
  --category performance --category seo
```

Wynik: pliki `reports/psi_https_babaji_org_pl_*_mobile.json` per URL+strategia oraz
zbiorczy `reports/compare_<timestamp>.json` z deltami vs poprzedni przebieg.

---

## (B) Web Search Indexing API v3

### B.1 Endpointy

| Akcja | HTTP | Endpoint | Body |
|---|---|---|---|
| Powiadom o nowej/aktualizowanej stronie | `POST` | `https://indexing.googleapis.com/v3/urlNotifications:publish` | `{ "url": "…", "type": "URL_UPDATED" }` |
| Powiadom o usuniętej stronie | `POST` | `https://indexing.googleapis.com/v3/urlNotifications:publish` | `{ "url": "…", "type": "URL_DELETED" }` |
| Sprawdź status | `GET` | `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=<URL-encoded>` | — |
| Batch (≤100 requestów/req) | `POST` | `https://indexing.googleapis.com/batch` | `multipart/mixed` |

**Ważne ograniczenie z oficjalnej dokumentacji:**
> The Indexing API can only be used to crawl pages with either `JobPosting` or `BroadcastEvent`
> embedded in a `VideoObject`.

W praktyce Google zatwierdza też inne krótkotrwałe strony (`NewsArticle`, `Event` dla portali
eventowych) po wypełnieniu formularza zwiększenia quota — wtedy działa na stronach typu
`/events/[…slug]`. Dla treści długowiecznych (homepage, `/teachings/`, `/about`) **wystarczy
sitemap + IndexNow**, Indexing API nie jest przeznaczony i quota 200/dzień i tak by się
skończyło.

### B.2 Autoryzacja: OAuth 2.0, scope `index`

1. Google Cloud Console → wybierz projekt (ten sam, w którym masz PSI key) →
   APIs & Services → Library → włącz **Web Search Indexing API**.
2. APIs & Services → Credentials → **Create credentials → Service account**.
   Pobierz JSON klucz (`*.json` z `private_key`, `client_email`).
3. Search Console właściciela `babaji.org.pl` → Settings → Users and permissions →
   dodaj `client_email` service accounta jako **Owner** (lub przynajmniej z pełnym prawem).
4. **Request approval & quota:** formularz na
   `https://forms.gle/WY8CjRJcEgg77Rau6` (link z oficjalnej dokumentacji). Bez tego dostajesz
   tylko domyślne 200/dzień i access token z restrykcjami.
5. Wygeneruj access token (server-to-server, **nie** potrzebujesz interaktywnego usera):

```js
// snippets/google-auth.mjs
import { readFile } from 'node:fs/promises';
import { createSign } from 'node:crypto';

export async function getAccessToken(saPath, scope = 'https://www.googleapis.com/auth/indexing') {
  const sa = JSON.parse(await readFile(saPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${b64(header)}.${b64(claim)}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = `${b64(header)}.${b64(claim)}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const { access_token } = await res.json();
  return access_token;
}
```

W Cloudflare Pages ustaw sekret `GOOGLE_SA_JSON` (multiline) albo wrzuć plik
do `.ashram-google-api-usage/credentials/` (gitignored). **Nie commituj klucza.**

### B.3 Quota

Z oficjalnej strony `developers.google.com/search/apis/indexing-api/v3/quota-pricing`:

| Parametr | Wartość domyślna | Reset |
|---|---|---|
| `DefaultPublishRequestsPerDayPerProject` | **200** (URL_UPDATED + URL_DELETED) | midnight Pacific Time |
| `DefaultMetadataRequestsPerMinutePerProject` | 180 | na minutę |
| `DefaultRequestsPerMinutePerProject` | 380 | na minutę |

**API jest darmowe**, ale Google wymaga „Request approval & quota" do użycia poza testami
(patrz B.2 punkt 4). Wcześniejsze wersje docs wspominały o `submitException` dla nowych stron —
obecnie to po prostu review formularza; Google rozpatruje po stronie jakości dokumentów.

W naszym projekcie: 200/dzień × 30 dni = 6 000 URL/mies. Sitemap ma kilkadziesiąt URL;
**realnie quota wystarczy na daily push tylko zdarzeń** (nowe `/events/[…slug]`). Dla reszty
— sitemap + IndexNow.

### B.4 Batch submit URL-i z sitemap

Batch endpoint `/batch` łączy do **100 requestów** w jeden `multipart/mixed`. Poniżej wersja
„Node 20 + natywnie `fetch`":

```js
// snippets/indexing-batch.mjs
import { getAccessToken } from './google-auth.mjs';
import { readFile } from 'node:fs/promises';

const HOST = 'https://indexing.googleapis.com';
const BOUNDARY = `===============${Date.now()}===============`;

async function buildBatch(urls, type = 'URL_UPDATED') {
  const parts = urls.map((u, i) => {
    const body = JSON.stringify({ url: u, type });
    return [
      `--${BOUNDARY}`,
      `Content-Type: application/http`,
      `Content-Transfer-Encoding: binary`,
      `Content-ID: <batch-${i}+1>`,
      ``,
      `POST /v3/urlNotifications:publish`,
      `Content-Type: application/json`,
      `accept: application/json`,
      `content-length: ${Buffer.byteLength(body)}`,
      ``,
      body,
    ].join('\r\n');
  });
  return parts.join('\r\n') + `\r\n--${BOUNDARY}--\r\n`;
}

export async function pushBatch(urls, type = 'URL_UPDATED') {
  if (urls.length > 100) throw new Error('max 100 URLs per batch');
  const token = await getAccessToken('.ashram-google-api-usage/credentials/sa.json');
  const body = await buildBatch(urls, type);

  const res = await fetch(`${HOST}/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/mixed; boundary="${BOUNDARY}"`,
    },
    body,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.text();  // multipart response — parsuj per Content-ID
}
```

**Czytanie sitemap i filtrowanie tylko eventów** (przykład dla Astro `@astrojs/sitemap`,
który generuje `dist/sitemap-index.xml` + `dist/sitemap-0.xml`):

```js
// scripts/indexing-push.mjs
import { readFile } from 'node:fs/promises';
import { pushBatch } from '../snippets/indexing-batch.mjs';
import { glob } from 'node:fs/promises';   // Node 22; dla 20 użyj `node:fs` readdirSync

const FILES = ['dist/sitemap-0.xml'];        // bez i18n
const FILTERS = [
  /\/events(\/|$|\?)/,                       // /events, /events/foo
  /\/en\/events(\/|$|\?)/,                   // /en/events
  // celowo pomijamy /teachings i /en (długowieczne → wystarczy sitemap)
];

async function loadSitemapUrls() {
  const all = new Set();
  for (const f of FILES) {
    const xml = await readFile(f, 'utf8');
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      all.add(m[1].replace(/\/$/, '') /* normalizuj trailing slash */);
    }
  }
  return [...all].filter((u) => FILTERS.some((re) => re.test(u)));
}

const urls = await loadSitemapUrls();
console.log(`Pushing ${urls.length} URLs to Indexing API…`);

for (let i = 0; i < urls.length; i += 100) {
  const chunk = urls.slice(i, i + 100);
  await pushBatch(chunk, 'URL_UPDATED');
  console.log(`✓ batch ${i / 100 + 1}: ${chunk.length} URLs`);
}
```

`astro.config.mjs` ma `i18n: { defaultLocale: 'pl', locales: ['pl','en'] }` + sitemap bez
prefixu dla PL, więc URL `/events/xxx` (PL) i `/en/events/xxx` (EN) siedzą w jednym
`dist/sitemap-0.xml` — regex w `FILTERS` musi pokrywać oba.

### B.5 Alternatywy

**IndexNow** (Bing + Yandex + Seznam + Naver + Eaton) — **już włączone w projekcie**:
- `astro.config.mjs`: `indexnow({ key: process.env.INDEXNOW_KEY })` pod warunkiem że env jest ustawione.
- Klucz generujesz w dashboardzie Bing Webmaster Tools → IndexNow → Generate API Key
  (8–128 znaków hex/a-zA-Z0-9-).
- Klucz weryfikujesz przez plik `https://babaji.org.pl/<key>.txt` w `public/`.
- Każdy build automatycznie POST-uje do Bing+reszty listę zmienionych URL-i.
- **Limit: 10 000 URL per POST** (JSON `urlList`).
- **Nie działa z Google** — Google ma własny stos (sitemap + opcjonalnie Indexing API).

**Porównanie trzech ścieżek indeksowania:**

| | **Sitemap** | **Indexing API** | **IndexNow** |
|---|---|---|---|
| Główny beneficjent | Google, Bing, Yandex, … | **tylko Google** | Bing, Yandex, Seznam, Naver, Eaton |
| Mechanizm | URL-list do crawlera (pull) | Push URL → szybszy recrawl (push) | Push URL → szybszy recrawl (push) |
| Uwierzytelnianie | file w robots.txt / meta | OAuth 2.0 (service account) | API key + plik weryfikacyjny |
| Quota | bez limitu (best practice) | 200/dzień, 100/batch, 380 QPM | 10 000 URL/POST |
| Koszt wdrożenia | 0 (już jest `@astrojs/sitemap`) | średni (service account, OAuth, CF secret) | minimalny (już jest `astro-indexnow`) |
| Kiedy używać | wszystkie strony, baseline | krótkotrwałe strony (events, jobs) wymagające szybkiego recrawlu | Bing + altanatywy, szybki push po deployu |
| Czy strona musi mieć `JobPosting`/`BroadcastEvent`? | nie | **tak** (lub approval) | nie |
| Koszty | darmowe | darmowe | darmowe |

**Rekomendacja dla babaji.org.pl:**
1. **Sitemap** = podstawa, generowana automatycznie przez `@astrojs/sitemap`.
2. **IndexNow** = już działa po każdym buildzie (gdy `INDEXNOW_KEY` jest ustawione w CF Pages
   environment variables). Pokrywa Bing + Yandex — ważne dla polskich użytkowników szukających
   treści duchowych poza Google.
3. **Indexing API** = **opcjonalnie**, tylko dla `/events/[…slug]` (nowe i zaktualizowane
   eventy), z `URL_DELETED` po usunięciu. Daje szybszy recrawl eventów w Google. Wymaga
   dodania `GOOGLE_SA_JSON` (albo `GOOGLE_SA_EMAIL` + `GOOGLE_SA_PRIVATE_KEY`) do CF
   Pages secrets i napisania CF Function albo uruchomienia z GitHub Actions na `master` push.

### B.6 Wpięcie Indexing API w CI

Najprościej: dedykowany `indexing-push.yml` uruchamiany po `deploy.yml` (sukces) +
`workflow_dispatch`:

```yaml
name: Indexing API push (prod)
on:
  workflow_run:
    workflows: ["Deploy to Cloudflare Pages"]
    types: [completed]
  workflow_dispatch:

jobs:
  push:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build:cf
      - name: Push /events/* do Indexing API
        env:
          GOOGLE_SA_JSON: ${{ secrets.GOOGLE_SA_JSON }}  # cały JSON w sekrecie
        run: |
          node -e "require('fs').writeFileSync('/tmp/sa.json', process.env.GOOGLE_SA_JSON)"
          node scripts/indexing-push.mjs
```

`GOOGLE_SA_JSON` w GH Secrets przechowujesz jako multiline (paste całego JSON-a klucza
service account). Skrypt buduje sitemap, filtruje eventy, dzieli na batche po 100 i pcha.

> **Uwaga Cloudflare Workers/Pages Functions:** OAuth2 JWT signing wymaga `crypto.createSign`
> (RSA-SHA256), które jest dostępne w Workers runtime przez Web Crypto API — ale algorytm
> RSA-SHA256 z PKCS#8 jest w Workers niestandardowy. Łatwiej wywołać API z GH Actions (Node)
> albo z prostego CF Worker importującego `jose` (paczka z `nodejs_compat`).

---

## TL;DR — co dodać do projektu

1. **Już działa:**
   - PSI: `node .ashram-google-api-usage/scripts/psi-snapshot.mjs` (snapshot per URL, raporty JSON).
   - IndexNow: `astro-indexnow` w `astro.config.mjs` (Bing+Yandex po buildzie).
   - Sitemap: `@astrojs/sitemap` z i18n + custom priorytetami (events/teachings/about).

2. **Do dodania (opcjonalnie):**
   - `.github/workflows/psi-prod.yml` — PSI snapshot na produkcji po `deploy.yml` (8 zapytań/deploy).
   - Service account Google + `snippets/google-auth.mjs` + `snippets/indexing-batch.mjs` +
     `scripts/indexing-push.mjs` (push eventów).
   - `.github/workflows/indexing-push.yml` — fire-and-forget po deployu.
   - Sekrety: `ASHRAM_GOOGLE_API_KEY` (ma), `GOOGLE_SA_JSON` (do dodania), `INDEXNOW_KEY`
     (opcjonalny, do Bing Webmaster Tools).

3. **Nie wymaga dodatkowej pracy:**
   - Sitemap submission (Sitemap już linkowany w `robots.txt` lub wykrywany przez Google Search
     Console — `https://babaji.org.pl/sitemap-index.xml`).
