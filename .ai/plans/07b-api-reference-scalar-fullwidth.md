# Step 7 (Variant) — Full‑Width API Reference with Scalar, Separate from Docs Sidebar

[Unverified] Some layout flags differ between Starlight versions. Where noted, choose **Option A** (full‑width within Starlight layout by hiding the sidebar on this page) or **Option B** (stand‑alone Astro page). Test locally and adopt the one that best matches your theme/version.

**Objective**  
Add a top navigation item **“API Ref”** that opens a **full‑width** interactive API explorer (Scalar) **without the docs left sidebar**, while **“Docs”** continues to show the standard Starlight docs with the collapsible left nav and right “On this page” TOC.

---

## Actions

### 1) Install Scalar
```bash
npm install @scalar/api-reference
```

### 2) Ensure your OpenAPI spec is available
Serve your OpenAPI schema statically (YAML or JSON):
```
/public/openapi/openapi.json
```

### 3) Add a top‑level nav to both “Docs” and “API Ref”
In `astro.config.mjs` Starlight configuration, add two items to the top nav:
```js
starlight({
  title: 'Cyoda Documentation',
  nav: [
    { label: 'Docs', link: '/docs/' },
    { label: 'API Ref', link: '/api-reference/' } // target we create below
  ],
  // ...sidebar, editLink, etc.
})
```

### 4) Choose a full‑width implementation

#### Option A — Keep it inside Starlight but hide the docs sidebar on this page
Create `src/content/docs/api/reference.mdx` with Scalar:
```mdx
---
title: API Reference
# Attempt to suppress sidebar/TOC for this page (behavior can vary by version)
# If your Starlight version doesn't support flags here, use Option B below.
sidebar: false
tableOfContents: false
---

import { ApiReference } from '@scalar/api-reference';

<ApiReference configuration={{ spec: { url: '/openapi/openapi.json' } }} />
```

Then, add a route alias so the top nav goes to `/api-reference/` without showing the docs tree path (optional). You can do this via a lightweight redirect page at `src/pages/api-reference.astro`:
```astro
---
// Redirect /api-reference -> /docs/api/reference/
const target = '/docs/api/reference/';
---
<html lang="en">
  <head>
    <meta http-equiv="refresh" content={`0; url=${target}`} />
    <link rel="canonical" href={target} />
  </head>
  <body></body>
</html>
```

**Notes**
- If `sidebar: false` is not respected in your version/theme, you can also hide the sidebar via a small CSS override bounded to this route (e.g., using a route‑scoped class on the page or `:has()` selectors).

#### Option B — Stand‑alone Astro page (no Starlight sidebar/layout)
Create `src/pages/api-reference.astro` so the API explorer is full‑bleed and independent of the docs layout:
```astro
---
import { ApiReference } from '@scalar/api-reference';
// If you want a simple header matching your site, build a small shared Header component and import it here.
const title = 'API Reference';
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <!-- Optional: custom header/navbar that mirrors the Starlight nav links -->
    <main style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
      <h1 style="margin-bottom:1rem">{title}</h1>
      <ApiReference configuration={{ spec: { url: '/openapi/openapi.json' } }} />
    </main>
  </body>
</html>
```

**Notes**
- This page will not use Starlight’s built‑in layout. If you need the same top bar, factor a small shared header component so both Starlight and this page have consistent nav links.
- This approach guarantees **no docs sidebar** and maximizes space for Scalar.

### 5) Configure “try it out” basics (base URL & auth)
Scalar lets users set a server/base URL and auth (e.g., API key or Bearer token) at runtime through its UI. If you want to pre‑seed defaults, pass them in the `configuration` prop per Scalar docs (e.g., default server URL, security scheme hints). Example stub:
```mdx
<ApiReference
  configuration={{
    spec: { url: '/openapi/openapi.json' },
    // Example: seed defaults (adjust to Scalar’s documented options)
    // servers: [{ url: 'https://api.example.com' }],
    // auth: { apiKey: '...' }
  }}
/>
```

### 6) Test locally
```bash
npm run dev
```
- Click **Docs** → confirm standard docs with left sidebar and right TOC.
- Click **API Ref** → confirm a **full‑width** API explorer page **without** the docs sidebar.
- Use the UI to set base URL and authentication; try calling a safe GET endpoint.

---

## Acceptance Criteria
- The top nav shows **Docs** and **API Ref**.
- **Docs** renders with the standard Starlight sidebar and TOC.
- **API Ref** renders an interactive Scalar explorer **without** the docs sidebar, giving more real estate.
- Users can configure base URL and authentication and successfully send requests.
- No console errors.
