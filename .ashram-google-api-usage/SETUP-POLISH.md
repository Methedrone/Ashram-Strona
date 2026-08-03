# Konfiguracja Google Cloud + Service Account dla ashram-strona

**Cel:** Podpiąć `ASHRAM_GOOGLE_API_KEY` (który dziś aktywuje tylko PageSpeed) tak, aby cały stack GA4 + GSC + Indexing też działał.

**Czas:** ~2 godziny.
**Wymagania:** konto Google, dostęp do `babaji.org.pl` w panelu DNS, konto w Google Analytics 4 (nawet puste — utworzymy), konto w Google Search Console (też utworzymy).

---

## Część 1: Google Cloud Console (5–10 min)

### 1.1 Utwórz projekt

1. Otwórz https://console.cloud.google.com
2. Prawy górny róg → **Project picker** → **New Project**
3. **Project name:** `babaji-org-pl` (bez spacji, myślnik)
4. **Location:** brak (Organization zostaw None, chyba że masz Workspace)
5. Kliknij **Create**
6. Poczekaj ~30s, potwierdź że dropdown pokazuje `babaji-org-pl`

### 1.2 Aktywuj API

W lewym menu **APIs & Services → Library**, wyszukaj i **Enable** po kolei:

| API | Link aktywacji |
|---|---|
| PageSpeed Insights API | https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com |
| Google Search Console API | https://console.cloud.google.com/apis/library/searchconsole.googleapis.com |
| Google Analytics Data API | https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com |
| Google Analytics Admin API | https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com |
| Indexing API | https://console.cloud.google.com/apis/library/indexing.googleapis.com |

> 💡 PageSpeed masz już aktywne (bo klucz działa), ale reszta domyślnie wyłączona.

### 1.3 Klucz API (PageSpeed)

W **APIs & Services → Credentials → Create Credentials → API key**:

- Skopiuj wartość do `.env` jako `ASHRAM_GOOGLE_API_KEY` (zastąp obecny)
- **Restrict key** → **API restrictions** → zaznacz **PageSpeed Insights API** tylko
- **Application restrictions** → **HTTP referrers**:
  - `https://babaji.org.pl/*`
  - `https://www.babaji.org.pl/*`
  - `http://localhost:4321/*` (do testów)

### 1.4 Service Account (GA4 + GSC + Indexing)

W **APIs & Services → Credentials → Create Credentials → Service account**:

1. **Service account name:** `ashram-bot`
2. **Service account ID:** `ashram-bot` (auto)
3. **Description:** `Service account dla skryptów SEO babaji.org.pl`
4. **Step 2 (Grant access):** pomiń — nadamy uprawnienia w GA4/GSC
5. **Step 3 (Users):** pomiń
6. **Done**

### 1.5 Pobierz klucz JSON

1. Kliknij w listę na `ashram-bot@babaji-org-pl.iam.gserviceaccount.com`
2. Zakładka **Keys** → **Add Key** → **Create new key** → **JSON**
3. Plik `ashram-bot-XXXX.json` pobierze się
4. **Przenieś do projektu**:
   ```bash
   mkdir -p .ashram-google-api-usage/credentials
   mv ~/Downloads/ashram-bot-*.json .ashram-google-api-usage/credentials/ashram-bot.json
   chmod 600 .ashram-google-api-usage/credentials/ashram-bot.json
   ```
5. Dodaj do `.gitignore`:
   ```
   .ashram-google-api-usage/credentials/*.json
   ```
6. Dodaj do `.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/home/m/Work/Ashram-Strona/.ashram-google-api-usage/credentials/ashram-bot.json
   ```

### 1.6 Skopiuj Service Account email

Zostanie nam: `ashram-bot@babaji-org-pl.iam.gserviceaccount.com` — **potrzebny w krokach 2 i 3**.

---

## Część 2: Google Analytics 4 (15 min)

### 2.1 Utwórz property (jeśli nie masz)

