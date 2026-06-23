#!/usr/bin/env node
/**
 * Copy Cloudflare Pages Functions to dist/ so cloudflare/pages-action
 * (which only uploads dist/) can deploy them. Without this script,
 * /api/* endpoints silently 404 in production because the root
 * functions/ directory never reaches the Pages deployment.
 *
 * Run automatically via `npm run build:cf` (used by deploy.yml).
 * Idempotent — safe to run on every build.
 */
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "functions");
const dst = resolve(root, "dist/functions");

if (!existsSync(src)) {
  console.log("copy-functions: no functions/ directory, skipping");
  process.exit(0);
}

if (!existsSync(resolve(root, "dist"))) {
  console.error("copy-functions: dist/ does not exist — run `astro build` first");
  process.exit(1);
}

await rm(dst, { recursive: true, force: true });
await mkdir(resolve(root, "dist"), { recursive: true });
await cp(src, dst, { recursive: true });
console.log(`copy-functions: copied ${src} → ${dst}`);
