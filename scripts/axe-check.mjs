#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

async function listAxeResultFiles() {
  try {
    const entries = await fs.readdir('test-results', { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && /^axe-.*\.json$/i.test(e.name))
      .map((e) => path.join('test-results', e.name))
      .sort();
  } catch {
    return [];
  }
}

async function main() {
  const files = await listAxeResultFiles();
  if (!files.length) {
    globalThis.console.error('No axe result files found in test-results/. Make sure axe-run produced results.');
    globalThis.process.exit(1);
  }

  let totalViolations = 0;
  let hadReadErrors = false;
  const byFile = [];
  for (const f of files) {
    try {
      const raw = await fs.readFile(f, 'utf8');
      const data = JSON.parse(raw);
      const count = Array.isArray(data.violations) ? data.violations.length : 0;
      totalViolations += count;
      byFile.push({ file: f, violations: count });
    } catch (err) {
      hadReadErrors = true;
      globalThis.console.error('Failed to read/parse', f, err);
      byFile.push({ file: f, violations: null, error: String(err) });
    }
  }

  globalThis.console.log('Axe violations summary:', JSON.stringify(byFile, null, 2));
  globalThis.console.log('Total axe violations:', totalViolations);

  if (hadReadErrors) {
    globalThis.console.error('Failed to parse one or more axe result files. Failing build.');
    globalThis.process.exit(2);
  }

  if (totalViolations > 0) {
    globalThis.console.error('Accessibility violations detected. Failing build.');
    globalThis.process.exit(1);
  }
}

main().catch(err => {
  globalThis.console.error(err);
  globalThis.process.exit(2);
});
