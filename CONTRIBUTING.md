# Contributing

## Branching Model

- `dev` is the integration branch for day-to-day work.
- `master` is the production branch.
- Do not push directly to `master`.
- Changes land in `master` only via Pull Requests.

## Typical Workflow

1) Create a feature branch from `dev` (optional) or commit directly to `dev`.
2) Open a PR into `master`.
3) Ensure CI checks pass.
4) Merge the PR (no direct pushes to `master`).

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Notes

- Build output (`dist/`) and local audit artifacts (`test-results/`) are intentionally not committed.

## Optional Local Guardrails

This repo includes a shared git hook that blocks direct pushes to `master`.

```bash
git config core.hooksPath .githooks
```
