// tests/navigator-pages.spec.ts
// Smoke tests for the three reference navigator pages.
// Each asserts the FromTheBinary callout renders, at least one topic card
// appears, and no 'awaiting-upstream' banner copy is present.

import { test, expect } from '@playwright/test';

const pages = [
  { path: '/reference/cli/', topic: 'cli' },
  { path: '/reference/configuration/', topic: 'config' },
  { path: '/reference/helm/', topic: 'helm' },
];

for (const { path, topic } of pages) {
  test.describe(`Navigator: ${path}`, () => {
    test(`renders FromTheBinary callout with topic "${topic}"`, async ({ page }) => {
      await page.goto(path);
      const callout = page.locator('aside.from-the-binary');
      await expect(callout).toBeVisible();
      await expect(callout.locator('code').first()).toHaveText(`cyoda help ${topic}`);
    });

    test('has at least one related-topic bullet', async ({ page }) => {
      await page.goto(path);
      // Root on the stable heading id. Starlight currently wraps each <h2>
      // in a <div class="sl-heading-wrapper">, so the <ul> is a sibling of
      // that wrapper — NOT of the <h2>. Use document-order XPath traversal
      // ("find the first <ul> that follows this <h2> anywhere in the tree")
      // so the test works regardless of wrapper changes in future Starlight.
      const bullets = page
        .locator('h2#related-topics')
        .locator('xpath=following::ul[1]/li');
      await expect(bullets.first()).toBeVisible();
    });

    test('shows no Awaiting upstream copy', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('text=Awaiting upstream')).toHaveCount(0);
    });
  });
}
