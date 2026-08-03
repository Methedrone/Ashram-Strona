#!/usr/bin/env node
/**
 * gtm-create-trigger.mjs
 *
 * Tworzy nowy trigger w GTM — pageview, click, form submit, custom event, scroll itp.
 *
 * Użycie:
 *   node scripts/gtm-create-trigger.mjs --preset all-pages
 *   node scripts/gtm-create-trigger.mjs --preset form-kontakt
 *   node scripts/gtm-create-trigger.mjs --preset click-donate
 *   node scripts/gtm-create-trigger.mjs --preset ce-signup-havan
 *   node scripts/gtm-create-trigger.mjs --custom --name "..." --type pageview
 *   node scripts/gtm-create-trigger.mjs --dry-run
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.edit.containers'];
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;
const WORKSPACE_ID = process.env.GTM_DEFAULT_WORKSPACE ?? '1';

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

const PRESETS = {
  'all-pages': {
    name: 'CE — All Pages',
    type: 'pageview',
    description: 'Wszystkie strony (domyślny pageview)',
  },
  'form-kontakt': {
    name: 'Form Submit — /kontakt',
    type: 'formSubmission',
    description: 'Wysłanie formularza kontaktowego',
    filter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{Page URL}}' },
        { type: 'template', key: 'arg1', value: 'https://babaji.org.pl/kontakt' },
      ],
    }],
  },
  'click-donate': {
    name: 'CE — click .donate-btn',
    type: 'click',
    description: 'Kliknięcie w przycisk donate',
    filter: [{
      type: 'cssSelector',
      parameter: [
        { type: 'template', key: 'arg0', value: '.donate-btn' },
      ],
    }],
  },
  'ce-signup-havan': {
    name: 'CE — sign_up_havan (custom event)',
    type: 'customEvent',
    description: 'Wyzwalany przez dataLayer.push({event: "sign_up_havan"})',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: 'sign_up_havan' },
      ],
    }],
  },
  'ce-click-donate': {
    name: 'CE — click_donate (custom event)',
    type: 'customEvent',
    description: 'Wyzwalany przez dataLayer.push({event: "click_donate"})',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: 'click_donate' },
      ],
    }],
  },
  'ce-contact-form': {
    name: 'CE — contact_form_submit',
    type: 'customEvent',
    description: 'Wyzwalany przez dataLayer.push({event: "contact_form_submit"})',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: 'contact_form_submit' },
      ],
    }],
  },
  'ce-newsletter': {
    name: 'CE — newsletter_signup',
    type: 'customEvent',
    customEventFilter: [{
      type: 'equals',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{_event}}' },
        { type: 'template', key: 'arg1', value: 'newsletter_signup' },
      ],
    }],
  },
  'link-external': {
    name: 'CE — outbound link',
    type: 'linkClick',
    filter: [{
      type: 'contains',
      parameter: [
        { type: 'template', key: 'arg0', value: '{{Click Hostname}}' },
        { type: 'template', key: 'arg1', value: '{{Page Hostname}}' },
      ],
    }],
    // uwaga: 'contains' z różnymi hostnames triggeruje — trzeba dodać negate
  },
  'scroll-25-50-75-100': {
    name: 'CE — scroll 25/50/75/100',
    type: 'scrollDepth',
    parameter: [
      { type: 'template', key: 'verticalThresholds', value: '25,50,75,100' },
      { type: 'template', key: 'horizontalThresholds', value: '' },
    ],
  },
};

let triggerConfig;
if (PRESET && PRESETS[PRESET]) {
  triggerConfig = PRESETS[PRESET];
  console.log(`→ Using preset: ${PRESET}`);
} else if (CUSTOM) {
  triggerConfig = {
    name: flag('name', 'Custom Trigger'),
    type: flag('type', 'pageview'),
  };
} else {
  console.error(`❌ Brak --preset ani --custom`);
  console.error(`   Presety: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log('\n--- DRY RUN ---');
  console.log(JSON.stringify(triggerConfig, null, 2));
  process.exit(0);
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const url = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/triggers`;

const r = await client.request({ url, method: 'POST', data: triggerConfig });
const created = r.data;
console.log(`\n✅ Trigger created:`);
console.log(`   triggerId: ${created.triggerId}`);
console.log(`   name:      ${created.name}`);
console.log(`   type:      ${created.type}`);
