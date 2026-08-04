# Plan: Refaktor Ashram-Strona → Astro 7.1.6 + wzbogacenie o nowości v7

> **Data:** 2026-08-04 · **Autor:** Hermes (Methedrone) · **Repo:** `/home/m/Work/Ashram-Strona` · **Domena:** babaji.org.pl
>
> **Dla implementacji:** wykonywać fazami, commit po każdym tasku, weryfikacja po każdym kroku (nigdy exit code 0 bez sprawdzenia wyniku). Po akceptacji planu praca na nowej gałęzi `feat/astro7-upgrade` z gałęzi `dev`.

**Goal:** Przeprowadzić Ashram-Strona z Astro 5.17.1 na Astro 7.1.6 (Content Layer API, Vite 8/Rolldown, Rust compiler, Sätteri, queued rendering) oraz wzbogacić projekt o stabilne nowości Astro 7 i sprawdzone integracje z ekosystemu — bez utraty ruchu SEO, bez regresji wizualnych, z pełną weryfikacją E2E i a11y.

**Architecture:** Migracja w 5 fazach: (A) przygotowanie + baseline, (B) migracja obowiązkowa (breakage 5→7), (C) weryfikacja lokalna + deploy, (D) wzbogacenie (nowości v7 + integracje — każde zadanie opcjonalne, osobny commit, osobny rollback), (E) testy końcowe + release. Zasada: **najpierw działa jak przedtem, potem wzbogacamy** — żadnych nowych funkcji przed zielonym buildem na v7.

**Tech Stack:** Astro 7.1.6 · @astrojs/cloudflare 14.1.7 · @astrojs/sitemap 3.7.3 · @astrojs/rss 4.0.19 · astro-indexnow 2.3.10 · astro-seo 1.1.0 · astro-lightgallery 2.6.0 · Node ≥ 22.12 (CI: 24) · npm · Playwright · axe-core · Lighthouse · sharp

---

## CZĘŚĆ 0 — Stan wyjściowy (zweryfikowany 2026-08-04, gałąź `dev`)

| Fakt | Wartość |
|---|---|
| Gałąź / status | `dev` (na bieżąco z origin), drzewo czyste |
| Astro (zainstalowane) | `^5.17.1` (npm dist-tags: **latest = 7.1.6**) |
| Adapter | `@astrojs/cloudflare ^12.6.12` (npm: **latest = 14.1.7**, peer `astro ^7.0.0`, `wrangler ^4.83.0`) |
| Integracje oficjalne | `@astrojs/sitemap ^3.7.0` (→ 3.7.3), `@astrojs/rss ^4.0.15` (→ 4.0.19) |
| Integracje community | `astro-seo 1.1.0` (brak peerDep — do przetestowania), `astro-lightgallery ^2.3.0` (→ 2.6.0, brak peerDep — do przetestowania), `astro-indexnow ^2.1.0` (→ 2.3.10, peer `astro ^4–^7` ✓) |
| Node lokalny | v26.5.1 ✓ (wymóg Astro 6/7: ≥22.12.0) |
| Node w CI | **20** w `ci.yml`, `deploy.yml`, `audit.yml` — **NIEZGODNY, do zmiany** |
| Output / trailingSlash | static (default) / `'never'` |
| i18n | `defaultLocale:'pl'`, `locales:['pl','en']`, `prefixDefaultLocale:false`, ręczny middleware `/pl/*`→root 301 (bez `redirectToDefaultLocale`) |
| Content | **LEGACY**: `src/content/config.ts`, `type:'content'`, brak loaderów; 2 kolekcje (events 28 plików, teachings 16 plików) w `{pl,en}/` |
| Legacy API w kodzie | `entry.slug`/`entry.render()` w 4× `[...slug].astro`, `Related{Events,Teachings}.astro`, `{Event,Teaching}Card.astro`, listy `events/teachings` (pl+en), `rss.xml.ts`, `image-scanner.ts` |
| Obrazy | **brak** `astro:assets`/`<Image>` — surowe `<img>` + ręcznie generowane warianty w `public/images/optimized/` (skrypt `scripts/image-gen.mjs` + sharp) |
| ViewTransitions / Astro.glob / fetch.ts | **brak** (nic do migracji) |
| Pages Functions | `functions/api/{auth,callback}.ts` + `functions/_routes.json` (`include: ["/api/*"]`); `scripts/copy-functions.mjs` kopiuje + patchuje `dist/_routes.json`; wpisany w `npm run build` |
| CMS | Sveltia CMS w `public/admin/` (config.yml edytuje pliki md — **niezależny od config Astro**, działa bez zmian) |
| Testy | `tests/site-verification.spec.ts` (39 stron, obrazy, lang-switch, schema.org), webServer `astro dev --port 39755` |
| Martwy kod | `src/components/schemas/{EventSchema,ArticleSchema}.astro` (0 importów — zweryfikowano grep-em), `public/gtag-init.js` (0 użyć), `scripts/test-add-script.mjs` (0 użyć) |

## CZĘŚĆ 1 — Wersje docelowe (zweryfikowane npm registry + docs 2026-08-04)

