## Audit Report — Ashram-Strona (local repo)

TL;DR
- Performed a local audit (Lighthouse, axe-core, JSON‑LD) against the built `dist/` site.
- Key results: root Lighthouse (mobile) shows slow FCP/LCP (dev run: FCP ≈ 10s, LCP ≈ 17s). Accessibility (axe) found 0–2 violations per page (see list below). JSON‑LD exists on root and en root (ReligiousOrganization, WebSite).

Audit artifacts (created)
- `test-results/lighthouse-calibrated-root.json`
- `test-results/axe-*.json` (individual axe reports per page)
- `test-results/jsonld-root.json`, `test-results/jsonld-en_.json`
- `public/images/optimized/` (generated AVIF/WebP variants for fromFacebook images)

Quick counts (axe violations by file)
- `test-results/axe-about.json`: 2
- `test-results/axe-contact.json`: 1
- `test-results/axe-donations.json`: 1
- `test-results/axe-en_.json`: 1
- `test-results/axe-en_about.json`: 2
- `test-results/axe-en_contact.json`: 1
- `test-results/axe-en_teachings.json`: 1
- `test-results/axe-events.json`: 1
- `test-results/axe-gallery.json`: 0
- `test-results/axe-root.json`: 1
- `test-results/axe-teachings.json`: 1

High-level findings

- Images & media (High impact, low effort)
  - Responsive AVIF/WebP variants were generated for a subset (public/images/optimized/fromFacebook/). This reduces bandwidth but components still render original images. Update image components to use picture + srcset (AVIF -> WebP -> fallback) with width descriptors and loading="lazy".
  - Recommended: generate optimized variants for the entire public/images/ tree and persist a manifest at public/images/optimized/manifest.json (the generator script already supports this).

- Performance (High impact)
  - Lighthouse root (mobile) shows long FCP/LCP (FCP ≈ 10s, LCP ≈ 17s on audit machine). Main drivers: large hero background image, render-blocking CSS, third-party iframes (Google Maps) and font loading.
  - Quick wins: preload hero critical image, replace CSS background-image hero with a semantic img/picture so the browser can fetch responsive resources and decode efficiently, use font-display: swap, defer non-critical scripts, and serve assets compressed (Brotli) + long cache TTLs.

- Accessibility (Medium impact)
  - axe reports show a small number of issues (0–2 per page). Common items include:
    - Decorative SVGs and icons reported in contexts where aria-hidden or removing focusability is appropriate. (Examples in test-results/axe-root.json target event/teaching card svgs and lotus dividers.)
    - Inline background-image rules flagged by the avoid-inline-spacing rule (hero uses inline style background-image). Move to CSS class or use an img element.
    - Modal/focus management: ensure any interactive modal traps focus and returns it on close (if modals exist).

- SEO / Structured Data (Medium impact)
  - JSON-LD exists on root (ReligiousOrganization, WebSite) with contact and geo data (test-results/jsonld-root.json). Good baseline.
  - Recommended: add localized JSON-LD on equivalent locale pages, add Event schema for pages under src/pages/events/ (startDate/location), and ensure OpenGraph/Twitter metadata and canonical/hreflang tags are present in src/layouts/Layout.astro.

Recommended prioritized actions (order by impact/effort)

1) Images: finish generation + update components (High/Low)
   - Run: `npm run generate-images` to produce AVIF/WebP for all images.
   - Update `src/components/GalleryGrid.astro` and any image-use components to render picture with AVIF -> WebP -> fallback and include sizes/srcset using the generated manifest.
   - File refs: [src/components/GalleryGrid.astro](src/components/GalleryGrid.astro), [src/components/Hero.astro](src/components/Hero.astro), [src/pages/gallery.astro](src/pages/gallery.astro)

2) Hero & critical images: preload + responsive (High/Low)
   - Move hero background to picture or img and add `<link rel="preload" as="image" href="/images/optimized/...-w1600.avif" type="image/avif">` for the largest critical image used above the fold. Add width/height on img to avoid layout shifts.
   - File ref: [src/layouts/Layout.astro](src/layouts/Layout.astro) (head), [src/components/Hero.astro](src/components/Hero.astro)

3) Fonts & CSS: optimize loading (High/Low)
   - Add `font-display: swap` to custom fonts, `preconnect` to font CDNs, and extract critical CSS for above-the-fold styles.
   - Audit unused CSS (Tailwind purge or manual extraction) and minimize CSS payload.

4) Accessibility fixes (Medium/Medium)
   - Mark decorative SVGs with `aria-hidden="true"` and add accessible names for interactive icons (or wrap in `<button aria-label="...">`).
   - Replace inline `style="background-image: ..."` hero with semantic `img` and move spacing to CSS classes.
   - Verify modals trap focus and provide accessible dismiss buttons.
   - Files to check: [src/components/LotusDivider.astro](src/components/LotusDivider.astro), [src/components/EventCard.astro](src/components/EventCard.astro), [src/components/TeachingCard.astro](src/components/TeachingCard.astro)

5) Structured Data & SEO (Medium/Low)
   - Add Event structured data for `src/pages/events/[...slug].astro` (Event schema: `startDate`, `endDate`, `location`, `offers` where applicable).
   - Ensure `link rel=canonical` and `hreflang` tags exist in Layout.astro.
   - Add `og:image` using an optimized image variant (include width/height in metadata where possible).

6) CI: add automated audit workflow (Medium/Low)
   - Add a GitHub Action that runs: `npm run generate-images` (if permitted), `npm run build`, spin a static server, run `node scripts/jsonld-validate.mjs`, `node scripts/axe-run.mjs`, and `lighthouse` with thresholds. Fail the job when critical accessibility violations or large regressions in LCP are detected.

Example picture pattern (proposal)

    <picture>
      <source type="image/avif" srcset="/images/optimized/gallery/photo-w480.avif 480w, /images/optimized/gallery/photo-w768.avif 768w, /images/optimized/gallery/photo-w1024.avif 1024w" sizes="(max-width: 600px) 480px, 768px">
      <source type="image/webp" srcset="/images/optimized/gallery/photo-w480.webp 480w, /images/optimized/gallery/photo-w768.webp 768w">
      <img src="/images/gallery/photo.jpg" alt="Brief description" loading="lazy" decoding="async" width="1024" height="640">
    </picture>

Reproduction & commands
- Build site: `npm run build`
- Serve built `dist/` (example): `python3 -m http.server 39756 --directory dist`
- Run accessibility scans: `AUDIT_PORT=39756 node scripts/axe-run.mjs`
- Validate JSON‑LD: `AUDIT_PORT=39756 node scripts/jsonld-validate.mjs`
- Regenerate images: `npm run generate-images`
- Lighthouse (mobile): `npx lighthouse http://localhost:39756/ --output=json --output-path=test-results/lighthouse-root.json --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' --emulated-form-factor=mobile`

Next steps I can take (pick any):
- Finish generating optimized images for the entire `public/images/` tree and commit (I already generated a subset; will finish if you approve).
- Produce concrete patch proposals for the components mentioned (`GalleryGrid`, `Hero`, `Layout`) — I will provide single-file diffs for your review.
- Create a CI workflow that runs these audits and fails on regressions.

If you want me to proceed, tell me which of the three next steps to run now: `generate-images`, `patch-components`, or `add-ci`.
