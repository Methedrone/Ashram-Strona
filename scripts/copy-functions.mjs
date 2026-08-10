#!/usr/bin/env node
/**
 * Copy Cloudflare Pages Functions to dist/client so `wrangler pages deploy`
 * (which uploads the build output directory) can deploy them. Without this
 * script, /api/* endpoints silently 404 in production because the root
 * functions/ directory never reaches the Pages deployment.
 *
 * Adapter v14 layout: static assets → dist/client/ (was dist/ in v12).
 * Pages expects: <build-output-dir>/functions + <build-output-dir>/_routes.json.
 *
 * Also patches dist/client/_routes.json to include /api/* in the "include"
 * array — otherwise CF Pages routes /api/* requests to the static asset
 * handler and 404s.
 *
 * Run automatically via `npm run build` / `npm run build:cf`.
 * Idempotent — safe to run on every build.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "functions");
const clientDir = resolve(root, "dist/client");
const dst = resolve(clientDir, "functions");
const distRoutes = resolve(clientDir, "_routes.json");

if (!existsSync(src)) {
  console.log("copy-functions: no functions/ directory, skipping");
  process.exit(0);
}

if (!existsSync(clientDir)) {
  console.error("copy-functions: dist/client does not exist — run `astro build` first");
  process.exit(1);
}

// 1) Copy functions/ → dist/client/functions/
await rm(dst, { recursive: true, force: true });
await mkdir(clientDir, { recursive: true });
await cp(src, dst, { recursive: true });
console.log(`copy-functions: copied ${src} → ${dst}`);

// 2) Ensure dist/client/_routes.json exists — Pages expects it at the root of
//    the build output directory, not inside functions/. The adapter does not
//    generate one for static output, so take the copied functions/_routes.json.
if (!existsSync(distRoutes) && existsSync(resolve(dst, "_routes.json"))) {
  await cp(resolve(dst, "_routes.json"), distRoutes);
  console.log(`copy-functions: moved ${dst}/_routes.json → ${distRoutes}`);
}

// 3) Patch dist/client/_routes.json — add /api/* to "include" so Pages routes
//    /api/* requests to Functions instead of static asset handler.
if (existsSync(distRoutes)) {
  const raw = await readFile(distRoutes, "utf8");
  const routes = JSON.parse(raw);
  routes.include = Array.isArray(routes.include) ? routes.include : [];
  if (!routes.include.includes("/api/*")) {
    routes.include.unshift("/api/*");
  }
  await writeFile(distRoutes, JSON.stringify(routes, null, 2) + "\n");
  console.log(`copy-functions: patched ${distRoutes} → include: ${JSON.stringify(routes.include)}`);
} else {
  console.warn("copy-functions: dist/client/_routes.json missing — /api/* may 404");
}

// 4) (usunięte) Generowanie dist/client/_redirects z rewrite'ami 200 było
//    nieskuteczne — CF Pages i tak wykonuje własny 308 redirect katalogowy
//    (potwierdzone na żywo 2026-08-10: /about → 308 pomimo reguły
//    `/about /about/index.html 200`). Łańcuch 308 → /about/ → 200 jest
//    natywnym zachowaniem Pages i działa w każdej przeglądarce i dla
//    Google. Właściwy fix (zero hopów) = trailingSlash: 'always' w Astro.