| Pakiet | Wersja | Peer / uwaga |
|---|---|---|
| `astro` | `^7.1.6` | Vite 8 (Rolldown), Rust compiler, Sätteri, queued rendering default |
| `@astrojs/cloudflare` | `^14.1.7` | peer `astro ^7.0.0`, `wrangler ^4.83.0` (npm zainstaluje wrangler automatycznie jako peer) |
| `@astrojs/sitemap` | `^3.7.3` | |
| `@astrojs/rss` | `^4.0.19` | |
| `astro-indexnow` | `^2.3.10` | peer `astro ^4.0.0 \|\| ^5 \|\| ^6 \|\| ^7` ✓ |
| `astro-seo` | `1.1.0` (bez zmian) | brak peerDep — weryfikacja przy buildzie |
| `astro-lightgallery` | `^2.6.0` | brak peerDep — weryfikacja przy buildzie |
| `wrangler` | peer `^4.83.0` (auto-instalacja; w CI `npx wrangler`) | opcjonalnie przypiąć jako devDep |

## CZĘŚĆ 2 — Zmiany 5→6→7 istotne DLA TEGO projektu (źródło: upgrade guides v6/v7, zweryfikowane)

| Zmiana | Wersja | Wpływ na Ashram | Akcja |
|---|---|---|---|
| Node 18/20 usunięte | v6 | CI node 20 → fail | `node-version: 24` we wszystkich workflow + `.nvmrc` + `engines` |
| Legacy content collections usunięte (bez backcompat; `legacy.collectionsBackwardsCompat` tylko tymczasowo) | v6 | **Projekt nie zbuduje się** | `src/content.config.ts` + `glob()` loadery (Task B2) |
| `entry.render()` → `render(entry)`, `entry.slug` → `entry.id` | v6 | 15+ miejsc | Taski B4–B7 |
| `astro:schema`/`z` z `astro:content` deprecated → `astro/zod` | v6 | config.ts | Task B2 (nowy plik) |
| Zod 4: `.default()` musi pasować do typu output, `z.string().email()` → `z.email()` | v6 | Schemas ashram: same proste typy, brak transform+default — **bez zmian**; `z.date()` działa (YAML parsuje daty do Date; fallback `z.coerce.date()` przy błędzie) | weryfikacja przy buildzie |
| `i18n.redirectToDefaultLocale` default `true`→`false`, tylko z `prefixDefaultLocale:true` | v6 | Config ashram: `prefixDefaultLocale:false` + ręczny middleware — **zgodne**, nic nie zmieniać (nie dodawać `redirectToDefaultLocale`!) | Task B8 (check) |
| Endpointy z rozszerzeniem (`.xml.ts`) odrzucają trailing slash | v6 | `trailingSlash:'never'` już ustawione — **bez zmian** | check |
| `import.meta.env` zawsze inlined, bez koercji | v6 | brak użyć `import.meta.env` w kodzie stron — bez zmian | check |
| `getStaticPaths()` params tylko string | v6 | slugi to stringi — bez zmian | check |
| `Astro.site` deprecated w `getStaticPaths` | v6 | brak użycia — bez zmian | check |
| `<ViewTransitions />` usunięty → `<ClientRouter />` | v6 | brak użycia — bez zmian | — |
| `Astro.glob()` usunięty | v6 | brak użycia — bez zmian | — |
| Rust compiler (tylko on): unclosed tags = **błąd**, invalid nesting nie naprawiane | v7 | Możliwe błędy builda | Task B9 (naprawa tagów) |
| `compressHTML` default `true` → `'jsx'` (znikające spacje między inline elementami) | v7 | Ryzyko `helloworld`-efektu | Task B10 → **decyzja: `compressHTML: true`** (zero ryzyka wizualnego) |
| Sätteri domyślnym procesorem Markdown (GFM, smartypants, heading IDs, directives, math built-in) | v7 | Treści md nie używają pluginów remark/rehype — **bez zmian** | check |
| `src/fetch.ts` zarezerwowany (advanced routing) | v7 | Projekt nie ma `src/fetch.ts` — bez zmian | check |
| Experimental flags v7 (logger, queuedRendering, rustCompiler, advancedRouting, cache) | v7 | Projekt ich nie używa — bez zmian | — |
| `@astrojs/db` usunięty, `astro:transitions` internals usunięte, `getContainerRenderer()` z dedykowanych ścieżek | v7 | nie dotyczy | — |
| Vite 8 / Rolldown | v7 | pluginy: tylko astro-lightgallery (runtime) — test | build |
| Adapter CF v13/v14: „breaking changes to your existing Cloudflare setup are expected" | v6/v7 | Layout `dist/` może się zmienić | Task B13 (re-weryfikacja Functions) |

---

## FAZA A — Przygotowanie i baseline (≈20 min)

### Task A1: Utwórz gałąź roboczą

```bash
cd /home/m/Work/Ashram-Strona
git checkout dev && git pull origin dev
git checkout -b feat/astro7-upgrade
```

**Oczekiwane:** nowa gałąź z `dev`, czysty status.

### Task A2: Baseline — build i testy na Astro 5 (punkt odniesienia)

```bash
npm run build && npm test
```

**Oczekiwane:** exit 0; Playwright: wszystkie testy zielone (39 stron). **Zapisz pełny output do `docs/plans/baseline-astro5.log`** — to wzorzec porównawczy (liczba stron w dist, rozmiary, liczba testów). Jeśli coś już teraz jest czerwone — STOP, napraw przed migracją.

