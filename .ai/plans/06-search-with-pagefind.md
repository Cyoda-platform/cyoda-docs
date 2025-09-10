# Step 6 — Search (Built-in Pagefind)

**Objective**  
Confirm the built-in static search (Pagefind) indexes pilot content and returns results quickly.

**Actions**  
1. Build the site (`npm run build`) so Pagefind can index the output (Starlight default).
2. Start a static server against `dist/` and test search queries.
3. Validate highlighting and navigation from results to pages.
4. Ensure keyboard shortcut (if enabled) focuses the search input.

**Acceptance Criteria**  
- Pilot pages are discoverable via search.
- Result navigation is instant-feeling; no FOUC.
- No client errors related to Pagefind assets.

