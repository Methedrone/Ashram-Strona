#!/usr/bin/env node
// Submits all built site URLs to Bing's Webmaster URL Submission API.
// This replaces the per-site IndexNow key-file path for Bing, which rejects
// this site with 403 UserForbiddedToAccessSite (see the ashram-google-apis
// skill). Non-fatal on purpose: a failed submit must not fail a deploy.
// Quota: ~99 URLs/day, ~199/month (checked before submitting).
import { existsSync, readFileSync } from 'node:fs';

const API = 'https://ssl.bing.com/webmaster/api.svc/json/';
const SITE = 'https://babaji.org.pl/';
const KEY = process.env.INDEXNOW_BING_API_KEY;
const SITEMAP = 'dist/client/sitemap-0.xml';

if (!KEY) {
  console.warn('[bing-submit] INDEXNOW_BING_API_KEY not set — skipping.');
  process.exit(0);
}
if (!existsSync(SITEMAP)) {
  console.warn(`[bing-submit] ${SITEMAP} not found — skipping.`);
  process.exit(0);
}

// ponytail: one sitemap chunk is enough — @astrojs/sitemap only splits past
// 45k URLs; if that day comes, read sitemap-index.xml first.
const xml = readFileSync(SITEMAP, 'utf8');
const urls = new Set();
for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  if (!m[1].endsWith('.xml')) urls.add(m[1]);
}
if (urls.size === 0) {
  console.warn('[bing-submit] no URLs found in sitemaps — skipping.');
  process.exit(0);
}

let quota = 0;
try {
  const q = await fetch(
    `${API}GetUrlSubmissionQuota?apikey=${encodeURIComponent(KEY)}&siteUrl=${encodeURIComponent(SITE)}`
  );
  quota = (await q.json())?.d?.DailyQuota ?? 0;
} catch (err) {
  console.warn('[bing-submit] quota check failed:', err.message);
  process.exit(0);
}

let list = [...urls];
if (quota <= 0) {
  console.warn('[bing-submit] daily quota exhausted — skipping this run.');
  process.exit(0);
}
if (list.length > quota) {
  console.warn(`[bing-submit] quota ${quota} < ${list.length} URLs; submitting first ${quota}.`);
  list = list.slice(0, quota);
}

try {
  const r = await fetch(`${API}SubmitUrlBatch?apikey=${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ siteUrl: SITE, urlList: list }),
  });
  const text = (await r.text()).slice(0, 200);
  if (r.ok) {
    console.log(`[bing-submit] OK: submitted ${list.length} URLs (daily quota was ${quota}). ${text}`);
  } else {
    console.warn(`[bing-submit] HTTP ${r.status}: ${text}`);
  }
} catch (err) {
  console.warn('[bing-submit] submit failed:', err.message);
}