**Weryfikacja baseline:**
```bash
ls dist/ | head; find dist -name "*.html" | wc -l; du -sh dist
node -e "const a=require('./package.json');console.log('astro:', a.dependencies.astro)"
```

### Task A3: Commit baseline

```bash
git add docs/plans/baseline-astro5.log && git commit -m "docs(plans): baseline build/test log (Astro 5.17.1)"
```

---

## FAZA B — Migracja obowiązkowa (breakage 5→7, ≈2–3 h)

### Task B1: Bump zależności (tylko te 5 pakietów)

Edycja `package.json` — wiersz po wierszu (dokładna treść po zmianie):

```json
"dependencies": {
  "@astrojs/cloudflare": "^14.1.7",
  "@astrojs/rss": "^4.0.19",
  "@astrojs/sitemap": "^3.7.3",
  "astro": "^7.1.6",
  "astro-indexnow": "^2.3.10",
  "astro-lightgallery": "^2.6.0",
  "astro-seo": "^1.1.0",
  "dotenv": "^17.3.1"
}
```

Następnie:
```bash
npm install
```

**Uwaga:** npm v7+ auto-instaluje peerDependency `wrangler ^4.83.0` (duży pakiet, ~50 MB) — to oczekiwane. Jeśli npm zgłosi konflikt peerów: NIE używaj `--force` od razu — pokaż błąd i rozwiąż celowo (jedyny możliwy konflikt to brak peerDep w astro-seo/lightgallery, który nie generuje konfliktów).

**Weryfikacja:**
```bash
node -e "const a=require('./package.json');console.log(a.dependencies.astro, a.dependencies['@astrojs/cloudflare'])"
# oczekiwane: ^7.1.6 ^14.1.7
npm ls astro @astrojs/cloudflare --depth=0
```

**Commit:** `chore(deps): bump astro to ^7.1.6 and official integrations (v7 upgrade)`

**Rollback:** `git revert <commit>` + `npm install` — lockfile wraca z gałęzi.

### Task B2: Content Layer — utwórz `src/content.config.ts` (KRYTYCZNY)

Utwórz plik **`src/content.config.ts`** (nowa wymagana lokalizacja) o dokładnie tej treści (schemas skopiowane 1:1 z obecnego `src/content/config.ts`, `type:'content'` usunięte, dodane loadery `glob`, `z` z `astro/zod`):

```ts
// src/content.config.ts  (was src/content/config.ts)
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const teachingsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teachings' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Babaji'),
    lang: z.enum(['pl', 'en']),
    featuredImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    relatedTeachings: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    duration: z.string().optional(),
    updatedAt: z.date().optional(),
  }),
});

const eventsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    endDate: z.date().optional(),
    time: z.string().optional(),
    location: z.string().default('Ashram Babaji, Mąkolno 129'),
    lang: z.enum(['pl', 'en']),
    featuredImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    registrationUrl: z.string().optional(),
    isOnline: z.boolean().default(false),
    featured: z.boolean().default(false),
    updatedAt: z.date().optional(),
  }),
});

export const collections = {
  teachings: teachingsCollection,
  events: eventsCollection,
};
```

Następnie **usuń stary plik**:
```bash
git rm src/content/config.ts
```

**Dlaczego id = slug:** dla `src/content/teachings/pl/prawda-prostocie-milosc.md` nowy `entry.id` = `pl/prawda-prostocie-milosc` — identycznie jak stary `entry.slug`. Cała logika `split('/')` działa bez zmian po podmianie nazwy właściwości.

**Weryfikacja:**
```bash
grep -c "type: 'content'" src/content.config.ts   # oczekiwane: exit 1 (0 dopasowań)
test ! -f src/content/config.ts && echo "legacy config usunięty"
```

**Commit:** `refactor(content): migrate collections to Content Layer API (glob loaders)`

### Task B3: Call sites — 4 strony `[...slug].astro` (pl + en)

Dla KAŻDEGO z 4 plików (identyczne wzorce; różnią się tylko nazwą kolekcji i URL-em):
- `src/pages/teachings/[...slug].astro`
- `src/pages/events/[...slug].astro`
- `src/pages/en/teachings/[...slug].astro`
- `src/pages/en/events/[...slug].astro`

Dokładne zmiany (wzorzec dla pl/teachings; w en/events: wiersze 16, 26, 48, 155, 156):

```diff
-import { getCollection } from 'astro:content';
+import { getCollection, render } from 'astro:content';
...
-    const [lang, ...slugParts] = entry.slug.split('/');
+    const [lang, ...slugParts] = entry.id.split('/');
...
-const { Content } = await entry.render();
+const { Content } = await render(entry);
...
-const articleUrl = `${siteUrl}/teachings/${entry.slug.split('/').slice(1).join('/')}`;
+const articleUrl = `${siteUrl}/teachings/${entry.id.split('/').slice(1).join('/')}`;
... (events: `eventUrl` analogicznie)
...
-      <RelatedTeachings currentSlug={entry.slug} lang="pl" tags={data.tags} />
+      <RelatedTeachings currentSlug={entry.id} lang="pl" tags={data.tags} />
-      <RelatedEvents currentSlug={entry.slug} lang="pl" tags={data.tags} />
+      <RelatedEvents currentSlug={entry.id} lang="pl" tags={data.tags} />
```

