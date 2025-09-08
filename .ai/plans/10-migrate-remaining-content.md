# Step 10 — Migrate Remaining Content & Redirects

**Objective**  
Bring over all remaining documentation, normalize frontmatter, and preserve important URLs.

**Actions**  
1. Copy the rest of the markdown tree into `src/content/docs/` maintaining hierarchy.
2. Ensure each page has `title:` and, where useful, `description:` in frontmatter.
3. Adjust internal links; prefer relative links within the docs tree.
4. Add frontmatter hints for ordering/labels where needed (`sidebar.order`, `sidebar.label`).
5. If legacy URLs must be preserved, define redirects (Astro file-based redirects or a `_redirects` file if using Netlify; for GitHub Pages, add stub pages with meta refresh if critical).

**Acceptance Criteria**  
- All pages render without broken links.
- Sidebar structure matches expectations.
- Legacy URLs (if any) accounted for or intentionally dropped.

