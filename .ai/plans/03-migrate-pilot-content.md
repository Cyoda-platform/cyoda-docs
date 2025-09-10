# Step 3 — Migrate a Pilot Set of Docs

**Objective**  
Bring in a small subset of existing documentation to validate content rendering, links, and basic sidebar.

**Scope**  
- Home page (landing) and one section (e.g., "Getting Started" with 2–3 pages).

**Actions**  
1. Create folders under `src/content/docs/`, e.g.:
   ```
   src/content/docs/
   ├── index.md
   └── getting-started/
       ├── index.md
       ├── introduction.md
       └── quickstart.md
   ```
2. Copy markdown from the current site into the pilot pages. Ensure each page has `title:` in frontmatter.
3. Fix internal links to use Starlight’s routes (relative paths within `docs`).

**Acceptance Criteria**  
- Pilot pages render with proper headings, code blocks, images.
- Internal links function.
- Sidebar shows the pilot section.

**Deliverables**  
- Pilot doc pages in `src/content/docs/`.

**Rollback**  
- Remove the pilot section and `index.md` from the docs folder.
