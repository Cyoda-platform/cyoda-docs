# Step 8 — Mermaid Diagram Support

**Objective**  
Render Mermaid diagrams from fenced code blocks at build time to avoid flicker.

**Actions**  
1. Install a Mermaid remark plugin (example: `remark-mermaidjs`):
   ```bash
   npm i -D remark-mermaidjs
   ```
2. Add it to your Starlight/Astro markdown pipeline in `astro.config.mjs`, e.g.:
   ```js
   markdown: {
     remarkPlugins: [import('remark-mermaidjs')]
   }
   ```
3. Add a sample page with a mermaid block and verify rendering:
   ````md
   ```mermaid
   graph TD
     A[Start] --> B{Decision}
     B -->|Yes| C[Continue]
     B -->|No| D[Stop]
   ```
   ````

**Acceptance Criteria**  
- Mermaid diagrams render as SVG/HTML at build time.
- No client-side flicker; diagrams appear immediately.

