# Content Generation Guide

## Goal
Convert Facebook posts or raw text into Astro Content Collection entries.

## Process

1.  **Identify Type**: Is it a Teaching (Nauka) or an Event (Wydarzenie)?
2.  **Extract Metadata**:
    -   **Title**: First line or summary.
    -   **Date**: Post date or event date.
    -   **Description**: Short summary (150 chars) for SEO.
    -   **Location**: If event, extract location (default: Mąkolno 129).
3.  **Format**: Create a `.md` file in `src/content/[type]/[lang]/`.

## Template: Teaching
```markdown
---
title: "Tytuł Nauki"
description: "Krótki opis..."
date: 2026-01-01
author: "Babaji"
lang: "pl"
---

Treść nauki...
```

## Template: Event
```markdown
---
title: "Nazwa Wydarzenia"
description: "Opis wydarzenia..."
date: 2026-03-20
location: "Mąkolno 129"
lang: "pl"
---

Szczegóły wydarzenia...
```
