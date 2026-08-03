# Google Search Console API (Webmaster Tools)

**Cel:** monitoring pozycji, stanu indeksacji, sitemaps i błędów crawl dla `babaji.org.pl`.

**Autoryzacja:** service account z scope `https://www.googleapis.com/auth/webmasters` (pełny) lub `webmasters.readonly`.

**Weryfikacja domeny:** DNS TXT record (szczegóły w `SETUP-POLISH.md`).

---

## 1. Base URL i scopes

```
Base URL:    https://www.googleapis.com/webmasters/v3
              https://searchconsole.googleapis.com/v1  (nowsza wersja dla urlInspection)
Auth:        Bearer <service-account-token>
Scopes:
  - https://www.googleapis.com/auth/webmasters          (read+write)
  - https://www.googleapis.com/auth/webmasters.readonly (read only)
```

> ⚠ **Ważne:** `siteUrl` musi być dokładnie taki jak w GSC — sprawdź czy masz `https://babaji.org.pl/` (z trailing slash) czy `https://babaji.org.pl` (bez). URL prefix property i Domain property używają różnych formatów.

---

## 2. Najważniejsze metody

| Metoda | URL | Co robi |
|---|---|---|
| `sites.list` | `GET /webmasters/v3/sites` | list wszystkich zweryfikowanych properties |
| `sites.get` | `GET /webmasters/v3/sites/{siteUrl}` | info o property |
| `sites.add` | `PUT /webmasters/v3/sites/{siteUrl}` | dodaj property (już zweryfikowaną) |
| `sites.delete` | `DELETE /webmasters/v3/sites/{siteUrl}` | usuń z listy |
| `sitemaps.list` | `GET /webmasters/v3/sites/{siteUrl}/sitemaps` | list sitemaps |
| `sitemaps.get` | `GET /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` | stan sitemap |
| `sitemaps.submit` | `PUT /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` | submit sitemap |
| `sitemaps.delete` | `DELETE /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` | usuń sitemap |
| **`searchanalytics.query`** | `POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query` | **najważniejsze — keywords + clicks** |
| `urlInspection.index.inspect` | `POST /v1/urlInspection/index:inspect` | sprawdź pojedynczy URL |

---

## 3. `searchanalytics.query` — najczęściej używane

### 3.1 Top 25 zapytań w 28 dni

```bash
curl -sS -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fbabaji.org.pl%2F/searchAnalytics/query" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-07-06",
    "endDate": "2026-08-03",
    "dimensions": ["query"],
    "rowLimit": 25
  }' | jq '.rows[] | {q: .keys[0], clicks: .clicks, impressions: .impressions, ctr: .ctr, pos: .position}'
```

**Response** (wyciąg):
```json
[
  { "q": "babaji", "clicks": 142, "impressions": 1820, "ctr": 0.078, "pos": 4.2 },
  { "q": "medytacja kłodzko", "clicks": 89, "impressions": 340, "ctr": 0.262, "pos": 1.8 }
]
```

### 3.2 Top pages z filtrowaniem po urządzeniu

```json
{
  "startDate": "2026-07-06",
  "endDate": "2026-08-03",
  "dimensions": ["page", "device"],
  "dimensionFilterGroups": [{
    "groupType": "and",
    "filters": [{
      "dimension": "device",
      "operator": "equals",
      "expression": "MOBILE"
    }]
  }],
  "rowLimit": 50
}
```

### 3.3 Queries, gdzie pozycja > 10 (optymalizacja)

```json
{
  "startDate": "2026-07-06",
  "endDate": "2026-08-03",
  "dimensions": ["query", "page"],
  "dimensionFilterGroups": [{
    "groupType": "and",
    "filters": [
      { "dimension": "query", "operator": "contains", "expression": "medytacja" },
      { "dimension": "page", "operator": "contains", "expression": "/events" }
    ]
  }],
  "aggregationType": "byPage",
  "rowLimit": 100
}
```

### 3.4 Local SEO: zapytania z PL (geo-target)

