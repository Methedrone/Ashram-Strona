# `.ashram-google-api-usage/` — Google API integration dla babaji.org.pl

**Właściciel:** ashram (projekt Astro 5 + Cloudflare Pages, domena `https://babaji.org.pl`)
**Zasoby:** `ASHRAM_GOOGLE_API_KEY` + `ashram-bot` service account (OAuth 2.0)
**Cel:** pełna automatyzacja PSI / GA4 / GSC / GTM / Indexing / IndexNow.

---

## 0. TL;DR — co działa DZIŚ, a co nie

| API | Auth | Status (2026-08-03) | Realne dane |
|---|---|---|---|
| **PageSpeed Insights v5** | API key | ✅ działa | perf mobile=0.71, desktop=0.93, **CLS 0.107 na `/teachings`** |
| **GA4 Admin API** | SA `ashram-bot` | ✅ działa | 1 stream, 2 conversions (purchase, qualify_lead) |
| **GA4 Data API** | SA `ashram-bot` | ✅ działa | 28 rows top pages 7d (`/` 26 sesji, `/gallery/` 10) |
| **GSC searchanalytics** | SA + DNS TXT | ✅ działa (sc-domain:babaji.org.pl) | 28d top queries, position 11.9 "babaji ashram" |
| **GSC URL Inspection** | SA | ✅ działa | Homepage "przesłana i zindeksowana" |
| **GTM API v2** | SA + GTM scope | ✅ opublikowane na LIVE | 5 tagów, 4 CE triggers, 6 DLV variables |
| **IndexNow** | API key (klucz publiczny) | ✅ konfigurowane | 67 URL-i auto-submit przy buildzie; **czeka na Bing Webmaster verification** |
| **Web Search Indexing** | SA | ⚠ tylko JobPosting/BroadcastEvent | NIE dla zwykłego contentu — nie aktywuj |

---

## 1. Architektura (co masz w `public/q5m2etqbj47d6wkvq18sksbkkbjq3nzj.txt`)

```
                       .ashram-google-api-usage/
                       ├── README.md                       ← ten plik
                       ├── SETUP-POLISH.md                 ← krok-po-kroku OAuth/SA setup
                       ├── .env.example                    ← wzorzec env
                       ├── .gitignore
                       ├── package.json
                       ├── docs/                           ← 10 plików markdown
                       │   ├── pagespeed-api.md
                       │   ├── ga4-data-api.md
                       │   ├── ga4-admin-api.md
                       │   ├── gsc-api.md
                       │   ├── tag-manager-api.md           ← GTM API v2 reference
                       │   ├── indexing-api.md
                       │   ├── indexnow.md
                       │   ├── seo-geo-roadmap.md           ← plan SEO + GEO + AEO
                       │   └── google-apis.md               ← omnibus (research notes)
                       ├── scripts/                        ← 14+ skryptów .mjs
                       │   ├── psi-snapshot.mjs            ✅ działa
                       │   ├── psi-cf-deploy-hook.mjs
                       │   ├── gsc-searchanalytics.mjs      ✅ (auto-detect sc-domain:)
                       │   ├── gsc-url-inspection.mjs       ✅
                       │   ├── ga4-run-report.mjs           ✅ (auto-rewrite page→pagePath)
                       │   ├── ga4-admin.mjs                ✅
                       │   ├── gtm-list.mjs                 ✅ (diagnostyka GTM)
                       │   ├── gtm-create-tag.mjs           ✅ (5 presetów)
                       │   ├── gtm-create-trigger.mjs       ✅ (9 presetów)
                       │   ├── gtm-create-variable.mjs      ✅
                       │   ├── gtm-publish.mjs              ✅
                       │   ├── gtm-grant-access.mjs         ✅
                       │   ├── gtm-onboard.mjs              ✅ (one-shot setup — ZROBIONE)
                       │   ├── indexing-batch.mjs
                       │   ├── indexnow-batch.mjs           ✅ (po Bing WMT verify)
                       │   ├── indexnow-diag.mjs            ✅ (6-point diagnostic)
                       │   └── lib/google-auth.mjs          ✅ SCALONY auth helper
                       ├── credentials/                    ← NIGDY nie commituj (w .gitignore)
                       ├── reports/                         ← snapshoty PSI + GSC + GA4
                       └── src-integration/                 ← trackery w kodzie strony
                           ├── src/utils/analytics.ts
                           └── src/components/DataLayerTrack.astro
```

---

## 2. Quick wins w 15 minut (zero setupu)

### 2.1 PageSpeed snapshot — już działa

```bash
node .ashram-google-api-usage/scripts/psi-snapshot.mjs
```

### 2.2 IndexNow setup (po Bing Webmaster verify)

```bash
# 1. Bing Webmaster: https://www.bing.com/webmasters → Add site → babaji.org.pl → verify
# 2. Po verify — submit URL-e (już działa auto na każdym buildzie dzięki INDEXNOW_KEY w .env)
node .ashram-google-api-usage/scripts/indexnow-batch.mjs  # ręczny batch
node .ashram-google-api-usage/scripts/indexnow-diag.mjs   # 6-point diagnostic
```

---

## 3. Setup OAuth 2.0 (szczegóły w `SETUP-POLISH.md`)

Już zrobiony dla `ashram-bot` w projekcie `ashrammakolno-1772040639983`:
- ✅ GA4 (Viewer w property 524482229)
- ✅ GSC (Owner `sc-domain:babaji.org.pl`)
- ✅ GTM (`containerAccess: publish` w container 243497515)

---

## 4. SEO + GEO + AEO + Local SEO

