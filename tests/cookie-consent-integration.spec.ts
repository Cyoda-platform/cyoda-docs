import { test, expect } from '@playwright/test';

/**
 * Integration tests for cookie consent that work around bot detection
 * These tests focus on the technical integration without bypassing security
 */

test.describe('Cookie Consent Integration Tests', () => {

  test('should verify cookie consent library files are accessible', async ({ page }) => {
    // Test that the cookie consent CSS loads
    const cssResponse = await page.goto('http://localhost:4321/node_modules/vanilla-cookieconsent/dist/cookieconsent.css');
    expect(cssResponse?.status()).toBe(200);

    // Test that the JS files exist (even if not loaded by the integration)
    const esmResponse = await page.goto('http://localhost:4321/node_modules/vanilla-cookieconsent/dist/cookieconsent.esm.js');
    expect(esmResponse?.status()).toBe(200);

    const umdResponse = await page.goto('http://localhost:4321/node_modules/vanilla-cookieconsent/dist/cookieconsent.umd.js');
    expect(umdResponse?.status()).toBe(200);
  });

  test('should verify Analytics component initializes correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const analyticsStatus = await page.evaluate(() => {
      return {
        dataLayerExists: typeof window.dataLayer !== 'undefined',
        dataLayerLength: window.dataLayer ? window.dataLayer.length : 0,
        hasDefaultConsent: window.dataLayer ?
          window.dataLayer.some(entry =>
            // Check for both array format and object format
            (Array.isArray(entry) &&
             entry[0] === 'consent' &&
             entry[1] === 'default' &&
             entry[2]?.analytics_storage === 'denied') ||
            // Check for object format that gtag might use
            (typeof entry === 'object' &&
             entry['0'] === 'consent' &&
             entry['1'] === 'default' &&
             entry['2']?.analytics_storage === 'denied')
          ) : false,
        gtagExists: typeof window.gtag !== 'undefined',
        handleAnalyticsConsentExists: typeof window.handleAnalyticsConsent !== 'undefined',
        // Debug: include actual dataLayer content for troubleshooting
        dataLayerContent: window.dataLayer ? window.dataLayer.slice(0, 3) : []
      };
    });

    expect(analyticsStatus.dataLayerExists, 'dataLayer should be initialized').toBe(true);
    expect(analyticsStatus.dataLayerLength, 'dataLayer should have entries').toBeGreaterThan(0);
    expect(analyticsStatus.hasDefaultConsent, 'Should have default consent denied').toBe(true);
    expect(analyticsStatus.handleAnalyticsConsentExists, 'Analytics consent handler should be available').toBe(true);
  });

  test('should verify cookie consent integration configuration', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check if cookie consent CSS is inlined (new behavior after refactoring)
    const cssInlined = await page.evaluate(() => {
      const styles = Array.from(document.querySelectorAll('style'));
      return styles.some(style =>
        style.textContent &&
        style.textContent.includes('#cc-main') &&
        style.textContent.includes('--cc-font-family')
      );
    });

    expect(cssInlined, 'Cookie consent CSS should be inlined in the page').toBe(true);

    // Document the current state for debugging
    const integrationStatus = await page.evaluate(() => {
      // Check if cookie consent CSS is inlined (new behavior after refactoring)
      const styles = Array.from(document.querySelectorAll('style'));
      const cssInlined = styles.some(style =>
        style.textContent &&
        style.textContent.includes('#cc-main') &&
        style.textContent.includes('--cc-font-family')
      );

      return {
        cookieConsentLibraryLoaded: typeof window.CookieConsent !== 'undefined',
        ccElementsCount: document.querySelectorAll('[id*="cc"], [class*="cc"]').length,
        scriptsWithCookieConsent: Array.from(document.querySelectorAll('script')).filter(s =>
          s.src && s.src.includes('cookieconsent')
        ).length,
        hasInlinedCookieConsentCSS: cssInlined
      };
    });

    console.log('Cookie consent integration status:', JSON.stringify(integrationStatus, null, 2));

    // After refactoring, the CSS is inlined and the library is not loaded by default
    expect(integrationStatus.cookieConsentLibraryLoaded,
      'Cookie consent library should not be loaded by default (new behavior after refactoring)'
    ).toBe(false);

    expect(integrationStatus.hasInlinedCookieConsentCSS,
      'Cookie consent CSS should be inlined in the page'
    ).toBe(true);
  });
});