**Weryfikacja (po wszystkich 4 plikach):**
```bash
grep -rn "entry\.slug\|entry\.render()" src/pages/   # oczekiwane: 0 dopasowań
grep -rn "render(entry)" src/pages/ | wc -l          # oczekiwane: 4
```

### Task B4: Call sites — komponenty `Related*` i `Card*`

- `src/components/RelatedTeachings.astro` (w. 15, 26):
  - `entry.slug !== currentSlug` → `entry.id !== currentSlug`
  - `teaching.slug.split('/')` → `teaching.id.split('/')`
- `src/components/RelatedEvents.astro` (w. 15, 26): identycznie
- `src/components/EventCard.astro` (w. 17, 56):
  - `post.slug.split('/')` → `post.id.split('/')`
  - `havan_id: post.slug` → `havan_id: post.id`  (ważne: to trafia do `data-event-data` dla GTM — wartość ta sama: `pl/holi`)
- `src/components/TeachingCard.astro` (w. 17): `post.slug.split('/')` → `post.id.split('/')`

**Weryfikacja:**
```bash
grep -rn "\.slug" src/components/   # oczekiwane: 0
```

### Task B5: Call sites — listy stron (pl + en)

- `src/pages/events.astro` (w. 24), `src/pages/en/events.astro` (w. 24)
- `src/pages/teachings.astro` (w. 21), `src/pages/en/teachings.astro` (w. 21)

Wszędzie: `event.slug.split('/').slice(1).join('/')` → `event.id.split('/').slice(1).join('/')` (analogicznie `teaching.`).

### Task B6: Call sites — RSS i image-scanner

- `src/pages/rss.xml.ts` (w. 38, 45): `event.slug`/`teaching.slug` → `event.id`/`teaching.id` (zachowaj `.split('/').slice(1).join('/')`)
- `src/utils/image-scanner.ts` (w. 227, 229, 245, 247): `event.slug` → `event.id`, `teaching.slug` → `teaching.id`

**Uwaga do image-scanner:** `pageUrl: /events/${event.id}` daje `pl/slug` (identycznie jak legacy) — `normalizePageUrl()` w `image-sitemap.xml.ts` już to obsługuje (`/events/pl/xxx` → `/events/xxx`, `/events/en/xxx` → `/en/events/xxx`). **Bez zmian w normalizePageUrl.**

**Weryfikacja całego legacy API (MUST być 0):**
```bash
grep -rn "\.slug\b\|\.render()" src/ --include="*.astro" --include="*.ts"
grep -rn "type: 'content'\|getEntryBySlug\|getDataEntryById\|astro:schema" src/
```

### Task B7: i18n — weryfikacja (bez zmian)

`astro.config.mjs` ma `i18n: { defaultLocale:'pl', locales:['pl','en'], routing:{ prefixDefaultLocale:false } }` — brak `redirectToDefaultLocale`, więc v6 default `false` jest zgodny z ręcznym middleware `/pl/*`→301. **NIE dodawać** `redirectToDefaultLocale:true` (pętla przekierowań z ręcznym middleware). Dodatkowo dla czytelności dopisz komentarz:

```js
  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: {
      prefixDefaultLocale: false,
      // v6+: redirectToDefaultLocale domyślnie false; ręczny middleware w src/middleware.ts
      // obsługuje /pl/* → 301 do root. NIE włączać redirectToDefaultLocale (konflikt = pętla).
    },
  },
```

**Weryfikacja:** `grep -n "redirectToDefaultLocale" astro.config.mjs` → 0 dopasowań.

### Task B8: CI/Node — krytyczne (bez tego deploy i CI się wywalą)

1. W **`ci.yml`**, **`deploy.yml`**, **`audit.yml`**: `node-version: 20` → `node-version: 24`.
2. Sprawdź pozostałe workflow (mają setup-node?):
   ```bash
   grep -n "node-version" .github/workflows/*.yml   # wszystkie muszą być >= 22
   ```
   (`diagnose-deployments.yml`, `force-delete-deployment.yml` — jeśli używają Node 20, też zmień).
3. Utwórz **`.nvmrc`**: `24`
4. `package.json` — dodaj blok:
   ```json
   "engines": { "node": ">=22.12.0" }
   ```

**Weryfikacja:** `grep -rn "node-version: 20" .github/` → 0.

### Task B9: Build → naprawa błędów Rust compiler

```bash
npm run build
```

**Możliwe błędy i naprawy (z upgrade guide v7):**
- `unclosed tag` / `unexpected token` → dodaj zamykający tag (void elements `<br>`, `<img>`, `<input>`, `<hr>` nie potrzebują).
- Invalid nesting (`<div>` w `<p>`) → przebuduj na poprawny kontener. Rust compiler NIE auto-poprawia.
- Błędy `Invalid date` w content → zamień `z.date()` na `z.coerce.date()` w `src/content.config.ts` (fallback, mało prawdopodobny — YAML parsuje ISO do Date).
- CSS: kosmetyczne różnice serializacji (kolory hex, cudzysłowy url()) — nie wymagają akcji.

**Weryfikacja:** build exit 0; `find dist -name "*.html" | wc -l` ≥ wartość z baseline.

### Task B10: `compressHTML: true` (decyzja prewencyjna)

Astro 7 default `'jsx'` tnie spacje między inline elementami (efekt `hello world` → `helloworld`). Projekt ma dużo ręcznego markupu; zamiast polowania na każdy `{" "}` ustawiamy jawnie poprzednie zachowanie (HTML-aware):

