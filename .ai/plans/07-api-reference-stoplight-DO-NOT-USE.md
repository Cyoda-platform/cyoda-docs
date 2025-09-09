# Step 7 — Integrate API Reference (Stoplight Elements)

**Objective**  
Render the existing OpenAPI spec using Stoplight Elements inside a docs page.

**Actions**  
1. Place the OpenAPI spec under `public/openapi/openapi.json` (or similar path).
2. Create a page `src/content/docs/api/reference.mdx` with the Stoplight Elements web component:
   ```mdx
   ---
   title: API Reference
   tableOfContents: false
   ---

   <head>
     <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css" />
     <script type="module" src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
   </head>

   <elements-api apiDescriptionUrl="/openapi/openapi.json" router="hash"></elements-api>
   ```
3. Add an “API Reference” top-nav link in the Starlight config pointing to `/docs/api/reference/`.

**Acceptance Criteria**  
- The API page renders without style bleed.
- Routes and deep links within Elements function.
- No errors in the console.

