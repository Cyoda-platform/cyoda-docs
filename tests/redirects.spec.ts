import { test, expect } from '@playwright/test';

const REDIRECTS: [string, string][] = [
  ['/getting-started/introduction/', '/concepts/what-is-cyoda/'],
  ['/getting-started/quickstart/', '/getting-started/install-and-first-entity/'],
  ['/guides/cyoda-design-principles/', '/concepts/design-principles/'],
  ['/guides/api-saving-and-getting-data/', '/build/working-with-entities/'],
  ['/guides/authentication-authorization/', '/concepts/authentication-and-identity/'],
  ['/guides/iam-jwt-keys-and-oidc/', '/cyoda-cloud/identity-and-entitlements/'],
  ['/guides/iam-oidc-and-jwt-claims/', '/cyoda-cloud/identity-and-entitlements/'],
  ['/guides/workflow-config-guide/', '/build/workflows-and-processors/'],
  ['/guides/client-calculation-member-guide/', '/build/client-compute-nodes/'],
  ['/guides/entity-model-simple-view-specification/', '/reference/entity-model-export/'],
  ['/guides/sql-and-trino/', '/reference/trino/'],
  ['/guides/provision-environment/', '/cyoda-cloud/provisioning/'],
  ['/architecture/cyoda-cloud-architecture/', '/cyoda-cloud/'],
  ['/cloud/entitlements/', '/cyoda-cloud/identity-and-entitlements/'],
  ['/cloud/roadmap/', '/cyoda-cloud/status-and-roadmap/'],
  ['/cloud/service-details/', '/cyoda-cloud/'],
  ['/cloud/status/', '/cyoda-cloud/status-and-roadmap/'],
];

for (const [from, to] of REDIRECTS) {
  test(`redirect ${from} → ${to}`, async ({ page }) => {
    try {
      await page.goto(from);
      // Astro's static redirects emit a meta-refresh page; wait briefly
      // for the follow-on navigation (or timeout if the target 404s).
      await page.waitForURL((url) => url.pathname.includes(to), {
        timeout: 5000,
      }).catch(() => {
        /* target page may not exist yet (Phase 6/7 creates most of them) */
      });
    } catch {
      // Initial goto may fail if the target 404s under strict nav policies.
    }
    expect(page.url()).toContain(to);
  });
}
