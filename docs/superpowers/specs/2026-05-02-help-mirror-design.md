# Static help mirror at `docs.cyoda.net/help/...` — design

**Date:** 2026-05-02
**Pinned cyoda-go version targeted by this work:** v0.6.2 (current value of
`cyoda-go-version.json`).
**Status:** design approved through brainstorming; ready to hand to
`writing-plans` for an implementation plan.

## Goal

Publish a static, always-available mirror of the cyoda-go binary's help
surface — both the CLI (`cyoda help …`) and the live HTTP help API
(`{CYODA_CONTEXT_PATH}/help`, default `/api/help`) — at
`https://docs.cyoda.net/help/...`. The mirror serves two audiences:

- **Humans** who do not have a local cyoda-go runtime installed, or who
  prefer a browseable web UI to a CLI.
- **AI agents** that need to discover and consume cyoda-go's structured,
  machine-readable help in order to answer questions, generate code, or
  build retrieval indexes — without needing to install or run the binary.

These help endpoints are described as *crucial for AI agents to discover
and understand cyoda-go*, so the design treats agent UX as a
first-class requirement, not an afterthought.

## Reversal of a prior principle

The Phase A integration spec
(`docs/superpowers/specs/2026-04-24-post-80-help-integration-design.md`)
adopted the principle:

> **The website never mirrors help bodies.**

That decision was correct *for Phase A*, when the only consumers were
the three reference-navigator pages and `<FromTheBinary>` callouts.
Mirroring bodies would have introduced a second canonical reference
that could drift from the binary.

The current work explicitly reverses that principle for the new
`/help/...` URL space, for two reasons:

1. The audience expanded from "human readers of curated docs pages" to
   "AI agents that cannot install the binary." Agents have no
   alternative path to the canonical content; pointing them at the CLI
   does not work.
2. The mirror is now generated *from* the pinned, integrity-verified
   `cyoda_help_<v>.json` upstream artefact, with the pinned version
   stamped on every page. There is one canonical source per pinned
   version; drift is structurally impossible within a single build.

`<FromTheBinary>` callouts on hand-authored pages keep their existing
semantic ("the binary is authoritative") and continue to *not* embed
help bodies. The new `/help/...` tree is a separate, opt-in surface.

## Scope

### In scope

1. Static `/help/...` URL space generated at build time from the
   pinned `cyoda_help_<v>.json` release artefact.
2. Per-topic Starlight pages at `/help/<segments>/`.
3. Per-topic raw payloads at `/help/<segments>.md` (markdown body) and
   `/help/<segments>.json` (full descriptor).
4. Manifest at `/help/index.json` with envelope identical to the live
   API's `GET /help` response.
5. Version registry at `/help/versions.json` — single-entry today,
   designed for future per-major.minor expansion.
6. Top-level "Help" sidebar section between Cyoda Cloud and Reference,
   with two visible sub-entries.
7. Relocation of the existing `/reference/cyoda-help/` navigator into
   the new Help section, with a redirect from the old URL.
8. `llms.txt` advertisement of the help mirror plus a
   `/help/llms.txt` companion for agents that land on `/help/` first.

### Out of scope (explicit follow-ups)

- A version-switcher UI widget — none built today; the registry exists
  so it can be added later without redesign.
- An MCP server reference implementation that wraps the manifest +
  per-topic JSON.
- `<FromTheBinary>` extension to optionally link into the new
  rendered help pages.
- Inbound rewrite from `/help/<dotted>/` to `/help/<slashed>/`. Only
  the slash form is canonical.
- Diff or changelog rendering between version trees.

## URL conventions

The single rule, documented on the landing page, in `/llms.txt`, and
inside `/help/index.json` itself:

> `cyoda help A B C`
>     ↔ `https://docs.cyoda.net/help/A/B/C/` (rendered HTML)
>     ↔ `https://docs.cyoda.net/help/A/B/C.json` (full descriptor)
>     ↔ `https://docs.cyoda.net/help/A/B/C.md` (markdown body)

