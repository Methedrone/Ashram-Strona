# Web Search Indexing API v3

**Cel:** powiadamianie Google o nowych/zaktualizowanych/usunientych URL-ach w czasie rzeczywistym (szybciej niż czekać na crawler).

**⚠ KRYTYCZNE OGRANICZENIE:** API obsługuje **TYLKO** strony z:
- `JobPosting` (oferty pracy)
- `BroadcastEvent` w schema.org `VideoObject` (livestreamy)

Dla zwykłego contentu (havan, nauki, artykuły) Google **zignoruje requesty** bez ręcznej akceptacji. Alternatywa: **IndexNow** (patrz `06-indexnow.md`).

---

## 1. Base URL i scopes

```
Base URL:    https://indexing.googleapis.com/v3/urlNotifications:publish
              https://indexing.googleapis.com/v3/urlNotifications/metadata
Auth:        Bearer <service-account-token>
Scope:       https://www.googleapis.com/auth/indexing
```

Wymaga:
- Google Cloud → Indexing API enabled
- Service account z dostępem do domeny w GSC
- **Dla production quota > 200/day** — wypełnij formularz "Request quota" (link w `SETUP-POLISH.md`)

---

## 2. Limity (potwierdzone w context7, 2025)

| Quota | Domyślnie | Po akceptacji |
|---|---|---|
| `DefaultPublishRequestsPerDayPerProject` | **200** | do 600+ (case-by-case) |
| `DefaultMetadataRequestsPerMinutePerProject` | 180 | — |
| `DefaultRequestsPerMinutePerProject` | 380 | — |
| Daily quota reset | midnight Pacific Time | — |
| Batch size | 100 requests / call | — |
| Czas propagacji | kilka minut – kilka godzin | j.w. |
| **Spam detection** | **aktywne** (potwierdzone 2025) | nadużycia = revoked access |

> ⚠ **WAŻNE z context7 (2025):** "Submissions to the Indexing API are subject to spam detection. The default quota is intended for initial setup and testing; usage beyond this requires approval for additional quota and resource provisioning. Exceeding quotas may result in revoked access." — submituj TYLKO URL-e, które faktycznie się zmieniły. NIE spamuj całą sitemap co godzinę.

---

## 3. Endpointy

| Metoda | URL | Co robi |
|---|---|---|
| `urlNotifications.publish` | `POST /v3/urlNotifications:publish` | powiadom o URL_UPDATED lub URL_DELETED |
| `urlNotifications.metadata.get` | `GET /v3/urlNotifications/metadata?url=...` | status ostatniego zgłoszenia dla URL |
| `urlNotifications.batch` | `POST /v3/urlNotifications:batchPublish` (niestandardowe, max 100) | batch publish (sam budujesz request body) |

---

## 4. URL_UPDATED — nowy/zaktualizowany URL

```bash
curl -sS -X POST \
  "https://indexing.googleapis.com/v3/urlNotifications:publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://babaji.org.pl/events/havan-30-06",
    "type": "URL_UPDATED"
  }'
```

**Response:**
```json
{
  "urlNotificationMetadata": {
    "url": "https://babaji.org.pl/events/havan-30-06",
    "latestUpdate": {
      "url": "https://babaji.org.pl/events/havan-30-06",
      "type": "URL_UPDATED",
      "notifyTime": "2026-08-03T05:50:00Z"
    }
  }
}
```

## 5. URL_DELETED

```bash
curl -sS -X POST \
  "https://indexing.googleapis.com/v3/urlNotifications:publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://babaji.org.pl/events/havan-stare",
    "type": "URL_DELETED"
  }'
```

## 6. Status sprawdzenia

```bash
curl -sS "https://indexing.googleapis.com/v3/urlNotifications/metadata?url=https://babaji.org.pl/events/havan-30-06" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.urlNotificationMetadata.latestUpdate'
```

## 7. Batch (ręczny)

