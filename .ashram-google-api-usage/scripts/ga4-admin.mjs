#!/usr/bin/env node
/**
 * ga4-admin.mjs
 *
 * Operacje administracyjne na GA4 property — listowanie streams, tworzenie
 * custom dimensions, audiences. Wymaga scope analytics.edit.
 *
 * Użycie:
 *   node scripts/ga4-admin.mjs --action list-streams
 *   node scripts/ga4-admin.mjs --action create-dim --name event_type --display "Event Type" --scope EVENT
 *   node scripts/ga4-admin.mjs --action mark-conversion --event sign_up_havan
 */

import 'dotenv/config';
import { GoogleAuth } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/analytics.edit'];
const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
if (!PROPERTY_ID) {
  console.error('❌ Brak GA4_PROPERTY_ID w .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (n, fb) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};
const ACTION = flag('action', 'list-streams');

const auth = new GoogleAuth({ scopes: SCOPES });
const client = await auth.getClient();
const base = `https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}`;
const baseAlpha = `https://analyticsadmin.googleapis.com/v1alpha/properties/${PROPERTY_ID}`;

async function call(method, url, body) {
  const r = await client.request({ url, method, data: body });
  return r.data;
}

switch (ACTION) {
  case 'list-streams': {
    const data = await call('GET', `${base}/dataStreams`);
    console.log(`\nData streams (${data.dataStreams?.length ?? 0}):`);
    for (const s of data.dataStreams ?? []) {
      console.log(`  - ${s.displayName} (${s.type})  id=${s.name.split('/').pop()}`);
    }
    break;
  }
  case 'list-custom-dims': {
    const data = await call('GET', `${base}/customDimensions`);
    console.log(`\nCustom dimensions (${data.customDimensions?.length ?? 0}):`);
    for (const d of data.customDimensions ?? []) {
      console.log(`  - ${d.parameterName.padEnd(25)}  "${d.displayName}"  scope=${d.scope}`);
    }
    break;
  }
  case 'list-conversions': {
    const data = await call('GET', `${base}/conversionEvents`);
    console.log(`\nConversion events (${data.conversionEvents?.length ?? 0}):`);
    for (const c of data.conversionEvents ?? []) {
      console.log(`  - ${c.eventName}  custom=${c.custom ?? false}`);
    }
    break;
  }
  case 'create-dim': {
    const parameterName = flag('name');
    const displayName = flag('display', parameterName);
    const scope = flag('scope', 'EVENT');
    if (!parameterName) {
      console.error('❌ --name wymagane');
      process.exit(1);
    }
    const created = await call('POST', `${base}/customDimensions`, {
      parameterName,
      displayName,
      scope,
    });
    console.log('✅ Created:', created);
    break;
  }
  case 'mark-conversion': {
    const eventName = flag('event');
    if (!eventName) {
      console.error('❌ --event wymagane');
      process.exit(1);
    }
    const created = await call('POST', `${base}/conversionEvents`, {
      eventName,
      custom: true,
    });
    console.log('✅ Conversion event:', created);
    break;
  }
  case 'list-audiences': {
    const data = await call('GET', `${baseAlpha}/audiences`);
    console.log(`\nAudiences (${data.audiences?.length ?? 0}):`);
    for (const a of data.audiences ?? []) {
      console.log(`  - ${a.displayName}  members=${a.membershipDurationDays}d`);
    }
    break;
  }
  default:
    console.error(`❌ Unknown --action: ${ACTION}`);
    console.error(`   Known: list-streams | list-custom-dims | list-conversions | create-dim | mark-conversion | list-audiences`);
    process.exit(1);
}
