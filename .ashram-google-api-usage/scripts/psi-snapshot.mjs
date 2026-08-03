#!/usr/bin/env node
/**
 * pagespeed-snapshot.mjs
 *
 * Wywołuje PageSpeed Insights v5 dla wybranych URL-i i strategii
 * (mobile + desktop), wyciąga kategorie + Core Web Vitals + CrUX (jeśli są)
 * i zapisuje raport do .ashram-google-api-usage/reports/.
 *
 * Użycie:
 *   node .ashram-google-api-usage/scripts/psi-snapshot.mjs
 *   node .ashram-google-api-usage/scripts/psi-snapshot.mjs --urls https://babaji.org.pl,https://babaji.org.pl/en
 *   node .ashram-google-api-usage/scripts/psi-snapshot.mjs --strategy desktop
 *
 * Wymaga: ASHRAM_GOOGLE_API_KEY w .env
 * Działa BEZ OAuth (PageSpeed Insights v5 to jedyny z tej listy, który
 * akceptuje zwykły API key).
 */

import 'dotenv/config';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const API_KEY = process.env.ASHRAM_GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('❌ Brak ASHRAM_GOOGLE_API_KEY w .env');
  process.exit(1);
}

// --- Argumenty CLI ---------------------------------------------------------
const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const URLS = (flag(
  'urls',
  'https://babaji.org.pl,https://babaji.org.pl/en,https://babaji.org.pl/events,https://babaji.org.pl/teachings'
)).split(',').map((s) => s.trim()).filter(Boolean);

const STRATEGIES = (flag('strategy') ?? 'mobile,desktop').split(',');
const LOCALE = flag('locale', 'pl');
const CATEGORIES = (flag('category') ?? 'performance,accessibility,best-practices,seo').split(',');

// --- Ekstrakt metryk -------------------------------------------------------
function extractMetrics(payload) {
  const lh = payload?.lighthouseResult;
  const audits = lh?.audits ?? {};
  const cats = lh?.categories ?? {};
  const crux = payload?.loadingExperience ?? {};

  const num = (k) => (audits[k]?.numericValue ?? null);
  const disp = (k) => audits[k]?.displayValue ?? null;

  return {
    lighthouse_version: lh?.lighthouseVersion,
    user_agent: lh?.userAgent,
    fetch_time: lh?.fetchTime,
    requested_url: payload?.id,
    final_url: lh?.finalUrl,
    scores: {
      performance: cats.performance?.score ?? null,
      accessibility: cats.accessibility?.score ?? null,
      best_practices: cats['best-practices']?.score ?? null,
      seo: cats.seo?.score ?? null,
    },
    metrics: {
      fcp_ms: num('first-contentful-paint'),
      lcp_ms: num('largest-contentful-paint'),
      cls: num('cumulative-layout-shift'),
      tbt_ms: num('total-blocking-time'),
      si_ms: num('speed-index'),
      tti_ms: num('interactive'),
      fcp: disp('first-contentful-paint'),
      lcp: disp('largest-contentful-paint'),
      cls_disp: disp('cumulative-layout-shift'),
      tbt: disp('total-blocking-time'),
      si: disp('speed-index'),
    },
    crux: {
      overall_category: crux.overall_category ?? null,
      lcp_category: crux.metrics?.largest_contentful_paint?.category ?? null,
      cls_category: crux.metrics?.cumulative_layout_shift?.category ?? null,
      fcp_category: crux.metrics?.first_contentful_paint?.category ?? null,
      fid_category: crux.metrics?.first_input_delay?.category ?? null,
      inp_category: crux.metrics?.interaction_to_next_paint?.category ?? null,
      has_real_user_data: !!crux.overall_category,
    },
    top_issues: Object.values(audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.details?.type !== 'debugdata')
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 10)
      .map((a) => ({ id: a.id, title: a.title, score: a.score, savings_ms: a.details?.overallSavingsMs ?? null })),
  };
}

// --- Wywołanie API ---------------------------------------------------------
async function fetchPSI(url, strategy) {
  const u = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  u.searchParams.set('url', url);
  u.searchParams.set('key', API_KEY);
  u.searchParams.set('strategy', strategy);
  u.searchParams.set('locale', LOCALE);
  for (const c of CATEGORIES) u.searchParams.append('category', c);
  const res = await fetch(u.toString());
  if (!res.ok) {
    const text = await res.text();
    return { error: `HTTP ${res.status}`, body: text.slice(0, 500) };
  }
  return await res.json();
}

// --- Porównanie z poprzednim snapshotem ------------------------------------
async function loadPrevious(label) {
  const path = resolve(REPORTS_DIR, `${label}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

function diff(a, b) {
  if (!a || !b) return null;
  const out = {};
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'number' && typeof b[k] === 'number') {
      out[k] = { before: a[k], after: b[k], delta: +(a[k] - b[k]).toFixed(4) };
    }
  }
  return out;
}

// --- Main ------------------------------------------------------------------
async function main() {
  if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const results = { generated_at: new Date().toISOString(), project: 'babaji.org.pl', rows: [] };

  for (const url of URLS) {
    for (const strategy of STRATEGIES) {
      const label = `psi_${url.replace(/[^a-z0-9]+/gi, '_')}_${strategy}`;
      const prev = await loadPrevious(label);

      process.stdout.write(`→ ${url} [${strategy}] ... `);
      const json = await fetchPSI(url, strategy);
      if (json.error) {
        console.log(`❌ ${json.error}`);
        results.rows.push({ url, strategy, error: json.error });
        continue;
      }
      const m = extractMetrics(json);
      const file = resolve(REPORTS_DIR, `${label}.json`);
      await writeFile(file, JSON.stringify({ ...m, raw_keys: Object.keys(json) }, null, 2));

      // diff vs poprzedni snapshot
      const scoreDelta = diff(prev?.scores, m.scores);
      const metricDelta = diff(prev?.metrics, m.metrics);
      console.log(
        `✓ perf=${m.scores.performance} seo=${m.scores.seo} LCP=${m.metrics.lcp} CLS=${m.metrics.cls} CrUX=${m.crux.has_real_user_data ? 'yes' : 'no'}`
      );
      results.rows.push({
        url, strategy, label,
        scores: m.scores,
        metrics: m.metrics,
        crux: m.crux,
        deltas_vs_previous: { scores: scoreDelta, metrics: metricDelta },
        issues_count: m.top_issues.length,
      });
    }
  }

  // Porównawczy raport HTML + JSON
  const cmpFile = resolve(REPORTS_DIR, `compare_${stamp}.json`);
  await writeFile(cmpFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Raport: ${cmpFile}`);
  console.log(`   Raporty per-URL w: ${REPORTS_DIR}/psi_*.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
