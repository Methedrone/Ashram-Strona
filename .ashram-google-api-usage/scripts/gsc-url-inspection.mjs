#!/usr/bin/env node
/**
 * gsc-url-inspection.mjs
 *
 * Sprawdza status indeksacji, mobile usability i canonical dla pojedynczego URL.
 * Endpoint: POST /v1/urlInspection/index:inspect
 *
 * Użycie:
 *   node scripts/gsc-url-inspection.mjs --url https://babaji.org.pl/
 *   node scripts/gsc-url-inspection.mjs --url https://babaji.org.pl/events/havan-30-06 --lang pl
 */

import 'dotenv/config';
import { getServiceAuth } from './lib/google-auth.mjs';

const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];
const SITE = process.env.GSC_SITE_URL ?? 'https://babaji.org.pl/';

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const URL_TO_INSPECT = flag('url', null);

if (!URL_TO_INSPECT) {
  console.error('❌ Podaj --url https://...');
  process.exit(1);
}

async function main() {
  const auth = await getServiceAuth(SCOPES);
  const client = await auth.getClient();
  const url = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
  const res = await client.request({
    url,
    method: 'POST',
    data: { inspectionUrl: URL_TO_INSPECT, siteUrl: SITE, languageCode: flag('lang', 'pl') },
  });
  const r = res.data.inspectionResult;
  if (!r) {
    console.log(JSON.stringify(res.data, null, 2));
    return;
  }

  const idx = r.indexStatusResult ?? {};
  const mob = r.mobileUsabilityResult ?? {};
  const amp = r.ampResult ?? null;

  console.log(`\n🔍 URL Inspection: ${URL_TO_INSPECT}`);
  console.log(`   Site: ${SITE}\n`);
  console.log(`   ${'─'.repeat(60)}`);
  console.log(`   Coverage state:     ${idx.coverageState ?? '—'}`);
  console.log(`   Crawled as:         ${idx.crawledAs ?? '—'}`);
  console.log(`   Google canonical:   ${idx.googleCanonical ?? '—'}`);
  console.log(`   User canonical:     ${idx.userCanonical ?? '—'}`);
  console.log(`   Indexing state:     ${idx.indexingState ?? '—'}`);
  console.log(`   Last crawl:         ${idx.lastCrawlTime ?? '—'}`);
  console.log(`   Page fetch state:   ${idx.pageFetchState ?? '—'}`);
  console.log(`   Robots.txt:         ${idx.robotsTxtState ?? '—'}`);
  console.log(`   Mobile usability:   ${mob.verdict ?? '—'}`);
  if (amp) console.log(`   AMP result:         ${amp.verdict ?? '—'}`);
  console.log(`   ${'─'.repeat(60)}\n`);

  // friendly status
  const ok = ['Submitted and indexed', 'Indexed, not submitted in sitemap', 'Crawled - currently not indexed'];
  const bad = ['Excluded by noindex tag', 'Blocked by robots.txt', 'Not found (404)', 'Soft 404', 'Server error (5xx)'];
  if (ok.includes(idx.coverageState)) {
    console.log('✅ URL jest w porządku.');
  } else if (bad.includes(idx.coverageState)) {
    console.log('❌ Problem z indeksacją — wymaga uwagi.');
  } else {
    console.log(`⚠ Status: ${idx.coverageState}`);
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  if (e.message.includes('403')) {
    console.error('   Sprawdź czy service account jest Owner w GSC.');
  }
  process.exit(1);
});
