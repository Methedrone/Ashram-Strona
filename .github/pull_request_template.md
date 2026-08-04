## What

<!-- One-paragraph summary of the change -->

## Why

<!-- Motivation, context, links to issues or design docs -->

## Type of change

- [ ] Feature (new functionality)
- [ ] Fix (bug fix)
- [ ] Refactor (no behavior change)
- [ ] Content (event / teaching / translation)
- [ ] Chore / docs / CI
- [ ] Release (dev → master only)

## Target branch

- [ ] PR into **`dev`** for normal work
- [ ] PR into **`master`** for a release — only after `dev` is green and the release scope is locked

## Verification

- [ ] `npm run check` is clean
- [ ] `npm test` passes locally (42 Playwright tests)
- [ ] `npm run build` succeeds
- [ ] Manual smoke test of affected routes
- [ ] Bilingual parity preserved (if content)
- [ ] No secrets in the diff (API keys, tokens, passwords)

## Bilingual parity (if applicable)

- [ ] PL entry added or updated at `src/content/<collection>/pl/…`
- [ ] EN entry added or updated at `src/content/<collection>/en/…`

## Release notes (if this PR targets `master`)

<!-- Bullet list of user-facing changes for the deploy log / announcement -->

## Checklist

- [ ] CI workflow passes
- [ ] (Optional) `Audit Site` workflow passes
- [ ] Author is ready to merge
