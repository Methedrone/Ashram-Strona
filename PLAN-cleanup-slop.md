# PLAN: czyszczenie slopu — Ashram-Strona (babaji.org.pl)

**Wersja:** 5 (finalna, zrealizowana 2026-08-10) · **Status: ✅ WYKONANE** (release dev → master: PR #48)

## Cel

Całościowe czyszczenie slopu: martwy kod, martwe pliki, nadmiarowe komentarze, deduplikacja stron PL/EN, modernizacja do Astro 7 + Biome. Tylko zmiany strukturalne — **zero zmiany logiki i wyglądu** (z wyjątkiem świadomie naprawionych bugów).

## Zasady

- Git worktree + PR per faza → `dev`, merge sekwencyjny, jeden duży release PR `dev → master` (nigdy direct, merge tylko za zgodą).
- Biome: lint lokalnie, formatter OFF, **nie w CI**.
- Komentarz = tylko DLACZEGO.
- Commity: osobny commit per punkt zmiany.

## Fazy

| Faza | Zakres | PR | Status |
|---|---|---|---|
| F0 | Audyt bazowy: AST scan, artefakty, hinty astro check 11, `any` 7, i18n parity 63=63, 9 dead keys | — | ✅ |
| Hotfix 4.1/4.2 | i18n: brakujący slug `havan-ceremonia-ognia ↔ havan-fire-ceremony`; EN literały DailySchedule → klucze | #42 | ✅ |
| F1 | Martwy kod: 6 dead keys i18n, martwe komponenty/pliki (14 artifacts), Schema.astro dead props, nadmiarowe routes, duplikaty treści | #43 | ✅ |
| F2 | Komentarze: 268 → ~107 (tylko DLACZEGO; usunięte „co" i „how") | #44 | ✅ |
| F3 | Modernizacja: Astro 7.2.0 + TS 5.9, `import type`, template literals, `astro:env` (GTM_CONTAINER_ID), Biome 2.5.7 lint-only (override `**/*.astro`) | #45 | ✅ |
| F4B | Dedup 11 par stron PL/EN → wspólne szablony (`src/components/pages/*Page.astro`) + 211+211 kluczy i18n; `[...slug].astro` i content collections nietknięte | #47 | ✅ |
| F5 | Docs: AGENTS.md (7.2.0, content.config.ts, dist/client, GTM /lhsi, SKILLKIT −210), README, copilot-instructions, CONTRIBUTING (lint:biome), llms-full (71 stron) | #46 | ✅ |
| Fix header | PL/EN nav wrap: one-row ≥1101px (zagęszczone gapy/paddingi), hamburger <1100px | bezpośrednio na dev `451e557` | ✅ |
| F6 | Weryfikacja live (CF Pages: manifest/favicon/avif 200, MD5), audyt spójności (RAPORT-audyt-dev.md), release PR dev→master | #48 | ✅ |

## Akceptacje (spełnione)

- `astro check`: **0 errors / 0 warnings / 2 hints** (GTM false-positives; było 11)
- Biome: **0** diagnostyk (~350 przed)
- Playwright: **42/42** po każdej fazie i po fixie headera
- F4B: semantic diff **22/22 stron identyczny** z baseline (tylko hash scope Astro + `'`→`&#39;`)
- Produkcja: manifest/favicon/avif **200 + poprawne content-type**; GTM-5J4NL66W renderuje się (12× dataLayer)
- `any` 7 → **0**; dead artifacts 15 → **0**; strony PL/EN 3582 → ~2395 linii

## Wynik końcowy

| Metryka | Przed | Po |
|---|---|---|
| Komentarze | 330 | ~107 |
| astro check hints | 11 | 2 |
| `any` | 7 | 0 |
| Biome diagnostyki | ~350 | 0 |
| Dead code artifacts | 15 | 0 |
| Linie stron PL/EN | 3582 | ~2395 (−33%) |

## Po release (backlog / follow-up)

- `/lhsi` 404: Redirect Rule w CF lub wyłączenie first-party mode w GTM (patrz RAPORT-audyt-dev.md)
- data-event `click_donate` tylko PL → dodać do EN (konwersje darowizn z EN w GA4)
- IndexNow 403 → weryfikacja domeny w Bing WMT (klucz w `public/<key>.txt`)
- Mapa: fallback statyczny pod Google Maps embed
- Zduplikowany blok info-items na /contact (h3+h4) — pre-existing, do decyzji
- Typo `Meditacja` w JSON-LD babaji (zachowane 1:1 w F4B) — do decyzji