| Cel | API | Akcja |
|---|---|---|
| **Szybkość strony** | PSI | `psi-snapshot.mjs` co tydzień |
| **Indeksacja nowej strony** | IndexNow + GSC sitemap | `astro-indexnow` auto na buildzie |
| **Audyt słów kluczowych** | GSC | `gsc-searchanalytics.mjs` co tydzień |
| **Audyt wizyt + konwersji** | GA4 | `ga4-run-report.mjs` co tydzień |
| **Audyt real-user CWV** | PSI `loadingExperience` | w raportach PSI |
| **AEO / GEO (LLM citation)** | ręcznie | `llms.txt` + `llms-full.txt` w `public/` |
| **Lokalne SEO (Kłodzko)** | GSC `dimensionFilter country=POL` | `gsc-searchanalytics.mjs --country POL` |
| **Knowledge Graph** | ręcznie | Schema.org `Organization` + `FAQPage` w Layout |
| **Eventy konwersji** | GTM (auto) | 5 tagów live: sign_up_havan, click_donate, contact_form_submit, newsletter_signup + page_view |

Pełen plan: `docs/seo-geo-roadmap.md`.

---

## 5. Decyzja: co TERAZ, co PÓŹNIEJ

### 🟢 TERAZ (zero setupu)
- [x] PSI snapshot (auto)
- [x] GA4 + GSC skrypty (po SA setup)
- [x] GTM onboard (5 tagów live)
- [x] DataLayerTrack w Layout
- [x] IndexNow env (czeka na Bing WMT verify)

### 🟡 TEN TYDZIEŃ (10 min)
- [ ] Bing Webmaster Tools: https://www.bing.com/webmasters → Add site `babaji.org.pl` → verify
- [ ] Napraw CLS na `/teachings` (0.107 > 0.1) — `<img width height>` w `TeachingCard.astro`
- [ ] Popraw meta description dla `babaji` query (CTR 2.1%)

### 🔴 PÓŹNIEJ
- [ ] Audit `image-sitemap.xml` (138 errors w GSC)
- [ ] `llms.txt` + `llms-full.txt` dla GEO/AEO
- [ ] GTM wersje dla A/B test (np. CTA button text)
- [ ] Looker Studio dashboard (GA4 + GSC + PSI)
- [ ] Wniosek o zwiększenie GTM API quota (10k/dzień default może nie wystarczyć)

---

## 6. Quick start (po sklonowaniu)

```bash
# 1. Zainstaluj deps
cd .ashram-google-api-usage
npm install

# 2. Sprawdź czy wszystko działa
node scripts/lib/google-auth.mjs --diag    # SA + API key
node scripts/psi-snapshot.mjs --urls https://babaji.org.pl/
node scripts/gsc-searchanalytics.mjs --days 7 --dimension query --row-limit 10
node scripts/ga4-run-report.mjs --days 7 --dimensions page --metrics sessions,totalUsers
node scripts/gtm-list.mjs --tags
node scripts/indexnow-diag.mjs              # 6-point check

# 3. Co tydzień: weekly SEO audit
node scripts/psi-snapshot.mjs
node scripts/gsc-searchanalytics.mjs --days 7 --dimension query --row-limit 50
node scripts/ga4-run-report.mjs --days 7 --dimensions page --metrics sessions,totalUsers,conversions

# 4. Gdy dodajesz nowy event w kodzie
#    1. Dodaj data-event="..." w .astro
#    2. node scripts/gtm-create-tag.mjs --preset <name>
#    3. node scripts/gtm-publish.mjs
```

---

## 7. Kluczowe ustalenia (z sesji 2026-08-03)

1. **Property GA4 524482229** ("StronaAshramMakolno") — to **inna** strona niż babaji.org.pl. Sprawdź czy to Twoja (URL w admin) czy czyjaś.
2. **GTM container ID** = `GTM-5J4NL66W` (public) / `243497515` (internal numeric) — to dwie różne rzeczy!
3. **GSC property type** = "Domain" (`sc-domain:babaji.org.pl`), nie URL prefix. Skrypty auto-detectują.
4. **Workspace auto-reset** co 35 dni (Google czyści opublikowane wersje w Default Workspace).
5. **GTM API rate limit** = **0.25 QPS** (1 request / 4s) — trzeba throttlować przy onboarding.
6. **Image-sitemap** ma 138 błędów w GSC (0/138 indexed) — sprawdzimy później.
7. **Babaji.org.pl** ma już GTM-5J4NL66W snippet wdrożony (Layout.astro) — od dziś dataLayer aktywny.
8. **IndexNow 403** — czeka na Bing Webmaster verification (5 min w UI).

---

## 8. Status deliverables

| Kategoria | Plik | Status |
|---|---|---|
| **PSI** | scripts/psi-snapshot.mjs | ✅ działający |
| **GA4** | scripts/ga4-{run-report,admin}.mjs | ✅ działający |
| **GSC** | scripts/gsc-{searchanalytics,url-inspection}.mjs | ✅ działający |
| **GTM** | scripts/gtm-{list,create-tag,create-trigger,create-variable,publish,grant-access,onboard}.mjs | ✅ wszystkie działają |
| **Indexing** | scripts/indexing-batch.mjs | ✅ (wymaga JobPosting schema dla pełnego działania) |
| **IndexNow** | scripts/indexnow-{batch,diag}.mjs | ✅ (czeka na Bing WMT verify) |
| **Auth** | scripts/lib/google-auth.mjs | ✅ SCALONY helper (API key + SA) |
| **Dokumentacja** | docs/*.md (10 plików) | ✅ |
| **Skill** | ~/.hermes/skills/devops/ashram-google-api/SKILL.md | ✅ zainstalowany |
| **Trackery w kodzie** | src/utils/analytics.ts + DataLayerTrack.astro | ✅ wdrożone |
