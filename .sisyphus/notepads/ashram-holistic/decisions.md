# Decisions - ashram-holistic

## Design
- Colors: Orange #FF6B00, Gold #FFD700, Warm White #FFF8F0.
- Components: Pure Astro/CSS.
- Maps: OpenStreetMap iframe embed (no API keys).

## Workflow
- Content: Extract from Facebook (https://www.facebook.com/haidakhandisevadham.polska.9) or public sources.
- Translation: AI-assisted PL -> EN.

## GitHub Actions Secrets for Cloudflare Deployment (2026-02-11)
To enable automated deployments to Cloudflare Pages, the following secrets must be configured in the GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Description |
|-------------|-------------|
| `CLOUDFLARE_API_TOKEN` | API Token with "Cloudflare Pages: Edit" permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID. |
| `CLOUDFLARE_PROJECT_NAME` | The name of the Cloudflare Pages project. |