```json
{
  "startDate": "2026-07-06",
  "endDate": "2026-08-03",
  "dimensions": ["country", "query"],
  "dimensionFilterGroups": [{
    "filters": [
      { "dimension": "country", "operator": "equals", "expression": "POL" }
    ]
  }],
  "rowLimit": 50
}
```

### 3.5 Web Vitals per page (custom integration z PSI)

GSC nie zwraca CWV bezpośrednio przez API. Trzeba: PSI API → mapowanie URL → GSC API.

---

## 4. Sitemaps

### 4.1 Submit sitemap

```bash
curl -sS -X PUT \
  "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fbabaji.org.pl%2F/sitemaps/https%3A%2F%2Fbabaji.org.pl%2Fsitemap-index.xml" \
  -H "Authorization: Bearer ${TOKEN}"
```

### 4.2 Status sitemap

```bash
curl -sS "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fbabaji.org.pl%2F/sitemaps" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.sitemap[] | {path, lastSubmitted, isPending, errors, warnings}'
```

---

## 5. URL Inspection API (`v1`)

```bash
curl -sS -X POST \
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "inspectionUrl": "https://babaji.org.pl/events/havan-30-06",
    "siteUrl": "https://babaji.org.pl/"
  }' | jq '.inspectionResult | {indexed: .indexStatusResult.coverageState, crawl: .indexStatusResult.crawledAs, mobileUsable: .mobileUsabilityResult.verdict}'
```

**Response** (wyciąg):
```json
{
  "indexStatusResult": {
    "coverageState": "Submitted and indexed",
    "crawledAs": "MOBILE",
    "robotsTxtState": "ALLOWED"
  },
  "mobileUsabilityResult": { "verdict": "PASS" }
}
```

Coverage states:
- `Submitted and indexed` ✅
- `Crawled - currently not indexed` ⚠
- `Discovered - currently not indexed` ⚠
- `Excluded by noindex tag` ❌
- `Blocked by robots.txt` ❌
- `Not found (404)` ❌

---

## 6. Limity

| Zasób | Limit |
|---|---|
| Requesty / min / project | 1 200 |
| Requesty / min / user | 200 |
| `searchanalytics.query` — rows returned | 25 000 / query |
| URL Inspection | 600 / min / project |
| Data lag | 2-3 dni (searchanalytics), real-time (urlInspection) |

---

## 7. Skrypt Node.js

```js
// scripts/gsc-searchanalytics.mjs
import { GoogleAuth } from 'google-auth-library';
import { writeFile } from 'node:fs/promises';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });

async function searchAnalytics(siteUrl, body) {
  const client = await auth.getClient();
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const res = await client.request({ url, method: 'POST', data: body });
  return res.data;
}

const site = 'https://babaji.org.pl/';
const data = await searchAnalytics(site, {
  startDate: '28daysAgo',
  endDate: 'today',
  dimensions: ['query', 'page'],
  rowLimit: 100,
});

const rows = (data.rows ?? []).map((r) => ({
  query: r.keys[0],
  page: r.keys[1],
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: +(r.ctr * 100).toFixed(2) + '%',
  pos: r.position.toFixed(1),
}));
console.table(rows);
await writeFile(`reports/gsc_searchanalytics_${Date.now()}.json`, JSON.stringify(data, null, 2));
```

---

## 8. Use cases dla babaji.org.pl

1. **Co tydzień:** top 50 queries — co nowego w SERP
2. **Co miesiąc:** queries z pozycją 8-15 (łatwy awans do top 10) → dodaj do content brief
3. **Po każdym deployu:** urlInspection na 5 kluczowych URL (homepage, /events, /teachings, 2 havan)
4. **Po każdym deployu:** sitemap submit (automatyczny via GitHub Action)
5. **Co kwartał:** kraje odwiedzających — weryfikacja target PL vs diaspora
6. **GEO target:** queries z `?gl=pl` lub z IP PL → optymalizacja title/h1 pod rynek
