#!/usr/bin/env node
/**
 * gtm-grant-access.mjs
 *
 * Nadaje dostęp do GTM account/containers dla danego emaila.
 * Przydatne do onboardingu nowych deweloperów lub SA z innych projektów.
 *
 * Użycie:
 *   node scripts/gtm-grant-access.mjs --email "newdev@example.com" --role edit
 *   node scripts/gtm-grant-access.mjs --email "ashram-bot@other-project.iam.gserviceaccount.com" --role publish --container-only
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/tagmanager.manage.users'];
const ACCOUNT_ID = process.env.GTM_ACCOUNT_ID;
const CONTAINER_ID = process.env.GTM_INTERNAL_CONTAINER_ID ?? process.env.GTM_CONTAINER_ID;

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const EMAIL = flag('email', null);
const ROLE = flag('role', 'read');
const CONTAINER_ONLY = args.includes('--container-only');

if (!EMAIL) {
  console.error('❌ Brak --email');
  process.exit(1);
}
if (!ACCOUNT_ID) {
  console.error('❌ Brak GTM_ACCOUNT_ID w .env');
  process.exit(1);
}

const ROLE_MAP = {
  noAccess: ['noAccess'],
  read: ['read'],
  edit: ['edit'],
  approve: ['approve'],
  publish: ['publish', 'edit'], // publish może wszystko co edit + publish
  // specjalne: 'manage' = full
};

const body = {
  emailAddress: EMAIL,
  accountAccess: { permission: CONTAINER_ONLY ? [] : [ROLE] },
};
if (CONTAINER_ID) {
  body.containerAccess = [{ containerId: CONTAINER_ID, permission: [ROLE] }];
}

const auth = await getServiceAuth(SCOPES);
const client = await auth.getClient();
const url = `https://tagmanager.googleapis.com/tagmanager/v2/accounts/${ACCOUNT_ID}/user_permissions`;

const r = await client.request({ url, method: 'POST', data: body });
console.log(`✅ Dostęp nadany:`);
console.log(`   userId:    ${r.data.userId ?? '—'}`);
console.log(`   email:     ${r.data.emailAddress}`);
console.log(`   account:   ${JSON.stringify(r.data.accountAccess?.permission)}`);
console.log(`   container: ${JSON.stringify(r.data.containerAccess)}`);
