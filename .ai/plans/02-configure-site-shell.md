# Step 2 — Configure Site Metadata & Shell

**Objective**  
Set up core metadata and the base layout (title, logo placeholder, basic header/footer), without branding.

**Actions**  
1. Update site title and description in `astro.config.mjs` using the Starlight integration options.
2. Set the docs root to `src/content/docs/` (default) and confirm default sidebar.
3. Add top-level navigation links (e.g., Docs, API Reference, GitHub) via Starlight config.
4. Add a minimal footer with copyright and links.
5. Start dev server and verify the header/footer render.

**Acceptance Criteria**  
- Title and description reflect the project.
- Header and footer visible with placeholder links.
- No visual regressions or console warnings.

**Deliverables**  
- Updated `astro.config.mjs` and any minimal layout/config files.

**Rollback**  
- Revert `astro.config.mjs` changes.
