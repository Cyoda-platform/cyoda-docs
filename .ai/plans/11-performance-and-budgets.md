# Step 11 — Performance Hardening & Budgets

**Objective**  
Ensure the site meets performance targets and avoids flicker/FOUC.

**Actions**  
1. Defer non-critical JS and hydrate components only when necessary.
2. Verify images are optimized and lazy-loaded; prefer `astro:assets` for local images where applicable.
3. Ensure code highlighting is applied without blocking rendering.
4. Run Lighthouse locally against a production build:
   ```bash
   npm run build
   npx serve dist
   npx lighthouse http://localhost:3000 --view
   ```
5. Compare against your performance budget (FCP, LCP, CLS, TTI, initial JS size).

**Acceptance Criteria**  
- Meets or beats defined thresholds.
- No visible layout shift during navigation.
- No console errors or large unused JS warnings.

