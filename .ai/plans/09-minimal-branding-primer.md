# Step 9 — Minimal Branding with Primer Tokens

**Objective**  
Introduce a minimal, token-based look using Primer primitives without heavy theming.

**Actions**  
1. Install Primer primitives:
   ```bash
   npm i -D @primer/primitives
   ```
2. Create `src/styles/primer.css` and import desired token sets (typography, size, colors). Example:
   ```css
   @import '@primer/primitives/dist/css/base/typography/typography.css';
   @import '@primer/primitives/dist/css/base/size/size.css';
   /* import additional primitives as needed */
   :root {
     /* optional custom properties mapped to Starlight variables */
   }
   ```
3. Register stylesheet via Starlight `customCss` in `astro.config.mjs`.
4. Verify legibility, spacing, and headings hierarchy.

**Acceptance Criteria**  
- Typography and spacing feel consistent and readable.
- No contrast regressions.
- Light/dark mode remain usable (if enabled).