The manifest's `topic` field uses the live API's dotted form
(`config.database`). Agents construct slash-paths by replacing dots
with slashes. This dotted-vs-slash split is intentional: it preserves
byte-level envelope compatibility with the live API while giving the
docs tree a URL form that plays well with static hosting and Starlight
sidebar conventions.

The mirror diverges from the live API in exactly three documented
ways:

1. URL prefix: `/help` on the docs site, `{CYODA_CONTEXT_PATH}/help`
   (default `/api/help`) on the binary.
2. URL form per topic: slashes on the docs site, dots on the binary.
3. Authentication: none on either side (the live API mounts help
   endpoints outside global auth too).

## Versioning model

### Today

Single tree at `/help/...`. No version segment in any URL. The pinned
`cyoda-go-version.json` decides which release the build targets;
bumping the pin re-pulls and regenerates everything.

### Future (additive, no current code)

When older trees need to coexist with the current frontline version,
they ship at `/help/v<MAJOR>.<MINOR>/...`. The unversioned URL never
becomes a redirect; it permanently means "current." This eliminates
churn at the most-trafficked URLs across version bumps.

### Hooks built today so future expansion is purely additive

1. The new generator script accepts a `--prefix=<segment>` flag
   defaulting to empty. Today the build invokes it once with empty
   prefix; later it can be invoked again with `--prefix=v0.6/` to
   emit a snapshot under `/help/v0.6/...`.
2. `/help/versions.json` exists from day one with a single entry
   (`{ "current": "0.6", "versions": [{...}] }`). Adding a tree later
   is a one-line append plus a second generator invocation.
3. The generator hard-fails if any topic's first path segment matches
   `^v\d+(\.\d+)?$`, reserving the `/help/v…/` namespace.
4. The pinned version is stamped into every per-topic page, the
   manifest envelope, and `/help/versions.json`, sourced from one
   place (`.cyoda-cache/cyoda-help-full.json`).

## Architecture and data flow

```
┌───────────────────────────────────────────┐
│ cyoda-go release (pinned in              │
│ cyoda-go-version.json)                   │
│   • cyoda_help_<v>.json (full)           │
│   • SHA256SUMS                           │
└───────────────────────────────────────────┘
              │
              ▼  (network + sha256 verify)
   scripts/fetch-cyoda-help-index.js
   (existing script, modified)
              │
       ┌──────┴──────────┐
       ▼                 ▼
 src/data/         .cyoda-cache/
 cyoda-help-       cyoda-help-
 index.json        full.json
 (slim, existing   (full topics
  shape; current    incl. body,
  consumers         sections,
  untouched —       children;
  Astro-imported)   generator-only,
                    not Astro-imported)
       │                 │
       │                 ▼
       │     scripts/generate-help-pages.js
       │     (NEW; runs after fetch, before astro build)
       │                 │
       │   ┌─────────────┼─────────────────┬────────────────────┐
       │   ▼             ▼                 ▼                    ▼
       │ src/content/  public/help/      public/help/         public/help/
       │ docs/help/    index.json        <seg>/.../<leaf>.json index.json,
       │ index.mdx     (manifest)        (per-topic            versions.json,
       │ + topic-                        descriptor)           llms.txt
       │ tree.mdx      public/help/
       │ + <seg>/.../  <seg>/.../<leaf>.md
       │ <leaf>.md     (raw markdown
       │ (Starlight     body)
       │  pages)
       ▼
 (existing consumers:
  FromTheBinary,
  navigator MDX
  — unchanged)
```

### File-location principle

- `src/data/` — JSON imported by Astro/MDX at build time (Vite resolves
  it as a project module). The slim `cyoda-help-index.json` lives here
  because `<FromTheBinary>` and the navigator MDX import it.
- `public/` — static assets served verbatim at runtime. The manifest,
  per-topic raw payloads, and `versions.json` live here.
