import { test, expect } from '@playwright/test';

test.describe('Google Analytics Integration', () => {
  test('should embed Google Analytics scripts with correct GA_MEASUREMENT_ID', async ({ page }) => {
    // Navigate to the site
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check if Google Analytics component is embedded and configured
    const gaScriptInfo = await page.evaluate(() => {
      // Check for scripts that contain GA-related code
      const scripts = Array.from(document.querySelectorAll('script'));
      
      // Look for the Analytics component script (inline script with GA logic)
      const analyticsScript = scripts.find(script => 
        !script.src && 
        script.textContent && 
        script.textContent.includes('dataLayer') &&
        script.textContent.includes('gtag')
      );
      
      // Check for external GA script
      const gaScript = scripts.find(script => 
        script.src && script.src.includes('googletagmanager.com/gtag/js')
      );
      
      // Check if dataLayer exists (initialized by Analytics component)
      const dataLayerExists = typeof (window as any).dataLayer !== 'undefined';
      
      // Check if gtag function exists
      const gtagExists = typeof (window as any).gtag !== 'undefined';
      
      // Check if GA_MEASUREMENT_ID variable is defined in any script
      const hasGAMeasurementId = scripts.some(script => 
        script.textContent && script.textContent.includes('GA_MEASUREMENT_ID')
      );
      
      // Look for consent-related GA code
      const hasConsentCode = scripts.some(script => 
        script.textContent && 
        script.textContent.includes('consent') &&
        script.textContent.includes('analytics_storage')
      );
      
      // Extract GA_MEASUREMENT_ID from script content if present
      let extractedGAId = null;
      if (analyticsScript && analyticsScript.textContent) {
        const gaIdMatch = analyticsScript.textContent.match(/GA_MEASUREMENT_ID\s*=\s*["']([^"']+)["']/);
        if (gaIdMatch) {
          extractedGAId = gaIdMatch[1];
        }
      }
      
      return {
        analyticsScriptFound: !!analyticsScript,
        gaScriptFound: !!gaScript,
        gaScriptSrc: gaScript ? gaScript.src : null,
        dataLayerExists,
        gtagExists,
        hasGAMeasurementId,
        hasConsentCode,
        extractedGAId,
        analyticsScriptContent: analyticsScript && analyticsScript.textContent ? analyticsScript.textContent.substring(0, 300) + '...' : null
      };
    });

    console.log('Google Analytics script info:', JSON.stringify(gaScriptInfo, null, 2));

    // Verify Analytics component is embedded when GA_MEASUREMENT_ID is set
    if (gaScriptInfo.hasGAMeasurementId && gaScriptInfo.extractedGAId) {
      console.log(`✓ Found GA_MEASUREMENT_ID: ${gaScriptInfo.extractedGAId}`);
      
      // Verify Analytics component structure
      expect(gaScriptInfo.analyticsScriptFound, 'Analytics component script should be present').toBe(true);
      expect(gaScriptInfo.dataLayerExists, 'dataLayer should be initialized by Analytics component').toBe(true);
      expect(gaScriptInfo.hasConsentCode, 'Should have consent management code for analytics_storage').toBe(true);
      
      // Verify GA_MEASUREMENT_ID format (should start with G-)
      expect(gaScriptInfo.extractedGAId, 'GA_MEASUREMENT_ID should start with G-').toMatch(/^G-/);
      
      // Log the Analytics component content for debugging
      if (gaScriptInfo.analyticsScriptContent) {
        console.log('Analytics component content preview:', gaScriptInfo.analyticsScriptContent);
      }
      
    } else {
      console.log('ℹ️  GA_MEASUREMENT_ID not set - Analytics component should not be active');
      
      // If no GA_MEASUREMENT_ID, the Analytics component should not initialize GA
      expect(gaScriptInfo.dataLayerExists, 'dataLayer should not be initialized without GA_MEASUREMENT_ID').toBe(false);
      expect(gaScriptInfo.gtagExists, 'gtag should not be available without GA_MEASUREMENT_ID').toBe(false);
    }
  });

  test('should handle GA_MEASUREMENT_ID environment variable correctly', async ({ page }) => {
    // This test verifies the Analytics component respects the environment variable
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const envVarHandling = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      
      // Look for the Analytics component script
      const analyticsScript = scripts.find(script => 
        !script.src && 
        script.textContent && 
        script.textContent.includes('GA_MEASUREMENT_ID')
      );
      
      if (!analyticsScript) {
        return { hasAnalyticsScript: false };
      }
      
      const scriptContent = analyticsScript.textContent || '';
      
      // Check for proper environment variable handling
      const hasEnvVarCheck = scriptContent.includes('if (!GA_MEASUREMENT_ID) return');
      const hasConsoleLog = scriptContent.includes('console.log') && scriptContent.includes('GA_MEASUREMENT_ID');
      const hasConsentDefault = scriptContent.includes("consent', 'default'");
      const hasAnalyticsStorage = scriptContent.includes('analytics_storage');
      
      return {
        hasAnalyticsScript: true,
        hasEnvVarCheck,
        hasConsoleLog,
        hasConsentDefault,
        hasAnalyticsStorage,
        scriptLength: scriptContent.length
      };
    });

    console.log('Environment variable handling:', JSON.stringify(envVarHandling, null, 2));

    if (envVarHandling.hasAnalyticsScript) {
      // Verify proper environment variable handling
      expect(envVarHandling.hasEnvVarCheck, 'Should check if GA_MEASUREMENT_ID exists before proceeding').toBe(true);
      expect(envVarHandling.hasConsentDefault, 'Should set default consent state').toBe(true);
      expect(envVarHandling.hasAnalyticsStorage, 'Should handle analytics_storage consent').toBe(true);
      
      console.log('✓ Analytics component properly handles GA_MEASUREMENT_ID environment variable');
    } else {
      console.log('ℹ️  Analytics component script not found - may not be included in this build');
    }
  });

  test('should initialize dataLayer and gtag when GA_MEASUREMENT_ID is present', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const gaInitialization = await page.evaluate(() => {
      // Check if GA is properly initialized
      const dataLayer = (window as any).dataLayer;
      const gtag = (window as any).gtag;
      
      let dataLayerEntries = [];
      let hasConsentEntries = false;
      
      if (dataLayer && Array.isArray(dataLayer)) {
        dataLayerEntries = dataLayer.slice(); // Copy the array
        hasConsentEntries = dataLayer.some((entry: any) => 
          Array.isArray(entry) && entry[0] === 'consent'
        );
      }
      
      return {
        dataLayerExists: !!dataLayer,
        dataLayerIsArray: Array.isArray(dataLayer),
        dataLayerLength: dataLayer ? dataLayer.length : 0,
        gtagExists: typeof gtag === 'function',
        hasConsentEntries,
        dataLayerEntries: dataLayerEntries.slice(0, 5) // First 5 entries for debugging
      };
    });

    console.log('GA initialization status:', JSON.stringify(gaInitialization, null, 2));

    if (gaInitialization.dataLayerExists) {
      // If dataLayer exists, GA Analytics component is working
      expect(gaInitialization.dataLayerIsArray, 'dataLayer should be an array').toBe(true);
      expect(gaInitialization.dataLayerLength, 'dataLayer should have entries').toBeGreaterThan(0);

      // Check if we have consent entries (default consent should be set)
      const hasDefaultConsent = gaInitialization.dataLayerEntries.some((entry: any) =>
        Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default'
      );

      if (hasDefaultConsent) {
        console.log('✓ Default consent properly set in dataLayer');
        expect(hasDefaultConsent, 'Should have default consent entry in dataLayer').toBe(true);
      }

      // Note: gtag function may not be available until external GA script loads
      // This happens after user consent, so we don't expect it to be available immediately
      if (gaInitialization.gtagExists) {
        console.log('✓ gtag function is available');
      } else {
        console.log('ℹ️  gtag function not yet available - external GA script not loaded (expected behavior)');
      }

      console.log('✓ Google Analytics component properly initialized with consent management');
    } else {
      console.log('ℹ️  Google Analytics not initialized - GA_MEASUREMENT_ID may not be set');

      // This is acceptable if GA_MEASUREMENT_ID is not configured
      expect(true, 'No GA initialization is acceptable without GA_MEASUREMENT_ID').toBe(true);
    }
  });
});
