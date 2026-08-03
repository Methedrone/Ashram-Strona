# Google Analytics Data API v1 (GA4)

**Cel:** odpytywanie danych GA4 (page views, konwersje, kraje, urządzenia, źródła) z poziomu Node.js / CI.

**Autoryzacja:** service account (OAuth 2.0). Klucz API z `ASHRAM_GOOGLE_API_KEY` **NIE zadziała**.

---

## 1. Włączenie

- Google Cloud → APIs & Services → Library → **Google Analytics Data API** → Enable
- Service Account dodany do GA4 Property access management jako **Viewer** (lub Analyst)

---

## 2. Endpoint i scopes

```
Base URL:    https://analyticsdata.googleapis.com/v1beta
Auth:        Bearer <service-account-token>
Scope:       https://www.googleapis.com/auth/analytics.readonly
```

Najważniejsze metody (pełna lista w references):

| Metoda | URL | Zastosowanie |
|---|---|---|
| `runReport` | `POST /v1beta/properties/{propertyId}:runReport` | jeden raport |
| `batchRunReports` | `POST /v1beta/properties/{propertyId}:batchRunReports` | do 5 raportów w jednym |
| `runPivotReport` | `POST /v1beta/properties/{propertyId}:runPivotReport` | pivot table |
| `getMetadata` | `GET /v1beta/properties/{propertyId}/metadata` | lista wymiarów/metryk dla property |
| `runRealtimeReport` | `POST /v1beta/properties/{propertyId}:runRealtimeReport` | ostatnie 30 min |

---

## 3. Przykład: top 20 stron w ostatnich 7 dniach

```bash
PROPERTY_ID=123456789
TOKEN=$(node .ashram-google-api-usage/scripts/lib/get-token.mjs analytics.readonly)

curl -sS -X POST \
  "https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dateRanges": [{ "startDate": "7daysAgo", "endDate": "today" }],
    "dimensions": [{ "name": "pagePath" }],
    "metrics": [
      { "name": "sessions" },
      { "name": "totalUsers" },
      { "name": "screenPageViews" },
      { "name": "averageSessionDuration" }
    ],
    "orderBys": [{ "metric": { "metricName": "sessions" }, "desc": true }],
    "limit": 20
  }'
```

**Response** (wyciąg):

```json
{
  "rows": [
    {
      "dimensionValues": [{ "value": "/events/havan-30-06" }],
      "metricValues": [
        { "value": "312" },
        { "value": "248" },
        { "value": "489" },
        { "value": "142.5" }
      ]
    }
  ],
  "rowCount": 20,
  "metadata": { "currencyCode": "PLN", "timeZone": "Europe/Warsaw" }
}
```

---

## 4. Przykład: kraje + urządzenia (segmentacja)

```json
{
  "dateRanges": [{ "startDate": "30daysAgo", "endDate": "today" }],
  "dimensions": [
    { "name": "country" },
    { "name": "deviceCategory" }
  ],
  "metrics": [
    { "name": "sessions" },
    { "name": "engagedSessions" },
    { "name": "conversions" }
  ],
  "orderBys": [
    { "dimension": { "dimensionName": "sessions" }, "desc": true }
  ],
  "limit": 50
}
```

---

## 5. Przykład: konwersje havan (custom events)

Aby raportować konwersje zapisów na havan, w `gtag.js` na stronie `/events/havan-30-06` odpalamy:

```js
gtag('event', 'sign_up_havan', {
  event_category: 'event_registration',
  event_label: 'Havan 30.06.2026 Kłodzko',
  value: 1
});
```

Wtedy w API:

```json
{
  "dateRanges": [{ "startDate": "30daysAgo", "endDate": "today" }],
  "dimensions": [
    { "name": "eventName" },
    { "name": "pagePath" }
  ],
  "metrics": [
    { "name": "eventCount" },
    { "name": "conversions" }
  ],
  "dimensionFilter": {
    "filter": {
      "fieldName": "eventName",
      "stringFilter": { "value": "sign_up_havan" }
    }
  }
}
```

---

## 6. Limity i quoty (z dokumentacji)

| Zasób | Limit |
|---|---|
| Token / service account | 1h, potem auto-refresh |
| Requesty / dzień / project | 25 000 (Data API) |
| Requesty / minutę / project | 1 200 (Data API) |
| Concurrent requests | 10 |
| Maks. wymiarów na raport | 9 |
| Maks. metryk na raport | 10 |
| Data freshness | 24-48h dla danych non-realtime |

---

## 7. Przykładowe raporty przydatne dla babaji.org.pl

### 7.1 SEO landing pages (z GSC + GA4 cross-ref)

Wymaga custom integration: GSC API → page URL → GA4 API lookup.

### 7.2 Ścieżka: wejście → nauka → zapis na havan

```json
{
  "dateRanges": [{ "startDate": "30daysAgo", "endDate": "today" }],
  "dimensions": [
    { "name": "sessionDefaultChannelGroup" },
    { "name": "pagePath" }
  ],
  "metrics": [
    { "name": "sessions" },
    { "name": "eventsPerSession" }
  ],
  "dimensionFilter": {
    "andGroup": {
      "expressions": [
        {
          "filter": {
            "fieldName": "eventName",
            "stringFilter": { "value": "sign_up_havan", "matchType": "EXACT" }
          }
        }
      ]
    }
  }
}
```

### 7.3 Real-time (aktywni użytkownicy)

```bash
curl -X POST \
  "https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runRealtimeReport" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "dimensions": [{ "name": "unifiedScreenName" }],
    "metrics": [{ "name": "activeUsers" }]
  }'
```

---

## 8. Skrypt Node.js — oficjalny klient `@google-analytics/data` (ZALECANY)

> ✅ **Aktualizacja z context7 (2025):** Google udostępnia oficjalny klient Node.js — prostszy niż ręczne wywołania REST. Użyj go zamiast własnego wrappera.

```bash
npm install @google-analytics/data
```

```js
// scripts/ga4-run-report.mjs
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID; // np. 123456789
const client = new BetaAnalyticsDataClient();

const [response] = await client.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
  limit: 25,
});

console.log(`${response.rowCount} rows`);
response.dimensionHeaders.forEach((d) => console.log(`  dim: ${d.name}`));
response.metricHeaders.forEach((m) => console.log(`  met: ${m.name} (${m.type})`));
response.rows.forEach((r) => {
  console.log(`${r.dimensionValues[0].value.padEnd(40)}  sessions=${r.metricValues[0].value}  users=${r.metricValues[1].value}`);
});
```

> 💡 Klient automatycznie wykrywa `GOOGLE_APPLICATION_CREDENTIALS` z env (ścieżka do JSON key). Bez ręcznego tworzenia `GoogleAuth`.

## 8b. Alternatywa REST (gdy nie chcesz instalować paczki)

```js
// scripts/ga4-run-report.mjs (REST fallback)
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/analytics.readonly'] });

async function runReport(propertyId, body) {
  const client = await auth.getClient();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await client.request({ url, method: 'POST', data: body });
  return res.data;
}

const propertyId = process.env.GA4_PROPERTY_ID;
const data = await runReport(propertyId, {
  dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
  limit: 25,
});
console.table(data.rows.map((r) => ({
  page: r.dimensionValues[0].value,
  sessions: r.metricValues[0].value,
  users: r.metricValues[1].value,
})));
```

---

## 9. Cache'owanie

Nie odpytuj API częściej niż 1×/h. Trzymaj w `reports/ga4_<report>_<date>.json` z TTL.
