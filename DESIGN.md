# DESIGN.md

Section 1: Overview

This is a minimal design system used for Stitch generation. Keep styles modest and accessible.

Section 2: Colors

- Primary: #D9732B (terracotta)
- Accent: #F6D365 (gold)
- Background: #FAF7F0 (warm bone)
- Text: #262626 (charcoal)

Section 3: Typography

- Heading: `Cormorant Garamond`, serif; sizes: H1 48, H2 32, H3 20
- Body: `Work Sans`, sans-serif; base 16px, line-height 1.6

Section 4: Spacing & Radius

- Spacing scale: 8 / 16 / 24 / 32
- Radius: 8px small, 24px large

Section 5: Iconography

- Use simple stroke icons, 16/20/24 sizes. Decorative icons must be `aria-hidden`.

Section 6: Design System Notes for Stitch Generation

Use a warm, grounded aesthetic with terracotta accents and generous whitespace. Pages should:

- Use a centered header with language switcher and clear navigation.
- Hero area: large serif heading, short text, secondary CTA; use an optimized responsive image.
- Content sections: alternating background (light / white), clear H2 section headings, cards for events/teachings.
- Footer: simple link list, contact details, and small logo.

Accessibility rules:

- Color contrast >= 4.5:1 for body text.
- Images must include meaningful `alt` text.
- Interactive controls keyboard-focusable and have ARIA labels when necessary.
