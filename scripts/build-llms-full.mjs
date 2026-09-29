#!/usr/bin/env node
/**
 * build-llms-full.mjs — generates llms-full.txt from the built site.
 *
 * Walks dist/client (Cloudflare adapter v14 output), extracts the <main>
 * content of each HTML page, and assembles one markdown file for AI crawlers
 * (llmstxt.org pattern). Writes both the repo copy (public/) and the copy
 * that ships in the deploy (dist/client/), so the deployed file is always in
 * sync with the site content. Wired into `npm run build`.
 *
 * Usage: node scripts/build-llms-full.mjs (or just `npm run build`)
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist/client';
const OUTS = ['public/llms-full.txt', 'dist/client/llms-full.txt'];
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
    let rel = relative(DIST, file).replace(/\\/g, '/');
    // "index.html" -> "", "about/index.html" -> "about/", "404.html" -> "404/"
    rel = rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '/');
    if (rel === '404/') continue; // error page — not part of the site content
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

  const out = header + body;
  for (const f of OUTS) await writeFile(f, out, 'utf-8');
  console.log(`✅ ${OUTS.join(' + ')} — ${pages.length} pages, ${(out.length / 1024) | 0} KB`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
