#!/usr/bin/env node
/**
 * indexing-batch.mjs
 *
 * Wysyła URL do Google Web Search Indexing API.
 * ⚠ Wymaga schema.org/JobPosting LUB BroadcastEvent w VideoObject na stronie!
 *   Dla zwykłego contentu (havan, nauki) Google zignoruje requesty.
 *
 * Użycie:
 *   node scripts/indexing-batch.mjs --urls-file urls.txt
 *   node scripts/indexing-batch.mjs --url https://babaji.org.pl/events/havan-30-06 --type URL_UPDATED
 *   echo "https://babaji.org.pl/page" | node scripts/indexing-batch.mjs --stdin
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/indexing'];
const QUOTA_PER_DAY = parseInt(process.env.INDEXING_DAILY_QUOTA ?? '200', 10);
const RATE_MS = 200; // 5 req/sec → mieści się w 380/min

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const TYPE = flag('type', 'URL_UPDATED');
const URL = flag('url', null);
const URLS_FILE = flag('urls-file', null);

if (!['URL_UPDATED', 'URL_DELETED'].includes(TYPE)) {
  console.error(`❌ --type musi być URL_UPDATED lub URL_DELETED`);
  process.exit(1);
}

async function collectUrls() {
  if (URL) return [URL];
  if (URLS_FILE) return (await readFile(URLS_FILE, 'utf8')).trim().split('\n').filter(Boolean);
  if (args.includes('--stdin')) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return Buffer.concat(chunks).toString().trim().split('\n').filter(Boolean);
  }
  return [];
}

const urls = await collectUrls();
if (urls.length === 0) {
  console.error(`❌ Podaj --url <URL> | --urls-file <plik> | --stdin`);
  process.exit(1);
}

if (urls.length > QUOTA_PER_DAY) {
  console.warn(`⚠ ${urls.length} URLs > quota ${QUOTA_PER_DAY}/day. Tylko pierwsze ${QUOTA_PER_DAY} zostanie wysłanych.`);
  urls.length = QUOTA_PER_DAY;
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

console.log(`→ Web Search Indexing API: ${urls.length} URLs (type=${TYPE})`);
console.log(`  ⚠ Wymaga schema.org JobPosting/BroadcastEvent na stronie!`);

let ok = 0, fail = 0;
const results = [];

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  try {
    const res = await client.request({
      url: endpoint,
      method: 'POST',
      data: { url, type: TYPE },
    });
    ok++;
    results.push({ url, ok: true, response: res.data });
    process.stdout.write(`✓ ${i + 1}/${urls.length} ${url}\n`);
  } catch (e) {
    fail++;
    const msg = e.message?.slice(0, 150);
    results.push({ url, ok: false, error: msg });
    process.stdout.write(`✗ ${i + 1}/${urls.length} ${url} — ${msg}\n`);
  }
  await new Promise((r) => setTimeout(r, RATE_MS));
}

console.log(`\n📊 Wynik: ${ok} OK, ${fail} fail`);
if (fail > 0) {
  console.log(`\n   Typowe błędy:`);
  console.log(`   - 403 "Indexing API cannot be used" → strona nie ma JobPosting/BroadcastEvent schema`);
  console.log(`   - 429 quota exceeded → czekaj do północy Pacific Time`);
  console.log(`   - 403 permission denied → service account nie jest Owner w GSC`);
}