- `.cyoda-cache/` — intermediate artefacts only build scripts consume.
  The full help bundle lives here because no Astro page imports it
  directly; only the generator does.

## File layout

```
.cyoda-cache/
  cyoda-help-full.json          ← NEW (gitignored already)
src/data/
  cyoda-help-index.json         ← unchanged (gitignored already)
src/content/docs/help/          ← NEW dir (mixed: tracked + gitignored)
  index.mdx                       ← landing page (NEW, hand-authored, tracked)
  topic-tree.mdx                  ← moved from reference/cyoda-help.mdx
                                    (hand-authored, tracked)
  <seg>/<seg>.md                  ← per-topic Starlight pages
                                    (generated, gitignored)
public/help/                    ← NEW dir (gitignored)
  index.json                      ← manifest
  versions.json                   ← version registry
  llms.txt                        ← agent-discovery breadcrumb
  <seg>/<seg>.json                ← per-topic descriptors
  <seg>/<seg>.md                  ← per-topic raw markdown bodies
```

`.gitignore` additions:

```
# Generated per-topic help pages (the directory exists, but only the
# two hand-authored files at its root are tracked).
src/content/docs/help/**/*.md
src/content/docs/help/**/*.mdx
!src/content/docs/help/index.mdx
!src/content/docs/help/topic-tree.mdx

public/help/
```

(`.cyoda-cache/` is already ignored.)

Two files in `src/content/docs/help/` are **hand-authored and committed**:
`index.mdx` (landing page) and `topic-tree.mdx` (relocated navigator).
Everything else under `src/content/docs/help/` is generated and
gitignored.

`CLAUDE.md` updates: add `scripts/generate-help-pages.js` to the
build-pipeline list, and add the new generated paths to the
"auto-generated, do not hand-edit" list.

## Build pipeline integration

```
npm run build:
  1.  scripts/generate-schema-pages.js          (existing)
  1a. scripts/fetch-cyoda-help-index.js         (existing, MODIFIED)
        in:   cyoda-go-version.json
        net:  GET cyoda_help_<v>.json + SHA256SUMS
        out:  src/data/cyoda-help-index.json    (slim, unchanged)
              .cyoda-cache/cyoda-help-full.json (NEW)
  1b. scripts/generate-help-pages.js            (NEW)
        in:   .cyoda-cache/cyoda-help-full.json
        opts: --prefix=""  (default; reserved for future versioning)
        out:  src/content/docs/help/index.mdx
              src/content/docs/help/<seg>/.../<leaf>.md
              public/help/index.json
              public/help/<seg>/.../<leaf>.json
              public/help/<seg>/.../<leaf>.md
              public/help/versions.json
              public/help/llms.txt
  2.  astro build                                (existing)
  3.  scripts/export-markdown.js                 (existing)
  4.  scripts/generate-llms-txt.js               (existing, MODIFIED)
                                                  (adds /help section)
  5.  scripts/package-schemas.js                 (existing)
```

### `fetch-cyoda-help-index.js` modifications

- Add a second output: `.cyoda-cache/cyoda-help-full.json` containing
  the full validated topics array (no body stripping).
- The slim output, signature, CLI flags, `--if-missing` behaviour, and
  existing tests remain unchanged.
- New error class `HelpJsonBodyMissing` fires if any topic in the
  upstream JSON lacks a `body` field. The slim shape did not require
  bodies; the new full output does. The fetch step does the structural
  validation; downstream code can assume the cached file is well-formed.

### `generate-help-pages.js` (new)

- Pure file-system generator (no network).
- Reads `.cyoda-cache/cyoda-help-full.json`. Errors with
  `MissingFullData` if absent (with a hint to run the fetch step first).
- Walks topics in path order. For each:
  - `slug = topic.path.join('/')`. Normalised to lowercase
    (defensively; topics already are).
  - Per-topic Starlight page at `src/content/docs/help/<slug>.md`
    (see "Page structure" below).
  - Per-topic descriptor at `public/help/<slug>.json`.
  - Per-topic raw body at `public/help/<slug>.md`.
