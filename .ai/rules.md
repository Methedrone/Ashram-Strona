# Coding Rules & Standards

## General
- **Strict TypeScript**: No `any`. Define interfaces for Props.
- **Astro Components**: Use `---` frontmatter for logic.
- **Scoped CSS**: Prefer `<style>` blocks over global CSS unless necessary.

## i18n
- **Always use `useTranslations`**: Never hardcode text in components.
- **Update `ui.ts`**: Add new keys to `src/i18n/ui.ts` for both languages.
- **Dynamic Links**: Use `/${lang}/path` for internal links.

## Content
- **Markdown/MDX**: Use for text-heavy content (teachings, events).
- **Frontmatter**: Ensure all required fields are present.

## SEO
- **Schema**: Use `<Schema />` component for JSON-LD.
- **Semantic HTML**: Use `<main>`, `<article>`, `<section>`, `<h1>`...`<h6>`.