```js
// astro.config.mjs — dodaj na poziomie root (obok site:)
compressHTML: true,
```

**Weryfikacja wizualna:** `npm run preview`, sprawdź nagłówek „Dzień • 06:00" itp. w DailySchedule, breadcrumb `Strona główna › Nauki`, przyciski share — spacje obecne. (Jeśli mimo `true` coś się sklei — dodaj `{" "}` w tym miejscu; to nie powinno wystąpić.)

### Task B11: Pages Functions — re-weryfikacja po adapterze v14

```bash
npm run build
ls dist/functions/api/          # musi istnieć (skopiowane przez scripts/copy-functions.mjs)
cat dist/_routes.json           # "include" musi zawierać "/api/*"
```

Adapter v14 mógł zmienić layout `dist/`. Jeśli `_routes.json` nie powstaje lub funkcje nie trafiają do `dist/functions/` → dostosuj `scripts/copy-functions.mjs` (patrz skill `cf-pages-astro-functions`). **Kryterium:** `npm run build` musi być w 100% deterministyczny (CI + CF Dashboard retry).

**Weryfikacja lokalna endpointów (dev):**
```bash
npx astro dev --port 4321 &   # lub osobny terminal
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/api/auth
# static site: /api/* odpowie przez dev server tylko jeśli funkcje są obsłużone — oczekiwane 200 lub 404 ZGODNIE z implementacją funkcji
```

### Task B12: Testy Playwright

```bash
npm test
```

**Oczekiwane:** wszystkie testy zielone (39 stron + responsive + schema + lang-switch). Uwaga: `reuseExistingServer: true` — upewnij się, że nie chodzi stary dev server na 39755 (jeśli działa, zabij: `npx astro dev stop` lub kill portu).

### Task B13: Commit fazy B

```bash
git add -A && git commit -m "refactor(astro7): content layer migration, call sites, CI node 24, compressHTML"
```

**Checkpoint:** pełny build + testy zielone. **Nie przechodź do Fazy D, dopóki Faza B nie jest w 100% zielona.**

---

## FAZA C — Weryfikacja lokalna i deploy (≈1 h)

### Task C1: Ręczna weryfikacja URL (preview)

```bash
npm run preview -- --port 4321
```

Sprawdź w przeglądarce (albo curl status 200):
`/`, `/en`, `/events`, `/en/events`, `/teachings`, `/en/teachings`, `/events/siwaratri`, `/en/events/shivaratri`, `/teachings/havan-ogien`, `/en/teachings/sacred-fire-ceremony`, `/gallery`, `/rss.xml`, `/image-sitemap.xml`, `/sitemap-index.xml`, `/404`, `/pl/events` (oczekiwane 301 → `/events`).

Dodatkowo: walidacja RSS i sitemap (`xmllint --noout` jeśli dostępny, albo otwórz w przeglądarce).

### Task C2: Audyty lokalne

```bash
npm run audit:quick        # obrazy + JSON-LD + axe (wymaga działającego serwera na 4321)
```

### Task C3: PR i deploy na master

```bash
git push -u origin feat/astro7-upgrade
gh pr create --base master --head feat/astro7-upgrade --title "feat(astro7): upgrade Astro 5.17 → 7.1.6 (Content Layer, Vite 8, Rust compiler)" --body "..."
```

Po zielonym CI + audit na PR → merge → `deploy.yml` (Node 24, `npm run build:cf`, wrangler pages deploy).

### Task C4: Weryfikacja produkcyjna (po deploy)

```bash
for p in / /en/ /events/ /teachings/ /events/siwaratri /en/events/shivaratri /rss.xml /image-sitemap.xml /sitemap-index.xml; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://babaji.org.pl$p"
done
curl -s -o /dev/null -w "/pl/events %{http_code} -> %{redirect_url}\n" "https://babaji.org.pl/pl/events"
curl -s -o /dev/null -w "/api/auth %{http_code}\n" "https://babaji.org.pl/api/auth"
```

Sprawdź też `https://babaji.org.pl/robots.txt` (sitemap-y) i GSC (IndexNow wyśle pingi przy buildzie z INDEXNOW_KEY).

**Rollback (gdyby cokolwiek padło):** revert PR (revert commit na master → auto-deploy poprzedniej wersji) albo CF Pages → Deployment → rollback do poprzedniego deploymentu z dashboardu.

---

## FAZA D — Wzbogacenie o nowości Astro 7 + ekosystem integracji

