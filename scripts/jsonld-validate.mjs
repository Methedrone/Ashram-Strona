#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs/promises';

const pages = ['/', '/en'];

async function main() {
  await fs.mkdir('test-results', { recursive: true });
  const port = process.env.AUDIT_PORT || '39755';

  let hasErrors = false;
  for (const pagePath of pages) {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = `http://localhost:${port}${pagePath}`;
    console.log('Validating JSON-LD on', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      const scripts = await page.$$eval('script[type="application/ld+json"]', nodes => nodes.map(n => n.innerText));
      const results = scripts.map((s) => {
        try {
          const parsed = JSON.parse(s);
          const hasContext = parsed['@context'] || (parsed['@graph'] && parsed['@graph'].length > 0);
          const hasType = parsed['@type'] || (Array.isArray(parsed['@graph']) && parsed['@graph'].some(x => x['@type'])) || false;
          return { valid: true, hasContext: !!hasContext, hasType: !!hasType, parsed };
        } catch (err) {
          return { valid: false, error: String(err), raw: s };
        }
      });
      if (results.some(r => !r.valid)) {
        console.error('Invalid JSON-LD detected on', url);
        hasErrors = true;
      }
      const safeName = pagePath === '/' ? 'root' : pagePath.replace(/^\//, '').replace(/\//g, '_');
      await fs.writeFile(`test-results/jsonld-${safeName}.json`, JSON.stringify(results, null, 2));
      console.log('Saved test-results/jsonld-' + safeName + '.json - scripts found:', scripts.length);
    } catch (err) {
      console.error('Error validating JSON-LD on', url, err);
      hasErrors = true;
    } finally {
      try { await page.close(); } catch {}
      try { await context.close(); } catch {}
      try { await browser.close(); } catch {}
    }
  }
  if (hasErrors) {
    console.error('One or more pages had JSON-LD errors or failed to scan. Failing audit.');
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
