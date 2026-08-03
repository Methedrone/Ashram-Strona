#!/usr/bin/env node
/**
 * ga4-snapshot.mjs — pobiera 6 kluczowych raportów GA4 dla babaji.org.pl
 * i zapisuje do .ashram-google-api-usage/reports/ga4-YYYY-MM-DD.json
 *
 * Wymaga: ASHRAM_GA4_SERVICE_ACCOUNT + ASHRAM_GA4_PROPERTY_ID w .env
 */
import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');

const PROPERTY = process.env.ASHRAM_GA4_PROPERTY_ID;
const SA_PATH = process.env.ASHRAM_GA4_SERVICE_ACCOUNT;
if (!PROPERTY || !SA_PATH) {
  console.error('❌ Ustaw ASHRAM_GA4_PROPERTY_ID i ASHRAM_GA4_SERVICE_ACCOUNT w .env');
  process.exit(1);
}

const { JWT } = await import('google-auth-library');
const sa = JSON.parse(await readFile(resolve(process.cwd(), SA_PATH), 'utf8'));
const jwt = new JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
await jwt.authorize();
const TOKEN = (await jwt.getAccessToken()).token;

const REPORTS = [
  {
    name: 'top_countries_7d',
    body: {
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    },
  },
  {
    name: 'top_pages_30d',
    body: {
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 50,
    },
  },
  {
    name: 'events_30d',
    body: {
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 30,
    },
  },
  {
    name: 'traffic_sources_30d',
    body: {
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }, { name: 'engagementRate' }],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 30,
    },
  },
  {
    name: 'device_split_30d',
    body: {
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'engagementRate' }],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    },
  },
  {
    name: 'events_section_30d',
    body: {
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: { value: '/events', matchType: 'BEGINS_WITH' },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 30,
    },
  },
];

if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });
const out = { property: PROPERTY, generated_at: new Date().toISOString(), reports: {} };

for (const r of REPORTS) {
  process.stdout.write(`→ ${r.name} ... `);
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`,
    { method: 'POST', headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(r.body) }
  );
  if (!res.ok) {
    const t = await res.text();
    console.log(`❌ ${res.status} ${t.slice(0, 200)}`);
    out.reports[r.name] = { error: t };
    continue;
  }
  const j = await res.json();
  // skróć do zrozumiałych wierszy
  const rows = (j.rows ?? []).map((row) => {
    const dims = row.dimensionValues.map((d) => d.value);
    const mets = row.metricValues.map((m) => parseFloat(m.value));
    return dims.length === 1 ? dims[0] : dims;
  });
  out.reports[r.name] = { rows, raw_row_count: j.rowCount };
  console.log(`✓ ${j.rowCount ?? 0} rows`);
}

const today = new Date().toISOString().slice(0, 10);
const file = resolve(REPORTS_DIR, `ga4-${today}.json`);
await writeFile(file, JSON.stringify(out, null, 2));
console.log(`\n📄 ${file}`);
