# Step 7 — Integrate API Reference (Scalar API Reference)

**Objective**  
Provide an interactive API reference inside the docs site using the Scalar API Reference component. This allows users to set a base URL, configure authentication, and try out API requests directly.

---

## Actions

1. **Install Scalar API Reference**
   ```bash
   npm install @scalar/api-reference
   ```

2. **Place your OpenAPI schema**  
   Put your OpenAPI spec where it can be served statically, e.g.:
   ```
   /public/openapi/openapi.json
   ```

3. **Create an API Reference page**  
   Make a file `src/content/docs/api/reference.mdx`:
   ```mdx
   ---
   title: API Reference
   tableOfContents: false
   ---

   import { ApiReference } from "@scalar/api-reference";

   <ApiReference
     configuration={{ spec: { url: "/openapi/openapi.json" } }}
   />
   ```

4. **Update navigation**  
   In your Starlight config (`astro.config.mjs`), add a top-nav item or sidebar entry pointing to `/docs/api/reference/`.

5. **Run and test locally**
   ```bash
   npm run dev
   ```
   Confirm:
   - API operations display with interactive controls.
   - Users can set base URL and authentication.
   - Requests are sent successfully to your chosen server.

---

## Acceptance Criteria
- API Reference page is accessible under `/docs/api/reference/`.
- Users can configure base URL and authentication through the UI.
- “Try it out” requests succeed against the API.
- No console errors in browser.
