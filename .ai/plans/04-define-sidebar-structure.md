# Step 4 — Define Sidebar Structure (Autogenerate + Order)

**Objective**  
Configure a hierarchical, collapsible left sidebar that mirrors folder structure and supports ordering.

**Actions**  
1. In `astro.config.mjs`, add `sidebar` groups with `autogenerate.directory` mapped to top-level folders, e.g.:
   ```js
   sidebar: [
     { label: 'Getting Started', collapsed: true, autogenerate: { directory: 'getting-started' } },
     { label: 'Guides', collapsed: true, autogenerate: { directory: 'guides' } },
     { label: 'Concepts', collapsed: true, autogenerate: { directory: 'concepts' } },
     { label: 'Architecture', collapsed: true, autogenerate: { directory: 'architecture' } },
   ]
   ```
2. Use per-page frontmatter (`sidebar.order`, `sidebar.label`) where you need fine control.
3. Run the dev server and confirm the groups and nesting are correct.

**Acceptance Criteria**  
- Sidebar reflects folder hierarchy.
- Collapsible groups behave correctly and preserve state during navigation.
- Active page highlighting works.

**Deliverables**  
- Updated `astro.config.mjs` with `sidebar` configuration.

