#!/usr/bin/env node
/**
 * indexing-auth.mjs — OAuth Bearer dla Web Search Indexing API
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SA_PATH = process.env.ASHRAM_INDEXING_SERVICE_ACCOUNT;
if (!SA_PATH) { console.error('❌ Brak ASHRAM_INDEXING_SERVICE_ACCOUNT'); process.exit(1); }
const abs = resolve(process.cwd(), SA_PATH);
if (!existsSync(abs)) { console.error(`❌ Brak ${abs}`); process.exit(1); }

let JWT;
try { ({ JWT } = await import('google-auth-library')); }
catch { console.error('❌ Zainstaluj google-auth-library'); process.exit(1); }

const sa = JSON.parse(await readFile(abs, 'utf8'));
const jwt = new JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});
await jwt.authorize();
console.log((await jwt.getAccessToken()).token);
