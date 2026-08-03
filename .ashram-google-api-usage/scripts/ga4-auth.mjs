#!/usr/bin/env node
/**
 * ga4-auth.mjs — generuje OAuth Bearer token dla GA4 Data / Admin API
 * używając service account JSON.
 *
 * Użycie:
 *   TOKEN=$(node .ashram-google-api-usage/scripts/ga4-auth.mjs)
 *   curl -H "Authorization: Bearer $TOKEN" "https://analyticsdata.googleapis.com/v1beta/properties/123:runReport" -d '{...}'
 *
 * Wymaga: ASHRAM_GA4_SERVICE_ACCOUNT=./.ashram-google-api-usage/credentials/ga4-service-account.json
 *         + npm install google-auth-library (jeśli brak w package.json)
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SA_PATH = process.env.ASHRAM_GA4_SERVICE_ACCOUNT;
if (!SA_PATH) { console.error('❌ Brak ASHRAM_GA4_SERVICE_ACCOUNT w .env'); process.exit(1); }
const abs = resolve(process.cwd(), SA_PATH);
if (!existsSync(abs)) { console.error(`❌ Nie znaleziono ${abs}`); process.exit(1); }

let JWT;
try {
  ({ JWT } = await import('google-auth-library'));
} catch {
  console.error('❌ Brak google-auth-library. Zainstaluj: npm install google-auth-library');
  process.exit(1);
}

const sa = JSON.parse(await readFile(abs, 'utf8'));
const jwt = new JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.edit',
  ],
});
await jwt.authorize();
const tok = await jwt.getAccessToken();
console.log(tok.token);
