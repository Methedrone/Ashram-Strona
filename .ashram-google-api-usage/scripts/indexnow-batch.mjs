#!/usr/bin/env node
/**
 * indexnow-batch.mjs
 *
 * Wysyła wszystkie URL-e ze sitemap do IndexNow (Bing + Yandex + inne).
 * Działa BEZ service account — tylko API key.
 *
 * Użycie:
 *   node scripts/indexnow-batch.mjs
 *   node scripts/indexnow-batch.mjs --sitemap dist/sitemap-0.xml
 *   node scripts/indexnow-batch.mjs --urls-file urls.txt
 *   node scripts/indexnow-batch.mjs --urls "https://babaji.org.pl/a,https://babaji.org.pl/b"
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error(`❌ Brak INDEXNOW_KEY w .env.\n   Wygeneruj: openssl rand -hex 16\n   Hostuj plik public/{key}.txt z zawartością klucza`);
  process.exit(1);
}

const HOST = 'babaji.org.pl';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH = 10000; // IndexNow limit

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};

// ── URLs source ──
async function collectUrls() {
  const sitemap = flag('sitemap', 'dist/sitemap-0.xml');
  if (existsSync(sitemap)) {
    const xml = await readFile(sitemap, 'utf8');
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  }
  if (args.includes('--urls-file')) {
    const file = flag('urls-file');
    return (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean);
  }
  if (args.includes('--urls')) {
    return flag('urls').split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const urls = await collectUrls();
if (urls.length === 0) {
  console.error(`❌ Brak URL-i. Użyj --sitemap <plik> | --urls-file <plik> | --urls "<lista>"`);
  process.exit(1);
}

console.log(`→ IndexNow: ${urls.length} URLs → ${KEY_LOCATION}`);

let ok = 0;
let fail = 0;
for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const num = i / BATCH + 1;
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk }),
  });
  const status = res.status;
  if (status === 200 || status === 202) {
    ok += chunk.length;
    console.log(`✓ Batch ${num}: HTTP ${status} (${chunk.length} URLs)`);
  } else {
    fail += chunk.length;
    const body = await res.text();
    console.log(`✗ Batch ${num}: HTTP ${status} — ${body.slice(0, 200)}`);
  }
}

console.log(`\n📊 Wynik: ${ok} OK, ${fail} fail`);
console.log(`   Bing Webmaster: https://www.bing.com/webmasters → IndexNow`);
