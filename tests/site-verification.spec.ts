import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/teachings',
  '/about',
  '/contact',
  '/gallery',
  '/events',
  '/donations',
  '/en',
  '/en/teachings',
  '/en/about',
  '/en/contact',
  '/en/gallery',
  '/en/events',
  '/en/donations',
  '/events/siwaratri',
  '/en/events/shivaratri',
  '/events/holi',
  '/teachings/havan-ogien',
  '/en/teachings/sacred-fire-ceremony'
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
        const href = await langSwitcher.getAttribute('href');
        expect(href).not.toBeNull();
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
    for (const pagePath of ['/', '/en']) {
      await page.goto(`http://localhost:39755${pagePath}`);
      const schema = await page.locator('script[type="application/ld+json"]').innerText();
      expect(schema).toContain('WebSite');
    }
  });

  test('Detail page language switching', async ({ page }) => {
    const switchCases = [
      { from: '/events/siwaratri', to: '/en/events/shivaratri' },
      { from: '/en/events/shivaratri', to: '/events/siwaratri' },
      { from: '/events/holi', to: '/en/events/holi' },
      { from: '/teachings/havan-ogien', to: '/en/teachings/sacred-fire-ceremony' },
      { from: '/en/teachings/sacred-fire-ceremony', to: '/teachings/havan-ogien' }
    ];

    for (const { from, to } of switchCases) {
      await page.goto(`http://localhost:39755${from}`);
      const langSwitcher = page.locator('nav').locator('a.lang-switch');
      const href = await langSwitcher.getAttribute('href');
      expect(href).toBe(to);
      
      const response = await page.goto(`http://localhost:39755${href}`);
      expect(response?.status()).toBe(200);
    }
  });
});