> Każde zadanie OPCJONALNE, osobny commit, osobny PR (albo jeden PR „enhance(astro7)" z osobnymi commitami do cherry-pick). Kolejność = malejący stosunek wartości do ryzyka. Wszystkie weryfikacje = `npm run build && npm test` po każdym zadaniu.

### Task D1: ClientRouter + prefetch (nowość stabilna v6/v7; wartość: UX nawigacji)

1. `src/layouts/Layout.astro` — w `<head>` dodaj:
   ```astro
   import { ClientRouter } from 'astro:transitions';
   ...
   <ClientRouter />
   ```
2. `astro.config.mjs` — dodaj:
   ```js
   prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
   ```
3. `src/components/Header.astro` — atrybut `data-astro-prefetch` na linkach nawigacji:
   ```astro
   <a href={item.href} data-astro-prefetch class={...}>
   ```
4. **Pitfall GTM (ważne!):** przy nawigacji client-side `DataLayerTrack.astro` (is:inline) wykona się ponownie → **podwójne `page_view`** w GTM. Poprawka w `src/components/DataLayerTrack.astro` — push `page_view` dopiero na zdarzenie nawigacji, z fallbackiem dla pierwszego loadu:
   ```js
   function pushPageView() {
     window.dataLayer.push({ event: 'page_view', page_path: window.location.pathname, page_title: document.title, page_lang: document.documentElement.lang || 'pl', page_referrer: document.referrer || '' });
   }
   // pierwszy load (skrypt wykonuje się na końcu body):
   pushPageView();
   // kolejne nawigacje client-side (ClientRouter): inline skrypty nowej strony
   // wykonują się przy swap — ale dataLayer jest wspólny, więc page_view z
   // poprzedniej strony już poszedł; dodatkowo nasłuch na event routera:
   document.addEventListener('astro:page-load', () => pushPageView());
   ```
   **Uwaga:** jeśli `astro:page-load` odpali się też przy pierwszym loadzie, dostaniesz dubel na starcie — sprawdź w GTM Preview albo console.log, i w razie potrzeby guard `if (!window.__astroInitialPageView) { ... }`.

5. **Weryfikacja:** `npm run build && npm test`; ręcznie: przejście ze strony na stronę bez pełnego reloadu (sprawdź w DevTools Network — dokument pobierany przez fetch), scroll wraca do góry, `back` działa. Sprawdź w GTM debug, że `page_view` nie ma duplikatów.

### Task D2: `astro:env` — type-safe env zamiast `process.env` (stabilne; wartość: typy + brak wycieków)

1. `astro.config.mjs`:
   ```js
   import { defineConfig, envField } from 'astro/config';
   ...
   env: {
     schema: {
       GTM_CONTAINER_ID: envField.string({ context: 'server', access: 'public', optional: true }),
     },
   },
   ```
   Usuń `import 'dotenv/config';` z góry configa (INDEXNOW_KEY pochodzi z env CI — `process.env` w configu działa bez dotenv; lokalnie integracja indexnow po prostu się nie załaduje, jak dotąd).
2. `src/layouts/Layout.astro`:
   ```astro
   import { GTM_CONTAINER_ID } from 'astro:env/server';
   ...
   const gtmId = GTM_CONTAINER_ID || 'GTM-5J4NL66W';
   ```
3. **Nie usuwać pakietu `dotenv`** — używają go skrypty `.ashram-google-api-usage/scripts/*` (zweryfikowano: 9 importów).
4. Uruchom `npx astro sync` (generuje typy) — `astro:env/server` bez typów nie skompiluje się w TS.
5. **Weryfikacja:** `npm run build && npm test`; `grep -rn "process\.env" src/` → 0 (poza ew. komentarzami).

### Task D3: `astro check` + usunięcie `any` (wartość: typowanie, CI quality gate)

1. DevDeps: `@astrojs/check ^0.9.10` (peer `typescript ^5 || ^6` — dodać też `typescript` do devDeps, w projekcie go nie ma), potem `npm install`.
2. `package.json` scripts: `"check": "astro check"`.
3. Napraw typy — najpierw 4 strony `[...slug].astro`:
   ```astro
   import type { CollectionEntry } from 'astro:content';
   const { entry } = Astro.props as { entry: CollectionEntry<'teachings'> };
   const data = entry.data;   // zamiast `as Record<string, any>`
   ```
   (`events` analogicznie; `relatedTeachings`/`faqs` typowane z schema — usuń rzutowania `as { question: string; answer: string }[]` tam, gdzie schema już je typuje).
4. `ci.yml` — krok po buildzie:
   ```yaml
   - name: Type check
     run: npm run check
   ```
5. **Weryfikacja:** `npm run check` → 0 błędów; `grep -rn ": any" src/` → 0.

### Task D4: Centralizacja `siteUrl` → `import.meta.env.SITE` (wartość: DRY, jedna zmienna)

`import.meta.env.SITE` zwraca wartość `site` z configa (`https://babaji.org.pl`) — dostępne w stronach/endpointach.

Pliki z hardcoded `'https://babaji.org.pl'` (grep do weryfikacji):
```bash
grep -rln "https://babaji.org.pl" src/
```
Zamień w: `Layout.astro` (w. 31), `events/[...slug].astro` (w. 30, 51), `teachings/[...slug].astro` (w. 30, 47), `en/*[...slug].astro`, `events.astro` (w. 10), `en/events.astro`, `teachings.astro`, `en/teachings.astro`, `rss.xml.ts` (w. 5), `image-sitemap.xml.ts` (w. 3).

```ts
const siteUrl = import.meta.env.SITE;
```

**Uwaga:** `image-scanner.ts` działa też poza buildem (Node script)? Nie — jest importowany tylko z `image-sitemap.xml.ts`; `import.meta.env.SITE` w nim zadziała, ale bezpieczniej zostawić tam const (to util bez kontekstu Astro — sprawdź przy buildzie; jeśli błąd, zostaw hardcode z komentarzem).

### Task D5: `@astrojs/partytown` dla GTM (wartość: LCP/CWV — GTM przestaje blokować render; ryzyko: średnie)

1. `npm install @astrojs/partytown@^2.1.7`
2. `astro.config.mjs`:
   ```js
   import partytown from '@astrojs/partytown';
   integrations: [ sitemap(...), ..., partytown({ config: { forward: ['dataLayer.push'] } }) ],
   ```
3. `src/layouts/Layout.astro` — **usuń** inline GTM snippet z `<head>` (w. 160–166) i noscript z `<body>` (w. 246–249). Partytown sam wstrzyknie `gtm.js` przez `partytown` + skrypt `window.dataLayer` forwardowany.
   **ZOSTAJE:** `DataLayerTrack.astro` (main-thread DOM events; `dataLayer.push` z main thread działa z forwardem partytown).
4. **Weryfikacja (produkcyjna, nie tylko build):** po deploy sprawdź w DevTools → Network że `gtm.js` ładuje się z `worker`/partytown, a w GTM Preview że `page_view` i `click` eventy dochodzą. Sprawdź `dataLayer` w konsoli: `dataLayer` musi być `[]`-podobny proxied przez partytown.
5. **Rollback:** `git revert` commita D5 (snippet GTM wraca). Dlatego D5 robi się OSTATNI w PR wzbogacającym albo w osobnym PR.

### Task D6: `astro-robots-txt` (wartość: konfiguracja zamiast martwego pliku; ryzyko: niskie)

1. `npm install astro-robots-txt@^1.0.0`
2. `astro.config.mjs`:
   ```js
   import robotsTxt from 'astro-robots-txt';
   integrations: [ ..., robotsTxt({
     sitemap: [
       'https://babaji.org.pl/sitemap-index.xml',
       'https://babaji.org.pl/image-sitemap.xml',
       'https://babaji.org.pl/rss.xml',
     ],
     policy: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/*.json$', '/404'] }],
   }) ],
   ```
3. `git rm public/robots.txt` (integra generuje do dist; plik w public/ by go shadowował).
4. **Weryfikacja:** po buildzie `cat dist/robots.txt` — musi być 1:1 z obecnym `public/robots.txt` (porównaj z baseline).

### Task D7: `astro-icon` — centralizacja inline SVG (wartość: DRY, spójność; ryzyko: niskie, dużo edycji)

Projekt ma ~15 inline SVG (Header hamburger, EventCard pin/strzałka, TeachingCard strzałka, strony szczegółów strzałka/pin).

1. `npm install astro-icon@^1.1.5 @iconify-json/lucide`
2. Komponent `src/components/Icon.astro`:
   ```astro
   ---
   import { Icon } from 'astro-icon/components';
   interface Props { name: string; size?: number; class?: string; }
   const { name, size = 20, class: className } = Astro.props;
   ---
   <Icon name={name} size={size} class={className} aria-hidden="true" />
   ```
3. Zamień inline `<svg>...</svg>` na `<Icon name="lucide:map-pin" />` itd.
4. **Weryfikacja:** build + testy; wizualnie strony z ikonami (Header mobile, EventCard, breadcrumb).

### Task D8: `@astrojs/mdx` (wartość: komponenty w treściach; ryzyko: niskie, ale rozszerza możliwości CMS)

1. `npm install @astrojs/mdx@^7.0.5` (peer: `astro ^7`, `@astrojs/markdown-satteri ^0.3.1` — zainstaluje się).
2. `astro.config.mjs`: `integrations: [ mdx() ]`.
3. Rozszerz kolekcje o md? **NIE od razu** — najpierw tylko integracja (nic się nie zmienia dla istniejącego md). Dopiero później można dodawać `.mdx` z komponentami (np. CTA w naukach).
4. **Weryfikacja:** build + testy. Jeśli nie planujesz treści MDX w najbliższym czasie — **pomiń D8** (YAGNI).

### Task D9: `astro-compress` (wartość: mniejsze transfery; ryzyko: średnie na CF Pages — kompresja edge)

1. `npm install astro-compress@^2.4.1`
2. **Przemyśl:** CF Pages sam kompresuje (gzip/brotli) na edge; astro-compress generuje pre-kompresowane pliki i może wejść w konflikt z `compressHTML: true` (podwójna kompresja). Decyzja: **test na branchu, nie w głównym PR** — zmierz `du -sh dist` przed/po. Jeśli brak znaczącej różnicy → odrzuć (YAGNI). Tylko jeśli CF edge nie kompresuje czegoś (sprawdź `curl -H "Accept-Encoding: br" -I https://babaji.org.pl/` — jeśli `content-encoding: br` już jest → D9 zbędne).

### Task D10: Usunięcie martwego kodu (wartość: czystość; ryzyko: zerowe po weryfikacji grep)

```bash
# 1. potwierdź brak importów (zweryfikowane 2026-08-04: 0):
grep -rn "EventSchema\|ArticleSchema" src/ --include="*.astro" | grep -v "schemas/"
# 2. usuń:
git rm src/components/schemas/EventSchema.astro src/components/schemas/ArticleSchema.astro
git rm public/gtag-init.js
git rm scripts/test-add-script.mjs
# 3. sprawdź czy katalog schemas nie był jedynym miejscem (BreadcrumbSchema.astro w katalogu też nieużywany?):
grep -rn "BreadcrumbSchema" src/ --include="*.astro" | grep -v "schemas/"
# jeśli 0 → git rm src/components/schemas/BreadcrumbSchema.astro (po weryfikacji!)
```

**Uwaga:** `Schema.astro`, `FAQSchema.astro`, `Breadcrumb.astro`, `BreadcrumbSchema.astro` (sprawdź) — usuwaj TYLKO potwierdzone 0 importów. `schema-markup` skill: po usunięciu JSON-LD waliduj dalej (`npm run audit:quick`).

### Task D11: README + scripts tidy

1. README: „Astro 5.x" → „Astro 7.x", Node 18+ → „Node ≥ 22.12 (zalecane 24)", sekcja nowych skryptów (`check`, ewentualnie `astro dev --background`).
2. `package.json`: `build` i `build:cf` są identyczne — zostaw oba (deploy.yml używa `build:cf`; usunięcie wymagałoby zmiany workflow — mały zysk, zostaw z komentarzem).
3. Dodaj skrypt ułatwiający pracę agentom (nowość v7):
   ```json
   "dev:bg": "astro dev --background"
   ```

---

## FAZA E — Testy końcowe i release (≈30 min)

1. `npm run build && npm run check && npm test` — wszystko zielone.
2. `npm run audit:ci` (obrazy + build + JSON-LD + axe + axe-check).
3. Ręczny przegląd kluczowych stron (home, events, teaching detail, gallery — wizualnie, PL i EN, mobile 375px).
4. Push, PR do master, CI zielony, merge, deploy.
5. Weryfikacja produkcyjna (Task C4 powtórzony) + GSC/IndexNow (IndexNow automatycznie przy buildzie z `INDEXNOW_KEY`).
6. **Aktualizacja skilli** (patrz niżej).

---

## RYZYKA I PUŁAPKI

| Ryzyko | Symptom | Akcja | Skill/źródło |
|---|---|---|---|
| Legacy content collections | Build fail na `src/content/config.ts` | Task B2 (przeniesienie + glob) — bez backcompat w v6+ | astro-migration |
| `entry.render is not a function` | Runtime/build error | `render(entry)` z importu `astro:content` | astro-migration |
| `entry.slug` undefined | Type/runtime error | `entry.id` (id = slug) | astro-migration |
| CI/deploy fail na Node 20 | `ERR_OSSL_EVP_UNSUPPORTED` / engine error | Task B8: node 24 wszędzie | upgrade guide v6 |
| Rust compiler: unclosed tags | Błąd builda „unexpected token" | Dopisz zamykające tagi; void elements bez | upgrade guide v7 |
| Sklejone spacje („helloworld") | Zmieniony wygląd | `compressHTML: true` (Task B10) | upgrade guide v7 |
| `astro-seo`/`astro-lightgallery` z Vite 8 | Błąd builda lub strony gallery | Nie mają peerDep — test na branchu; awaryjnie: astro-seo → własne meta / lightgallery → vendoring | astro-migration-ashram |
| `/api/*` 404 w prod | `link: preconnect` header na 404 | `_routes.json` + `dist/functions/` (Task B11, skill cf-pages-astro-functions) | cf-pages-astro-functions |
| Podwójne `page_view` po ClientRouter | GTM pokazuje 2× pageview | Guard w DataLayerTrack (Task D1.4) | — |
| Partytown + GTM nie strzela eventami | Brak danych w GA4 | Debug w GTM Preview; rollback = revert commita | — |
| `astro:env` bez typów | TS error na import | `npx astro sync` przed buildem | docs env |
| `z.date()` odrzuca stringi (Zod 4) | „Invalid date" | `z.coerce.date()` w content.config.ts | upgrade guide v6 |
| Wrangler peer auto-instalowany | Duży node_modules | Oczekiwane; nie usuwać ręcznie | npm |
| Sveltia CMS po migracji | CMS nie widzi treści | **Nie powinno wystąpić** (CMS edytuje pliki md niezależnie od Astro config); sprawdź `/admin` po deploy | — |
| `import.meta.env.SITE` w image-scanner | Błąd poza kontekstem Astro | Zostaw const w utilu (Task D4) | — |

## ŹRÓDŁA (zweryfikowane 2026-08-04)

- Upgrade v7: https://docs.astro.build/en/guides/upgrade-to/v7/
- Upgrade v6: https://docs.astro.build/en/guides/upgrade-to/v6/
- Blog Astro 7 (nowości): https://astro.build/blog/astro-7/
- Environment variables / astro:env: https://docs.astro.build/en/guides/environment-variables/
- i18n routing: https://docs.astro.build/en/guides/internationalization/
- npm registry: `npm view astro dist-tags --json` i pokrewne (7.1.6 / 14.1.7 / 3.7.3 / 4.0.19 / 2.3.10 / 1.1.0 / 2.6.0)
- Skille: `astro-migration` (+3 referencje), `astro-migration-ashram` (+content-config-rewrite), `cf-pages-astro-functions`, `writing-plans`

## Po wdrożeniu — aktualizacja skilli

1. `astro-migration-ashram`: wersja 0.2.0 — dopisz wynik faktycznej migracji (co się zepsuło przy buildzie, finalna lista zmian, wersje rzeczywiście zainstalowane), aktualizuj sekcję „Current State".
2. Jeśli D1–D11 cokolwiek zmieniły w know-how (np. guard page_view, partytown+GTM, robots-txt na CF) — patchnij odpowiednie skille (`astro-migration`, `astro-performance-tuning`, `seo`).
