# Step 1 — Scaffold a Minimal Starlight Site

**Objective**  
Create a fresh Astro + Starlight project locally and verify that it runs and builds.

**Prereqs**  
- Node.js 20+ and npm or pnpm installed locally.
- Git installed.
- No repo changes required yet (work locally first).

**Actions**  
1. Create a new branch locally:
   ```bash
   git checkout -b feat/astro-starlight
   ```
2. Scaffold a Starlight site in a subfolder `site` (keeps the repo root clean during evaluation):
   ```bash
   npm create astro@latest -- --template starlight site
   # or: pnpm create astro --template starlight site
   ```
3. Install dependencies and run the dev server:
   ```bash
   cd site
   npm install
   npm run dev
   ```
4. Visit the local URL (typically `http://localhost:4321`) and confirm the starter renders.
5. Produce a production build:
   ```bash
   npm run build
   npx serve ./dist
   ```
   Confirm the static output loads correctly.

**Acceptance Criteria**  
- Starter site renders at `npm run dev` and after `npm run build`.
- No console errors in the browser.
- The project structure is the default Starlight scaffold.

**Deliverables**  
- Running local Starlight starter (`site/`), not yet committed to main.

**Rollback**  
- Delete the `site/` folder and branch if needed.

---
**Documentation Requirement**  
For this step, update the **Technical Design Document** with:
- Objectives and rationale for this step.
- Decisions made (configs, structure, tools).
- Issues encountered and resolutions (if any).
- Validation results before moving to the next step.
