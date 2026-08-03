#!/usr/bin/env node
/**
 * gtm-publish.mjs
 *
 * 1. Tworzy nową wersję (snapshot) z workspace'a
 * 2. Publikuje na env "live"
 *
 * Użycie:
 *   node scripts/gtm-publish.mjs --version-name "v2 - dodane konwersje"
 *   node scripts/gtm-publish.mjs --create-only        # tylko snapshot, bez publikacji
 *   node scripts/gtm-publish.mjs --dry-run
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.publish', 'https://www.googleapis.com/auth/tagmanager.edit.containers'];
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;
const WORKSPACE_ID = process.env.GTM_DEFAULT_WORKSPACE ?? '1';

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const VERSION_NAME = flag('version-name', `v-${new Date().toISOString().slice(0, 10)}`);
const CREATE_ONLY = args.includes('--create-only');
const DRY_RUN = args.includes('--dry-run');

if (!ACCOUNT_ID || !CONTAINER_ID) {
  console.error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID w .env');
  process.exit(1);
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const WORKSPACE_PATH = `accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}`;

if (DRY_RUN) {
  console.log(`Would create version: name="${VERSION_NAME}" from workspace=${WORKSPACE_PATH}`);
  if (!CREATE_ONLY) console.log(`Would publish to env: live`);
  process.exit(0);
}

console.log(`→ Creating version "${VERSION_NAME}" from workspace ${WORKSPACE_ID}...`);

const createUrl = `https://tagmanager.googleapis.com/tagmanager/v2/${WORKSPACE_PATH}:create_version`;
const cv = (await client.request({ url: createUrl, method: 'POST', data: { name: VERSION_NAME, notes: `Auto-published via gtm-publish.mjs` } })).data;
console.log(`✅ Version created: ${cv.path}`);
console.log(`   containerVersionId: ${cv.containerVersionId}`);
console.log(`   fingerprint: ${cv.fingerprint?.slice(0, 16)}...`);

if (CREATE_ONLY) {
  console.log(`\n⏸  --create-only — pominąłem publikację. Gotowe do preview w GTM UI.`);
  process.exit(0);
}

console.log(`\n→ Publishing to env: live...`);
const publishUrl = `https://tagmanager.googleapis.com/tagmanager/v2/${WORKSPACE_PATH}:publish`;
const pub = (await client.request({ url: publishUrl, method: 'POST', data: { name: VERSION_NAME } })).data;
console.log(`✅ Published!`);
console.log(`   path: ${pub.path}`);
console.log(`\n🎉 Wersja "${VERSION_NAME}" jest teraz LIVE na babaji.org.pl.`);
console.log(`\n⚠  Sprawdź: otwórz https://babaji.org.pl/ w trybie incognito i zobacz:`);
console.log(`     - Czy tag firing (DevTools → Network → szukaj 'collect?')`);
console.log(`     - GA4 DebugView: https://analytics.google.com → property 524482229 → DebugView`);
