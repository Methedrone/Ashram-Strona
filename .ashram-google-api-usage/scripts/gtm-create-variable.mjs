#!/usr/bin/env node
/**
 * gtm-create-variable.mjs
 *
 * Tworzy nową variable (data layer, constant, lookup table).
 *
 * Użycie:
 *   node scripts/gtm-create-variable.mjs --name "DLV - havan_id" --dlvar havan_id
 *   node scripts/gtm-create-variable.mjs --name "Constant - Currency" --constant PLN
 *   node scripts/gtm-create-variable.mjs --name "URL Path" --jsvar "window.location.pathname"
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
const NAME = flag('name', null);
const DLVAR = flag('dlvar', null);
const CONSTANT = flag('constant', null);
const JSVAR = flag('jsvar', null);
const DRY_RUN = args.includes('--dry-run');

if (!NAME) {
  console.error('❌ Brak --name');
  process.exit(1);
}
if (!DLVAR && !CONSTANT && !JSVAR) {
  console.error('❌ Podaj --dlvar <name> | --constant <value> | --jsvar "<js>"');
  process.exit(1);
}

let variableConfig;
if (DLVAR) {
  variableConfig = {
    name: NAME,
    type: 'v', // Data Layer Variable
    parameter: [
      { type: 'template', key: 'dataLayerVersion', value: '2' },
      { type: 'template', key: 'name', value: DLVAR },
    ],
  };
} else if (CONSTANT) {
  variableConfig = {
    name: NAME,
    type: 'c', // Constant
    parameter: [
      { type: 'template', key: 'value', value: CONSTANT },
    ],
  };
} else if (JSVAR) {
  variableConfig = {
    name: NAME,
    type: 'jsm', // JavaScript Variable
    parameter: [
      { type: 'template', key: 'javascript', value: JSVAR },
    ],
  };
}

if (DRY_RUN) {
  console.log(JSON.stringify(variableConfig, null, 2));
  process.exit(0);
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const url = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/variables`;

const r = await client.request({ url, method: 'POST', data: variableConfig });
const created = r.data;
console.log(`✅ Variable created: ${created.name} (id=${created.variableId})`);
