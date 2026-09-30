import { expect, test } from '@playwright/test';

test('podtytuły SectionHeading dzielą oś z tytułem (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/about/', '/donations/', '/en/about/']) {
    await page.goto(`http://localhost:39755${path}`);
    const h1Box = await page.locator('h1').first().boundingBox();
    const subBox = await page.locator('.section-heading .subtitle').first().boundingBox();
    expect(h1Box, `${path}: brak h1`).toBeTruthy();
    expect(subBox, `${path}: brak podtytułu`).toBeTruthy();
    const h1cx = h1Box!.x + h1Box!.width / 2;
    const subcx = subBox!.x + subBox!.width / 2;
    expect(Math.abs(h1cx - subcx), `${path}: podtytuł przesunięty o ${Math.round(subcx - h1cx)}px`).toBeLessThanOrEqual(2);
  }
});
