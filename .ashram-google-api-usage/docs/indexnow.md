# IndexNow — open protocol dla Bing + Yandex + inne

**Cel:** darmowy, open-source, szybki mechanizm powiadamiania wyszukiwarek o nowych/zaktualizowanych URL-ach. **Bez OAuth, bez API key od Google, bez quot.**

**Status:** ✅ **już zainstalowany** w `astro.config.mjs` (pakiet `astro-indexnow`), warunkowo aktywowany przez `INDEXNOW_KEY` w `.env`.

---

## 1. Czym jest

- Protokół open-source: https://www.indexnow.org
- Obsługiwane wyszukiwarki: **Bing**, **Yandex**, **Naver**, **Seznam.cz** + nowe
- ⚠ **Google NIE obsługuje IndexNow** (ale obsługuje sitemap submission, patrz GSC)
- Korzyść: 1 request → wszystkie wyszukiwarki jednocześnie
- Batch do 10 000 URL w jednym POST

---

## 2. Setup w ashram-strona (5 min)

### 2.1 Wygeneruj klucz

Klucz IndexNow:
- 8-128 znaków
- tylko `a-z`, `A-Z`, `0-9`, `-`
- przykład: `a1b2c3d4e5f67890abcdef1234567890`

```bash
# losowy klucz 32 znaki
openssl rand -hex 16
# → np. 8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c
```

### 2.2 Dodaj do `.env`

```bash
INDEXNOW_KEY=8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c
```

### 2.3 Hostuj plik weryfikacyjny

W `public/{key}.txt` (gdzie `{key}` to wartość `INDEXNOW_KEY`):

```bash
mkdir -p public
echo -n "8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c" > public/8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c.txt
```

Sprawdź: `curl https://babaji.org.pl/8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c.txt` → powinno zwrócić klucz.

### 2.4 Aktywuj integrację w Astro

W `astro.config.mjs` — już jest warunkowo:

```js
...(process.env.INDEXNOW_KEY ? [indexnow({ key: process.env.INDEXNOW_KEY })] : []),
```

Po deployu na Cloudflare Pages → przy każdym buildzie `astro-indexnow` wyśle wszystkie URL-e do IndexNow.

### 2.5 Verify

W Bing Webmaster Tools:
1. https://www.bing.com/webmasters
2. Dodaj domenę `babaji.org.pl` (weryfikacja przez IndexNow klucz lub DNS)
3. Ustawienia → IndexNow → potwierdź że klucz jest aktywny

---

## 3. Jak to działa

### 3.1 Single URL

```
GET https://<searchengine>/indexnow?url=<url-changed>&key=<your-key>
```

Przykład:
```bash
curl "https://api.indexnow.org/indexnow?url=https://babaji.org.pl/events/havan-30-06&key=${INDEXNOW_KEY}"
```

### 3.2 Batch (do 10 000 URL)

```bash
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{
    \"host\": \"babaji.org.pl\",
    \"key\": \"${INDEXNOW_KEY}\",
    \"keyLocation\": \"https://babaji.org.pl/${INDEXNOW_KEY}.txt\",
    \"urlList\": [
      \"https://babaji.org.pl/events/havan-30-06\",
      \"https://babaji.org.pl/teachings/medytacja\",
      \"https://babaji.org.pl/\"
    ]
  }"
```

### 3.3 Kody odpowiedzi

| HTTP | Response | Znaczenie |
|---|---|---|
| 200 | OK | URL submitted successfully |
| 202 | Accepted | URL received, key validation pending |
| 400 | Bad request | Invalid format |
| 403 | Forbidden | Key not valid (file not found lub content mismatch) |
| 422 | Unprocessable | URLs don't belong to host, lub key nie pasuje do schema |
| 429 | Too Many | Potencjalny spam |

---

## 4. Wbudowany `astro-indexnow` — jak działa

Pakiet automatycznie:
- Czyta sitemap wygenerowany przez `astro-sitemap` (jeśli zainstalowany)
- Po `astro build` wysyła batch do IndexNow
- Retry przy 429/5xx

W `astro.config.mjs` możesz dodać opcje:
```js
indexnow({
  key: process.env.INDEXNOW_KEY,
  host: 'babaji.org.pl',  // opcjonalne, default = site()
  // batch: 1000,  // URL per POST
  // log: true,
})
```

---

## 5. Skrypt standalone (opcjonalny)

```js
// scripts/indexnow-batch.mjs
import 'dotenv/config';
import { readFile } from 'node:fs/promises';

const KEY = process.env.INDEXNOW_KEY;
if (!KEY) { console.error('❌ Brak INDEXNOW_KEY'); process.exit(1); }

const HOST = 'babaji.org.pl';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// wczytaj URL z sitemap wygenerowanej przez astro build
const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log(`→ ${urls.length} URLs from sitemap`);

// batch po 1000 URL
const BATCH = 1000;
for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk }),
  });
  console.log(`✓ Batch ${i / BATCH + 1}: ${res.status} (${chunk.length} URLs)`);
}
```

---

## 6. Porównanie: Indexing API vs IndexNow vs Sitemap

| Cecha | Google Indexing API | IndexNow | GSC Sitemap submit |
|---|---|---|---|
| **Search engine** | Google | Bing, Yandex, + inne | Google (i Bing czyta) |
| **Auth** | OAuth 2.0 / SA | API key (open) | OAuth 2.0 / SA |
| **Koszt** | darmowy | darmowy | darmowy |
| **Quota** | 200/dzień (default) | bez limitu (rate-limit) | bez limitu |
| **Batch size** | 100/call | 10 000/call | 1 sitemap |
| **Latency** | minuty | minuty | dni (przy crawlu) |
| **Use case** | urgentne zmiany | bulk + multi-SE | baseline discovery |
| **Dla zwykłego contentu** | ❌ wymaga JobPosting/BroadcastEvent | ✅ | ✅ |

**Strategia dla babaji.org.pl:**
- ✅ Sitemap submit (już masz `astro-sitemap`)
- ✅ IndexNow (już masz `astro-indexnow`, trzeba tylko dodać klucz)
- ⏳ Google Indexing API — **NIE aktywuj** dopóki nie masz JobPosting/BroadcastEvent
