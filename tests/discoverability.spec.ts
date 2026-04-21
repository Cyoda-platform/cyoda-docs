import { test, expect } from '@playwright/test';

test.describe('Discoverability', () => {
  test('every doc page advertises its markdown sibling', async ({ page }) => {
    await page.goto('/getting-started/quickstart/');
    const href = await page.locator('link[rel="alternate"][type="text/markdown"]').first().getAttribute('href');
    expect(href).toMatch(/^\/markdown\/.+\.md$/);
  });

  test('every page links to llms.txt and llms-full.txt', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('link[rel="alternate"][type="text/markdown"]').evaluateAll(
      nodes => nodes.map(n => (n as HTMLLinkElement).href)
    );
    expect(hrefs.some(h => h.endsWith('/llms.txt'))).toBe(true);
    expect(hrefs.some(h => h.endsWith('/llms-full.txt'))).toBe(true);
  });

  test('pages emit TechnicalArticle JSON-LD', async ({ page }) => {
    await page.goto('/');
    const script = await page.locator('script[type="application/ld+json"]').first().innerText();
    const data = JSON.parse(script);
    expect(data['@type']).toBe('TechnicalArticle');
    expect(data.headline).toBeTruthy();
    expect(data.inLanguage).toBe('en');
  });
});
