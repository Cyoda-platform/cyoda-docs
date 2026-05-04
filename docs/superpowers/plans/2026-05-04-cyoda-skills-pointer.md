# Cyoda Skills Pointer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lead paragraph on `build/index.mdx` and `getting-started/install-and-first-entity.mdx` pointing readers at the cyoda-skills Claude Code plugin as the recommended first step.

**Architecture:** Content-only edits. Two prose paragraphs inserted at the top of two existing MDX pages. No new components, no new dependencies, no sidebar changes. Both link to `https://github.com/Cyoda-platform/cyoda-skills`.

**Tech Stack:** Astro + Starlight (MDX). No code; verification is a successful `npm run build:only` and a visual check via `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-05-04-cyoda-skills-pointer-design.md`

---

## File Structure

- Modify: `src/content/docs/build/index.mdx` — insert lead paragraph above existing intro.
- Modify: `src/content/docs/getting-started/install-and-first-entity.mdx` — insert lead paragraph above existing intro, before `## Install`.

No tests are added; this is content-only and the existing Playwright suite is unaffected.

---

### Task 1: Add lead paragraph to Build landing page

**Files:**
- Modify: `src/content/docs/build/index.mdx` (insert between frontmatter and existing intro paragraph at line 8)

- [ ] **Step 1: Read the current file**

Run: `cat src/content/docs/build/index.mdx`

Expected: file starts with frontmatter (lines 1–6), blank line (7), then existing intro paragraph beginning "Cyoda applications are **digital twins**…" at line 8.

- [ ] **Step 2: Insert the lead paragraph**

Use Edit to replace the existing block:

```
---
title: Build
description: Develop Cyoda applications — tier-agnostic patterns that work on any runtime.
sidebar:
  order: 0
---

Cyoda applications are **digital twins**: the same code runs on every
```

with:

```
---
title: Build
description: Develop Cyoda applications — tier-agnostic patterns that work on any runtime.
sidebar:
  order: 0
---

Building with Cyoda is easiest with an AI coding assistant. The [Cyoda
Skills plugin](https://github.com/Cyoda-platform/cyoda-skills) drops in
to Claude Code, Cursor, Codex, and other compatible tools, giving them
the skills to set up a local instance, model entities, design
workflows, and run tests against your Cyoda app. Install it from
[github.com/Cyoda-platform/cyoda-skills](https://github.com/Cyoda-platform/cyoda-skills)
and let your assistant lead — the rest of this section is the manual
reference behind what the skills do.

Cyoda applications are **digital twins**: the same code runs on every
```

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build:only`
Expected: build completes without errors. The MDX page renders.

- [ ] **Step 4: Visual check**

Run: `npm run dev` (in a separate terminal, or background it)
Open: `http://localhost:4321/build/`
Expected: the new paragraph is the first thing on the page, above the "digital twins" paragraph. Both `Cyoda Skills plugin` and `github.com/Cyoda-platform/cyoda-skills` link to `https://github.com/Cyoda-platform/cyoda-skills`. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/content/docs/build/index.mdx
git commit -m "docs(build): point readers at cyoda-skills plugin

Add a lead paragraph on the Build landing page recommending the
cyoda-skills Claude Code plugin as the first stop for anyone building
on Cyoda. No install instructions or per-skill reference — the
plugin's GitHub README is the source of truth."
```

---

### Task 2: Add lead paragraph to Getting Started page

**Files:**
- Modify: `src/content/docs/getting-started/install-and-first-entity.mdx` (insert between the imports block and the existing intro paragraph at line 11)

- [ ] **Step 1: Read the current file**

Run: `head -20 src/content/docs/getting-started/install-and-first-entity.mdx`

Expected: frontmatter (lines 1–6), imports (lines 7–9), blank line (10), existing intro paragraph beginning "This page takes you from nothing installed…" at line 11.

- [ ] **Step 2: Insert the lead paragraph**

Use Edit to replace the existing block:

```
import { Aside } from '@astrojs/starlight/components';
import FromTheBinary from '../../../components/FromTheBinary.astro';

This page takes you from nothing installed to a persisted entity you can query,
```

with:

```
import { Aside } from '@astrojs/starlight/components';
import FromTheBinary from '../../../components/FromTheBinary.astro';

Building with Cyoda is easiest with an AI coding assistant. The [Cyoda
Skills plugin](https://github.com/Cyoda-platform/cyoda-skills) drops in
to Claude Code, Cursor, Codex, and other compatible tools, giving them
the skills to set up a local instance, model entities, design
workflows, and run tests against your Cyoda app. Install it from
[github.com/Cyoda-platform/cyoda-skills](https://github.com/Cyoda-platform/cyoda-skills)
and let your assistant lead — the rest of this page walks through the
same steps by hand.

This page takes you from nothing installed to a persisted entity you can query,
```

Note the closing clause differs from Task 1: "the rest of this **page walks through the same steps by hand**" (vs Task 1's "the rest of this **section is the manual reference behind what the skills do**"). This is intentional — the surrounding context differs.

- [ ] **Step 3: Verify the build still passes**

Run: `npm run build:only`
Expected: build completes without errors.

- [ ] **Step 4: Visual check**

Run: `npm run dev`
Open: `http://localhost:4321/getting-started/install-and-first-entity/`
Expected: the new paragraph appears at the top of the page, above the existing "This page takes you from nothing installed…" intro and above the `## Install` heading. Both links point to `https://github.com/Cyoda-platform/cyoda-skills`. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/content/docs/getting-started/install-and-first-entity.mdx
git commit -m "docs(getting-started): point readers at cyoda-skills plugin

Add a lead paragraph on the install/first-entity page recommending
the cyoda-skills Claude Code plugin as the easiest path. The manual
walkthrough below remains the reference for users not driving via an
AI assistant."
```

---

## Self-Review

- **Spec coverage.** Spec calls for: (1) lead paragraph on `build/index.mdx` — Task 1. (2) lead paragraph on `getting-started/install-and-first-entity.mdx` — Task 2. (3) link target `https://github.com/Cyoda-platform/cyoda-skills` — used in both. (4) verification via `npm run build:only` + `npm run dev` — Step 3 and Step 4 in both tasks. No gaps.
- **Placeholders.** None — both paragraphs are written verbatim, both commit messages are written verbatim, all commands are concrete.
- **Type consistency.** N/A — no code, no types. Wording differs between the two pages by exactly one closing clause; this is called out explicitly in Task 2 Step 2.