- Hard-fails with `ReservedTopicSegment` if any topic's first path
  segment matches `^v\d+(\.\d+)?$` (reserves the version-tree
  namespace) or equals `index` or `topic-tree` (would collide with the
  hand-authored files at the top of `src/content/docs/help/`).
- Hard-fails with `TopicSlugConflict` if two distinct topics derive
  the same slug.
- Writes `public/help/index.json` whose envelope exactly matches the
  live API's `GET /help` shape:
  ```json
  {
    "schema": 1,
    "version": "<pinned full version>",
    "topics": [
      { "topic": "<dotted>", "title": "...", "stability": "...",
        "tagline": "<from synopsis>", "see_also": [...] }
    ],
    "_url_convention": "topic IDs use dots; build URL by replacing dots with slashes, e.g. config.database -> /help/config/database/"
  }
  ```
  (`_url_convention` is a non-API hint field; harmless and self-explaining.)
- Writes `public/help/versions.json` (single-entry today).
- Writes `public/help/llms.txt` (small companion for agents that land
  on `/help/` first).
- Does **not** write `index.mdx` or `topic-tree.mdx` — both are
  hand-authored, committed files. The generator only writes
  per-topic pages and the artefacts under `public/help/`.
- Atomic-writes per output root (`src/content/docs/help/`,
  `public/help/`) — writes into a temp directory, then renames; on
  any error, the temp tree is unlinked. The two tracked
  hand-authored files are explicitly preserved across the rename:
  the generator never touches them. Prevents partial state from
  poisoning a subsequent `astro build`.

### One-time relocation of `cyoda-help.mdx` (not part of the build)

This is a single human edit performed when the work lands, not a
build step:

1. Move `src/content/docs/reference/cyoda-help.mdx` to
   `src/content/docs/help/topic-tree.mdx`.
2. Update its frontmatter (`title`, `sidebar.order`).
3. Update the JSX expression that renders each tree entry so each
   `cyoda help <path>` invocation becomes a link to its rendered
   page (`/help/<slug>/`).
4. Add a `redirects` entry in `astro.config.mjs` mapping
   `/reference/cyoda-help/` → `/help/topic-tree/`.

The relative import path for `cyoda-help-index.json` is unchanged
(`../../../data/cyoda-help-index.json`) because both old and new
locations are three directory levels deep within `src/`.

### `generate-llms-txt.js` modification

Add a `## cyoda-go binary help` section advertising `/help/index.json`
and the URL convention. Body shape:

```
## cyoda-go binary help (mirror of CLI `cyoda help` and live HTTP API `/api/help`)

Pinned: cyoda-go v<X.Y.Z>

Manifest:        https://docs.cyoda.net/help/index.json
Per topic:       https://docs.cyoda.net/help/<slug>.json   (full descriptor)
                 https://docs.cyoda.net/help/<slug>.md     (markdown body only)
                 https://docs.cyoda.net/help/<slug>/       (rendered HTML)
Version tree:    https://docs.cyoda.net/help/versions.json

URL convention:  cyoda help A B C  ↔  /help/A/B/C/  (or .md / .json)
                 Manifest topic IDs use dots (e.g. "config.database");
                 replace dots with slashes to build the URL.
```

`/help/llms.txt` is a smaller subset of the same content.

## Page structure

### Per-topic page (`src/content/docs/help/<slug>.md`)

Critical decision: per-topic pages are `.md`, not `.mdx`. Topic bodies
contain literal `{...}` placeholders (e.g. `{CYODA_CONTEXT_PATH}/help/{topic}`)
and angle-bracket constructs that MDX would parse as JS expressions or
JSX. Inside markdown code spans these are inert; in MDX they break the
build. Starlight processes `.md` in the `docs` collection identically
to `.mdx` (frontmatter, headings, asides, syntax highlighting, TOC),
so there is no functional cost to using `.md` here.

