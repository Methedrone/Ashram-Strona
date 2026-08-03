#!/usr/bin/env node
/**
 * indexnow-diag.mjs
 *
 * Pełna diagnostyka IndexNow — sprawdza czy wszystko jest poprawnie skonfigurowane
 * do przyjmowania URL-i przez Bing + Yandex + DuckDuckGo.
 *
 * Użycie:
 *   node scripts/indexnow-diag.mjs
 *   node scripts/indexnow-diag.mjs --test-submit  # wykonaj prawdziwy submit 1 URL
 */

import 'dotenv/config';

const KEY = process.env.INDEXNOW_KEY;
const HOST = process.env.INDEXNOW_HOST ?? 'babaji.org.pl';

if (!KEY) {
  console.error('❌ Brak INDEXNOW_KEY w .env');
  process.exit(1);
}

const TEST_URL = `https://${HOST}/${KEY}.txt`;
const issues = [];
const ok = [];

async function check(name, fn) {
  try {
    const result = await fn();
    ok.push(`✅ ${name}: ${result}`);
  } catch (e) {
    issues.push(`❌ ${name}: ${e.message}`);
  }
}

console.log(`═`.repeat(60));
console.log(`  IndexNow diagnostic for ${HOST}`);
console.log(`═`.repeat(60));
console.log();

// 1. Plik weryfikacyjny na serwerze
await check('Verification file on root path', async () => {
  const r = await fetch(TEST_URL);
  if (r.status !== 200) throw new Error(`HTTP ${r.status} (oczekiwane 200)`);
  const text = (await r.text()).trim();
  if (text !== KEY) {
    throw new Error(`Zawartość pliku nie zgadza się z kluczem. Plik zawiera "${text}", oczekiwane "${KEY}"`);
  }
  return `HTTP 200, content matches key (32 chars)`;
});

// 2. Klucz w env
await check('INDEXNOW_KEY w .env', async () => {
  if (KEY.length !== 32) throw new Error(`Klucz ma ${KEY.length} znaków (oczekiwane 32)`);
  if (!/^[a-z0-9-]+$/i.test(KEY)) throw new Error('Klucz ma niedozwolone znaki');
  return `${KEY.length} chars, valid format`;
});

// 3. astro-indexnow config
await check('astro-indexnow integration', async () => {
  const fs = await import('node:fs');
  const cfg = fs.readFileSync('astro.config.mjs', 'utf8');
  if (!cfg.includes('indexnow')) throw new Error('Brak importu indexnow w astro.config.mjs');
  if (cfg.includes('process.env.INDEXNOW_KEY ?')) return 'conditional (aktywuje się tylko gdy INDEXNOW_KEY w env)';
  if (cfg.includes('indexnow(')) return 'unconditional';
  throw new Error('Nieznany pattern');
});

// 4. IndexNow endpoint test (suchy submit 1 URL-a)
await check('IndexNow API endpoint reachable', async () => {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: TEST_URL,
      urlList: [`https://${HOST}/`],
    }),
  });
  const body = await r.text();
  if (r.status === 200 || r.status === 202) return `HTTP ${r.status} (URL przyjęty)`;
  if (r.status === 403) {
    if (body.includes('UserForbiddedToAccessSite') || body.includes('User is unauthorized')) {
      throw new Error('Bing nie rozpoznaje Cię jako właściciela → ZAREJESTRUJ domenę w Bing Webmaster Tools');
    }
    throw new Error(`HTTP 403: ${body.slice(0, 100)}`);
  }
  if (r.status === 422) throw new Error(`HTTP 422: key invalid or URL nie należy do hosta`);
  throw new Error(`HTTP ${r.status}: ${body.slice(0, 100)}`);
});

// 5. Bingbot user-agent test (czy Bing może crawlować stronę)
await check('Bingbot user-agent', async () => {
  const r = await fetch(`https://${HOST}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' },
  });
  if (r.status === 200) return `HTTP 200 — Bing ma dostęp do strony`;
  throw new Error(`HTTP ${r.status} — Bing ma problem z dostępem`);
});

// 6. Sprawdź robots.txt
await check('robots.txt allows Bing', async () => {
  const r = await fetch(`https://${HOST}/robots.txt`);
  if (r.status !== 200) return `Brak robots.txt (Bing zaindeksuje wszystko)`;
  const text = await r.text();
  if (text.match(/User-agent:\s*Bingbot[\s\S]*Disallow:\s*\//i)) {
    throw new Error('robots.txt BLOKUJE Bingbota!');
  }
  return `robots.txt OK (nie blokuje Bingbota)`;
});

console.log('WYNIKI:\n');
for (const m of ok) console.log(m);
if (issues.length > 0) {
  console.log('\nPROBLEMY DO NAPRAWIENIA:\n');
  for (const m of issues) console.log(m);
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  ❌ IndexNow nie będzie działać dopóki powyższe nie zostaną naprawione');
  console.log('═'.repeat(60));
  process.exit(1);
}

console.log('\n');
console.log('═'.repeat(60));
console.log('  ✅ Wszystko OK! IndexNow powinien działać.');
console.log('═'.repeat(60));
console.log('\nNastępne kroki:');
console.log('  1. Jeśli jeszcze nie: zarejestruj https://www.bing.com/webmasters → Add site → babaji.org.pl');
console.log('  2. Każdy build automatycznie wyśle URL-e przez astro-indexnow');
console.log('  3. Ręczne wysyłanie: node scripts/indexnow-batch.mjs');
console.log('  4. Monitor: https://www.bing.com/webmasters → babaji.org.pl → IndexNow\n');
