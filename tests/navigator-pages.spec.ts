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
      // Root on the stable heading id; the two selectors handle Starlight's
      // current wrapper-div sibling structure AND a future layout where the
      // <ul> is a direct sibling of the <h2>.
      const bullets = page.locator('h2#related-topics + * ~ ul li, h2#related-topics ~ ul li');
      await expect(bullets.first()).toBeVisible();
    });

    test('shows no Awaiting upstream copy', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('text=Awaiting upstream')).toHaveCount(0);
    });
  });
}
