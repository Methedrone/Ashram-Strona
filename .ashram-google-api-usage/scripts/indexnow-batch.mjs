#!/usr/bin/env node
/**
 * indexnow-batch.mjs
 *
 * Wysyła URL-e do Bing + Yandex + IndexNow (multi-endpoint z fallbackami).
 *
 * Trzy tryby:
 *   1. IndexNow.org (aggregator) — wymaga zweryfikowanej domeny w Bing WMT
 *   2. Yandex — przyjmuje od razu (bez weryfikacji)
 *   3. Bing WMT SubmitUrlBatch — wymaga apikey z Bing Webmaster Tools
 *
 * Użycie:
 *   node scripts/indexnow-batch.mjs
 *   node scripts/indexnow-batch.mjs --sitemap dist/sitemap-0.xml
 *   node scripts/indexnow-batch.mjs --urls "https://babaji.org.pl/a,https://babaji.org.pl/b"
 *   node scripts/indexnow-batch.mjs --urls-file urls.txt
 *   node scripts/indexnow-batch.mjs --only yandex            # fallback bez Bing
 *   node scripts/indexnow-batch.mjs --only bing-wmt         # wymaga INDEXNOW_BING_API_KEY
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const KEY = process.env.INDEXNOW_KEY;
const HOST = process.env.INDEXNOW_HOST ?? 'babaji.org.pl';
const BING_API_KEY = process.env.INDEXNOW_BING_API_KEY; // z Bing WMT → Settings → API Access

if (!KEY) {
  console.error(`❌ Brak INDEXNOW_KEY w .env.\n   Wygeneruj: openssl rand -hex 16\n   Hostuj plik public/{key}.txt z zawartością klucza`);
  process.exit(1);
}

const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const BATCH = 10000; // IndexNow limit per POST

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

const only = flag('only', null);
const useYandex = !only || only === 'yandex' || only === 'all';
const useIndexNow = !only || only === 'indexnow' || only === 'all';
const useBingWMT = BING_API_KEY && (!only || only === 'bing-wmt' || only === 'all');

console.log(`→ ${urls.length} URLs → ${KEY_LOCATION}\n`);

const stats = { yandex: { ok: 0, fail: 0 }, indexnow: { ok: 0, fail: 0 }, bingwmt: { ok: 0, fail: 0 } };

// ── Helper: split into batches ──
function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── 1. Yandex (zawsze działa bez weryfikacji) ──
if (useYandex) {
  console.log(`📤 Yandex (${urls.length} URLs, ${chunks(urls, BATCH).length} batch(es)):`);
  for (const chunk of chunks(urls, BATCH)) {
    const res = await fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk }),
    });
    const status = res.status;
    if (status === 200 || status === 202) {
      stats.yandex.ok += chunk.length;
      console.log(`  ✓ ${status} (${chunk.length} URLs)`);
    } else {
      stats.yandex.fail += chunk.length;
      const text = await res.text();
      console.log(`  ✗ ${status} — ${text.slice(0, 200)}`);
    }
  }
}

// ── 2. IndexNow.org aggregator (wymaga Bing WMT verify) ──
if (useIndexNow) {
  console.log(`\n📤 IndexNow.org (${urls.length} URLs, ${chunks(urls, BATCH).length} batch(es)):`);
  for (const chunk of chunks(urls, BATCH)) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: chunk }),
    });
    const status = res.status;
    if (status === 200 || status === 202) {
      stats.indexnow.ok += chunk.length;
      console.log(`  ✓ ${status} (${chunk.length} URLs)`);
    } else {
      stats.indexnow.fail += chunk.length;
      const text = await res.text();
      console.log(`  ✗ ${status} — ${text.slice(0, 200)}`);
      if (status === 403 && text.includes('User is unauthorized')) {
        console.log(`     💡 To normalne — Bing nie zweryfikował jeszcze domeny babaji.org.pl.`);
        console.log(`        Idź do https://www.bing.com/webmasters → babaji.org.pl → Verify`);
        console.log(`        (lub poczekaj, Bing sprawdza weryfikację co ~24h)`);
      }
    }
  }
}

// ── 3. Bing WMT Content Submission API (wymaga apikey, działa natychmiast) ──
if (useBingWMT) {
  console.log(`\n📤 Bing WMT Content Submission API (${urls.length} URLs):`);
  // Bing limit: 500 URLs per request
  const BING_LIMIT = 500;
  for (const chunk of chunks(urls, BING_LIMIT)) {
    const res = await fetch(
      `https://api.bing.com/contentsubmission/v1.0/submitBatch?apikey=${BING_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ siteUrl: `https://${HOST}/`, urlList: chunk }),
      }
    );
    const status = res.status;
    if (status === 200) {
      stats.bingwmt.ok += chunk.length;
      console.log(`  ✓ ${status} (${chunk.length} URLs)`);
    } else {
      stats.bingwmt.fail += chunk.length;
      const text = await res.text();
      console.log(`  ✗ ${status} — ${text.slice(0, 200)}`);
      if (status === 400 && text.includes('InvalidApiKey')) {
        console.log(`     💡 Invalid API key — sprawdź INDEXNOW_BING_API_KEY w .env`);
        console.log(`        Bing WMT → babaji.org.pl → Settings → API Access → Generate API Key`);
      }
    }
  }
} else if (!only || only === 'all') {
  console.log(`\n💡 Bing WMT Content Submission API wyłączony — dodaj INDEXNOW_BING_API_KEY w .env`);
  console.log(`   (Bing WMT → babaji.org.pl → Settings → API Access → Generate API Key)`);
  console.log(`   Endpoint: https://api.bing.com/contentsubmission/v1.0/submitBatch?apikey=...`);
}

console.log(`\n📊 Wynik:`);
console.log(`   Yandex:        ${stats.yandex.ok} OK / ${stats.yandex.fail} fail`);
console.log(`   IndexNow.org:  ${stats.indexnow.ok} OK / ${stats.indexnow.fail} fail`);
if (useBingWMT) console.log(`   Bing WMT:      ${stats.bingwmt.ok} OK / ${stats.bingwmt.fail} fail`);
console.log(`\n   Bing WMT:    https://www.bing.com/webmasters → babaji.org.pl → URL Inspection`);
console.log(`   Yandex:      https://webmaster.yandex.com/`);
