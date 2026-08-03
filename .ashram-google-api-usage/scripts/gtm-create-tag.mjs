#!/usr/bin/env node
/**
 * gtm-create-tag.mjs
 *
 * Tworzy nowy tag w GTM (GA4 event, conversion linker, custom HTML, etc.)
 * Można użyć do stworzenia standardowej konfiguracji babaji (havan, donate, contact, newsletter).
 *
 * Użycie:
 *   node scripts/gtm-create-tag.mjs --preset havan-signup
 *   node scripts/gtm-create-tag.mjs --preset donate
 *   node scripts/gtm-create-tag.mjs --preset contact-form
 *   node scripts/gtm-create-tag.mjs --preset newsletter
 *   node scripts/gtm-create-tag.mjs --preset pageview-marketing-consent
 *   node scripts/gtm-create-tag.mjs --custom --name "..." --type gaawe --trigger <triggerId>
 *   node scripts/gtm-create-tag.mjs --dry-run
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.edit.containers'];
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;
const WORKSPACE_ID = process.env.GTM_DEFAULT_WORKSPACE ?? '1';
const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID ?? 'G-XXXXXXXX';

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const PRESET = flag('preset', null);
const CUSTOM = args.includes('--custom');
const DRY_RUN = args.includes('--dry-run');

if (!ACCOUNT_ID || !CONTAINER_ID) {
  console.error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID w .env');
  process.exit(1);
}

// ── Presets (gotowe tagi dla babaji.org.pl) ──────────────────────
const PRESETS = {
  'havan-signup': {
    name: 'GA4 — sign_up_havan',
    type: 'googtag',
    description: 'Wysyła event sign_up_havan gdy user kliknie "Zapisz się"',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: 'sign_up_havan' },
      {
        type: 'list',
        key: 'eventParameters',
        list: [
          { type: 'map', map: [
            { type: 'template', key: 'name', value: 'havan_id' },
            { type: 'template', key: 'value', value: '{{DLV - havan_id}}' },
          ]},
          { type: 'map', map: [
            { type: 'template', key: 'name', value: 'havan_date' },
            { type: 'template', key: 'value', value: '{{DLV - havan_date}}' },
          ]},
          { type: 'map', map: [
            { type: 'template', key: 'name', value: 'havan_location' },
            { type: 'template', key: 'value', value: '{{DLV - havan_location}}' },
          ]},
        ],
      },
    ],
    firingTriggerId: ['<TRIGGER_CE_signup_havan>'],
  },
  'donate': {
    name: 'GA4 — click_donate',
    type: 'googtag',
    description: 'Event click_donate z wartością',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: 'click_donate' },
      { type: 'list', key: 'eventParameters', list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'amount' },
          { type: 'template', key: 'value', value: '{{DLV - donate_amount}}' },
        ]},
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'currency' },
          { type: 'template', key: 'value', value: '{{DLV - donate_currency}}' },
        ]},
      ]},
    ],
    firingTriggerId: ['<TRIGGER_CE_donate>'],
  },
  'contact-form': {
    name: 'GA4 — contact_form_submit',
    type: 'googtag',
    description: 'Event kontaktowy — formularz na /kontakt',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: 'contact_form_submit' },
    ],
    firingTriggerId: ['<TRIGGER_FORM_kontakt>'],
  },
  'newsletter': {
    name: 'GA4 — newsletter_signup',
    type: 'googtag',
    description: 'Event zapisu na newsletter',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: 'newsletter_signup' },
      { type: 'list', key: 'eventParameters', list: [
        { type: 'map', map: [
          { type: 'template', key: 'name', value: 'source' },
          { type: 'template', key: 'value', value: '{{DLV - newsletter_source}}' },
        ]},
      ]},
    ],
    firingTriggerId: ['<TRIGGER_FORM_newsletter>'],
  },
  'pageview-marketing-consent': {
    name: 'GA4 — page_view (only with marketing consent)',
    type: 'googtag',
    description: 'Page view wysyłany TYLKO gdy użytkownik wyraził zgodę na marketing',
    parameter: [
      { type: 'template', key: 'tagId', value: MEASUREMENT_ID },
      { type: 'template', key: 'eventName', value: 'page_view_consented' },
    ],
    firingTriggerId: ['<TRIGGER_PV_consented>'],
  },
};

// ── Custom tag z --name/--type/--trigger/--param ──
function buildCustom() {
  return {
    name: flag('name', 'Custom Tag'),
    type: flag('type', 'gaawe'),
    parameter: JSON.parse(flag('param', '[]')),
    firingTriggerId: flag('trigger', '').split(',').filter(Boolean),
  };
}

let tagConfig;
if (PRESET && PRESETS[PRESET]) {
  tagConfig = PRESETS[PRESET];
  console.log(`→ Using preset: ${PRESET}`);
} else if (CUSTOM) {
  tagConfig = buildCustom();
  console.log(`→ Building custom tag: ${tagConfig.name}`);
} else if (PRESET) {
  console.error(`❌ Unknown preset: ${PRESET}`);
  console.error(`   Known: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
} else {
  console.error(`❌ Brak --preset <name> ani --custom`);
  console.error(`   Presety: ${Object.keys(PRESETS).join(', ')}`);
  console.error(`   Lub użyj --custom z --name/--type/--trigger/--param`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log('\n--- DRY RUN — nic nie wysyłam ---');
  console.log(JSON.stringify(tagConfig, null, 2));
  process.exit(0);
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const url = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/tags`;

const r = await client.request({ url, method: 'POST', data: tagConfig });
const created = r.data;
console.log(`\n✅ Tag created:`);
console.log(`   tagId: ${created.tagId}`);
console.log(`   path:  ${created.path}`);
console.log(`   name:  ${created.name}`);
console.log(`   type:  ${created.type}`);
console.log(`\n⚠ Następne kroki:`);
console.log(`   1. node scripts/gtm-create-trigger.mjs --preset havan-signup`);
console.log(`   2. node scripts/gtm-create-variable.mjs --name "DLV - havan_id" --dlvar havan_id`);
console.log(`   3. Zaktualizuj ten tag (replace firingTriggerId) → tagId=${created.tagId}`);
console.log(`   4. node scripts/gtm-publish.mjs --version-name "v2 - konwersje"`);
