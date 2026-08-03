#!/usr/bin/env node
/**
 * gsc-snapshot.mjs — 4 kluczowe raporty GSC dla babaji.org.pl
 * Wymaga: ASHRAM_GSC_SERVICE_ACCOUNT + ASHRAM_GSC_SITE_URL
 */
import 'dotenv/config';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');

const SITE = process.env.ASHRAM_GSC_SITE_URL;
const SA_PATH = process.env.ASHRAM_GSC_SERVICE_ACCOUNT;
if (!SITE || !SA_PATH) { console.error('❌ Ustaw ASHRAM_GSC_SITE_URL i ASHRAM_GSC_SERVICE_ACCOUNT'); process.exit(1); }

const { JWT } = await import('google-auth-library');
const sa = JSON.parse(await readFile(resolve(process.cwd(), SA_PATH), 'utf8'));
const jwt = new JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
await jwt.authorize();
const TOKEN = (await jwt.getAccessToken()).token;
const enc = encodeURIComponent(SITE);
const BASE = `https://searchconsole.googleapis.com/v1/sites/${enc}`;

async function gsc(path, init) {
  const r = await fetch(BASE + path, init);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

const today = new Date();
const start28 = new Date(today); start28.setDate(today.getDate() - 28);
const fmt = (d) => d.toISOString().slice(0, 10);
const DATE = { startDate: fmt(start28), endDate: fmt(today) };

const REPORTS = [
  {
    name: 'top_queries_pl_mobile',
    body: { ...DATE, dimensions: ['query'], rowLimit: 30, dimensionFilterGroups: [{ filters: [
      { dimension: 'country', operator: 'equals', expression: 'POL' },
      { dimension: 'device', operator: 'equals', expression: 'MOBILE' },
    ] }] },
  },
  {
    name: 'top_pages_30d',
    body: { ...DATE, dimensions: ['page'], rowLimit: 30 },
  },
  {
    name: 'top_queries_desktop',
    body: { ...DATE, dimensions: ['query'], rowLimit: 30, dimensionFilterGroups: [{ filters: [
      { dimension: 'device', operator: 'equals', expression: 'DESKTOP' },
    ] }] },
  },
  {
    name: 'low_ctr_high_impressions',
    body: { ...DATE, dimensions: ['query', 'page'], rowLimit: 30, type: 'web' },
  },
];

if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });
const out = { site: SITE, date_range: DATE, generated_at: new Date().toISOString(), reports: {} };

for (const r of REPORTS) {
  process.stdout.write(`→ ${r.name} ... `);
  try {
    const j = await gsc('/searchAnalytics/query', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(r.body),
    });
    out.reports[r.name] = (j.rows ?? []).map((row) => {
      const keys = row.keys;
      return {
        ...(keys.length === 1 ? { key: keys[0] } : { keys }),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: +(row.ctr * 100).toFixed(2),
        position: +row.position.toFixed(1),
      };
    });
    console.log(`✓ ${j.rows?.length ?? 0} rows`);
  } catch (e) {
    console.log(`❌ ${e.message.slice(0, 200)}`);
    out.reports[r.name] = { error: e.message };
  }
}

const stamp = today.toISOString().slice(0, 10);
const file = resolve(REPORTS_DIR, `gsc-${stamp}.json`);
await writeFile(file, JSON.stringify(out, null, 2));
console.log(`\n📄 ${file}`);
