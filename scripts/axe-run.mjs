#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs/promises';
import * as axe from 'axe-core';

const pages = [
  '/',
  '/teachings',
  '/about',
  '/contact',
  '/gallery',
  '/events',
  '/donations',
  '/en/',
  '/en/teachings',
  '/en/about',
  '/en/contact',
  '/en/gallery',
  '/en/events',
  '/en/donations'
];

async function main() {
  await fs.mkdir('test-results', { recursive: true });

  const port = process.env.AUDIT_PORT || '39755';
  for (const pagePath of pages) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = `http://localhost:${port}${pagePath}`;
    console.log('Scanning', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      // Inject axe-core from local dependency (avoids CDN/network issues)
      await page.addScriptTag({ content: axe.source });
      const result = await page.evaluate(async () => await window.axe.run());
      const safeName = pagePath === '/' ? 'root' : pagePath.replace(/^\//, '').replace(/\//g, '_');
      await fs.writeFile(`test-results/axe-${safeName}.json`, JSON.stringify(result, null, 2));
      console.log('Saved test-results/axe-' + safeName + '.json - violations:', result.violations.length);
    } catch (err) {
      console.error('Error scanning', url, err);
    } finally {
      try { await page.close(); } catch {}
      try { await context.close(); } catch {}
      try { await browser.close(); } catch {}
    }
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
