#!/usr/bin/env node
/**
 * gsc-searchanalytics.mjs
 *
 * Zapytanie do Google Search Console API — top queries, pages, CTR, pozycje.
 * Wymaga service account z dostępem do property w GSC.
 *
 * Użycie:
 *   node scripts/gsc-searchanalytics.mjs --dimension query --row-limit 50
 *   node scripts/gsc-searchanalytics.mjs --dimension page --device mobile
 *   node scripts/gsc-searchanalytics.mjs --dimension query --country POL
 *   node scripts/gsc-searchanalytics.mjs --submit-sitemap
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
// GSC ma 2 typy properties: "Domain" (sc-domain:babaji.org.pl) i "URL Prefix" (https://babaji.org.pl/)
// Domain jest preferowany bo pokrywa wszystkie subdomiany i protokoły. Auto-detect z API.
let SITE = process.env.GSC_SITE_URL ?? 'https://babaji.org.pl/';

// ── Args ──
const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const DAYS = parseInt(flag('days', '28'), 10);
const DIMENSION = flag('dimension', 'query');
const ROW_LIMIT = parseInt(flag('row-limit', '25'), 10);
const DEVICE = flag('device', null);
const COUNTRY = flag('country', null);
const SUBMIT_SITEMAP = args.includes('--submit-sitemap');
const SITEMAP_URL = flag('sitemap', null);
const ARGS_SITE = flag('site', null);
if (ARGS_SITE) SITE = ARGS_SITE;

const VALID_DIMS = ['date', 'query', 'page', 'country', 'device', 'searchAppearance', 'filterExpression'];
if (!VALID_DIMS.includes(DIMENSION)) {
  console.error(`❌ --dimension musi być jednym z: ${VALID_DIMS.join(', ')}`);
  process.exit(1);
}

// ── Date range ──
function dateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

// ── API call ──
async function call(path, method = 'GET', body = null) {
  // Specjalne endpointy BEZ site w URL (np. /sites)
  const rootOnly = ['/sites'];
  const auth = await getServiceAuth(SCOPES);
  const client = await auth.getClient();
  let url;
  if (rootOnly.includes(path)) {
    url = `https://www.googleapis.com/webmasters/v3${path}`;
  } else {
    const encodedSite = encodeURIComponent(SITE);
    url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}${path}`;
  }
  const res = await client.request({ url, method, data: body });
  return res.data;
}

// ── Sitemap submit ──
async function submitSitemap(feedpath) {
  const auth = await getServiceAuth(['https://www.googleapis.com/auth/webmasters']);
  const client = await auth.getClient();
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps/${encodeURIComponent(feedpath)}`;
  const res = await client.request({ url, method: 'PUT' });
  return res.data;
}

async function listSitemaps() {
  return await call('/sitemaps');
}

// ── Main ──
async function main() {
  if (SUBMIT_SITEMAP) {
    const sitemap = SITEMAP_URL ?? `${SITE.replace(/\/$/, '')}/sitemap-index.xml`;
    console.log(`→ Submitting sitemap: ${sitemap}`);
    const r = await submitSitemap(sitemap);
    console.log('✅', r);
    return;
  }

  // Auto-detect site type — zawsze szukamy "sc-domain:" w GSC, bo to preferowany typ
  // (działa dla www, bez www, http, https, subdomianów)
  const allSites = await call('/sites');
  console.log(`\n📡 Widoczne properties w GSC dla SA:`);
  for (const s of allSites.siteEntry ?? []) {
    console.log(`   ${s.siteUrl.padEnd(50)}  ${s.permissionLevel}`);
  }
  // Prefer "sc-domain:" jeśli istnieje; w przeciwnym razie użyj SITE z env
  const domainMatch = allSites.siteEntry?.find(
    (s) => s.siteUrl === `sc-domain:${SITE.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  );
  if (domainMatch) {
    console.log(`\nℹ Auto-detected: ${domainMatch.siteUrl}  (${domainMatch.permissionLevel})`);
    SITE = domainMatch.siteUrl;
  } else if (!SITE.startsWith('sc-domain:')) {
    // Sprawdź czy SITE pasuje do jakiejś URL-prefix property
    const urlMatch = allSites.siteEntry?.find(
      (s) => s.siteUrl === SITE || s.siteUrl === SITE.replace(/\/$/, '')
    );
    if (!urlMatch) {
      console.error(`\n❌ Brak dostępu do ${SITE} w GSC. Użyj --site <jakiś-z-powyższej-listy>`);
      process.exit(1);
    }
    SITE = urlMatch.siteUrl;
  }

  const { startDate, endDate } = dateRange(DAYS);
  const dimensions = [DIMENSION];
  const filters = [];
  if (DEVICE) filters.push({ dimension: 'device', operator: 'equals', expression: DEVICE });
  if (COUNTRY) filters.push({ dimension: 'country', operator: 'equals', expression: COUNTRY });

  const body = {
    startDate,
    endDate,
    dimensions,
    rowLimit: ROW_LIMIT,
  };
  if (filters.length > 0) {
    body.dimensionFilterGroups = [{ groupType: 'and', filters }];
  }

  console.log(`→ Querying GSC: ${SITE} (${startDate} → ${endDate}) dim=${DIMENSION} limit=${ROW_LIMIT}`);
  const data = await call('/searchAnalytics/query', 'POST', body);
  const rows = data.rows ?? [];

  if (rows.length === 0) {
    console.log('⚠ Brak danych dla podanych filtrów (albo właśnie dodana własność — dane pojawią się za 2-3 dni).');
    return;
  }

  console.log(`\n${'━'.repeat(90)}`);
  console.log(`  Top ${rows.length} ${DIMENSION}(s) for ${SITE}`);
  console.log(`${'━'.repeat(90)}`);

  const header = DIMENSION.padEnd(45) + 'clicks'.padStart(8) + 'impressions'.padStart(13) + 'CTR'.padStart(8) + 'pos'.padStart(7);
  console.log(header);
  console.log('─'.repeat(90));

  for (const row of rows) {
    const key = String(row.keys[0]).padEnd(45).slice(0, 45);
    const clicks = String(row.clicks).padStart(7);
    const impr = String(row.impressions).padStart(12);
    const ctr = (row.ctr * 100).toFixed(1) + '%';
    const pos = row.position.toFixed(1);
    console.log(`${key}${clicks}${impr}${ctr.padStart(8)}${pos.padStart(7)}`);
  }

  // zapisz raport
  if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });
  const fname = resolve(REPORTS_DIR, `gsc_${DIMENSION}_${Date.now()}.json`);
  await writeFile(fname, JSON.stringify({ site: SITE, body, response: data }, null, 2));
  console.log(`\n📄 Raport: ${fname}`);

  // sitemaps status (opcjonalnie, info)
  try {
    const sm = await listSitemaps();
    if (sm.sitemap?.length > 0) {
      console.log(`\n📑 Sitemaps (${sm.sitemap.length}):`);
      for (const s of sm.sitemap) {
        console.log(`   ${s.path}  last: ${s.lastSubmitted ?? '—'}  errors: ${s.errors ?? 0}  warnings: ${s.warnings ?? 0}`);
      }
    }
  } catch (e) {
    console.log(`\nℹ (nie udało się pobrać listy sitemaps: ${e.message?.slice(0, 100)})`);
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  if (e.message.includes('auth') || e.message.includes('403')) {
    console.error('\n   Sprawdź:');
    console.error('   1. Service account dodany do GSC jako Owner (GSC → Settings → Users)');
    console.error('   2. GSC_SITE_URL zgadza się z URL w GSC (z/bez trailing slash)');
    console.error('   3. Search Console API włączone w Google Cloud');
  }
  process.exit(1);
});
