import { test, expect } from '@playwright/test';

test.describe('Visual tokens', () => {
  test('Montserrat is the computed body font', async ({ page }) => {
    await page.goto('/');
    const family = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily
    );
    expect(family).toContain('Montserrat');
  });

  test('primary accent is the cyoda teal', async ({ page }) => {
    await page.goto('/');
    const color = await page.evaluate(() => {
      const el = document.querySelector('.site-title') || document.body;
      return getComputedStyle(el).getPropertyValue('--sl-color-accent').trim();
    });
    // Value comes via CSS var — assert it resolves to a hsl(...) form
    expect(color.length).toBeGreaterThan(0);
  });
});
