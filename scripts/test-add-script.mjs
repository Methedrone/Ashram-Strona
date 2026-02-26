#!/usr/bin/env node
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:39756/', { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: 'window.__TEST_INJECTED = 1; console.log("injected")' });
  const value = await page.evaluate(() => window.__TEST_INJECTED);
  console.log('injection result', value);
  await browser.close();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