Generator output is wholly self-contained:

```markdown
---
title: <topic.title>
description: <topic.synopsis, truncated to ~155 chars, YAML-escaped>
sidebar:
  hidden: true
---

:::note[Canonical reference]
This page mirrors `cyoda help <space-joined path>` from
**cyoda-go v<pinnedPatch>** (pinned). The binary you run is authoritative
for the version you run.
:::

<topic.body verbatim>

## Subtopics

- [`cyoda help <child path>`](./<leaf>/) — <child synopsis>
…  (omitted if no children)

## See also

- [`cyoda help <peer>`](/help/<peer>/) — <peer synopsis>
…  (omitted if see_also empty)

## Raw formats

- [`/help/<slug>.json`](./<leaf>.json) — full descriptor
- [`/help/<slug>.md`](./<leaf>.md) — body only
```

`:::note[…]` is Starlight's native markdown directive; no component
import is needed. `sidebar.hidden: true` excludes the page from
sidebar autogen even if a glob were to crawl this directory.

Breadcrumbs, TOC, and prev/next come from Starlight defaults.

### Landing page (`src/content/docs/help/index.mdx`)

The "Browse rendered help" sub-entry under the Help section. Imports
the slim `cyoda-help-index.json` and renders:

- Two paragraphs of prose: what this is, the pinned-version model,
  and the convention that `/help/...` always means latest.
- The pinned version stamp.
- A `<CardGrid>` with one card per top-level topic, linking to
  `/help/<top>/`. Cards display topic name, stability badge, and
  synopsis.
- "For agents" subsection listing the four concrete URLs:
  `/help/index.json`, `/help/<topic>.json`, `/help/<topic>.md`,
  `/help/versions.json`. Plus a one-paragraph slug-rule explainer.
- "Conventions" subsection: dotted-vs-slash mapping, divergence from
  live API (URL prefix, URL form), no-auth.

### Topic-tree navigator (`src/content/docs/help/topic-tree.mdx`)

The existing `src/content/docs/reference/cyoda-help.mdx` relocated.
Same content, with two changes:

- Each topic invocation in the rendered tree becomes a link to its
  rendered page (`/help/<slug>/`).
- Frontmatter `sidebar.order` adjusted to make this the first item
  under Help (above the landing page) so users see "what topics
  exist" before "browse them."
- Title clarified to `Topic tree (\`cyoda help\`)` to distinguish from
  the second sub-entry.

The original path becomes a redirect via `astro.config.mjs`'s
`redirects` map.

## Sidebar and navigation

`astro.config.mjs` change — add a top-level item between Cyoda Cloud
and Reference:

```js
{
  label: 'Help',
  collapsed: true,
  items: [
    { label: 'Topic tree (`cyoda help`)', link: '/help/topic-tree/' },
    { label: 'Browse rendered help', link: '/help/' },
  ],
},
```

Two explicit items, no `autogenerate`. Per-topic pages set
`sidebar.hidden: true` so they cannot accidentally appear in sidebar
nav.

`astro.config.mjs` `redirects` gains:

```js
'/reference/cyoda-help/': '/help/topic-tree/',
```

## AI-facing surfaces

Agents navigate the mirror via three primitives:

- `/help/index.json` — the manifest. Agents fetch this first.
- `/help/<slug>.{json,md}` — per-topic payloads. Agents pick whichever
  format suits their job: `.md` for prose synthesis, `.json` for
  programmatic filtering or section-level retrieval.
- `/help/versions.json` — version registry. Agents check this to
  confirm or pin a version.

Discovery: `/llms.txt` (existing, gets a new section) and
`/help/llms.txt` (new; smaller, scoped to the help mirror) point
agents at these URLs and document the slug rule.

The live API's pre-parsed `sections[]` field is preserved verbatim in
each per-topic JSON descriptor, enabling RAG ingestors to chunk by
section without writing a markdown splitter.

