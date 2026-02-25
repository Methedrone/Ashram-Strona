#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const pages = [
  '/',
  '/teachings',
  '/about',
  '/contact',
  '/gallery',
  '/events',
  '/donations',
  '/en',
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
  // Load axe-core source from node_modules (fallback to dynamic import)
    let axeSource = '';
    const axeFilePath = path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');
    try {
      axeSource = await fs.readFile(axeFilePath, 'utf8');
    } catch (err) {
      try {
        const axeModule = await import('axe-core');
        axeSource = axeModule.source || (axeModule.default && axeModule.default.source) || '';
      } catch (err2) {
        console.error('Failed to load axe-core source; axe injection will fail', err2);
      }
    }
  let hasErrors = false;
  for (const pagePath of pages) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = `http://localhost:${port}${pagePath}`;
    console.log('Scanning', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      // Inject axe-core from local dependency (avoids CDN/network issues)
        if (axeSource) {
          try {
            // Prefer adding via local file path to avoid large-content serialization
            await page.addScriptTag({ path: axeFilePath });
          } catch (e) {
            // Fallback to injecting content if path-based injection fails
            await page.addScriptTag({ content: axeSource });
          }
        } else {
          console.warn('No axe source available; skipping axe injection for', url);
        }
      const result = await page.evaluate(async () => await window.axe.run());
      const safeName = pagePath === '/' ? 'root' : pagePath.replace(/^\//, '').replace(/\//g, '_');
      await fs.writeFile(`test-results/axe-${safeName}.json`, JSON.stringify(result, null, 2));
      console.log('Saved test-results/axe-' + safeName + '.json - violations:', result.violations.length);
    } catch (err) {
      console.error('Error scanning', url, err);
      hasErrors = true;
    } finally {
      try { await page.close(); } catch {}
      try { await context.close(); } catch {}
      try { await browser.close(); } catch {}
    }
  }
  if (hasErrors) {
    console.error('One or more pages failed to scan. Failing audit.');
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
