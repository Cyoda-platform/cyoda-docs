# cyoda-docs restructure — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the big-bang restructure of `docs.cyoda.net` around the cyoda-go pivot — new IA, full content rewrite, delegation plumbing, discoverability upgrade, and visual alignment with cyoda-launchpad — in one coordinated landing.

**Architecture:** Astro + Starlight static site. Tokens and components stay framework-native; content lives in `src/content/docs/**`; version-specific artefacts are ingested via a new `scripts/sync-vendored.mjs`. Redirects handled by Astro's built-in `redirects` config in `astro.config.mjs` (GitHub Pages has no edge rewrites). Playwright covers cookie consent today and gains discoverability + link-integrity checks.

**Tech Stack:** Astro 5, Starlight 0.35, React 19 (for schema viewer), Playwright 1.55, Node scripts for build pipeline. Fonts via Google Fonts (Montserrat). Deployment: GitHub Pages.

**Source of truth:** `docs/superpowers/specs/2026-04-20-cyoda-docs-restructure-design.md` — read it before starting.

**Key context files:**
- `astro.config.mjs` — sidebar, redirects, Starlight config
- `package.json` — build pipeline ordering
- `scripts/generate-llms-txt.js`, `scripts/export-markdown.js`, `scripts/generate-schema-pages.js`
- `src/components/Head.astro`, `src/components/TableOfContents.astro`
- `src/styles/critical.css`, `src/styles/primer.css`, `src/styles/custom.css`
- Launchpad tokens: `~/dev/cyoda-launchpad/tailwind.config.ts`, `~/dev/cyoda-launchpad/src/index.css`
- cyoda-go reference: `~/go-projects/cyoda-light/cyoda-go/` (README, ARCHITECTURE.md, examples/)

**Confidentiality:** `cyoda-go-cassandra` is proprietary. No internals from it — ever — in anything written here.

---

## File Structure

**Created:**
- `src/components/Badge.astro` — pill-style status/tier badge
- `src/components/Button.astro` — primary/secondary brand button
- `src/components/GrowthPathDiagram.astro` — reused growth-path visual
- `src/components/VendoredBanner.astro` — notice on pages sourced from cyoda-go
- `src/components/ViewAsMarkdown.astro` — injected into TableOfContents
- `src/styles/tokens.css` — extracted design tokens (new)
- `src/styles/visual.css` — look-and-feel utilities (grid bg, separators, section tints)
- `scripts/sync-vendored.mjs` — vendor-mode sync
- `scripts/generate-llms-full.js` — concatenated content for agents (or extension of existing)
- `vendored/CYODA_GO_VERSION` — pinned upstream release tag
- `vendored/schemas/` — JSON Schemas, today a local mirror of `src/schemas/`
- `vendored/cli/README.md` — placeholder with upstream issue link
- `vendored/configuration/README.md` — placeholder with upstream issue link
- `vendored/helm/README.md` — placeholder with upstream issue link
- `src/content/docs/getting-started/install-and-first-entity.mdx`
- `src/content/docs/concepts/{what-is-cyoda,entities-and-lifecycle,workflows-and-events,digital-twins-and-growth-path,apis-and-surfaces,authentication-and-identity,design-principles}.md`
- `src/content/docs/build/{index,modeling-entities,working-with-entities,workflows-and-processors,client-compute-nodes,testing-with-digital-twins}.{md,mdx}`
- `src/content/docs/run/{index.mdx,desktop.md,docker.md,kubernetes.md}`
- `src/content/docs/run/cyoda-cloud/{overview,provisioning,identity-and-entitlements,status-and-roadmap}.md`
- `src/content/docs/reference/{index.mdx,api.mdx,schemas.mdx,cli.mdx,configuration.mdx,helm.mdx}`
- `tests/discoverability.spec.ts` — Playwright checks for head tags, `.md` endpoints
- `tests/visual-tokens.spec.ts` — computed font + primary-color checks
- `tests/redirects.spec.ts` — every mapped redirect resolves
- `tests/link-integrity.spec.ts` — no broken internal links

**Modified:**
- `astro.config.mjs` — sidebar, redirects map, font preload, sitemap extension
- `package.json` — build pipeline (sync-vendored → schema-pages → astro build → export-markdown → llms + llms-full → package-schemas)
- `src/components/Head.astro` — Montserrat preload, `<link rel="alternate">` for markdown & llms.txt, JSON-LD `TechnicalArticle`
- `src/components/TableOfContents.astro` — inject `<ViewAsMarkdown>`
- `src/components/SiteTitle.astro`, `Header.astro`, `Footer.astro` — adapt to new tokens (no restructuring)
- `src/styles/critical.css` — consolidate tokens from launchpad; keep `--cyoda-aqua` alias
- `src/styles/custom.css` — migrate component-level rules onto new tokens; drop obsolete
- `src/styles/primer.css` — retarget to new tokens
- `scripts/generate-llms-txt.js` — update section names to new IA; add `llms-full.txt` emission
- `scripts/generate-schema-pages.js` — read from `vendored/schemas/` (post-sync), write to `src/content/docs/reference/schemas/`
- `scripts/export-markdown.js` — unchanged logic; confirm new IA works
- `public/robots.txt` — explicit AI crawler allows
- `src/content/docs/index.mdx` — hero-lite treatment with Montserrat headline + growth-path

**Deleted (after migration):**
- `src/content/docs/getting-started/introduction.md`
- `src/content/docs/getting-started/quickstart.md`
- `src/content/docs/guides/` (all contents)
- `src/content/docs/concepts/` (current contents replaced)
- `src/content/docs/architecture/cyoda-cloud-architecture.md`
- `src/content/docs/cloud/` (all contents; new home under `run/cyoda-cloud/`)

---

## Worktree recommendation

This is a big-bang pivot touching nearly every content file. **Work in a git worktree** so `main` stays stable and a long-running reviewable branch exists:

```bash
git worktree add ../cyoda-docs-pivot -b restructure-cyoda-go-pivot
cd ../cyoda-docs-pivot
npm install
```

All commands below assume the worktree is the working directory.

---

## Phase 0 — Baseline verification

### Task 0.1: Record current build is green

**Files:** none (read-only)

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: exits 0. `dist/` populated. `dist/llms.txt`, `dist/markdown/`, `dist/schemas.zip` all exist.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all pass (cookie consent + GA).

- [ ] **Step 3: Record current inventory**

```bash
find src/content/docs -type f \( -name '*.md' -o -name '*.mdx' \) | sort > /tmp/docs-inventory-before.txt
wc -l /tmp/docs-inventory-before.txt
```

Expected: ~30 files (pre-restructure). Keep this file — it's the source for the redirect map derivation later.

- [ ] **Step 4: Commit the plan itself**

```bash
git add docs/superpowers/plans/2026-04-20-cyoda-docs-restructure.md
git commit -m "docs(plan): implementation plan for cyoda-docs restructure"
```

---

## Phase 1 — Visual tokens and fonts

### Task 1.1: Introduce extracted tokens file

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `astro.config.mjs:232-240` (customCss array)

- [ ] **Step 1: Write tokens.css** (source-of-truth for palette + typography; mirrors launchpad)

```css
/* src/styles/tokens.css — design tokens aligned with cyoda-launchpad */

:root {
  /* Cyoda brand palette (HSL triplets for hsl() composition) */
  --cyoda-teal: 175 67% 52%;         /* #4FB8B0 */
  --cyoda-orange: 32 95% 59%;        /* #FD9E29 */
  --cyoda-purple: 258 74% 37%;       /* #5A18AC */
  --cyoda-green: 106 44% 60%;        /* #6BB45A */

  /* Legacy alias (do not remove — referenced across primer.css / custom.css) */
  --cyoda-aqua: hsl(var(--cyoda-teal));
  --cyoda-aqua-rgb: 79, 184, 176;
  --cyoda-aqua-light: hsl(var(--cyoda-teal) / 0.1);
  --cyoda-aqua-medium: hsl(var(--cyoda-teal) / 0.2);

  /* Surfaces */
  --cyoda-background: 0 0% 100%;
  --cyoda-foreground: 222 47% 11%;
  --cyoda-border: 214 32% 91%;
  --cyoda-muted: 210 40% 96%;

  /* Typography */
  --cyoda-font-sans: 'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --cyoda-font-mono: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

  /* Starlight slot mappings */
  --sl-font: var(--cyoda-font-sans);
  --sl-font-mono: var(--cyoda-font-mono);
  --sl-color-accent: var(--cyoda-aqua);
  --sl-color-accent-low: hsl(var(--cyoda-teal) / 0.1);
  --sl-color-accent-high: hsl(var(--cyoda-teal) / 0.9);
  --sl-color-border-accent: var(--cyoda-aqua);
}

:root[data-theme='dark'] {
  --cyoda-background: 220 14% 8%;
  --cyoda-foreground: 220 20% 96%;
  --cyoda-border: 220 10% 22%;
  --cyoda-muted: 220 10% 16%;
  --sl-color-accent: var(--cyoda-aqua);
  --sl-color-accent-low: hsl(var(--cyoda-teal) / 0.15);
  --sl-color-border-accent: hsl(var(--cyoda-teal) / 0.5);
}
```

- [ ] **Step 2: Wire tokens.css into Starlight customCss**

In `astro.config.mjs`, update the `customCss` array so `tokens.css` loads **before** the existing files:

```js
customCss: [
    './src/styles/tokens.css',   // NEW — load first so later files override-free
    './src/styles/critical.css',
    './src/styles/primer.css',
    './src/styles/custom.css',
],
```

- [ ] **Step 3: Remove duplicated tokens from critical.css**

Open `src/styles/critical.css` and delete the `--cyoda-aqua*` declarations and the `--sl-color-accent*` mappings (lines ~10–18, ~26–28). Keep only `--sl-content-width` and non-token layout rules. The tokens.css file now owns these.

- [ ] **Step 4: Build and verify no regressions**

```bash
npm run build
```