GitHub Pages serves `.json` as `application/json`, `.md` as
`text/markdown; charset=utf-8`, and adds permissive CORS by default,
so browser-based agents fetch without proxies.

## Error handling

Three layers, each with explicit named errors that follow the existing
`err('ClassName', message)` convention.

**Layer 1 — fetch step:** existing classes
(`InvalidVersionPin`, `FetchFailed`, `ReleaseNotFound`,
`IntegrityManifestMissing`, `IntegrityManifestIncomplete`,
`IntegrityCheckFailed`, `HelpJsonMalformed`) plus the new
`HelpJsonBodyMissing`.

**Layer 2 — generator:**

- `MissingFullData` — `.cyoda-cache/cyoda-help-full.json` not present.
- `MalformedTopic` — required field absent in the cached data.
- `ReservedTopicSegment` — first path segment matches
  `^v\d+(\.\d+)?$`, or equals `index` or `topic-tree`.
- `TopicSlugConflict` — two topics derive the same slug.
- `IOFailed` — wraps fs errors with the failing path.

**Layer 3 — Astro build:** standard MDX/markdown errors. Limited in
practice to the hand-authored landing and topic-tree pages, since
per-topic pages are `.md` (no MDX evaluation).

Atomic writes per output root prevent partial state on failure.

Idempotency: re-running the generator over an unchanged input must
produce byte-identical output. The generator does not embed a
`generatedAt` timestamp anywhere, to keep diffs clean.

## Testing

### `scripts/fetch-cyoda-help-index.test.js` (existing, extended)

- Asserts both outputs are produced (slim in `src/data/`, full in
  `.cyoda-cache/`).
- Asserts the full file preserves `body` and `sections[]` for each
  topic.
- Asserts `HelpJsonBodyMissing` fires when an upstream topic lacks a
  body.

### `scripts/generate-help-pages.test.js` (new, `node:test`)

Pure file-system tests over a fixture full-data file. Cases:

- One topic produces three artefacts (`.md` page in src, `.json` and
  `.md` in public).
- Manifest envelope shape exactly matches live API.
- Per-topic JSON descriptor exactly matches live API
  `GET /help/{topic}` shape.
- Slug derivation: `path: ["config", "database"]` → `config/database`.
- `ReservedTopicSegment` fires for first segment matching
  `^v\d+(\.\d+)?$`, and separately for first segment equal to
  `index` or `topic-tree`.
- `TopicSlugConflict` fires when two distinct topics collide.
- Idempotency: two consecutive runs over the same input produce
  identical outputs.
- Atomic-rename: simulated failure mid-write leaves the previous tree
  intact.

### Playwright (existing runner, one new spec at `tests/help-mirror.spec.ts`)

- `/help/` renders, contains the pinned version, lists top-level
  topics as cards.
- `/help/<some-real-topic>/` renders the body, contains the
  canonical-reference aside, links to the `.json` and `.md` siblings.
- `/help/index.json` returns valid JSON with the manifest envelope.
- `/help/<slug>.json` returns valid JSON with the descriptor envelope.
- `/help/<slug>.md` returns body as `text/markdown`.
- `/help/versions.json` returns the version registry.
- `/reference/cyoda-help/` redirects to `/help/topic-tree/`.

### Build integration

The existing build-runs-clean test continues to assert
`npm run build` exits 0; no change beyond the new artefacts being
present in `dist/`.

### What is intentionally not tested

- Exact text of any topic body (would couple tests to upstream content).
- Visual styling of rendered pages (covered indirectly by Playwright
  text-based assertions).
- Byte-for-byte equality between our `.json` output and a
  `cyoda help X --format=json` invocation. We test envelope shape;
  body content is the binary's responsibility.

## Open questions

None blocking. The five out-of-scope items above (version-switcher
UI, MCP reference server, `<FromTheBinary>` linking into rendered
pages, dotted-URL rewrites, version-diff/changelog rendering) are
deferred follow-ups.
