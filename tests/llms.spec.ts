import { expect, test } from '@playwright/test';

test('llms.txt — format v2', async ({ request }) => {
  const res = await request.get('http://localhost:39755/llms.txt');
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt).toMatch(/^# .+/m);            // H1 (wymagany)
  expect(txt).toMatch(/^> .+/m);            // blockquote z podsumowaniem
  expect(txt).toContain('## Optional');     // sekcja pomijalna
  expect(txt).toContain('[Full site content](https://babaji.org.pl/llms-full.txt)');
  expect(txt).toMatch(/\]\(https:\/\/babaji\.org\.pl\/[^)]*\.md\)/); // linki do wersji .md
});

test('Layout — rel alternate (markdown) + describedby', async ({ page }) => {
  await page.goto('http://localhost:39755/about/');
  await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute('href', '/about/index.md');
  await expect(page.locator('link[rel="describedby"]')).toHaveAttribute('href', '/llms.txt');
});
