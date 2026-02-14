import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/teachings',
  '/about',
  '/contact',
  '/gallery',
  '/events',
  '/donations',
  '/en/',
  '/en/teachings',
  '/en/about',
  '/en/contact',
  '/en/gallery',
  '/en/events',
  '/en/donations'
];

test.describe('Ashram Website QA', () => {
  for (const pagePath of pages) {
    test(`Verify page: ${pagePath}`, async ({ page }) => {
      const response = await page.goto(`http://localhost:39755${pagePath}`);
      expect(response?.status()).toBe(200);

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      const images = await page.locator('img').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          const imgResponse = await page.request.get(`http://localhost:39755${src}`);
          expect(imgResponse.status(), `Image ${src} on page ${pagePath} should load`).toBe(200);
        }
      }

      const langSwitcher = page.locator('nav').locator('a.lang-switch');
      if (await langSwitcher.count() > 0) {
        await expect(langSwitcher).toBeVisible();
      }
    });
  }

  test('Responsive check', async ({ page }) => {
    await page.goto('http://localhost:39755/');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('Schema.org verification', async ({ page }) => {
    for (const pagePath of ['/', '/en/']) {
      await page.goto(`http://localhost:39755${pagePath}`);
      const schema = await page.locator('script[type="application/ld+json"]').innerText();
      expect(schema).toContain('WebSite');
    }
  });
});
