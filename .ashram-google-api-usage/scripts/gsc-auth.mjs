#!/usr/bin/env node
/**
 * gsc-auth.mjs — OAuth Bearer token dla Google Search Console API
 * Użycie: TOKEN=$(node .ashram-google-api-usage/scripts/gsc-auth.mjs); curl -H "Authorization: Bearer $TOKEN" "https://searchconsole.googleapis.com/v1/sites/..."
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SA_PATH = process.env.ASHRAM_GSC_SERVICE_ACCOUNT;
if (!SA_PATH) { console.error('❌ Brak ASHRAM_GSC_SERVICE_ACCOUNT w .env'); process.exit(1); }
const abs = resolve(process.cwd(), SA_PATH);
if (!existsSync(abs)) { console.error(`❌ Nie znaleziono ${abs}`); process.exit(1); }

let JWT;
try { ({ JWT } = await import('google-auth-library')); }
catch { console.error('❌ Zainstaluj google-auth-library: npm install google-auth-library'); process.exit(1); }

const sa = JSON.parse(await readFile(abs, 'utf8'));
const jwt = new JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: ['https://www.googleapis.com/auth/webmasters', 'https://www.googleapis.com/auth/webmasters.readonly'],
});
await jwt.authorize();
console.log((await jwt.getAccessToken()).token);
