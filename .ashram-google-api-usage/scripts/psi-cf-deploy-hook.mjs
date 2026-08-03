#!/usr/bin/env node
/**
 * psi-cf-deploy-hook.mjs
 *
 * Hook uruchamiany po deployu na Cloudflare Pages.
 * Źródło: CF Pages Deploy hook (w ustawieniach projektu) LUB GitHub Action.
 *
 * Akcja:
 *   1. Wywołuje PageSpeed Insights dla kluczowych URL-i (mobile+desktop)
 *   2. Porównuje z poprzednim snapshotem
 *   3. Jeśli performance spadło < 0.7 → opcjonalny alert (env ALERT_WEBHOOK_URL)
 *
 * Użycie:
 *   node scripts/psi-cf-deploy-hook.mjs
 *   CF_DEPLOY_HOOK_URL=https://api.cf/... node scripts/psi-cf-deploy-hook.mjs
 */

import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = resolve(__dirname, '..', 'reports');
const PSI_SCRIPT = resolve(__dirname, 'psi-snapshot.mjs');

const KEY_URLS = [
  'https://babaji.org.pl/',
  'https://babaji.org.pl/en',
  'https://babaji.org.pl/events',
  'https://babaji.org.pl/teachings',
];

const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK_URL;
const THRESHOLD_PERF = 0.7;

console.log('🚀 Cloudflare Pages post-deploy: PSI snapshot');

// 1. Run PSI snapshot
const r = spawnSync('node', [PSI_SCRIPT, '--urls', KEY_URLS.join(',')], {
  stdio: 'inherit',
  env: process.env,
});
if (r.status !== 0) {
  console.error('❌ PSI snapshot failed');
  process.exit(r.status ?? 1);
}

// 2. Find latest compare file
if (!existsSync(REPORTS_DIR)) await mkdir(REPORTS_DIR, { recursive: true });
const files = (await readdir(REPORTS_DIR)).filter((f) => f.startsWith('compare_') && f.endsWith('.json')).sort();
const latest = files[files.length - 1];
if (!latest) {
  console.log('⚠ Brak raportu compare_*.json do analizy');
  process.exit(0);
}

const compare = JSON.parse(await readFile(resolve(REPORTS_DIR, latest), 'utf8'));
console.log(`\n📊 Analiza: ${latest}`);

let alerts = [];
for (const row of compare.rows) {
  if (row.error) {
    alerts.push(`❌ ${row.url} [${row.strategy}]: ${row.error}`);
    continue;
  }
  const perf = row.scores?.performance ?? 1;
  const lcp = row.metrics?.lcp_ms ?? 0;
  const cls = row.metrics?.cls ?? 0;
  if (perf < THRESHOLD_PERF) {
    alerts.push(`⚠ ${row.url} [${row.strategy}]: performance=${perf} < ${THRESHOLD_PERF}`);
  }
  if (lcp > 4000) {
    alerts.push(`⚠ ${row.url} [${row.strategy}]: LCP=${(lcp / 1000).toFixed(1)}s > 4s`);
  }
  if (cls > 0.1) {
    alerts.push(`⚠ ${row.url} [${row.strategy}]: CLS=${cls.toFixed(3)} > 0.1 (Poor)`);
  }
  if (row.deltas_vs_previous?.scores?.performance?.delta < -0.05) {
    alerts.push(`📉 ${row.url} [${row.strategy}]: perf spadło o ${(row.deltas_vs_previous.scores.performance.delta * 100).toFixed(0)}pp vs poprzedni deploy`);
  }
}

if (alerts.length === 0) {
  console.log('✅ Wszystkie URL-e w normie.');
  if (ALERT_WEBHOOK) {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `✅ babaji.org.pl post-deploy PSI: OK (${compare.rows.length} URLs)` }),
    });
  }
  process.exit(0);
}

const message = `🚨 babaji.org.pl post-deploy PSI alerts:\n${alerts.join('\n')}`;
console.log(`\n${message}`);

if (ALERT_WEBHOOK) {
  await fetch(ALERT_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}

process.exit(1); // niech CI wie że jest problem