Expected: build succeeds. Open `dist/index.html` and confirm brand accent still teal. No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/critical.css astro.config.mjs
git commit -m "style(tokens): extract design tokens into tokens.css"
```

### Task 1.2: Load Montserrat via Google Fonts with preconnect

**Files:**
- Modify: `src/components/Head.astro`

- [ ] **Step 1: Write a discoverability test fixture first (will be extended in Phase 3)**

Create `tests/visual-tokens.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Visual tokens', () => {
  test('Montserrat is loaded and applied', async ({ page }) => {
    await page.goto('/');
    // Wait for font loading to settle before probing.
    await page.evaluate(() => (document as any).fonts.ready);
    const loaded = await page.evaluate(() =>
      (document as any).fonts.check('1em Montserrat')
    );
    expect(loaded).toBe(true);
  });

  test('--sl-color-accent resolves to a color', async ({ page }) => {
    await page.goto('/');
    const color = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--sl-color-accent')
        .trim()
    );
    // Accept any resolved color form; guards against the var being undefined
    // or accidentally left as a raw HSL triplet (e.g. "175 67% 52%").
    expect(color).toMatch(/^(hsl\(|rgb\(|#)/i);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail on Montserrat**

```bash
npx playwright test tests/visual-tokens.spec.ts
```

Expected: first test FAILS (Montserrat not yet loaded); second test passes or fails depending on resolution. Note the failure modes.

- [ ] **Step 3: Add Montserrat preconnect + link to Head.astro**

Modify `src/components/Head.astro` — inside the existing component, before `<StarlightHead {...Astro.props} />`:

```astro
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  as="style"
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"
  onload="this.onload=null;this.rel='stylesheet'"
/>
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" />
</noscript>
```

- [ ] **Step 4: Re-run the test**

```bash
npm run build && npx playwright test tests/visual-tokens.spec.ts
```

Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Head.astro tests/visual-tokens.spec.ts
git commit -m "style(fonts): load Montserrat and add token regression tests"
```

### Task 1.3: Add dotted-grid body background

**Files:**
- Create: `src/styles/visual.css`
- Modify: `astro.config.mjs` (customCss)

- [ ] **Step 1: Write visual.css**

```css
/* src/styles/visual.css — look-and-feel utilities aligned with cyoda-launchpad */

body {
  background-image: radial-gradient(
    circle at 1px 1px,
    hsl(var(--cyoda-foreground) / 0.08) 1px,
    transparent 0
  );
  background-size: 20px 20px;
}

/* Subtle teal wash for hero/section-index pages (opt-in via class) */
.section-hero {
  background: linear-gradient(
    to bottom,
    hsl(var(--cyoda-teal) / 0.06),
    transparent
  );
  padding-block-end: 2rem;
  margin-block-end: 2rem;
}

/* Dotted divider */
.section-separator {
  height: 1rem;
  background-image: radial-gradient(
    circle at center,
    hsl(var(--cyoda-foreground) / 0.2) 1px,
    transparent 1.5px
  );
  background-size: 8px 8px;
  background-repeat: repeat-x;
  background-position: center;
  margin-block: 2rem;
}

/* Teal-tinted card variant */
.card-teal {
  background: hsl(var(--cyoda-teal) / 0.05);
  border: 1px solid hsl(var(--cyoda-teal) / 0.3);
  border-radius: 0.5rem;
  padding: 1.25rem;
}
```

- [ ] **Step 2: Append to customCss array**

```js
customCss: [
    './src/styles/tokens.css',
    './src/styles/critical.css',
    './src/styles/primer.css',
    './src/styles/custom.css',
    './src/styles/visual.css',   // NEW — last so utilities can layer on top
],
```

- [ ] **Step 3: Build and spot-check**

```bash
npm run build && npm run preview &
sleep 2 && curl -s http://localhost:4321/ | grep -c 'background-image' || true
```

Expected: build passes. Kill the preview server.

- [ ] **Step 4: Commit**

```bash
git add src/styles/visual.css astro.config.mjs
git commit -m "style(visual): add dotted-grid background and utility classes"
```

---

## Phase 2 — Reusable components

### Task 2.1: Badge component

**Files:**
- Create: `src/components/Badge.astro`
- Test: `tests/visual-tokens.spec.ts` (extend)

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Badge.astro — pill-style status/tier badge aligned with launchpad
interface Props {
  variant?: 'teal' | 'orange' | 'purple' | 'green' | 'muted';
  size?: 'sm' | 'md';
}
const { variant = 'teal', size = 'md' } = Astro.props;
---
<span class:list={['cyoda-badge', `cyoda-badge--${variant}`, `cyoda-badge--${size}`]}>
  <slot />
</span>

<style>
  .cyoda-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    font-family: var(--cyoda-font-sans);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .cyoda-badge--sm { font-size: 0.7rem; padding: 0.15rem 0.6rem; }
  .cyoda-badge--md { font-size: 0.8rem; padding: 0.25rem 0.9rem; }
  .cyoda-badge--teal   { background: hsl(var(--cyoda-teal) / 0.15);   color: hsl(var(--cyoda-teal)); }
  .cyoda-badge--orange { background: hsl(var(--cyoda-orange) / 0.15); color: hsl(var(--cyoda-orange)); }
  .cyoda-badge--purple { background: hsl(var(--cyoda-purple) / 0.15); color: hsl(var(--cyoda-purple)); }
  .cyoda-badge--green  { background: hsl(var(--cyoda-green) / 0.15);  color: hsl(var(--cyoda-green)); }
  .cyoda-badge--muted  { background: hsl(var(--cyoda-muted));          color: hsl(var(--cyoda-foreground) / 0.7); }
</style>
```

- [ ] **Step 2: Use once in a test sandbox page**

Create a temporary `src/pages/_sandbox/badge.astro`:

```astro
---
import Badge from '../../components/Badge.astro';
---
<html><body>
  <Badge variant="teal">Stable</Badge>
  <Badge variant="orange" size="sm">Evolving</Badge>
  <Badge variant="purple">Awaiting upstream</Badge>
</body></html>
```

- [ ] **Step 3: Build, render, sanity-check**

```bash
npm run build
ls dist/_sandbox/badge/
```

Expected: `index.html` present.

- [ ] **Step 4: Remove the sandbox page**

```bash
rm -rf src/pages/_sandbox
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Badge.astro
git commit -m "feat(components): add Badge pill component"
```

### Task 2.2: Button component

**Files:**
- Create: `src/components/Button.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/Button.astro — primary/secondary CTA aligned with launchpad
interface Props {
  href: string;
  variant?: 'primary' | 'secondary';
}
const { href, variant = 'primary' } = Astro.props;
---
<a href={href} class:list={['cyoda-btn', `cyoda-btn--${variant}`]}>
  <slot />
</a>

<style>
  .cyoda-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    border-radius: 0.4rem;
    font-family: var(--cyoda-font-sans);
    font-weight: 600;
    text-decoration: none;
    transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
  }
  .cyoda-btn--primary {
    background: hsl(var(--cyoda-teal));
    color: white;
    border: 2px solid hsl(var(--cyoda-teal));
  }
  .cyoda-btn--primary:hover {
    background: hsl(var(--cyoda-teal) / 0.85);
  }
  .cyoda-btn--secondary {
    background: transparent;
    color: hsl(var(--cyoda-teal));
    border: 2px solid hsl(var(--cyoda-teal));
  }
  .cyoda-btn--secondary:hover {
    background: hsl(var(--cyoda-teal) / 0.08);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Button.astro
git commit -m "feat(components): add Button component"
```

### Task 2.3: GrowthPathDiagram component

**Files:**
- Create: `src/components/GrowthPathDiagram.astro`

- [ ] **Step 1: Write the component**

Reuse the existing light/dark SVG assets (PR #51 landed these). Check `public/` or `src/assets/` for the growth-path SVGs first:

```bash
find src/assets public -iname '*growth*' -o -iname '*tier*' 2>/dev/null
```

If no asset exists, render the four-tier progression in HTML/CSS instead (no inline SVG over 40 lines).

```astro
---
// src/components/GrowthPathDiagram.astro — shared growth-path visual
// Four tiers: In-Memory → SQLite → PostgreSQL → Cassandra
import Badge from './Badge.astro';
const tiers = [
  { name: 'In-Memory', sub: 'local dev + AI iteration', variant: 'teal' },
  { name: 'SQLite',    sub: 'embedded durable single node', variant: 'teal' },
  { name: 'PostgreSQL', sub: 'durable clustered production', variant: 'teal' },
  { name: 'Cassandra',  sub: 'enterprise distributed scale', variant: 'green' },
];
---
<ol class="growth-path">
  {tiers.map((t, i) => (
    <li class="growth-path__tier">
      <Badge variant={t.variant as any} size="sm">{t.name}</Badge>
      <div class="growth-path__sub">{t.sub}</div>
      {i < tiers.length - 1 && <span class="growth-path__arrow" aria-hidden="true">→</span>}
    </li>
  ))}
</ol>

<style>
  .growth-path {
    list-style: none;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    padding: 1.5rem;
    margin: 1.5rem 0;
    background: hsl(var(--cyoda-teal) / 0.04);
    border: 1px solid hsl(var(--cyoda-teal) / 0.2);
    border-radius: 0.5rem;
  }
  .growth-path__tier {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    min-width: 9rem;
  }
  .growth-path__sub {
    font-size: 0.75rem;
    color: hsl(var(--cyoda-foreground) / 0.7);
    text-align: center;
    max-width: 9rem;
  }
  .growth-path__arrow {
    font-size: 1.5rem;
    color: hsl(var(--cyoda-foreground) / 0.4);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GrowthPathDiagram.astro
git commit -m "feat(components): add GrowthPathDiagram component"
```

### Task 2.4: VendoredBanner component

**Files:**
- Create: `src/components/VendoredBanner.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/VendoredBanner.astro — banner on pages sourced from cyoda-go
interface Props {
  source?: { repo?: string; path?: string; vendored_at?: string };
  stability?: 'stable' | 'evolving' | 'awaiting-upstream';
  issue?: string; // optional GitHub issue URL for awaiting-upstream
}
const { source, stability = 'stable', issue } = Astro.props;
const showBanner = stability !== 'stable' || source;
---
{showBanner && (
  <aside class="vendored-banner" data-stability={stability}>
    {stability === 'awaiting-upstream' && (
      <>
        <strong>Awaiting upstream.</strong>
        This page is a placeholder.
        {issue && <> See <a href={issue}>{issue}</a>.</>}
      </>
    )}
    {stability === 'evolving' && (
      <><strong>Evolving.</strong> This page may change rapidly with cyoda-go releases.</>
    )}
    {stability === 'stable' && source && (
      <>
        Sourced from <a href={`https://github.com/${source.repo}/blob/${source.vendored_at ?? 'main'}/${source.path}`}>
          {source.repo}/{source.path}
        </a>. Edit upstream.
      </>
    )}
  </aside>
)}

<style>
  .vendored-banner {
    border-left: 4px solid hsl(var(--cyoda-orange));
    background: hsl(var(--cyoda-orange) / 0.08);
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    margin-block-end: 1.5rem;
    font-size: 0.9rem;
  }
  .vendored-banner[data-stability='awaiting-upstream'] {
    border-left-color: hsl(var(--cyoda-purple));
    background: hsl(var(--cyoda-purple) / 0.08);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/VendoredBanner.astro
git commit -m "feat(components): add VendoredBanner component"
```

---

## REVIEW CHECKPOINT 1

Phase 1–2 deliver tokens, fonts, visual utilities, and four reusable components. Before moving on, confirm:
- `npm run build` is green.
- `npx playwright test tests/visual-tokens.spec.ts` passes.
- Site homepage renders with Montserrat and teal accent in a browser.

Fix any regressions before continuing.

---

## Phase 3 — Discoverability infrastructure

### Task 3.1: Inject per-page `<link rel="alternate" type="text/markdown">`

**Files:**
- Modify: `src/components/Head.astro`
- Test: `tests/discoverability.spec.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/discoverability.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Discoverability', () => {
  test('every doc page advertises its markdown sibling', async ({ page }) => {
    await page.goto('/getting-started/install-and-first-entity/');
    const href = await page.locator('link[rel="alternate"][type="text/markdown"]').first().getAttribute('href');
    expect(href).toMatch(/^\/markdown\/.+\.md$/);
  });

  test('every page links to llms.txt and llms-full.txt', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('link[rel="alternate"][type="text/markdown"]').evaluateAll(
      nodes => nodes.map(n => (n as HTMLLinkElement).href)
    );
    expect(hrefs.some(h => h.endsWith('/llms.txt'))).toBe(true);
    expect(hrefs.some(h => h.endsWith('/llms-full.txt'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
npx playwright test tests/discoverability.spec.ts
```

- [ ] **Step 3: Extend Head.astro**

Add inside the component, after the referrer meta:

```astro
---
import StarlightHead from '@astrojs/starlight/components/Head.astro';
import Analytics from './Analytics.astro';
import HashRedirect from './HashRedirect.astro';

// Starlight exposes per-route data via Astro.locals.starlightRoute
// (NOT via Astro.props). See node_modules/@astrojs/starlight/utils/routing/types.ts
// for StarlightRouteData. entry.slug is the content-collection slug.
const slug = Astro.locals.starlightRoute?.entry?.slug ?? '';
const mdPath = slug === '' ? '/markdown/index.md' : `/markdown/${slug}.md`;
---

<meta name="referrer" content="strict-origin-when-cross-origin" />

<!-- Per-page markdown for LLM consumers -->
<link rel="alternate" type="text/markdown" href={mdPath} title="View as Markdown" />

<!-- Site-wide LLM indexes -->
<link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM index" />
<link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Full content for LLMs" />

<StarlightHead {...Astro.props} />
<Analytics />
<HashRedirect />
```

Note: Starlight's Head component receives `entry` via `Astro.props`. Verify the prop shape against `node_modules/@astrojs/starlight/components/Head.astro`.

- [ ] **Step 4: Re-run test — expect PASS**

```bash
npm run build && npx playwright test tests/discoverability.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Head.astro tests/discoverability.spec.ts
git commit -m "feat(disco): advertise markdown alternates in page head"
```

### Task 3.2: Generate /llms-full.txt

**Files:**
- Create: `scripts/generate-llms-full.js`
- Modify: `package.json` (build pipeline)

- [ ] **Step 1: Write the generator**

```js
#!/usr/bin/env node
// scripts/generate-llms-full.js — concatenate all exported markdown for agents

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_DIR = path.join(__dirname, '../dist/markdown');
const OUTPUT_FILE = path.join(__dirname, '../dist/llms-full.txt');
const SITE_URL = 'https://docs.cyoda.net';

async function main() {
  const files = (await glob('**/*.md', { cwd: MARKDOWN_DIR, absolute: true })).sort();
  const parts = [`# Cyoda Documentation — full content\n\n` +
                 `Source: ${SITE_URL}\n` +
                 `Generated: ${new Date().toISOString()}\n\n---\n\n`];
  for (const file of files) {
    const rel = path.relative(MARKDOWN_DIR, file);
    const body = await fs.readFile(file, 'utf-8');
    parts.push(`## ${rel}\n\n${body.trim()}\n\n---\n\n`);
  }
  await fs.writeFile(OUTPUT_FILE, parts.join(''), 'utf-8');
  console.log(`✅ Generated llms-full.txt (${files.length} docs)`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Wire into build pipeline**

In `package.json`, modify the `build` script:

```json
"build": "npm run sync:vendored && npm run generate:schema-pages && astro build && npm run export:markdown && npm run generate:llms && npm run generate:llms-full && npm run package:schemas",
"generate:llms-full": "node scripts/generate-llms-full.js",
```

Note: `sync:vendored` is added later in Task 4.1; for now, add the `generate:llms-full` command only and leave `sync:vendored` wiring to that task.

- [ ] **Step 3: Build and verify output**

```bash
npm run build
ls -la dist/llms-full.txt
head -20 dist/llms-full.txt
```

Expected: file exists, non-empty, starts with the "# Cyoda Documentation — full content" header.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-llms-full.js package.json
git commit -m "feat(disco): generate /llms-full.txt with all markdown concatenated"
```

### Task 3.3: JSON-LD TechnicalArticle in Head

**Files:**
- Modify: `src/components/Head.astro`
- Test: `tests/discoverability.spec.ts` (extend)

- [ ] **Step 1: Extend the test**

Append to `tests/discoverability.spec.ts`:

```ts
test('pages emit TechnicalArticle JSON-LD', async ({ page }) => {
  await page.goto('/');
  const script = await page.locator('script[type="application/ld+json"]').first().innerText();
  const data = JSON.parse(script);
  expect(data['@type']).toBe('TechnicalArticle');
  expect(data.headline).toBeTruthy();
  expect(data.inLanguage).toBe('en');
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx playwright test tests/discoverability.spec.ts -g "JSON-LD"
```

- [ ] **Step 3: Emit JSON-LD in Head.astro**

Inside the component frontmatter, build the object from `Astro.locals.starlightRoute`:

```astro
---
// ... existing imports; slug/mdPath already computed from Task 3.1
const entry = Astro.locals.starlightRoute?.entry;
const title = entry?.data?.title ?? 'Cyoda Documentation';
const description = entry?.data?.description ?? '';
const ld = {
  '@context': 'https://schema.org',
  '@type': 'TechnicalArticle',
  headline: title,
  description,
  inLanguage: 'en',
  isPartOf: { '@type': 'WebSite', name: 'Cyoda Documentation', url: 'https://docs.cyoda.net' },
  dateModified: entry?.data?.lastUpdated ?? new Date().toISOString().slice(0,10),
};
---
```

And in the template body, after the existing link tags and before `<StarlightHead>`:

```astro
<script type="application/ld+json" set:html={JSON.stringify(ld)} />
```

- [ ] **Step 4: Re-run — expect PASS**

```bash
npm run build && npx playwright test tests/discoverability.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Head.astro tests/discoverability.spec.ts
git commit -m "feat(disco): emit TechnicalArticle JSON-LD per page"
```

### Task 3.4: "View as Markdown" link in TableOfContents

**Files:**
- Create: `src/components/ViewAsMarkdown.astro`
- Modify: `src/components/TableOfContents.astro`

- [ ] **Step 1: Write the link component**

```astro
---
// src/components/ViewAsMarkdown.astro
// Starlight per-route data lives on Astro.locals.starlightRoute (not Astro.props).
const slug = Astro.locals.starlightRoute?.entry?.slug ?? '';
const mdPath = slug === '' ? '/markdown/index.md' : `/markdown/${slug}.md`;
---
<a class="view-as-md" href={mdPath} data-no-hover-prefetch>
  View as Markdown
</a>

<style>
  .view-as-md {
    display: inline-block;
    font-size: 0.85rem;
    color: hsl(var(--cyoda-teal));
    text-decoration: none;
    margin-top: 0.5rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid hsl(var(--cyoda-teal) / 0.3);
    border-radius: 0.25rem;
  }
  .view-as-md:hover {
    background: hsl(var(--cyoda-teal) / 0.08);
  }
</style>
```

- [ ] **Step 2: Inject into TableOfContents**

Replace `src/components/TableOfContents.astro`:

```astro
---
import type { Props } from '@astrojs/starlight/props';
import Default from '@astrojs/starlight/components/TableOfContents.astro';
import ViewAsMarkdown from './ViewAsMarkdown.astro';
---

<div class="toc-wrapper">
  <div class="default-toc">
    <Default {...Astro.props} />
  </div>
  <ViewAsMarkdown {...Astro.props} />
</div>
```

- [ ] **Step 3: Build and confirm link appears**

```bash
npm run build && npm run preview &
sleep 2 && curl -s http://localhost:4321/ | grep -c 'view-as-md'
pkill -f 'astro preview'
```

Expected: grep finds at least one match.

- [ ] **Step 4: Commit**

```bash
git add src/components/ViewAsMarkdown.astro src/components/TableOfContents.astro
git commit -m "feat(disco): add 'View as Markdown' link in TOC"
```

### Task 3.5: Sitemap includes .md siblings

**Files:**
- Modify: `astro.config.mjs`
- Create: `scripts/generate-markdown-sitemap.js`
- Modify: `package.json`

- [ ] **Step 1: Write the sitemap generator**

```js
#!/usr/bin/env node
// scripts/generate-markdown-sitemap.js — companion sitemap listing .md endpoints

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_DIR = path.join(__dirname, '../dist/markdown');
const OUTPUT = path.join(__dirname, '../dist/sitemap-markdown.xml');
const SITE = 'https://docs.cyoda.net';

async function main() {
  const files = (await glob('**/*.md', { cwd: MARKDOWN_DIR })).sort();
  const entries = files.map(f => `  <url><loc>${SITE}/markdown/${f}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  await fs.writeFile(OUTPUT, xml, 'utf-8');
  console.log(`✅ Generated sitemap-markdown.xml (${files.length} urls)`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Wire into build**

In `package.json`:

```json
"generate:md-sitemap": "node scripts/generate-markdown-sitemap.js",
```

And append to the `build` command after `generate:llms-full`: `&& npm run generate:md-sitemap`.

- [ ] **Step 3: Build and verify**

```bash
npm run build && head -5 dist/sitemap-markdown.xml
```

Expected: valid XML preamble and at least one `<url>`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-markdown-sitemap.js package.json
git commit -m "feat(disco): generate sitemap-markdown.xml companion"
```

### Task 3.6: Update robots.txt with explicit AI crawler allows

**Files:**
- Modify: `public/robots.txt`

- [ ] **Step 1: Read current robots.txt**

```bash
cat public/robots.txt
```

- [ ] **Step 2: Replace with explicit allows**

Content for `public/robots.txt`:

```
# Cyoda Documentation — robots.txt
# Allow all default crawlers.
User-agent: *
Allow: /

# Explicit allows for AI/LLM crawlers.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://docs.cyoda.net/sitemap-index.xml
Sitemap: https://docs.cyoda.net/sitemap-markdown.xml
```

- [ ] **Step 3: Build and confirm**

```bash
npm run build && cat dist/robots.txt
```

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "feat(disco): explicit robots.txt allows for AI crawlers + md sitemap"
```

---

## REVIEW CHECKPOINT 2

Discoverability infrastructure is in place. Before moving on:
- `npx playwright test tests/discoverability.spec.ts` — all three tests pass.
- Manually visit `/llms.txt`, `/llms-full.txt`, `/sitemap-markdown.xml`, `/robots.txt` — all resolve with expected content.
- View source on the homepage and confirm: `<link rel="alternate" type="text/markdown">` for page, llms.txt, llms-full.txt; JSON-LD script present.

---

## Phase 4 — Vendoring plumbing

### Task 4.1: Create vendored directory structure and sync script

**Files:**
- Create: `vendored/CYODA_GO_VERSION`
- Create: `vendored/README.md`
- Create: `scripts/sync-vendored.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the pin file**

```bash
mkdir -p vendored
echo "v0.2.0" > vendored/CYODA_GO_VERSION
```

(Replace `v0.2.0` with the current cyoda-go release tag — check `gh release list -R Cyoda-platform/cyoda-go` if unsure.)

- [ ] **Step 2: Write vendored README**

```markdown
# vendored/

Source-of-truth artefacts mirrored from cyoda-go for consumption by
docs.cyoda.net.

- `CYODA_GO_VERSION` — pinned upstream release tag for the current
  cyoda-docs site version.
- `schemas/` — JSON Schemas (will be sourced from cyoda-go once
  upstream publishes them as a release artefact).
- `cli/`, `configuration/`, `helm/` — placeholder directories with
  README files linking to the upstream issues tracking each artefact.

`scripts/sync-vendored.mjs` materialises these artefacts based on
`VENDOR_MODE`:

- `local` (default) — use the checked-in copies as-is.
- `release` — download from the pinned cyoda-go release.
- `url` — download per-source URLs declared in `scripts/sync-vendored.mjs`.
```

- [ ] **Step 3: Write the sync script (local mode only for now)**

```js
#!/usr/bin/env node
// scripts/sync-vendored.mjs — materialise vendored artefacts per VENDOR_MODE

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODE = process.env.VENDOR_MODE || 'local';
const PIN = (await fs.readFile(path.join(ROOT, 'vendored/CYODA_GO_VERSION'), 'utf-8')).trim();

async function syncLocal() {
  // In local mode, vendored/schemas/ should already contain the schemas.
  // Mirror into src/schemas/ for the existing generate-schema-pages.js to consume.
  const srcDir = path.join(ROOT, 'vendored/schemas');
  const dstDir = path.join(ROOT, 'src/schemas');
  try {
    await fs.access(srcDir);
  } catch {
    console.log('ℹ️  vendored/schemas/ does not yet exist — skipping schema sync');
    return;
  }
  await fs.rm(dstDir, { recursive: true, force: true });
  await fs.cp(srcDir, dstDir, { recursive: true });
  console.log(`✅ Synced vendored/schemas → src/schemas (pin: ${PIN})`);
}

async function main() {
  console.log(`🔄 sync-vendored MODE=${MODE} PIN=${PIN}`);
  switch (MODE) {
    case 'local':
      await syncLocal();
      break;
    case 'release':
    case 'url':
      console.error(`❌ MODE=${MODE} is not implemented yet. File an issue if you need it.`);
      process.exit(1);
    default:
      console.error(`❌ Unknown VENDOR_MODE: ${MODE}`);
      process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Wire into package.json**

```json
"sync:vendored": "node scripts/sync-vendored.mjs",
```

And update the `build` script so `sync:vendored` runs **first**:

```json
"build": "npm run sync:vendored && npm run generate:schema-pages && astro build && npm run export:markdown && npm run generate:llms && npm run generate:llms-full && npm run generate:md-sitemap && npm run package:schemas",
```

- [ ] **Step 5: Verify it runs clean (no schemas moved yet)**

```bash
npm run sync:vendored
```

Expected: prints "vendored/schemas/ does not yet exist — skipping schema sync". No error.

- [ ] **Step 6: Commit**

```bash
git add vendored/CYODA_GO_VERSION vendored/README.md scripts/sync-vendored.mjs package.json
git commit -m "feat(vendor): add sync-vendored.mjs with local mode"
```

### Task 4.2: Move src/schemas into vendored/schemas

**Files:**
- Move: `src/schemas/` → `vendored/schemas/`

- [ ] **Step 1: Move the directory**

```bash
git mv src/schemas vendored/schemas
```

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: the sync step copies `vendored/schemas/` back into `src/schemas/`, then `generate-schema-pages` runs as before. Build succeeds.

- [ ] **Step 3: Add src/schemas/ to .gitignore**

Append to `.gitignore`:

```
# Materialised from vendored/schemas/ at build time
src/schemas/
```

- [ ] **Step 4: Verify git status is clean except for the intended moves**

```bash
git status
```

Expected: `vendored/schemas/...` added (from git mv), `.gitignore` modified. No stray `src/schemas/...` entries.

- [ ] **Step 5: Commit**

```bash
git add .gitignore vendored/schemas
git commit -m "refactor(schemas): move JSON Schemas into vendored/ for delegation"
```

### Task 4.3: Placeholder directories for awaiting-upstream sources

**Files:**
- Create: `vendored/cli/README.md`
- Create: `vendored/configuration/README.md`
- Create: `vendored/helm/README.md`

- [ ] **Step 1: Write all three placeholders**

`vendored/cli/README.md`:

```markdown
# vendored/cli/

**Awaiting upstream.** This directory will hold the cyoda-go CLI help
dump (generated from `cyoda --help` and all subcommand helps) as a
markdown tree.

Tracked in: https://github.com/Cyoda-platform/cyoda-go/issues/<TBD>

Until that issue lands, `src/content/docs/reference/cli.mdx` shows the
placeholder banner.
```

`vendored/configuration/README.md`:

```markdown
# vendored/configuration/

**Awaiting upstream.** This directory will hold the canonical
environment-variable and configuration documentation for cyoda-go.

Tracked in: https://github.com/Cyoda-platform/cyoda-go/issues/<TBD>
```

`vendored/helm/README.md`:

```markdown
# vendored/helm/

**Awaiting upstream.** This directory will hold the Helm values
documentation generated via `helm-docs` from the cyoda-go Helm chart
at `deploy/helm/`.

Tracked in: https://github.com/Cyoda-platform/cyoda-go/issues/<TBD>
```

- [ ] **Step 2: Commit**

```bash
git add vendored/cli/README.md vendored/configuration/README.md vendored/helm/README.md
git commit -m "chore(vendor): scaffold awaiting-upstream placeholder dirs"
```

---

## REVIEW CHECKPOINT 3

Vendoring plumbing is in place. Verify:
- `npm run build` is green; `src/schemas/` is regenerated from `vendored/schemas/`.
- `git status --ignored` shows `src/schemas/` ignored.
- Deleting `src/schemas/` and re-running `npm run sync:vendored` recreates it.

---

## Phase 5 — IA scaffold (empty shell, redirects, sidebar)

### Task 5.1: Create new content directories with index stubs

**Files:**
- Create: `src/content/docs/{concepts,build,run,run/cyoda-cloud,reference}/index.mdx` (all are stubs; detailed content lands in Phase 6–7)

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p src/content/docs/build
mkdir -p src/content/docs/run/cyoda-cloud
mkdir -p src/content/docs/reference
```

(Concepts exists already — we'll overwrite its contents in Phase 6.)

- [ ] **Step 2: Write section index stubs**

For each section, a minimal index that will be fleshed out later. Example — `src/content/docs/build/index.mdx`:

```mdx
---
title: Build
description: Develop Cyoda applications — tier-agnostic patterns that work on any runtime.
sidebar:
  order: 0
---

Cyoda applications are **digital twins**: the same code runs on every
storage tier, from in-memory dev through Cassandra at enterprise
scale. The pages in this section cover the patterns — entity modeling,
workflows, external processors, testing — independent of where your
app runs.

Where to next:
- [Modeling entities](./modeling-entities/)
- [Working with entities](./working-with-entities/)
- [Workflows and processors](./workflows-and-processors/)
- [Client compute nodes](./client-compute-nodes/)
- [Testing with digital twins](./testing-with-digital-twins/)
```

Create the analogue for Run (`src/content/docs/run/index.mdx`), Run/Cyoda-Cloud (`src/content/docs/run/cyoda-cloud/index.mdx` — note stability banner), and Reference (`src/content/docs/reference/index.mdx` — explain delegation model).

Each index stub is ~5–15 lines. Do not pad.

- [ ] **Step 3: Build — expect 404s on child paths, but build itself passes**

```bash
npm run build
```

Expected: build succeeds. Starlight may warn about missing sidebar targets if sidebar is updated; for now sidebar is untouched so these pages live outside the sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/build src/content/docs/run src/content/docs/reference
git commit -m "feat(ia): scaffold new section index stubs"
```

### Task 5.2: Update sidebar to the new five-section layout

**Files:**
- Modify: `astro.config.mjs:241-272`

- [ ] **Step 1: Replace the sidebar array**

In `astro.config.mjs`, replace the `sidebar` array with:

```js
sidebar: [
    {
        label: 'Getting Started',
        collapsed: false,
        autogenerate: { directory: 'getting-started' }
    },
    {
        label: 'Concepts',
        collapsed: true,
        autogenerate: { directory: 'concepts' }
    },
    {
        label: 'Build',
        collapsed: true,
        autogenerate: { directory: 'build' }
    },
    {
        label: 'Run',
        collapsed: true,
        autogenerate: { directory: 'run' }
    },
    {
        label: 'Reference',
        collapsed: true,
        autogenerate: { directory: 'reference' }
    },
],
```

- [ ] **Step 2: Build and verify sidebar renders**

```bash
npm run build && npm run preview &
sleep 2 && open http://localhost:4321/  # visually confirm the five sections
pkill -f 'astro preview'
```

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(ia): five-section sidebar (Getting Started/Concepts/Build/Run/Reference)"
```

### Task 5.3: Compile the complete redirect map and wire via Astro redirects

**Files:**
- Modify: `astro.config.mjs` (add `redirects` key)
- Create: `docs/superpowers/plans/redirect-map.md` (audit trail)

- [ ] **Step 1: Derive the redirect map from `/tmp/docs-inventory-before.txt` and the spec**

Every file in the inventory that changes path gets an entry. Based on the spec's migration mapping table:

```
/getting-started/introduction/          → /concepts/what-is-cyoda/
/getting-started/quickstart/            → /getting-started/install-and-first-entity/
/guides/cyoda-design-principles/        → /concepts/design-principles/
/guides/api-saving-and-getting-data/    → /build/working-with-entities/
/guides/authentication-authorization/   → /concepts/authentication-and-identity/
/guides/iam-jwt-keys-and-oidc/          → /run/cyoda-cloud/identity-and-entitlements/
/guides/iam-oidc-and-jwt-claims/        → /run/cyoda-cloud/identity-and-entitlements/
/guides/workflow-config-guide/          → /build/workflows-and-processors/
/guides/client-calculation-member-guide/ → /build/client-compute-nodes/
/guides/entity-model-simple-view-specification/ → /concepts/entities-and-lifecycle/
/guides/sql-and-trino/                  → /concepts/apis-and-surfaces/
/guides/provision-environment/          → /run/cyoda-cloud/provisioning/
/architecture/cyoda-cloud-architecture/ → /run/cyoda-cloud/overview/
/cloud/entitlements/                    → /run/cyoda-cloud/identity-and-entitlements/
/cloud/roadmap/                         → /run/cyoda-cloud/status-and-roadmap/
/cloud/service-details/                 → /run/cyoda-cloud/overview/
/cloud/status/                          → /run/cyoda-cloud/status-and-roadmap/
```

Save this table to `docs/superpowers/plans/redirect-map.md` for future reference.

- [ ] **Step 2: Add `redirects` in astro.config.mjs**

Inside the `defineConfig({ ... })` block (top-level, not inside `starlight`):

```js
redirects: {
  '/getting-started/introduction/': '/concepts/what-is-cyoda/',
  '/getting-started/quickstart/': '/getting-started/install-and-first-entity/',
  '/guides/cyoda-design-principles/': '/concepts/design-principles/',
  '/guides/api-saving-and-getting-data/': '/build/working-with-entities/',
  '/guides/authentication-authorization/': '/concepts/authentication-and-identity/',
  '/guides/iam-jwt-keys-and-oidc/': '/run/cyoda-cloud/identity-and-entitlements/',
  '/guides/iam-oidc-and-jwt-claims/': '/run/cyoda-cloud/identity-and-entitlements/',
  '/guides/workflow-config-guide/': '/build/workflows-and-processors/',
  '/guides/client-calculation-member-guide/': '/build/client-compute-nodes/',
  '/guides/entity-model-simple-view-specification/': '/concepts/entities-and-lifecycle/',
  '/guides/sql-and-trino/': '/concepts/apis-and-surfaces/',
  '/guides/provision-environment/': '/run/cyoda-cloud/provisioning/',
  '/architecture/cyoda-cloud-architecture/': '/run/cyoda-cloud/overview/',
  '/cloud/entitlements/': '/run/cyoda-cloud/identity-and-entitlements/',
  '/cloud/roadmap/': '/run/cyoda-cloud/status-and-roadmap/',
  '/cloud/service-details/': '/run/cyoda-cloud/overview/',
  '/cloud/status/': '/run/cyoda-cloud/status-and-roadmap/',
},
```

- [ ] **Step 3: Write redirect test**

Create `tests/redirects.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const REDIRECTS: [string, string][] = [
  ['/getting-started/introduction/', '/concepts/what-is-cyoda/'],
  ['/guides/cyoda-design-principles/', '/concepts/design-principles/'],
  ['/guides/api-saving-and-getting-data/', '/build/working-with-entities/'],
  ['/cloud/entitlements/', '/run/cyoda-cloud/identity-and-entitlements/'],
  // (add the rest — one per redirect)
];

for (const [from, to] of REDIRECTS) {
  test(`redirect ${from} → ${to}`, async ({ page }) => {
    const response = await page.goto(from);
    expect(response?.ok()).toBe(true);
    expect(page.url()).toContain(to);
  });
}
```

Fill in the full list from the redirect map.

- [ ] **Step 4: Run — all fail until target pages exist**

```bash
npm run build && npx playwright test tests/redirects.spec.ts
```

Expected: redirects resolve but target pages don't exist yet, so they 404. That's fine — the test will pass once Phase 6–7 creates the targets.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs tests/redirects.spec.ts docs/superpowers/plans/redirect-map.md
git commit -m "feat(ia): wire redirect map from old URLs to new paths"
```

---

## REVIEW CHECKPOINT 4

IA scaffold is in place. The site now has a five-section sidebar (old sections disappear as their content migrates). Redirects are declared but target pages are mostly missing. Content migration follows.

---

## Phase 6 — Content migration: moves and trims

Each task in this phase moves (or merges) one or more existing files into the new structure, adjusting frontmatter. These are mechanical — no new prose required beyond trimming obsolete sections and tightening with links to delegated reference pages.

### Task 6.1: Move and adapt design principles

**Files:**
- Move: `src/content/docs/guides/cyoda-design-principles.mdx` → `src/content/docs/concepts/design-principles.md` (convert to .md if no JSX needed; check contents)

- [ ] **Step 1: Inspect current file for JSX**

```bash
head -30 src/content/docs/guides/cyoda-design-principles.mdx
```

- [ ] **Step 2: Move (preserve extension if it uses JSX; convert otherwise)**

```bash
git mv src/content/docs/guides/cyoda-design-principles.mdx src/content/docs/concepts/design-principles.mdx
```

- [ ] **Step 3: Update frontmatter**

At the top of the moved file, update the `sidebar.order` so it sorts sensibly within Concepts (e.g., `order: 90` to land near the end).

- [ ] **Step 4: Build — expect the redirect from /guides/... to work**

```bash
npm run build && npx playwright test tests/redirects.spec.ts -g "design-principles"
```

- [ ] **Step 5: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): move design-principles into Concepts"
```

### Task 6.2: Move workflow-config-guide into Build

**Files:**
- Move: `src/content/docs/guides/workflow-config-guide.mdx` → `src/content/docs/build/workflows-and-processors.mdx`

- [ ] **Step 1: Move**

```bash
git mv src/content/docs/guides/workflow-config-guide.mdx src/content/docs/build/workflows-and-processors.mdx
```

- [ ] **Step 2: Update title + description frontmatter**

```yaml
---
title: Workflows and processors
description: State-machine design, transitions, and external processors — with a preference for gRPC in compute nodes.
sidebar:
  order: 30
---
```

- [ ] **Step 3: Trim version-specific API details**

Scan for retyped endpoint paths, parameter tables, or JSON shapes. Replace with a sentence linking to `/reference/api/` for the shape and keep the conceptual explanation.

Add a callout near the processor discussion:

> **Use gRPC, not HTTP, for compute nodes.** gRPC preserves audit
> hygiene and simplifies authorization. See
> [APIs and surfaces](/concepts/apis-and-surfaces/) for the decision
> rationale.

- [ ] **Step 4: Build and verify**

```bash
npm run build && npx playwright test tests/redirects.spec.ts -g "workflow-config"
```

- [ ] **Step 5: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): move workflow guide into Build and trim specifics"
```

### Task 6.3: Move client-calculation-member-guide

**Files:**
- Move: `src/content/docs/guides/client-calculation-member-guide.md` → `src/content/docs/build/client-compute-nodes.md`

- [ ] **Step 1: Move**

```bash
git mv src/content/docs/guides/client-calculation-member-guide.md src/content/docs/build/client-compute-nodes.md
```

- [ ] **Step 2: Update frontmatter**

```yaml
---
title: Client compute nodes
description: Patterns for processor and criteria services — implementation, registration, and lifecycle.
sidebar:
  order: 40
---
```

- [ ] **Step 3: Trim and ensure gRPC framing**

Ensure the page uses gRPC examples. If HTTP examples exist, replace or flag them with a note pointing to `/concepts/apis-and-surfaces/` and the gRPC preference.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): move client compute guide into Build"
```

### Task 6.4: Move provision-environment into Cyoda Cloud

**Files:**
- Move: `src/content/docs/guides/provision-environment.mdx` → `src/content/docs/run/cyoda-cloud/provisioning.mdx`

- [ ] **Step 1: Move**

```bash
git mv src/content/docs/guides/provision-environment.mdx src/content/docs/run/cyoda-cloud/provisioning.mdx
```

- [ ] **Step 2: Update frontmatter and header**

```yaml
---
title: Provisioning (Cyoda Cloud)
description: Provision a Cyoda Cloud environment.
sidebar:
  order: 10
---
```

Add a stability banner near the top using the new `<Badge>`:

```mdx
import Badge from '../../../../components/Badge.astro';

<Badge variant="orange">Evolving · Cyoda Cloud</Badge>

Cyoda Cloud is currently a test/demo offering. A commercial SLA
offering is coming. Use at your own risk until then.
```

- [ ] **Step 3: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): move provisioning into Run/Cyoda-Cloud with stability banner"
```

### Task 6.5: Move and merge IAM pages into Cyoda Cloud

**Files:**
- Create: `src/content/docs/run/cyoda-cloud/identity-and-entitlements.md`
- Delete after merge: `src/content/docs/guides/iam-jwt-keys-and-oidc.md`, `src/content/docs/guides/iam-oidc-and-jwt-claims.md`, `src/content/docs/cloud/entitlements.md`

- [ ] **Step 1: Start from the newest IAM page as skeleton**

```bash
cp src/content/docs/guides/iam-jwt-keys-and-oidc.md src/content/docs/run/cyoda-cloud/identity-and-entitlements.md
```

- [ ] **Step 2: Update frontmatter**

```yaml
---
title: Identity and entitlements (Cyoda Cloud)
description: Configure OIDC, manage signing keys, and assign entitlements on the hosted platform.
sidebar:
  order: 20
---
```

- [ ] **Step 3: Fold in content from the other two pages**

Merge headings/sections from `guides/iam-oidc-and-jwt-claims.md` (claim mapping) and `cloud/entitlements.md` (entitlement catalog). Keep logical grouping: signing keys → OIDC provider config → claim mapping → entitlements. Remove duplicated prose.

Add a note at the top:

> This page covers identity operations for the **hosted Cyoda Cloud**
> platform. For self-hosted cyoda-go identity (OAuth 2.0 issuance,
> M2M credentials, external key trust on your own instance), see the
> [cyoda-go identity docs](https://github.com/Cyoda-platform/cyoda-go/blob/main/docs/).

- [ ] **Step 4: Delete the source pages**

```bash
git rm src/content/docs/guides/iam-jwt-keys-and-oidc.md
git rm src/content/docs/guides/iam-oidc-and-jwt-claims.md
git rm src/content/docs/cloud/entitlements.md
```

- [ ] **Step 5: Build, verify redirects, commit**

```bash
npm run build
npx playwright test tests/redirects.spec.ts -g "iam|entitlements"
git add src/content/docs
git commit -m "refactor(ia): merge IAM pages into Cyoda Cloud/identity-and-entitlements"
```

### Task 6.6: Move cyoda-cloud-architecture and service-details into overview

**Files:**
- Merge: `src/content/docs/architecture/cyoda-cloud-architecture.md` + `src/content/docs/cloud/service-details.mdx` → `src/content/docs/run/cyoda-cloud/overview.mdx`

- [ ] **Step 1: Start from architecture page as skeleton**

```bash
git mv src/content/docs/architecture/cyoda-cloud-architecture.md src/content/docs/run/cyoda-cloud/overview.md
```

- [ ] **Step 2: Update frontmatter**

```yaml
---
title: Cyoda Cloud overview
description: The hosted Cassandra-backed Cyoda platform — architecture, service boundaries, and current status.
sidebar:
  order: 0
---
```

- [ ] **Step 3: Append service-details content**

Open `src/content/docs/cloud/service-details.mdx`, copy the body content into `overview.md` under a new heading `## Service details`. Remove any duplicate content (both pages likely cover the architecture from different angles — dedupe).

- [ ] **Step 4: Add stability banner**

At the top of the body:

```md
import Badge from '../../../../components/Badge.astro';

<Badge variant="orange">Evolving · Test / demo only</Badge>

Cyoda Cloud is a test and demonstration platform today. Use at your
own risk. A commercial offering with SLAs is planned.
```

(If the file is .md, rename to .mdx to allow the component import; `git mv` first.)

- [ ] **Step 5: Delete source**

```bash
git rm src/content/docs/cloud/service-details.mdx
```

- [ ] **Step 6: Remove the now-empty architecture directory**

```bash
rmdir src/content/docs/architecture 2>/dev/null || true
```

- [ ] **Step 7: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): merge architecture + service-details into Cyoda-Cloud overview"
```

### Task 6.7: Merge status and roadmap

**Files:**
- Create: `src/content/docs/run/cyoda-cloud/status-and-roadmap.md`
- Delete: `src/content/docs/cloud/status.md`, `src/content/docs/cloud/roadmap.md`

- [ ] **Step 1: Create the merged page**

```bash
cat src/content/docs/cloud/status.md src/content/docs/cloud/roadmap.md \
  > src/content/docs/run/cyoda-cloud/status-and-roadmap.md
```

- [ ] **Step 2: Replace the concatenated frontmatter with a single frontmatter block**

Edit the file so only one YAML block sits at the top:

```yaml
---
title: Status and roadmap (Cyoda Cloud)
description: Current status, known limitations, and upcoming work for the hosted Cyoda Cloud platform.
sidebar:
  order: 30
---
```

Organize the body under `## Current status` and `## Roadmap` headings.

- [ ] **Step 3: Delete sources + the now-empty cloud/ directory**

```bash
git rm src/content/docs/cloud/status.md src/content/docs/cloud/roadmap.md
rmdir src/content/docs/cloud 2>/dev/null || true
```

- [ ] **Step 4: Build and verify redirects**

```bash
npm run build && npx playwright test tests/redirects.spec.ts -g "status|roadmap"
```

- [ ] **Step 5: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): merge status + roadmap under Run/Cyoda-Cloud"
```

### Task 6.8: Split entity-model-simple-view-specification

**Files:**
- Source: `src/content/docs/guides/entity-model-simple-view-specification.md`
- Target: `src/content/docs/concepts/entities-and-lifecycle.md` (new, concept-focused)
- Delete source after extraction.

- [ ] **Step 1: Read the source**

```bash
cat src/content/docs/guides/entity-model-simple-view-specification.md
```

- [ ] **Step 2: Create the concept page**

Write `src/content/docs/concepts/entities-and-lifecycle.md` with:

```yaml
---
title: Entities and lifecycle
description: Entities as first-class citizens — schemas, states, history, and temporal queries.
sidebar:
  order: 10
---
```

Body: tier-agnostic explanation of what an entity is, its lifecycle (states, transitions, audit trail), temporal query capability, and how simple views relate. The *specification* of the simple-view export format — field shapes, mimetypes, etc. — belongs in Reference/vendored; link to it rather than retyping.

Draw from the source file's conceptual sections. Leave version-specific format details for `reference/` pages (placeholder links acceptable).

- [ ] **Step 3: Delete source**

```bash
git rm src/content/docs/guides/entity-model-simple-view-specification.md
```

- [ ] **Step 4: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): extract entity concepts from simple-view spec into Concepts"
```

### Task 6.9: Split sql-and-trino

**Files:**
- Source: `src/content/docs/guides/sql-and-trino.md`
- Target: concept content folds into `src/content/docs/concepts/apis-and-surfaces.md` (created in Phase 7); for now, rename the source to a holding file and leave the content split for Phase 7.

- [ ] **Step 1: Rename to a temporary holding location**

```bash
git mv src/content/docs/guides/sql-and-trino.md src/content/docs/concepts/_wip-sql-and-trino.md
```

Add to the top of the moved file:

```yaml
---
title: SQL and Trino (WIP extraction)
description: (Temporary) being split between Concepts/apis-and-surfaces and Reference.
draft: true
sidebar:
  hidden: true
---
```

The `draft: true` + `sidebar.hidden: true` combo keeps it out of navigation during the transition.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): stash sql-and-trino for Phase 7 extraction"
```

### Task 6.10: Delete the api-saving-and-getting-data placeholder

**Files:**
- Delete: `src/content/docs/guides/api-saving-and-getting-data.md`

The spec calls for a full rewrite (not a move). The replacement is written in Phase 7.

- [ ] **Step 1: Delete**

```bash
git rm src/content/docs/guides/api-saving-and-getting-data.md
```

- [ ] **Step 2: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): delete outdated API placeholder (rewrite in Phase 7)"
```

### Task 6.11: Move concepts files (edbms, event-driven-architecture, cpl-overview)

**Files:**
- `src/content/docs/concepts/edbms.md` → becomes part of `concepts/what-is-cyoda.md` (Phase 7)
- `src/content/docs/concepts/event-driven-architecture.md` → becomes part of `concepts/workflows-and-events.md` (Phase 7)
- `src/content/docs/concepts/cpl-overview.md` → revise and keep (may become concept page or move to reference)

- [ ] **Step 1: Rename the existing concept files with WIP prefix** (same pattern as Task 6.9)

```bash
git mv src/content/docs/concepts/edbms.md src/content/docs/concepts/_wip-edbms.md
git mv src/content/docs/concepts/event-driven-architecture.md src/content/docs/concepts/_wip-event-driven-architecture.md
git mv src/content/docs/concepts/cpl-overview.md src/content/docs/concepts/_wip-cpl-overview.md
```

- [ ] **Step 2: Add draft+hidden frontmatter to each**

Each file gets `draft: true` and `sidebar.hidden: true` added so they're ignored during the transition.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): stash current concept files for Phase 7 rewrite"
```

### Task 6.12: Delete getting-started current contents

**Files:**
- Delete: `src/content/docs/getting-started/introduction.md`, `src/content/docs/getting-started/quickstart.md`

These are fully rewritten in Phase 7. Redirects already point from `/getting-started/introduction` to the new concepts page.

- [ ] **Step 1: Delete**

```bash
git rm src/content/docs/getting-started/introduction.md
git rm src/content/docs/getting-started/quickstart.md
```

- [ ] **Step 2: Commit**

```bash
git add src/content/docs
git commit -m "refactor(ia): clear getting-started for Phase 7 rewrite"
```

---

## REVIEW CHECKPOINT 5

Phase 6 has moved every migratable file and staged drafts for the remainder. Verify:
- `npm run build` still succeeds (stubs + moved content).
- `find src/content/docs/guides -type f` returns empty or nearly so. Remove the directory if empty:

```bash
rmdir src/content/docs/guides 2>/dev/null || true
```

- All redirect tests pass for moved-file cases (not yet for rewrite targets).
- New Concepts/Build/Run pages render in the sidebar.

---

## Phase 7 — Content rewrites (new prose)

Each task writes one new page to a provided outline. These are longer than infrastructure tasks. The engineer consults cyoda-go sources (`~/go-projects/cyoda-light/cyoda-go/README.md`, `OVERVIEW.md`, `ARCHITECTURE.md`) for facts but writes version-agnostic prose. No retyping of parameter tables.

Each rewrite task follows the same shape:
1. Draft the page to the outline.
2. Build and spot-check rendered output.
3. Commit.

### Task 7.1: Getting Started — install-and-first-entity

**File:** `src/content/docs/getting-started/install-and-first-entity.mdx`

- [ ] **Step 1: Write the page to this outline**

```yaml
---
title: Install cyoda-go and create your first entity
description: Install cyoda-go with SQLite (default), define an entity model, trigger a workflow, and read state back.
sidebar:
  order: 0
---
```

Body outline:

1. **Install** (Homebrew / curl / Debian). Link to the cyoda-go README for the command list rather than duplicating. A single `brew install cyoda-platform/cyoda-go/cyoda` example is fine for readers who want to see the shape.
2. **SQLite is the default.** One sentence explaining durability and why it's the right starting point.
3. **First entity** — define a minimal entity schema; show the JSON. Keep it short.
4. **First workflow** — one or two states and a transition.
5. **Read back** — a `curl` against the local API to confirm persistence. Specify a field-level query; link `/reference/api/` for full shape.
6. **Next steps** — three links: Concepts, Build/working-with-entities, Run/overview.
7. **In-memory callout** — "if you want fast functional tests without durability, use in-memory mode; see Testing with digital twins."

Length: ~300–450 words plus ≤ 2 short code blocks.

- [ ] **Step 2: Build and spot-check**

```bash
npm run build && npm run preview &
sleep 2 && open http://localhost:4321/getting-started/install-and-first-entity/
pkill -f 'astro preview'
```

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/getting-started
git commit -m "docs(getting-started): write install-and-first-entity onramp"
```

### Task 7.2: Concepts — what-is-cyoda

**File:** `src/content/docs/concepts/what-is-cyoda.md`

- [ ] **Step 1: Write from outline**

```yaml
---
title: What is Cyoda?
description: An EDBMS — an entity database where data, state, lifecycle, and rules are a single first-class abstraction.
sidebar:
  order: 0
---
```

Body outline (~500 words):

1. **Entity Database Management System** — define EDBMS. Contrast with relational and document DBs: the entity is the unit, not the row or document.
2. **First-class concepts** — schema, lifecycle, temporal history, transactional integrity, audit trail, workflows.
3. **Why this shape** — briefly: complex-domain software where state, rules, and data must evolve together.
4. **Two forms today** — cyoda-go (open source, In-Memory/SQLite/PostgreSQL) and Cyoda Cloud (hosted, Cassandra-backed). Same platform, different runtimes.
5. **The growth path** — one paragraph; embed `<GrowthPathDiagram />`.
6. **Where to go next** — links to Entities, Workflows, Digital twins.

Import and use `<GrowthPathDiagram />`:

```mdx
import GrowthPathDiagram from '../../../components/GrowthPathDiagram.astro';

<GrowthPathDiagram />
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/what-is-cyoda.md
git commit -m "docs(concepts): write what-is-cyoda"
```

### Task 7.3: Concepts — entities-and-lifecycle

**File:** `src/content/docs/concepts/entities-and-lifecycle.md` (created in Task 6.8; expand here if still thin)

- [ ] **Step 1: Expand to full outline (~500–700 words)**

Outline:

1. **What is an entity** — JSON document plus schema plus state machine plus audit.
2. **Schema** — auto-discovered from samples, evolved over time, validated.
3. **Lifecycle** — states and transitions (brief; workflows cover this in depth).
4. **History & temporal queries** — point-in-time retrieval.
5. **Simple views** — computed projections of entity state, used for queries and exports. Conceptual only — shape specifics in Reference.
6. **Cross-references** — link to Workflows, APIs and surfaces.

Drop references to specific field names or API shapes; those live in Reference.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/entities-and-lifecycle.md
git commit -m "docs(concepts): expand entities-and-lifecycle"
```

Also delete `_wip-cpl-overview.md`, `_wip-edbms.md` if their content is now absorbed:

```bash
git rm src/content/docs/concepts/_wip-edbms.md src/content/docs/concepts/_wip-cpl-overview.md
git commit -m "docs(concepts): remove superseded WIP files"
```

### Task 7.4: Concepts — workflows-and-events

**File:** `src/content/docs/concepts/workflows-and-events.md`

- [ ] **Step 1: Write from outline (~500 words)**

```yaml
---
title: Workflows and events
description: State machines as a first-class concept — triggers, external processors, and audit trails.
sidebar:
  order: 20
---
```

Outline:

1. **State machines define allowed change.** Each entity type gets a workflow; every change is a transition.
2. **Triggers** — events (time-based, message-based, user-initiated).
3. **Processors** — code that runs on a transition; internal vs external. External processors use gRPC.
4. **Audit trail** — every transition recorded; queryable.
5. **Why this matters** — regulatory, auditable, replayable systems.
6. **Cross-refs** — Build/workflows-and-processors (pattern page), Build/client-compute-nodes (external processor impl).

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/workflows-and-events.md
git rm src/content/docs/concepts/_wip-event-driven-architecture.md
git commit -m "docs(concepts): write workflows-and-events"
```

### Task 7.5: Concepts — digital-twins-and-growth-path

**File:** `src/content/docs/concepts/digital-twins-and-growth-path.md`

- [ ] **Step 1: Write from outline (~400 words)**

```yaml
---
title: Digital twins and the growth path
description: Why the same Cyoda app runs on any storage tier — and when to pick each tier.
sidebar:
  order: 30
---
```

Outline:

1. **Digital twins** — same app logic runs on any tier. The difference is non-functional: durability, consistency, scale, ops cost.
2. **The four tiers** — `<GrowthPathDiagram />` + one-sentence "when to use" per tier.
   - In-Memory: fast functional tests, AI iteration loops, digital twin scenario runs.
   - SQLite: single-node durable, edge, small-team self-hosted.
   - PostgreSQL: clustered active-active production.
   - Cassandra: enterprise distributed; today only via Cyoda Cloud.
3. **Choosing** — decision criteria: durability, write volume, HA requirements, ops appetite.
4. **Moving up** — apps don't change when you move tier.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/digital-twins-and-growth-path.md
git commit -m "docs(concepts): write digital-twins-and-growth-path"
```

### Task 7.6: Concepts — apis-and-surfaces

**File:** `src/content/docs/concepts/apis-and-surfaces.md`

- [ ] **Step 1: Write from outline (~500 words)**

```yaml
---
title: APIs and surfaces
description: REST, gRPC, and Trino — when and why to use each.
sidebar:
  order: 40
---
```

Outline:

1. **Three surfaces** — REST, gRPC, Trino SQL.
2. **REST** — user-facing clients; human-initiated CRUD, search, dashboards.
3. **gRPC** — compute nodes, processors, criteria services. **Prefer gRPC for compute** — audit hygiene, simplified authorization, bidirectional streaming.
4. **Trino SQL** — analytics; cross-entity queries and reporting.
5. **Decision guide** — a short flowchart/prose: "what are you building?"
6. **Specifics live in Reference** — REST endpoints at `/reference/api/`, proto at (future) `/reference/api/#grpc`, Trino catalog at (existing) page.

Absorb relevant conceptual content from `_wip-sql-and-trino.md`; keep the Trino *spec* material for Reference.

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/apis-and-surfaces.md
git rm src/content/docs/concepts/_wip-sql-and-trino.md
git commit -m "docs(concepts): write apis-and-surfaces"
```

### Task 7.7: Concepts — authentication-and-identity

**File:** `src/content/docs/concepts/authentication-and-identity.md`

- [ ] **Step 1: Write from outline (~400–500 words)**

```yaml
---
title: Authentication and identity
description: OAuth 2.0, M2M credentials, on-behalf-of exchange, and external key trust — conceptually.
sidebar:
  order: 50
---
```

Outline:

1. **Platform issues tokens.** OAuth 2.0.
2. **Machine-to-machine credentials.** Service accounts.
3. **On-behalf-of exchange.** Downstream service calls.
4. **External key trust.** Accept tokens from trusted external IdPs.
5. **Where this is configured** — self-hosted: cyoda-go docs; Cyoda Cloud: `/run/cyoda-cloud/identity-and-entitlements/`.
6. **What your app does** — brief pointer to Build pages on wiring tokens into your client.

Absorb relevant content from `guides/authentication-authorization.md` (which we'll delete in a later cleanup) without duplication.

- [ ] **Step 2: Remove the old auth guide**

```bash
git rm src/content/docs/guides/authentication-authorization.md
```

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add src/content/docs/concepts/authentication-and-identity.md
git commit -m "docs(concepts): write authentication-and-identity"
```

### Task 7.8: Build — modeling-entities

**File:** `src/content/docs/build/modeling-entities.md`

- [ ] **Step 1: Write from outline (~400 words)**

```yaml
---
title: Modeling entities
description: Design patterns for entity schemas — boundaries, evolution, and validation.
sidebar:
  order: 10
---
```

Outline:

1. **One entity per noun.** Boundary patterns.
2. **Schema discovery.** Feed cyoda-go samples; it proposes the schema.
3. **Evolution.** Adding fields, renaming, defaults.
4. **Validation.** What cyoda-go enforces; what your app must validate.
5. **Anti-patterns.** God-entity, premature generalisation.
6. **Cross-refs.** Concepts/entities-and-lifecycle, Reference/schemas.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/build/modeling-entities.md
git commit -m "docs(build): write modeling-entities"
```

### Task 7.9: Build — working-with-entities (rewrite of deleted placeholder)

**File:** `src/content/docs/build/working-with-entities.md`

- [ ] **Step 1: Write from outline (~500–600 words)**

```yaml
---
title: Working with entities
description: Create, read, update, and search entities via the cyoda-go API — worked examples.
sidebar:
  order: 20
---
```

Outline:

1. **The shape of the API.** One paragraph; link to `/reference/api/` for endpoints.
2. **Create.** `POST` an entity; show a minimal `curl` (assume local cyoda-go + SQLite).
3. **Read.** `GET` by id; `GET` list with search.
4. **Update.** `PATCH` or transition — reference workflows.
5. **Search.** Immediate vs background query modes.
6. **Temporal query.** Point-in-time retrieval (brief).
7. **gRPC from compute nodes.** Brief pointer to Client compute nodes.

Show ≤ 2 small code blocks with realistic-looking JSON. No exhaustive parameter tables.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/build/working-with-entities.md
git commit -m "docs(build): write working-with-entities (rewrite)"
```

### Task 7.10: Build — testing-with-digital-twins

**File:** `src/content/docs/build/testing-with-digital-twins.md`

- [ ] **Step 1: Write from outline (~400 words)**

```yaml
---
title: Testing with digital twins
description: In-memory mode as a test harness; running simulations at volumes exceeding production.
sidebar:
  order: 50
---
```

Outline:

1. **In-memory mode as a test harness.** Fast, deterministic, no cleanup.
2. **Digital-twin simulation.** Behavioural clone of production for scenario runs.
3. **Volumes and rates.** Run thousands of scenarios per hour; exceed prod rates because no real external dependencies.
4. **What stays the same.** API contracts; workflow behaviour. Only non-functional properties differ.
5. **Examples.** Point to `cyoda-go/examples/` with a note per the spec's examples requirements.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/build/testing-with-digital-twins.md
git commit -m "docs(build): write testing-with-digital-twins"
```

### Task 7.11: Run — overview

**File:** `src/content/docs/run/index.mdx`

- [ ] **Step 1: Expand to full outline (~400 words + a matrix)**

```yaml
---
title: Run
description: The cyoda-go packaging ladder — desktop, docker, kubernetes, and hosted Cyoda Cloud.
sidebar:
  order: 0
---
```

Outline:

1. **Pick your packaging.**
2. **Matrix** — a small table showing packaging × tier:

```
               In-Memory  SQLite  PostgreSQL  Cassandra
Desktop          ✓          ✓ (default)
Docker           ✓          ✓        ✓
Kubernetes                           ✓ (production)
Cyoda Cloud                                      ✓
```

3. **When to pick what.** One sentence per deployment mode.
4. **Links** to `desktop/`, `docker/`, `kubernetes/`, `cyoda-cloud/`.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/run/index.mdx
git commit -m "docs(run): write overview with packaging ladder and tier matrix"
```

### Task 7.12: Run — desktop

**File:** `src/content/docs/run/desktop.md`

- [ ] **Step 1: Write from outline (~300–400 words)**

```yaml
---
title: Desktop (single binary)
description: Run cyoda-go from a single binary — dev, low-volume production, in-memory and SQLite modes.
sidebar:
  order: 10
---
```

Outline:

1. **Single binary for dev and low-volume production.**
2. **In-memory mode** — when and why.
3. **SQLite mode (default).** Durability, the data file location, backup = file copy.
4. **Install** — brew/curl/deb/rpm. Link to cyoda-go README.
5. **Run** — `cyoda init`, `cyoda start`. Link to Reference/cli.
6. **Configure** — env vars. Link to Reference/configuration.
7. **Upgrading** — release tag bump; config migration policy.
8. **When you outgrow this** — pointer to Docker/Kubernetes.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/run/desktop.md
git commit -m "docs(run): write desktop"
```

### Task 7.13: Run — docker

**File:** `src/content/docs/run/docker.md`

- [ ] **Step 1: Write from outline (~250–350 words)**

```yaml
---
title: Docker
description: Run cyoda-go in Docker for bespoke integrations and local compositions.
sidebar:
  order: 20
---
```

Outline:

1. **When Docker fits.** Bespoke integrations, composition with other services, CI.
2. **Image reference** — link to cyoda-go registry. Link to Reference where relevant.
3. **Compose example.** Point to `cyoda-go/examples/compose-with-observability` per spec's examples model.
4. **PostgreSQL via Docker** — dev/test against the postgres backend.
5. **Observability.** Logs, metrics, tracing plug points.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/run/docker.md
git commit -m "docs(run): write docker"
```

### Task 7.14: Run — kubernetes

**File:** `src/content/docs/run/kubernetes.md`

- [ ] **Step 1: Write from outline (~400 words)**

```yaml
---
title: Kubernetes
description: Deploy cyoda-go with the Helm chart for clustered PostgreSQL-backed production.
sidebar:
  order: 30
---
```

Outline:

1. **When Kubernetes fits.** Production, HA, multi-node.
2. **Deployment shape.** Active-active stateless cyoda-go behind LB; PostgreSQL as the only stateful dep.
3. **Helm chart.** Pointer to `deploy/helm` in cyoda-go. Values table lives in Reference/helm (placeholder today).
4. **High availability.** LB config, health checks, pod disruption.
5. **Backup and restore.** PostgreSQL-backed; standard pg-backup tooling.
6. **Upgrades and rollback.** Blue/green or rolling; schema migration ordering.
7. **Sizing.** Node counts vs write volume — qualitative.
8. **Observability.** Prometheus scrape, tracing hooks.

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/run/kubernetes.md
git commit -m "docs(run): write kubernetes"
```

### Task 7.15: Run/Cyoda-Cloud — consolidate index

By this point two files exist: `index.mdx` (the ~5–15 line stub from Task 5.1) and `overview.mdx` (the migrated architecture + service-details content from Task 6.6). Consolidate into `index.mdx`.

- [ ] **Step 1: Delete the stub index**

```bash
git rm src/content/docs/run/cyoda-cloud/index.mdx
```

- [ ] **Step 2: Rename overview.mdx to index.mdx**

```bash
git mv src/content/docs/run/cyoda-cloud/overview.mdx src/content/docs/run/cyoda-cloud/index.mdx
```

- [ ] **Step 3: Verify the stability banner is present at the top**

Open the file and confirm the banner is present:

```mdx
import Badge from '../../../../components/Badge.astro';

<Badge variant="orange">Evolving · Test / demo only</Badge>
```

If missing, add it.

- [ ] **Step 4: Build and confirm the section renders**

```bash
npm run build && npm run preview &
sleep 2 && open http://localhost:4321/run/cyoda-cloud/
pkill -f 'astro preview'
```

- [ ] **Step 5: Commit**

```bash
git add src/content/docs/run/cyoda-cloud
git commit -m "docs(run/cyoda-cloud): consolidate overview into section index"
```

### Task 7.16: Reference — index and placeholders

**File:** `src/content/docs/reference/index.mdx`, `reference/cli.mdx`, `reference/configuration.mdx`, `reference/helm.mdx`, `reference/api.mdx`, `reference/schemas.mdx`

- [ ] **Step 1: Write reference/index.mdx**

```mdx
---
title: Reference
description: Technical references — mostly sourced from cyoda-go at build time.
sidebar:
  order: 0
---

Reference content here is either **generated** from cyoda-go artefacts
or **embedded** from live resources. When an artefact isn't yet
available upstream, you'll see an **Awaiting upstream** banner with a
link to the tracking issue.

- [API](./api/) — REST (embedded) and gRPC (generated from proto, when available)
- [JSON Schemas](./schemas/) — auto-generated from `vendored/schemas/`
- [CLI](./cli/) — awaiting upstream
- [Configuration](./configuration/) — awaiting upstream
- [Helm values](./helm/) — awaiting upstream
```

- [ ] **Step 2: Write reference/api.mdx as an embed wrapper**

Reuse the existing `src/pages/api-reference.astro` logic. If the iframe embed is already working at `/api-reference/`, redirect or reference it from `/reference/api/`.

```mdx
---
title: API reference
description: REST and gRPC surfaces.
sidebar:
  order: 10
---

The REST API reference is rendered in a standalone viewer. Use the
link below (opens in a dedicated page so the viewer has full width):

[Open the REST API reference](/api-reference/)

gRPC proto documentation is tracked upstream and will appear here
once published.
```

- [ ] **Step 3: Write reference/schemas.mdx**

```mdx
---
title: JSON Schemas
description: Auto-generated JSON Schema references.
sidebar:
  order: 20
---
```

The existing schema generator (`scripts/generate-schema-pages.js`) emits per-schema pages; we just need the landing page here. Update the generator's output directory to `src/content/docs/reference/schemas/` in Task 7.17.

- [ ] **Step 4: Write reference/cli.mdx (placeholder)**

```mdx
---
title: CLI
description: cyoda-go CLI reference — awaiting upstream artefact.
sidebar:
  order: 30
stability: awaiting-upstream
---

import VendoredBanner from '../../../components/VendoredBanner.astro';

<VendoredBanner stability="awaiting-upstream" issue="https://github.com/Cyoda-platform/cyoda-go/issues/<TBD>" />

Until the CLI help dump is published from cyoda-go, run
`cyoda --help` locally for the authoritative command list.
```

- [ ] **Step 5: Write reference/configuration.mdx and reference/helm.mdx** using the same placeholder pattern.

- [ ] **Step 6: Commit**

```bash
git add src/content/docs/reference
git commit -m "docs(reference): write thin Reference pages with placeholders"
```

### Task 7.17: Update schema-pages generator output path

**Files:**
- Modify: `scripts/generate-schema-pages.js`

- [ ] **Step 1: Inspect current output target**

```bash
grep -nE "src/content/docs/schemas|OUTPUT_DIR|writeFile" scripts/generate-schema-pages.js | head -20
```

- [ ] **Step 2: Change target to reference/schemas/**

Update the output directory constant (or equivalent) from `src/content/docs/schemas` to `src/content/docs/reference/schemas`.

- [ ] **Step 3: Remove the old target directory from `.gitignore` (if present) and add the new one**

In `.gitignore`:

```
# Regenerated from vendored/schemas/ at build time
src/content/docs/reference/schemas/
```

Remove any existing entry for `src/content/docs/schemas/`.

- [ ] **Step 4: Delete the now-obsolete schemas sidebar entry**

Verify `astro.config.mjs` sidebar no longer references a top-level `schemas` directory. (Phase 5 already removed it.)

- [ ] **Step 5: Build**

```bash
rm -rf src/content/docs/schemas src/content/docs/reference/schemas
npm run build
ls src/content/docs/reference/schemas/ | head -5
```

Expected: schemas appear under the new path.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-schema-pages.js .gitignore
git commit -m "refactor(schemas): emit JSON Schema pages under Reference/schemas"
```

### Task 7.18: Site index.mdx — hero-lite treatment

**File:** `src/content/docs/index.mdx`

- [ ] **Step 1: Rewrite with hero treatment**

```mdx
---
title: Cyoda Documentation
description: Build and run Cyoda applications — from local cyoda-go to hosted Cyoda Cloud.
template: splash
---

import Badge from '../../components/Badge.astro';
import Button from '../../components/Button.astro';
import GrowthPathDiagram from '../../components/GrowthPathDiagram.astro';

<div class="section-hero">
  <Badge variant="teal" size="sm">Developer platform · digital twins</Badge>

  # Build once. Run anywhere on the growth path.

  State, workflow, transactions, events, history, and business logic as
  a single first-class abstraction. Write your app against cyoda-go
  locally; promote to PostgreSQL in production, or let Cyoda Cloud run
  it at enterprise scale.

  <Button href="/getting-started/install-and-first-entity/" variant="primary">Get started</Button>
  <Button href="/concepts/what-is-cyoda/" variant="secondary">Learn the concepts</Button>
</div>

<GrowthPathDiagram />

<div class="section-separator" />

## Where to go next

- **New here?** Start with the [5-minute onramp](/getting-started/install-and-first-entity/).
- **Understanding Cyoda?** Read [Concepts](/concepts/).
- **Building an app?** [Build](/build/) covers tier-agnostic patterns.
- **Running one?** [Run](/run/) covers desktop, Docker, Kubernetes, and Cyoda Cloud.
- **Need API specs?** [Reference](/reference/) embeds and ingests from cyoda-go.
```

- [ ] **Step 2: Build and visually confirm**

```bash
npm run build && npm run preview &
sleep 2 && open http://localhost:4321/
pkill -f 'astro preview'
```

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/index.mdx
git commit -m "docs(index): hero-lite treatment with growth-path diagram"
```

---

## REVIEW CHECKPOINT 6

All content has been written or migrated. Verify:
- `find src/content/docs -name '_wip-*' -o -name '*.md' -o -name '*.mdx' | wc -l` — count matches the file-structure target (~25 content files plus auto-generated schemas).
- No `_wip-*.md` files remain (all were either absorbed or deleted).
- `guides/`, `architecture/`, `cloud/` directories no longer exist.
- `npm run build` is green.
- The site index renders with the hero treatment.

---

## Phase 8 — Generator and pipeline updates

### Task 8.1: Update llms.txt section names to new IA

**Files:**
- Modify: `scripts/generate-llms-txt.js`

- [ ] **Step 1: Update `getSectionName` and `sectionOrder`**

In `scripts/generate-llms-txt.js`:

```js
function getSectionName(dirName) {
  const sectionNames = {
    'getting-started': 'Getting Started',
    'concepts':        'Concepts',
    'build':           'Build',
    'run':             'Run',
    'reference':       'Reference',
  };
  return sectionNames[dirName] || dirName.charAt(0).toUpperCase() + dirName.slice(1);
}
```

And:

```js
const sectionOrder = ['Getting Started', 'Concepts', 'Build', 'Run', 'Reference'];
```

- [ ] **Step 2: Build and verify /llms.txt**

```bash
npm run build && head -40 dist/llms.txt
```

Expected: sections are Getting Started / Concepts / Build / Run / Reference.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-llms-txt.js
git commit -m "fix(llms): update section names to new IA"
```

---

## Phase 9 — Link integrity and final verification

### Task 9.1: Link-integrity test

**Files:**
- Create: `tests/link-integrity.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

test.describe('Internal link integrity', () => {
  test('no broken internal links in rendered HTML', async ({ request }) => {
    const files = await glob('dist/**/*.html');
    const failures: string[] = [];
    for (const file of files) {
      const html = await fs.readFile(file, 'utf-8');
      const links = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map(m => m[1]);
      for (const link of new Set(links)) {
        // Skip known external-like patterns and the markdown mirror
        if (link.startsWith('/markdown/') || link.startsWith('/openapi/')) continue;
        const target = path.join('dist', link, 'index.html');
        try {
          await fs.access(target);
        } catch {
          // Try without trailing slash
          try { await fs.access(path.join('dist', link + '.html')); continue; } catch {}
          failures.push(`${path.relative('dist', file)} → ${link}`);
        }
      }
    }
    expect(failures, `Broken links:\n${failures.slice(0, 20).join('\n')}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run after full build**

```bash
npm run build && npx playwright test tests/link-integrity.spec.ts
```

Expected: PASS. If broken links exist, fix each page referenced and re-run. Repeat until clean.

- [ ] **Step 3: Commit**

```bash
git add tests/link-integrity.spec.ts
git commit -m "test: add internal link integrity check"
```

### Task 9.2: Redirect test — make complete

**Files:**
- Modify: `tests/redirects.spec.ts`

- [ ] **Step 1: Ensure every entry in the redirect map appears in the test array**

Cross-reference `tests/redirects.spec.ts` with the full redirect map. Add any missing entries.

- [ ] **Step 2: Run**

```bash
npx playwright test tests/redirects.spec.ts
```

Expected: all redirects resolve to valid pages.

- [ ] **Step 3: Commit**

```bash
git add tests/redirects.spec.ts
git commit -m "test: complete redirect coverage"
```

### Task 9.3: Full test suite + build verification

- [ ] **Step 1: Run everything**

```bash
npm run build && npm test
```

Expected: all tests pass. Cookie consent, Google Analytics, visual-tokens, discoverability, redirects, link-integrity.

- [ ] **Step 2: If anything fails, fix inline and re-run**

Do not proceed until clean.

### Task 9.4: Lighthouse sanity check

- [ ] **Step 1: Run lighthouse**

```bash
npm run perf:check
```

Expected: scores within acceptable ranges per `performance-budget.json`. If performance regresses, investigate: most likely Montserrat loading is unoptimised, or unused CSS is bundled.

- [ ] **Step 2: If regressed, tune**

Most likely fixes: narrow the Montserrat weights loaded (drop 300 or 900 if unused); check that `visual.css` is inlined via Starlight's `inlineStylesheets: 'always'`.

- [ ] **Step 3: Commit any performance fixes**

```bash
git add -A
git commit -m "perf: tune font loading and CSS bundling"
```

### Task 9.5: Manual visual review in a browser

- [ ] **Step 1: Start preview**

```bash
npm run preview &
sleep 2 && open http://localhost:4321/
```

- [ ] **Step 2: Walk the nav** — click every top-level sidebar section; confirm all index pages and 3–4 representative body pages render.

- [ ] **Step 3: Confirm:**
- Montserrat is applied.
- Dotted grid background is visible but subtle.
- Badges render correctly on the homepage and on Cyoda Cloud pages.
- "View as Markdown" link is present in TOC.
- No broken images or mermaid diagrams.

- [ ] **Step 4: Kill preview**

```bash
pkill -f 'astro preview'
```

---

## Out of scope (deferred to follow-up work)

The following spec items are **not** implemented in this plan:

- **Shiki code-syntax colour mapping** (keys=teal, strings=green,
  numbers=orange, booleans=purple). Spec lists this in the Section 7
  token table as a bonus; leaving for a follow-up PR so this pivot
  doesn't grow.
- **Version-cut tooling** (snapshotting into `/v<MAJOR>/` at major
  bumps). Spec explicitly defers this — the pivot lays groundwork
  (`CYODA_GO_VERSION`, URL reservation) only.
- **MCP docs server** — filed as its own issue in Task 10.7.

## Phase 10 — Upstream issue filing

Each of these tasks files a GitHub issue in the relevant upstream repo. These are *not* blocking for the pivot to land — they unlock future delegation.

### Task 10.1: File cyoda-go issue for CLI help dump

- [ ] **Step 1: Draft**

```
Title: docs: publish CLI help tree as release artefact

Body:
docs.cyoda.net wants to ingest the cyoda-go CLI reference at build time
rather than retyping flags (which drift). Propose:

- Makefile target `make docs/cli.md` that runs `cyoda --help` and every
  subcommand `--help`, concatenating into a single markdown tree.
- Include in the standard release artefact list alongside the binaries.
- Embed commit SHA or tag in a front-matter comment for provenance.

Consumer: cyoda-docs repo, `vendored/cli/`.
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "docs: publish CLI help tree as release artefact" --body-file /tmp/issue-cli.md
```

- [ ] **Step 3: Record the issue URL in vendored/cli/README.md**

Replace `<TBD>` in the placeholder with the actual issue URL.

```bash
git add vendored/cli/README.md
git commit -m "chore(vendor): record CLI help upstream issue URL"
```

### Task 10.2: File cyoda-go issue for canonical env vars doc

- [ ] **Step 1: Draft**

```
Title: docs: publish canonical environment variables documentation

Body:
docs.cyoda.net wants to ingest cyoda-go's env-var documentation rather
than duplicating it (which drifts). Propose:

- Single canonical file at `docs/environment.md` in cyoda-go.
- Ideally generated from struct tags or a schema so it cannot drift
  from code.
- Include per-variable: name, type, default, whether secret-sensitive,
  short description, and which mode(s) it applies to (in-memory,
  sqlite, postgres).

Consumer: cyoda-docs repo, `vendored/configuration/`.
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "docs: publish canonical environment variables documentation" --body-file /tmp/issue-env.md
```

- [ ] **Step 3: Record the issue URL**

Replace `<TBD>` in `vendored/configuration/README.md` with the actual issue URL; commit.

### Task 10.3: File cyoda-go issue for OpenAPI JSON as release artefact

- [ ] **Step 1: Draft**

```
Title: release: attach OpenAPI JSON to each GitHub release

Body:
docs.cyoda.net currently vendors `openapi.json` locally. Once attached
to cyoda-go releases, the docs site can pull it via
`VENDOR_MODE=release`, pinning to the `CYODA_GO_VERSION` in the docs
repo.

Propose:
- Publish `openapi.json` as a release asset alongside the binaries.
- Stable URL pattern like
  `https://github.com/Cyoda-platform/cyoda-go/releases/download/<tag>/openapi.json`.

Consumer: cyoda-docs repo, Reference/api.
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "release: attach OpenAPI JSON to each GitHub release" --body-file /tmp/issue-openapi.md
```

- [ ] **Step 3: Record in a tracking comment on `vendored/README.md` if desired.**

### Task 10.4: File cyoda-go issue for helm-docs generation

- [ ] **Step 1: Draft**

```
Title: docs: generate helm values reference via helm-docs

Body:
docs.cyoda.net has a placeholder Reference/helm page awaiting an
authoritative values table. Propose:

- Annotate `deploy/helm/<chart>/values.yaml` with helm-docs
  annotations.
- Add a `make helm-docs` target that writes `deploy/helm/<chart>/VALUES.md`.
- Include VALUES.md in each release artefact list.

Consumer: cyoda-docs repo, `vendored/helm/`.
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "docs: generate helm values reference via helm-docs" --body-file /tmp/issue-helm.md
```

- [ ] **Step 3: Record the issue URL in `vendored/helm/README.md`; commit.**

### Task 10.5: File cyoda-go issue for gRPC proto rendering

- [ ] **Step 1: Draft**

```
Title: docs: publish gRPC proto reference as a release artefact

Body:
docs.cyoda.net's Reference/api page wants a consumable gRPC reference
rendered from cyoda-go's `proto/`. Propose:

- Add a docs generation step (e.g., `protoc-gen-doc` or similar) that
  emits markdown or HTML per release.
- Attach to release artefacts.
- Keep service/message/field names stable across minor releases.

Consumer: cyoda-docs repo, Reference/api.
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "docs: publish gRPC proto reference as a release artefact" --body-file /tmp/issue-proto.md
```

### Task 10.6: (Optional) File cyoda-go issue for canonical error code catalogue

- [ ] **Step 1: Draft**

```
Title: docs: publish canonical error code catalogue

Body:
Optional — once error codes stabilise, a machine-readable catalogue
(code, message, category, remediation hint) would let cyoda-docs
render a consistent Reference page.

Consumer: cyoda-docs repo, future Reference/errors page.
```

- [ ] **Step 2: File (if appetite exists)**

```bash
gh issue create -R Cyoda-platform/cyoda-go --title "docs: publish canonical error code catalogue" --body-file /tmp/issue-errors.md
```

### Task 10.7: File cyoda-docs issue for MCP docs server (deferred)

- [ ] **Step 1: Draft**

```
Title: feat: MCP docs server for docs.cyoda.net

Body:
Expose cyoda-docs as an MCP server so AI tools (Claude Code, Cursor,
VS Code Copilot) can query docs directly as MCP tools:
- `search_docs(query)` — free-text search, returns ranked excerpts.
- `get_page(slug)` — return markdown of a specific page.
- `list_sections()` — the IA tree.

Implementation options:
- Standalone Cloudflare Worker reading /llms-full.txt and the schemas.
- Node service deployed next to the docs site.

Stretch goal: Cloudflare Pages edge function for content negotiation
(`Accept: text/markdown` on the same URL returns markdown).
```

- [ ] **Step 2: File**

```bash
gh issue create -R Cyoda-platform/cyoda-docs --title "feat: MCP docs server for docs.cyoda.net" --body-file /tmp/issue-mcp.md
```

---

## Phase 11 — Deploy and verify

### Task 11.1: Open PR to main

- [ ] **Step 1: Push the branch**

```bash
git push -u origin restructure-cyoda-go-pivot
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "restructure: cyoda-go pivot (IA + content + visual + discoverability)" --body "$(cat <<'EOF'
## Summary

Big-bang restructure of docs.cyoda.net around the cyoda-go pivot.

- New IA: Getting Started / Concepts / Build / Run / Reference.
- Full content rewrite; `guides/`, `architecture/`, `cloud/` sections replaced.
- Delegation model: `scripts/sync-vendored.mjs`, `vendored/`, placeholder pages for awaiting-upstream artefacts.
- Discoverability: per-page markdown alternates, `/llms-full.txt`, JSON-LD, markdown sitemap, robots updates.
- Visual alignment with cyoda-launchpad: Montserrat, full cyoda palette, dotted-grid background, reusable Badge/Button/GrowthPathDiagram components.
- Every old URL redirects to its new home.
- Full Playwright coverage for redirects, discoverability, link integrity, visual tokens.

## Spec

`docs/superpowers/specs/2026-04-20-cyoda-docs-restructure-design.md`

## Upstream issues filed

- cyoda-go: CLI help, env vars, OpenAPI, helm values, proto, errors
- cyoda-docs: MCP docs server (follow-up)

## Test plan

- [ ] All Playwright tests pass on CI.
- [ ] Preview deploy looks right (manual review).
- [ ] Spot-check half a dozen old URLs redirect correctly.
- [ ] Lighthouse doesn't regress.
EOF
)"
```

- [ ] **Step 3: Wait for Surge preview deploy**

The preview-deploy workflow posts a URL comment on the PR. Visit it; walk the nav; check a handful of redirects.

### Task 11.2: Merge and verify production

- [ ] **Step 1: Merge PR** (after review)

- [ ] **Step 2: Watch `.github/workflows/static.yml`** deploy production.

- [ ] **Step 3: Sanity-check production URLs**

```bash
for url in \
  "https://docs.cyoda.net/" \
  "https://docs.cyoda.net/getting-started/install-and-first-entity/" \
  "https://docs.cyoda.net/guides/cyoda-design-principles/" \
  "https://docs.cyoda.net/cloud/entitlements/" \
  "https://docs.cyoda.net/llms.txt" \
  "https://docs.cyoda.net/llms-full.txt" \
  "https://docs.cyoda.net/sitemap-markdown.xml"
do
  echo "=== $url ==="
  curl -sI "$url" | head -3
done
```

Expected: first resolves 200; old URLs resolve 200 (via the redirect target); llms-full.txt 200; sitemap-markdown.xml 200.

---

## Done

Plan is complete. The pivot has:

- Restructured IA with redirects.
- Full content rewrite aligned with cyoda-go.
- Vendoring model ready for upstream delegation.
- Tier-A discoverability for humans and AI.
- Visual alignment with cyoda-launchpad.
- Test coverage for the pieces that will silently rot otherwise.
- Upstream issues filed to unlock future delegation.
- MCP follow-up issue captured.

Next time someone reads this repo, they land on a site that is **one
platform expressed across tiers**, not a flat pile of guides that
assume cloud.
