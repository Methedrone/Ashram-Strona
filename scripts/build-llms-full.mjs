#!/usr/bin/env node
/**
 * build-llms-full.mjs — generates public/llms-full.txt from the built site.
 *
 * Walks dist (recursive), extracts the <main> content of each HTML page,
 * and assembles one markdown file for AI crawlers (llmstxt.org pattern).
 *
 * Usage: run AFTER `npm run build`:
 *   node scripts/build-llms-full.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const OUT = 'public/llms-full.txt';
const SITE_URL = 'https://babaji.org.pl';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const files = await walk(DIST);
  const pages = [];

  for (const file of files) {
    const rel = relative(DIST, file).replace(/\\/g, '/').replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
    const url = `${SITE_URL}/${rel}`;
    const html = await readFile(file, 'utf-8');
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i) || html.match(/<body[\s\S]*?<\/body>/i);
    const text = mainMatch ? htmlToText(mainMatch[0]) : '';
    if (!text) continue;
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    pages.push({ url, title: titleMatch ? titleMatch[1].trim() : url, text });
  }

  pages.sort((a, b) => a.url.localeCompare(b.url));

  const header = `# Babaji Ashram Poland — Full Site Content\n\n> Generated ${new Date().toISOString().slice(0, 10)} from the built site (${pages.length} pages).\n> Human-readable index: /llms.txt\n\n`;
  const body = pages
    .map(p => `## ${p.title}\n\nSource: ${p.url}\n\n${p.text}\n`)
    .join('\n---\n\n');

  await writeFile(OUT, header + body, 'utf-8');
  console.log(`✅ ${OUT} — ${pages.length} pages, ${(header.length + body.length) / 1024 | 0} KB`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
