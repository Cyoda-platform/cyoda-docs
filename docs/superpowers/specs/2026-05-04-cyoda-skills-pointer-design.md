# Cyoda Skills pointer in cyoda-docs

**Status:** Proposed
**Date:** 2026-05-04

## Problem

The [cyoda-skills](https://github.com/Cyoda-platform/cyoda-skills)
Claude Code plugin is the recommended first stop for anyone building
on Cyoda — it bundles skills (`/cyoda:setup`, `/cyoda:build`,
`/cyoda:design`, `/cyoda:test`, …) that automate setup, entity
modeling, workflow design, and testing against a Cyoda instance. The
docs site currently makes no mention of it, so readers landing in
**Build** or **Getting Started** miss the easiest path and start with
the manual reference instead.

The skills themselves already reference cyoda-docs and the cyoda-go
help feature for content. Mirroring install steps or per-skill
descriptions in cyoda-docs would be circular and would rot. The fix is
a small pointer, not a parallel reference.

## Goal

Direct readers starting to build on Cyoda to the cyoda-skills plugin
as the recommended first step, while keeping cyoda-docs free of any
content that duplicates what the plugin (or its README) already owns.

## Non-goals

- No dedicated page for the plugin in cyoda-docs (e.g. no
  `build/cyoda-skills.mdx`).
- No install instructions for any tool (Claude Code, Cursor, Codex,
  …) — the plugin's GitHub README is the source of truth.
- No enumeration or per-skill reference for `/cyoda:setup`,
  `/cyoda:build`, etc.
- No restructure of the existing Build pages or Getting Started page
  beyond inserting one lead paragraph at the top.
- No new sidebar entry.

## Design

### Placement

Two insertions, both lead paragraphs at the very top of the page body
(above all existing content, including any current intro paragraph and
the first heading):

1. `src/content/docs/build/index.mdx` — above the existing intro about
   digital twins and the "Where to next" list.
2. `src/content/docs/getting-started/install-and-first-entity.mdx` —
   above the existing intro paragraph and the `## Install` heading.

### Form

Plain prose paragraph. No Starlight `<Aside>`, no `<LinkCard>`, no
heading — the recommendation reads as native page voice and is the
first thing the reader sees.

### Content

A single paragraph, used on both pages with a one-clause tweak per
context.

**On `build/index.mdx`:**

> Building with Cyoda is easiest with an AI coding assistant. The
> [Cyoda Skills plugin](https://github.com/Cyoda-platform/cyoda-skills)
> drops in to Claude Code, Cursor, Codex, and other compatible tools,
> giving them the skills to set up a local instance, model entities,
> design workflows, and run tests against your Cyoda app. Install it
> from
> [github.com/Cyoda-platform/cyoda-skills](https://github.com/Cyoda-platform/cyoda-skills)
> and let your assistant lead — the rest of this section is the manual
> reference behind what the skills do.

**On `getting-started/install-and-first-entity.mdx`:**

Same paragraph, but the closing clause changes to:

> …the rest of this page walks through the same steps by hand.

### Link target

All links point at the repository root,
`https://github.com/Cyoda-platform/cyoda-skills`. The repo's README is
expected to carry install instructions and the skill list. If a
dedicated landing page is later published (e.g. on cyoda.com), only
this URL needs to change.

## Out of scope

See **Non-goals** above. In particular, the plugin's install steps and
skill catalogue are intentionally not mirrored here.

## Verification

Content-only change. Verification is:

- `npm run build:only` completes without errors.
- `npm run dev` — visit `/build/` and
  `/getting-started/install-and-first-entity/` and confirm the lead
  paragraph renders at the top of each page with a working link to the
  GitHub repo.

No new tests; existing Playwright suite is unaffected.

## Risks

- **Repo URL changes.** Mitigated by linking to a single canonical URL
  in two places — easy to find and update.
- **Plugin scope drifts** (skills are renamed, new ones added). The
  paragraph deliberately describes capabilities ("set up a local
  instance, model entities, design workflows, run tests") rather than
  naming individual skills, so it stays accurate without coupling to
  the plugin's command names.