1. https://analytics.google.com → **Admin** (lewy dolny róg ⚙️)
2. Kolumna **Account** → **Create Account**
3. **Account name:** `Babaji Ashram`
4. Kolumna **Property** → **Property name:** `babaji.org.pl`
5. **Reporting time zone:** `(GMT+01:00) Warsaw`
6. **Currency:** `Polish złoty (PLN)`
7. **Industry:** `Arts & Entertainment` albo `Spiritual & Religious`
8. **Business size:** `Small`
9. **Create** → zaakceptuj ToS
10. **Data stream** → **Web**:
    - URL: `https://babaji.org.pl`
    - Stream name: `Babaji Production`
11. **Enhanced measurement**: włącz wszystko (page views, scrolls, outbound clicks, site search, video engagement, file downloads)
12. **Copy Measurement ID** (np. `G-XXXXXXXX`) → `.env`:
    ```
    GA4_MEASUREMENT_ID=G-XXXXXXXX
    GA4_PROPERTY_ID=123456789  # wewnętrzne ID — widać w Admin → Property settings
    ```

### 2.2 Dodaj service account do property

1. W GA4 **Admin** → kolumna **Property** → **Property access management**
2. **+** → **Add users**
3. Wpisz: `ashram-bot@babaji-org-pl.iam.gserviceaccount.com`
4. **Role:** `Viewer` (read-only wystarczy do raportów, bezpieczniej niż Analyst/Editor)
5. **Notify user:** odznacz
6. **Add**

### 2.3 Włącz BigQuery export (opcja, do AEO/ML)

W **Admin → Property → Product links → BigQuery links → Link**:

- Wymaga projektu GCP z włączoną BigQuery API
- Free tier: 10 GB storage + 1 TB queries/mies. — wystarczy dla raportów
- Dane będą dostępne w `bigquery-public-data` albo Twoim datasetcie

> Bez BigQuery: GA4 Data API wystarczy do wszystkich raportów opisanych w `docs/01-ga4-data-api.md`.

---

## Część 3: Google Search Console (20 min)

### 3.1 Dodaj domenę

1. https://search.google.com/search-console
2. **Add property** → **Domain** (NIE URL prefix!)
3. Wpisz: `babaji.org.pl`
4. **Continue** → wybierz **DNS TXT record** (nie HTML file, nie GA4, nie DNS CNAME)
5. Google pokaże rekord TXT, np.:
   ```
   google-site-verification=abc123def456...
   ```

### 3.2 Dodaj rekord TXT w DNS

Gdzie hostujesz domenę? Oto szybkie komendy dla popularnych providerów:

| Provider | UI / komenda |
|---|---|
| **Cloudflare** | DNS → Records → Add record → Type: TXT, Name: `@`, Content: `google-site-verification=...` |
| **Ovh** | Strefa DNS → Dodaj rekord TXT → subdomena `@` |
| **home.pl** | Panel → Domeny → `babaji.org.pl` → Zarządzaj rekordami DNS → TXT |
| **nazwa.pl** | Ustawienia DNS → Dodaj rekord TXT → `@` |

Poczekaj na propagację (5 min – 24h, typowo 10-30 min dla Cloudflare).

### 3.3 Zweryfikuj

W GSC kliknij **Verify** → powinno przejść.

### 3.4 Dodaj service account

1. W GSC **Settings** (⚙️ koło zębate, prawy górny róg dla property `babaji.org.pl`)
2. **Users and permissions** → **Add user**
3. Email: `ashram-bot@babaji-org-pl.iam.gserviceaccount.com`
4. **Permission:** `Owner` (albo `Full`)
5. **Add**

### 3.5 Submit sitemap

1. Lewy panel **Sitemaps**
2. Dodaj: `https://babaji.org.pl/sitemap-index.xml` (albo `/sitemap-0.xml`)
3. **Submit**

> Jeśli sitemap nie istnieje — `astro-sitemap` ją generuje automatycznie. Sprawdź: `curl https://babaji.org.pl/sitemap-index.xml`.

---

## Część 4: Web Search Indexing API (5 min, ale **prawdopodobnie NIE dla tej strony**)

⚠ **Przeczytaj najpierw `docs/05-indexing-api.md`**. Indexing API obsługuje oficjalnie tylko:

- `JobPosting` (oferty pracy)
- `BroadcastEvent` w schema.org `VideoObject` (livestreamy)

**Dla zwykłego contentu (havan, nauki, strona o nas) Google zignoruje requesty.** Zamiast tego:

