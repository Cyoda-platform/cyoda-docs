import { test, expect } from '@playwright/test';

const REDIRECTS: [string, string][] = [
  ['/getting-started/introduction/', '/concepts/what-is-cyoda/'],
  ['/getting-started/quickstart/', '/getting-started/install-and-first-entity/'],
  ['/guides/cyoda-design-principles/', '/concepts/design-principles/'],
  ['/guides/api-saving-and-getting-data/', '/build/working-with-entities/'],
  ['/guides/authentication-authorization/', '/concepts/authentication-and-identity/'],
  ['/guides/iam-jwt-keys-and-oidc/', '/run/cyoda-cloud/identity-and-entitlements/'],
  ['/guides/iam-oidc-and-jwt-claims/', '/run/cyoda-cloud/identity-and-entitlements/'],
  ['/guides/workflow-config-guide/', '/build/workflows-and-processors/'],
  ['/guides/client-calculation-member-guide/', '/build/client-compute-nodes/'],
  ['/guides/entity-model-simple-view-specification/', '/concepts/entities-and-lifecycle/'],
  ['/guides/sql-and-trino/', '/concepts/apis-and-surfaces/'],
  ['/guides/provision-environment/', '/run/cyoda-cloud/provisioning/'],
  ['/architecture/cyoda-cloud-architecture/', '/run/cyoda-cloud/overview/'],
  ['/cloud/entitlements/', '/run/cyoda-cloud/identity-and-entitlements/'],
  ['/cloud/roadmap/', '/run/cyoda-cloud/status-and-roadmap/'],
  ['/cloud/service-details/', '/run/cyoda-cloud/overview/'],
  ['/cloud/status/', '/run/cyoda-cloud/status-and-roadmap/'],
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
