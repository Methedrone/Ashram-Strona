#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

let sharp;
try {
  // dynamic import so script can be added before deps are installed
  sharp = (await import('sharp')).default;
} catch (err) {
  globalThis.console.error('The "sharp" module is not installed. Run `npm install` and try again.');
  globalThis.process.exit(1);
}

const inputDir = path.resolve('public/images');
const outBase = path.resolve('public/images/optimized');
const widths = [480, 768, 1024, 1600];
const quality = 80;
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function walk(dir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Prevent re-processing generated output (keeps runs idempotent).
      if (path.resolve(full) === outBase) continue;
      files = files.concat(await walk(full));
    }
    else if (e.isFile() && exts.has(path.extname(e.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function processFile(filePath, inputDir, outBase, widths, quality) {
  try {
    const rel = path.relative(inputDir, filePath).split(path.sep).join('/');
    const dir = path.dirname(rel) === '.' ? '' : path.dirname(rel);
    const name = path.basename(rel, path.extname(rel));
    const outDir = path.join(outBase, dir);
    await ensureDir(outDir);

    const image = sharp(filePath);
    const meta = await image.metadata();

    const variants = [];
    for (const w of widths) {
      // don't upscale
      const shouldResize = !meta.width || meta.width > w;
      const resizeOpts = shouldResize ? { width: w } : { width: Math.min(meta.width || w, w), withoutEnlargement: true };

      const webpName = `${name}-w${w}.webp`;
      const avifName = `${name}-w${w}.avif`;
      const webpOut = path.join(outDir, webpName);
      const avifOut = path.join(outDir, avifName);

      const webpExists = await fs.access(webpOut).then(() => true).catch(() => false);
      const avifExists = await fs.access(avifOut).then(() => true).catch(() => false);

      if (!webpExists) {
        await image.clone().resize(resizeOpts).webp({ quality, effort: 4 }).toFile(webpOut);
      }
      if (!avifExists) {
        await image.clone().resize(resizeOpts).avif({ quality }).toFile(avifOut);
      }

      variants.push({
        width: w,
        webp: `/images/optimized/${dir ? dir + '/' : ''}${webpName}`,
        avif: `/images/optimized/${dir ? dir + '/' : ''}${avifName}`
      });
    }

    globalThis.console.log('Processed', rel, '->', variants.length, 'variants');
    return { rel, variants };
  } catch (err) {
    globalThis.console.error('Error processing', filePath, err);
    return null;
  }
}

async function process() {
  const exists = await (async () => {
    try { await fs.access(inputDir); return true; } catch { return false; }
  })();
  if (!exists) {
    globalThis.console.error('No images found at', inputDir);
    globalThis.process.exit(1);
  }

  const files = await walk(inputDir);
  await ensureDir(outBase);
  const manifest = {};

  const concurrency = 8;
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(f => processFile(f, inputDir, outBase, widths, quality)));
    for (const res of results) {
      if (res) manifest[res.rel] = { variants: res.variants };
    }
  }

  const manifestPath = path.join(outBase, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  globalThis.console.log('Wrote manifest to', manifestPath);
}

process().catch((err) => {
  globalThis.console.error(err);
  globalThis.process.exitCode = 1;
});
