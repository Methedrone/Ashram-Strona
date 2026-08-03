#!/usr/bin/env node
/**
 * gtm-list.mjs
 *
 * Listuje accounts, containers, workspaces, tags, triggers, variables w GTM.
 * Pomocne do diagnostyki i setup.
 *
 * Użycie:
 *   node scripts/gtm-list.mjs                       # list accounts
 *   node scripts/gtm-list.mjs --containers          # containers w domyślnym account
 *   node scripts/gtm-list.mjs --workspaces          # workspaces w domyślnym container
 *   node scripts/gtm-list.mjs --tags                # tagi w domyślnym workspace
 *   node scripts/gtm-list.mjs --triggers
 *   node scripts/gtm-list.mjs --variables
 *   node scripts/gtm-list.mjs --environments        # env (live, dev, staging)
 *   node scripts/gtm-list.mjs --version-live       # aktualnie opublikowana wersja
 *   node scripts/gtm-list.mjs --version-latest      # ostatnio utworzona
 *   node scripts/gtm-list.mjs --users              # uprawnienia userów
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.publish',
  'https://www.googleapis.com/auth/tagmanager.manage.users',
];

const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;
const WORKSPACE_ID = process.env.GTM_DEFAULT_WORKSPACE ?? '1'; // "Default Workspace" ma zawsze ID "1"

const args = process.argv.slice(2);
const mode = args.find((a) => a.startsWith('--'))?.slice(2) ?? 'accounts';

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const BASE = 'https://tagmanager.googleapis.com/tagmanager/v2';

async function call(path) {
  const url = `${BASE}${path}`;
  const r = await client.request({ url });
  return r.data;
}

function print(title, items, formatter) {
  console.log(`\n${title}:`);
  if (!items || items.length === 0) {
    console.log('  (empty)');
    return;
  }
  for (const it of items) {
    console.log(`  ${formatter(it)}`);
  }
}

switch (mode) {
  case 'accounts': {
    const data = await call('/accounts');
    print('Accounts', data.account, (a) =>
      `${a.path.padEnd(20)}  ${a.name}${a.fingerprint ? '  fp=' + a.fingerprint.slice(0, 8) : ''}`
    );
    break;
  }
  case 'containers': {
    if (!ACCOUNT_ID) throw new Error('❌ GTM_ACCOUNT_ID nie ustawiony w .env');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers`);
    print('Containers', data.container, (c) =>
      `${c.path.padEnd(35)}  ${c.name.padEnd(20)}  ${c.publicId}  ${c.usageContext?.join(',')}`
    );
    break;
  }
  case 'workspaces': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces`);
    print('Workspaces', data.workspace, (w) =>
      `${w.path.padEnd(70)}  ${w.name}`
    );
    break;
  }
  case 'tags': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/tags`);
    print(`Tags (workspace=${WORKSPACE_ID})`, data.tag, (t) =>
      `${t.tagId?.padEnd(5) ?? '?'}  ${t.name.padEnd(35)}  type=${t.type}  firing=${(t.firingTriggerId ?? []).length}  blocking=${(t.blockingTriggerId ?? []).length}`
    );
    break;
  }
  case 'triggers': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/triggers`);
    print(`Triggers (workspace=${WORKSPACE_ID})`, data.trigger, (t) =>
      `${t.triggerId?.padEnd(5) ?? '?'}  ${t.name.padEnd(40)}  type=${t.type}`
    );
    break;
  }
  case 'variables': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/variables`);
    print(`Variables (workspace=${WORKSPACE_ID})`, data.variable, (v) =>
      `${v.variableId?.padEnd(5) ?? '?'}  ${v.name.padEnd(40)}  type=${v.type}`
    );
    break;
  }
  case 'built-in': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/workspaces/${WORKSPACE_ID}/built_in_variables`);
    print(`Built-in variables (workspace=${WORKSPACE_ID})`, data.builtInVariable, (v) =>
      `${v.name.padEnd(30)}  type=${v.type}  account=${v.accountId}`
    );
    break;
  }
  case 'environments': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/environments`);
    print('Environments', data.environment, (e) =>
      `${e.path.padEnd(80)}  ${e.name.padEnd(15)}  ${e.type}  url=${e.url ?? '—'}`
    );
    break;
  }
  case 'version-live':
  case 'version-latest': {
    if (!ACCOUNT_ID || !CONTAINER_ID) throw new Error('❌ Brak GTM_ACCOUNT_ID lub GTM_CONTAINER_ID');
    const segment = mode === 'version-live' ? 'live' : 'latest';
    const data = await call(`/accounts/${ACCOUNT_ID}/containers/${CONTAINER_ID}/version_headers/${segment}`);
    console.log(`\nVersion (${segment}):`);
    if (!data) {
      console.log('  (none)');
      break;
    }
    console.log(`  path:        ${data.path}`);
    console.log(`  containerVersionId: ${data.containerVersionId}`);
    console.log(`  num containers: ${data.numContainers ?? '—'}`);
    console.log(`  num macros: ${data.numMacros ?? '—'}`);
    console.log(`  num rules:  ${data.numRules ?? '—'}`);
    console.log(`  num tags:   ${data.numTags ?? '—'}`);
    console.log(`  fingerprint: ${data.fingerprint?.slice(0, 16)}...`);
    break;
  }
  case 'users': {
    if (!ACCOUNT_ID) throw new Error('❌ GTM_ACCOUNT_ID nie ustawiony');
    const data = await call(`/accounts/${ACCOUNT_ID}/user_permissions`);
    print('User permissions', data.userPermission, (u) => {
      const accPerm = Array.isArray(u.accountAccess?.permission)
        ? u.accountAccess.permission.join(',')
        : (u.accountAccess?.permission ?? '—');
      return `${u.emailAddress?.padEnd(50) ?? '?'}  account=${accPerm}  containers=${(u.containerAccess ?? []).length}`;
    });
    break;
  }
  default:
    console.error(`❌ Unknown mode: --${mode}`);
    console.error(`   Known: --accounts, --containers, --workspaces, --tags, --triggers, --variables, --built-in, --environments, --version-live, --version-latest, --users`);
    process.exit(1);
}
