#!/usr/bin/env node
/**
 * gtm-onboard.mjs
 *
 * One-shot setup: tworzy kompletną konfigurację GTM dla babaji.org.pl
 * z tagiem GA4 Config, custom eventami dla konwersji i triggerami.
 *
 * Tworzy w kolejności:
 *   1. GA4 Configuration Tag (gtag.js init)
 *   2. Zmienne DLV (havan_id, havan_date, havan_location, donate_amount, donate_currency, newsletter_source)
 *   3. Custom Event Triggers (sign_up_havan, click_donate, contact_form_submit, newsletter_signup)
 *   4. Tagi GA4 Event dla każdego CE
 *   5. Tworzy wersję i publikuje
 *
 * Użycie:
 *   node scripts/gtm-onboard.mjs           # full setup + publish
 *   node scripts/gtm-onboard.mjs --dry-run # tylko pokaż co zrobi
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',  // wymagany do create_version
  'https://www.googleapis.com/auth/tagmanager.publish',
];
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;
const WORKSPACE_ID = process.env.GTM_DEFAULT_WORKSPACE ?? '1';
const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;

if (!ACCOUNT_ID || !CONTAINER_ID) {
  console.error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID w .env');
  process.exit(1);
}
if (!MEASUREMENT_ID || !MEASUREMENT_ID.startsWith('G-')) {
  console.error('❌ Brak GA4_MEASUREMENT_ID w .env (powinno zaczynać się od "G-")');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const BASE = 'https://tagmanager.googleapis.com/tagmanager/v2';
const WSP = `${BASE}/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}`;

async function call(method, path, data = null) {
  if (DRY_RUN) {
    console.log(`  [DRY] ${method} ${path.replace(BASE, '')}`);
    if (data) console.log(`         data: ${JSON.stringify(data).slice(0, 100)}...`);
    return { tagId: 'DRY', triggerId: 'DRY', variableId: 'DRY', path: 'DRY' };
  }
  try {
    const r = await client.request({ url: path, method, data });
    return r.data;
  } catch (e) {
    // Skip duplicate entity (już istnieje) — sukces logiczny
    const msg = e.message ?? '';
    if (msg.includes('duplicate') || msg.includes('already exists')) {
      console.log(`  ⚠ Skipped (duplicate): ${path.split('/').pop()}`);
      return { tagId: 'SKIP', triggerId: 'SKIP', variableId: 'SKIP', path: path };
    }
    throw e;
  }
}

const created = { variables: [], triggers: [], tags: [] };

// 1. GA4 Configuration Tag (na wszelki wypadek — jeśli jeszcze nie ma)
console.log(`\n[1/4] GA4 Configuration Tag...`);
const configTag = await call('POST', `${WSP}/tags`, {
  name: 'GA4 — Configuration',
  type: 'googtag',  // Google Tag (nowszy typ, zastępuje gaawe/gaawc)
  parameter: [
    { type: 'TEMPLATE', key: 'tagId', value: MEASUREMENT_ID },  // tagId = G-XXXXXX
  ],
  firingTriggerId: ['2147479553'], // Built-in: All Pages
});
created.tags.push({ step: 'config', name: 'GA4 — Configuration', tagId: configTag.tagId });
console.log(`  ✅ ${configTag.name} (id=${configTag.tagId})`);

// 2. DLV Variables
console.log(`\n[2/4] DataLayer Variables...`);
const DLVARS = [
  { name: 'DLV - havan_id', dlvar: 'havan_id' },
  { name: 'DLV - havan_date', dlvar: 'havan_date' },
  { name: 'DLV - havan_location', dlvar: 'havan_location' },
  { name: 'DLV - donate_amount', dlvar: 'donate_amount' },
  { name: 'DLV - donate_currency', dlvar: 'donate_currency' },
  { name: 'DLV - newsletter_source', dlvar: 'newsletter_source' },
];
for (const v of DLVARS) {
  const createdVar = await call('POST', `${WSP}/variables`, {
    name: v.name,
    type: 'v',
    parameter: [
      { type: 'template', key: 'dataLayerVersion', value: '2' },
      { type: 'template', key: 'name', value: v.dlvar },
    ],
  });
  created.variables.push({ name: v.name, variableId: createdVar.variableId });
  console.log(`  ✅ ${v.name} (id=${createdVar.variableId})`);
}

// 3. Custom Event Triggers
console.log(`\n[3/4] Custom Event Triggers...`);
const EVENTS = ['sign_up_havan', 'click_donate', 'contact_form_submit', 'newsletter_signup'];
for (const eventName of EVENTS) {
  const createdTr = await call('POST', `${WSP}/triggers`, {
    name: `CE — ${eventName}`,
    type: 'customEvent',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },  // uwaga: nowa konwencja w v2
        { type: 'template', key: 'arg1', value: eventName },
      ],
    }],
  });
  created.triggers.push({ eventName, triggerId: createdTr.triggerId });
  console.log(`  ✅ CE — ${eventName} (id=${createdTr.triggerId})`);
}

// 4. GA4 Event Tags (jeden na event)
console.log(`\n[4/4] GA4 Event Tags...`);
const eventParams = {
  sign_up_havan: [['havan_id', '{{DLV - havan_id}}'], ['havan_date', '{{DLV - havan_date}}'], ['havan_location', '{{DLV - havan_location}}']],
  click_donate: [['amount', '{{DLV - donate_amount}}'], ['currency', '{{DLV - donate_currency}}']],
  contact_form_submit: [],
  newsletter_signup: [['source', '{{DLV - newsletter_source}}']],
};

for (const ev of EVENTS) {
  const triggerInfo = created.triggers.find((t) => t.eventName === ev);
  if (!triggerInfo || triggerInfo.triggerId === 'DRY') continue;
  // Skip jeśli trigger nie został utworzony (np. "SKIP" z duplicate)
  if (triggerInfo.triggerId === 'SKIP') {
    // Szukamy istniejącego triggera z taką nazwą
    const existingTriggers = await call('GET', `${WSP}/triggers`);
    const existing = existingTriggers.trigger?.find((t) => t.name === `CE — ${ev}`);
    if (existing) {
      triggerInfo.triggerId = existing.triggerId;
    } else {
      console.log(`  ⚠ Skip tag for ${ev} — no trigger`);
      continue;
    }
  }

  const params = eventParams[ev] ?? [];
  const eventTag = await call('POST', `${WSP}/tags`, {
    name: `GA4 — ${ev}`,
    type: 'googtag',  // Google Tag (rekomendowany typ w 2025)
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: ev },
      ...(params.length > 0 ? [{
        type: 'list',
        key: 'eventParameters',
        list: params.map(([name, value]) => ({
          type: 'map',
          map: [
            { type: 'template', key: 'name', value: name },
            { type: 'template', key: 'value', value: value },
          ],
        })),
      }] : []),
    ],
    firingTriggerId: [triggerInfo.triggerId],
  });
  created.tags.push({ step: 'event', name: `GA4 — ${ev}`, tagId: eventTag.tagId });
  console.log(`  ✅ GA4 — ${ev} (id=${eventTag.tagId}, firing trigger=${triggerInfo.triggerId})`);
}

if (DRY_RUN) {
  console.log(`\n⏸  DRY RUN zakończony — nic nie wysłano.`);
  process.exit(0);
}

// 5. Create version + publish
console.log(`\n[5/5] Publishing...`);
const versionName = `onboard-${new Date().toISOString().slice(0, 10)}`;
const cv = await call('POST', `${WSP}:create_version`, { name: versionName, notes: 'Auto-generated by gtm-onboard.mjs' });
console.log(`  ✅ Version created: ${cv.path}`);

const pub = await call('POST', `${WSP}:publish`, { name: versionName });
console.log(`  ✅ Published: ${pub.path}`);

console.log(`\n🎉 GTM onboard zakończony pomyślnie!\n`);
console.log(`Podsumowanie:`);
console.log(`  ${created.variables.length} variables`);
console.log(`  ${created.triggers.length} triggers`);
console.log(`  ${created.tags.length} tags`);
console.log(`  1 version published: ${versionName}`);
console.log(`\n⚠  Następne kroki w kodzie strony:`);
console.log(`  - W Layout.astro użyj GTM_CONTAINER_ID=${process.env.GTM_CONTAINER_ID}`);
console.log(`  - Dodaj dataLayer.push({event: 'sign_up_havan', havan_id, havan_date, havan_location}) w przycisku zapisu`);
console.log(`  - Dodaj dataLayer.push({event: 'click_donate', donate_amount, donate_currency}) w donate button`);
console.log(`  - Dodaj dataLayer.push({event: 'contact_form_submit'}) w formularzu kontaktowym`);
console.log(`  - Test: DevTools → Network → szukaj 'collect?v=2' (request do GA4)`);
