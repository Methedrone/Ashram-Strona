#!/usr/bin/env node
/**
 * ga4-run-report.mjs
 *
 * Raport GA4 Data API v1beta — używa oficjalnego klienta @google-analytics/data
 * (zalecany sposób w 2025 — context7 potwierdza).
 *
 * Użycie:
 *   node scripts/ga4-run-report.mjs
 *   node scripts/ga4-run-report.mjs --days 7 --dimensions page,country --metrics sessions,totalUsers
 *   node scripts/ga4-run-report.mjs --filter country=POL --filter eventName=sign_up_havan
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
if (!PROPERTY_ID) {
  console.error('❌ Brak GA4_PROPERTY_ID w .env');
  process.exit(1);
}

// ── Args ──
const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const DAYS = parseInt(flag('days', '7'), 10);
const DIMENSIONS = (flag('dimensions', 'pagePath')).split(',').map((s) => s.trim());
const METRICS = (flag('metrics', 'sessions,totalUsers,screenPageViews')).split(',').map((s) => s.trim());
const LIMIT = parseInt(flag('limit', '25'), 10);
const FILTERS = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--filter' && args[i + 1]?.includes('=')) {
    const [k, v] = args[i + 1].split('=');
    FILTERS.push({ field: k.trim(), value: v.trim() });
  }
}

// Auto-rewrite deprecated "page" → "pagePath" (nowe GA4 nie mają "page")
const DEPRECATED = {
  page: 'pagePath',
  pageTitle: 'pageTitle',
  // inne: 'totalEvents' → 'eventCount', 'uniquePageviews' → 'screenPageViews'
};
function normalize(names, dict) {
  return names.map((n) => dict[n] ?? n);
}

// ── Klient ──
let client;
try {
  const mod = await import('@google-analytics/data');
  client = new mod.BetaAnalyticsDataClient();
} catch {
  console.error(`❌ Brak paczki '@google-analytics/data'.\n   cd .ashram-google-api-usage && npm install @google-analytics/data`);
  process.exit(1);
}

// ── Request body ──
const body = {
  property: `properties/${PROPERTY_ID}`,
  dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
  dimensions: normalize(DIMENSIONS, DEPRECATED).map((n) => ({ name: n })),
  metrics: normalize(METRICS, { totalEvents: 'eventCount' }).map((n) => ({ name: n })),
  limit: LIMIT,
  orderBys: [{ metric: { metricName: normalize([METRICS[0]], { totalEvents: 'eventCount' })[0] }, desc: true }],
};

if (FILTERS.length > 0) {
  body.dimensionFilter = {
    andGroup: {
      expressions: FILTERS.map((f) => ({
        filter: { fieldName: f.field, stringFilter: { value: f.value } },
      })),
    },
  };
}

// ── Main ──
console.log(`→ GA4: property=${PROPERTY_ID} days=${DAYS} dim=${DIMENSIONS.join(',')} metrics=${METRICS.join(',')} limit=${LIMIT}`);
if (FILTERS.length > 0) console.log(`  filters: ${FILTERS.map((f) => `${f.field}=${f.value}`).join(' ')}`);

const [response] = await client.runReport(body);

console.log(`\n${'━'.repeat(100)}`);
console.log(`  GA4 report — ${response.rowCount} rows`);
console.log(`${'━'.repeat(100)}`);

const dimWidths = DIMENSIONS.map((d) => Math.max(d.length, 30));
const header = DIMENSIONS.map((d, i) => d.padEnd(dimWidths[i])).join('  ') +
  '  ' + METRICS.map((m) => m.padStart(12)).join(' ');
console.log(header);
console.log('─'.repeat(100));

for (const row of response.rows ?? []) {
  const dimPart = row.dimensionValues.map((v, i) => String(v.value).padEnd(dimWidths[i]).slice(0, dimWidths[i])).join('  ');
  const metPart = row.metricValues.map((v) => String(v.value).padStart(12)).join(' ');
  console.log(`${dimPart}  ${metPart}`);
}

// ── Save ──
if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });
const fname = resolve(REPORTS_DIR, `ga4_${DIMENSIONS.join('-')}_${Date.now()}.json`);
await writeFile(fname, JSON.stringify({ request: body, response }, null, 2));
console.log(`\n📄 Raport: ${fname}`);
