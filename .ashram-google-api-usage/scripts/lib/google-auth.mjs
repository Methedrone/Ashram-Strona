/**
 * lib/google-auth.mjs
 *
 * Helper autoryzacji Google dla wszystkich skryptów w folderze scripts/.
 * Obsługuje:
 *   - API key (PageSpeed) — bez OAuth
 *   - Service Account (GA4, GSC, Indexing) — OAuth 2.0 z JWT
 *   - Domain-wide delegation (opcja)
 *
 * Użycie:
 *   import { getApiKey, getServiceAuth, getAccessToken } from './lib/google-auth.mjs';
 *
 *   // PageSpeed
 *   const KEY = getApiKey();
 *   const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?key=${KEY}&url=...`;
 *
 *   // GA4, GSC, Indexing
 *   const auth = getServiceAuth();
 *   const client = await auth.getClient();
 *   const res = await client.request({ url, method: 'POST', data });
 *
 *   // Albo bezpośrednio token
 *   const token = await getAccessToken(scopes);
 */

import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..'); // .ashram-google-api-usage/

// ─── 1. API key (PageSpeed) ─────────────────────────────────────────────
export function getApiKey() {
  const k = process.env.ASHRAM_GOOGLE_API_KEY;
  if (!k) {
    throw new Error(
      '❌ Brak ASHRAM_GOOGLE_API_KEY w .env. Dodaj klucz Google API (z restriction PageSpeed Insights API).'
    );
  }
  return k;
}

// ─── 2. Service account JSON key ───────────────────────────────────────
let cachedKey = null;
function loadServiceAccountKey() {
  if (cachedKey) return cachedKey;

  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      `❌ Brak GOOGLE_APPLICATION_CREDENTIALS w .env.\n` +
        `   Wskaż ścieżkę do JSON key service account:\n` +
        `   GOOGLE_APPLICATION_CREDENTIALS=${PROJECT_ROOT}/credentials/ashram-bot.json`
    );
  }
  const abs = p.startsWith('/') ? p : resolve(process.cwd(), p);
  if (!existsSync(abs)) {
    throw new Error(
      `❌ Nie znaleziono pliku: ${abs}\n` +
        `   1. Google Cloud → IAM & Admin → Service Accounts → utwórz ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '' : 'ashram-bot'}\n` +
        `   2. Add Key → Create new (JSON) → pobierz\n` +
        `   3. Zapisz w ${PROJECT_ROOT}/credentials/ashram-bot.json\n` +
        `   4. chmod 600 ${PROJECT_ROOT}/credentials/ashram-bot.json`
    );
  }
  try {
    cachedKey = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    throw new Error(`❌ Niepoprawny JSON w ${abs}: ${e.message}`);
  }
  if (!cachedKey.client_email || !cachedKey.private_key) {
    throw new Error(
      `❌ ${abs} nie zawiera client_email/private_key. To nie jest service account key?`
    );
  }
  return cachedKey;
}

// ─── 3. GoogleAuth client (lazy) ────────────────────────────────────────
let _GoogleAuth = null;
async function getGoogleAuth() {
  if (_GoogleAuth) return _GoogleAuth;
  try {
    const mod = await import('google-auth-library');
    _GoogleAuth = mod.GoogleAuth;
  } catch {
    throw new Error(
      `❌ Brak paczki 'google-auth-library'. Zainstaluj:\n` +
        `   cd .ashram-google-api-usage && npm install google-auth-library`
    );
  }
  return _GoogleAuth;
}

export async function getServiceAuth(scopes) {
  if (!scopes || scopes.length === 0) {
    throw new Error('❌ getServiceAuth wymaga tablicy scopes, np. ["https://www.googleapis.com/auth/analytics.readonly"]');
  }
  const GoogleAuth = await getGoogleAuth();
  return new GoogleAuth({
    credentials: loadServiceAccountKey(),
    scopes,
  });
}

// ─── 4. Prosty bearer token (bezpośrednio) ─────────────────────────────
export async function getAccessToken(scopes) {
  const auth = await getServiceAuth(scopes);
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  return token;
}

// ─── 5. Diagnostyka (dla --diag) ───────────────────────────────────────
export async function diagnose() {
  console.log('═'.repeat(60));
  console.log('  Google API auth diagnostics');
  console.log('═'.repeat(60));

  // 1. API key
  const hasKey = !!process.env.ASHRAM_GOOGLE_API_KEY;
  console.log(`\n[1] ASHRAM_GOOGLE_API_KEY: ${hasKey ? '✅ present' : '❌ MISSING'}`);
  if (hasKey) {
    console.log(`    value: ${process.env.ASHRAM_GOOGLE_API_KEY.slice(0, 10)}...`);
    // test PSI
    try {
      const r = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=${process.env.ASHRAM_GOOGLE_API_KEY}&strategy=mobile`
      );
      console.log(`    PSI test: ${r.status === 200 ? '✅' : '❌'} HTTP ${r.status}`);
    } catch (e) {
      console.log(`    PSI test: ❌ ${e.message}`);
    }
  }

  // 2. Service account
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log(`\n[2] GOOGLE_APPLICATION_CREDENTIALS: ${creds ? '✅ ' + creds : '❌ MISSING'}`);
  if (creds) {
    const abs = creds.startsWith('/') ? creds : resolve(process.cwd(), creds);
    const exists = existsSync(abs);
    console.log(`    file exists: ${exists ? '✅' : '❌'} ${abs}`);
    if (exists) {
      try {
        const key = loadServiceAccountKey();
        console.log(`    client_email: ${key.client_email}`);
        console.log(`    project_id: ${key.project_id}`);
        // test token
        try {
          const token = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform']);
          console.log(`    token test: ✅ (length: ${token.length})`);
        } catch (e) {
          console.log(`    token test: ❌ ${e.message.slice(0, 200)}`);
        }
      } catch (e) {
        console.log(`    ❌ ${e.message}`);
      }
    }
  }

  // 3. GA4 / GSC
  console.log(`\n[3] GA4_PROPERTY_ID: ${process.env.GA4_PROPERTY_ID || '❌ MISSING'}`);
  console.log(`    GA4_MEASUREMENT_ID: ${process.env.GA4_MEASUREMENT_ID || '❌ MISSING'}`);
  console.log(`    GSC_SITE_URL: ${process.env.GSC_SITE_URL || '❌ MISSING'}`);

  // 4. IndexNow
  console.log(`\n[4] INDEXNOW_KEY: ${process.env.INDEXNOW_KEY ? '✅ present' : '⚠ not set (optional)'}`);

  console.log('\n' + '═'.repeat(60));
}

// ─── 6. CLI --diag ──────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--diag')) {
    await diagnose();
  } else {
    console.log('Usage: node lib/google-auth.mjs --diag');
  }
}