```bash
for url in $URLS; do
  curl -sS -X POST "https://indexing.googleapis.com/v3/urlNotifications:publish" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$url\", \"type\": \"URL_UPDATED\"}" &
done
wait
```

⚠ **Nie przekraczaj 380 req/min.** Throttle 1 req/200ms.

---

## 8. Czy babaji.org.pl może korzystać?

### TAK, jeśli:
- Strona `/events/havan-30-06` embeduje `schema.org/Event` z:
  - `eventAttendanceMode: "OfflineEventAttendanceMode"` (fizyczna obecność)
  - `eventStatus: "EventScheduled"`
  - `startDate` w ISO 8601
- ALBO strona `/livestream/satsang` embeduje `schema.org/BroadcastEvent` wewnątrz `schema.org/VideoObject`

### Sprawdź

W kodzie `src/pages/events/[...slug].astro` czy jest `<script type="application/ld+json">` z Event schema. Jeśli tak — submit OK, ale wciąż Google zaznaczy *"not JobPosting — but allowed via BroadcastEvent if streaming"*.

### Przykład schema JSON-LD (Astro):

```astro
---
// src/components/EventSchema.astro
const { event } = Astro.props;
const json = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.title,
  startDate: event.date,
  endDate: event.endDate,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: event.location,
    address: event.address,
  },
  description: event.description,
};
---
<script type="application/ld+json" set:html={JSON.stringify(json)} />
```

---

## 9. Realna strategia dla babaji.org.pl

| Content type | Indexing API? | IndexNow? | Sitemap? |
|---|---|---|---|
| Statyczne strony (homepage, about) | ❌ nie | ✅ tak | ✅ |
| Artykuły (nauki) | ❌ nie | ✅ tak | ✅ |
| Eventy (havan) | ⚠ może (Event schema + Google review) | ✅ tak | ✅ |
| Livestreamy (satsang) | ✅ tak (BroadcastEvent) | ✅ tak | ✅ |
| Usunięte strony | ✅ URL_DELETED | ✅ | ✅ |

**Rekomendacja:** indexuj przez **IndexNow** + **sitemap submit po buildzie** + Indexing API **tylko dla livestreamów** (kiedy wprowadzisz).

---

## 10. Skrypt Node.js (szablon)

```js
// scripts/indexing-batch.mjs
import { GoogleAuth } from 'google-auth-library';
import { readFile, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/indexing'] });

async function publish(url, type = 'URL_UPDATED') {
  const client = await auth.getClient();
  const res = await client.request({
    url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
    method: 'POST',
    data: { url, type },
  });
  return res.data;
}

// 1. Wczytaj URL z sitemap lub z pliku
const urlsFile = argv[2] ?? 'urls.txt';
const urls = (await readFile(urlsFile, 'utf8')).trim().split('\n').filter(Boolean);

// 2. Throttle: 1 request / 200ms
let i = 0;
const results = [];
for (const url of urls) {
  try {
    const r = await publish(url);
    results.push({ url, ok: true, latestUpdate: r.urlNotificationMetadata.latestUpdate });
  } catch (e) {
    results.push({ url, ok: false, error: e.message });
  }
  i++;
  if (i % 200 === 0) await new Promise((r) => setTimeout(r, 60_000)); // quota co 200
  else await new Promise((r) => setTimeout(r, 200));
}

await writeFile(`reports/indexing_batch_${Date.now()}.json`, JSON.stringify(results, null, 2));
console.log(`✅ Submitted ${results.filter((r) => r.ok).length}/${urls.length} URLs`);
```

`urls.txt`:
```
https://babaji.org.pl/events/havan-30-06
https://babaji.org.pl/teachings/medytacja
https://babaji.org.pl/
```

---

## 11. Alternatywa: IndexNow

Bez autoryzacji, działa od razu, do 10 000 URL / POST, Bing + Yandex + uczestniczące wyszukiwarki. Patrz `06-indexnow.md`.
