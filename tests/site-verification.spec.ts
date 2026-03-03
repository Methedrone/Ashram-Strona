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
  '/events/makar-sankranti',
  '/en/events/makar-sankranti',
  '/events/vasant-panchami',
  '/en/events/vasant-panchami',
  '/events/chaitra-navaratri',
  '/en/events/chaitra-navaratri',
  '/events/ram-navami',
  '/en/events/ram-navami',
  '/events/guru-purnima',
  '/en/events/guru-purnima',
  '/events/janmashtami',
  '/en/events/janmashtami',
  '/events/ganesh-chaturthi',
  '/en/events/ganesh-chaturthi',
  '/events/dussehra',
  '/en/events/dussehra',
  '/events/diwali',
  '/en/events/diwali',
  '/events/navaratri-festiwal',
  '/en/events/navaratri-festival',
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
      { from: '/events/navaratri-festiwal', to: '/en/events/navaratri-festival' },
      { from: '/en/events/navaratri-festival', to: '/events/navaratri-festiwal' },
      { from: '/events/makar-sankranti', to: '/en/events/makar-sankranti' },
      { from: '/en/events/makar-sankranti', to: '/events/makar-sankranti' },
      { from: '/events/vasant-panchami', to: '/en/events/vasant-panchami' },
      { from: '/en/events/vasant-panchami', to: '/events/vasant-panchami' },
      { from: '/events/chaitra-navaratri', to: '/en/events/chaitra-navaratri' },
      { from: '/en/events/chaitra-navaratri', to: '/events/chaitra-navaratri' },
      { from: '/events/ram-navami', to: '/en/events/ram-navami' },
      { from: '/en/events/ram-navami', to: '/events/ram-navami' },
      { from: '/events/guru-purnima', to: '/en/events/guru-purnima' },
      { from: '/en/events/guru-purnima', to: '/events/guru-purnima' },
      { from: '/events/janmashtami', to: '/en/events/janmashtami' },
      { from: '/en/events/janmashtami', to: '/events/janmashtami' },
      { from: '/events/ganesh-chaturthi', to: '/en/events/ganesh-chaturthi' },
      { from: '/en/events/ganesh-chaturthi', to: '/events/ganesh-chaturthi' },
      { from: '/events/dussehra', to: '/en/events/dussehra' },
      { from: '/en/events/dussehra', to: '/events/dussehra' },
      { from: '/events/diwali', to: '/en/events/diwali' },
      { from: '/en/events/diwali', to: '/events/diwali' },
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
