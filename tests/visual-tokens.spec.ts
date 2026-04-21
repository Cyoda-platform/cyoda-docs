import { test, expect } from '@playwright/test';

test.describe('Visual tokens', () => {
  test('Montserrat is loaded and applied', async ({ page }) => {
    await page.goto('/');
    // Wait for font loading to settle before probing.
    await page.evaluate(() => (document as any).fonts.ready);
    const loaded = await page.evaluate(() =>
      (document as any).fonts.check('1em Montserrat')
    );
    expect(loaded).toBe(true);
  });

  test('--sl-color-accent resolves to a color', async ({ page }) => {
    await page.goto('/');
    const color = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--sl-color-accent')
        .trim()
    );
    // Accept any resolved color form; guards against the var being undefined
    // or accidentally left as a raw HSL triplet (e.g. "175 67% 52%").
    expect(color).toMatch(/^(hsl\(|rgb\(|#)/i);
  });
});