- ✅ **IndexNow** (Bing+Yandex) — działa od razu, już masz w `astro.config.mjs`
- ✅ **Search Console sitemap submit** — działa
- ✅ **GA4 + linkowanie wewnętrzne** — działa

Jeśli mimo to chcesz Indexing API (np. na przyszłość dla streamów havan):

1. W GSC ta sama property `babaji.org.pl` (już dodany)
2. **Formularz o quota:** https://developers.google.com/search/apis/indexing-api/v3/quota-pricing → "Request quota" link → opisz use case (livestreamy havan, Event schema w JSON-LD)
3. W Google Cloud → **APIs & Services → Enabled APIs → Indexing API → Quotas** — sprawdź czy `publishes/day` wzrosło po akceptacji

---

## Część 5: Test (10 min)

```bash
# 1. PSI (działało)
node .ashram-google-api-usage/scripts/psi-snapshot.mjs --urls https://babaji.org.pl

# 2. Test GA4 (po setupie SA)
GOOGLE_AUTH_MODE=service-account \
node .ashram-google-api-usage/scripts/ga4-run-report.mjs \
  --property $GA4_PROPERTY_ID \
  --days 7 \
  --dimensions page \
  --metrics sessions,totalUsers

# 3. Test GSC (po setupie SA)
node .ashram-google-api-usage/scripts/gsc-searchanalytics.mjs \
  --site https://babaji.org.pl \
  --days 28 \
  --dimensions query \
  --row-limit 25

# 4. Test URL Inspection
node .ashram-google-api-usage/scripts/gsc-url-inspection.mjs \
  --site https://babaji.org.pl \
  --url https://babaji.org.pl/

# 5. Test IndexNow (zero setup)
echo "https://babaji.org.pl/teachings/medytacja" | \
  curl -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json" \
    -d @-  # ← w praktyce użyj skryptu indexnow-batch.mjs
```

Jeśli wszystkie 5 przechodzi → setup ukończony. Wrzucaj konfigurację do repo:

```bash
git add .env.example .ashram-google-api-usage/{scripts,docs,package.json}
git commit -m "feat(seo): add Google API stack (PSI, GA4, GSC, IndexNow)"
```

⚠ **Nigdy nie commituj**:
- `.env` (cały plik)
- `.ashram-google-api-usage/credentials/*.json`

---

## Troubleshooting

| Błąd | Co zrobić |
|---|---|
| `403 The caller does not have permission` (GA4) | SA nie dodany do Property access management w GA4 |
| `403 PERMISSION_DENIED` (GSC) | SA nie dodany jako Owner w GSC Users and permissions |
| `403 accessNotConfigured` | API nie włączone w Google Cloud → APIs & Services → Library |
| `404 Requested entity was not found` (GSC) | `siteUrl` musi być dokładnie jak w GSC (z `https://`, bez trailing slash) |
| `403 Indexing API cannot be used` | Strona nie ma JobPosting/BroadcastEvent schema — to normalne, użyj IndexNow |
| `Quota exceeded` (PSI) | Cache'uj snapshoty lokalnie (już robimy: `reports/psi_*.json`) |
| `invalid_grant` (SA) | Czas systemowy > 1 min różnicy — `sudo ntpdate -s time.nist.gov` |

---

## Checklista końcowa

- [ ] Google Cloud projekt `babaji-org-pl` utworzony
- [ ] 5 API włączonych
- [ ] `ASHRAM_GOOGLE_API_KEY` z restriction PageSpeed
- [ ] Service account `ashram-bot` z JSON w `credentials/`
- [ ] `.env` ma `GOOGLE_APPLICATION_CREDENTIALS` i `GA4_*`
- [ ] GA4 property utworzone, Measurement ID w `.env`
- [ ] SA dodany do GA4 Property access (Viewer)
- [ ] GSC property `babaji.org.pl` zweryfikowana (DNS TXT)
- [ ] SA dodany do GSC Users (Owner)
- [ ] Sitemap submitnięty
- [ ] `INDEXNOW_KEY` ustawiony w `.env` + `public/{key}.txt` hostowany
- [ ] Wszystkie 5 skryptów testowych przeszło
- [ ] Cron job co tydzień: PSI snapshot + GSC top-queries
