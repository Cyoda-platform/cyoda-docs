# Static help mirror at `/help/...` — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, browseable mirror of cyoda-go's CLI and HTTP help surface at `https://docs.cyoda.net/help/...`, generated at build time from the pinned upstream `cyoda_help_<v>.json` artefact, with payloads tailored to both human readers (rendered Starlight pages) and AI agents (per-topic JSON/Markdown plus a manifest matching the live API envelope).

**Architecture:** A new build-time generator (`scripts/generate-help-pages.js`) consumes a *full* (non-stripped) cyoda-go help bundle that the existing fetch script will additionally cache to `.cyoda-cache/cyoda-help-full.json`. The generator emits per-topic Starlight `.md` pages into `src/content/docs/help/<slug>/`, plus per-topic `.json` and `.md` static assets and a manifest into `public/help/`. Two hand-authored entry pages (`index.mdx` landing, `topic-tree.mdx` relocated from `/reference/cyoda-help/`) live alongside the generated tree under a new top-level "Help" sidebar section. URL convention: `cyoda help A B C` ↔ `/help/A/B/C/`.

**Tech Stack:** Node.js (`node:test`, `node:fs`, native fetch — no new deps), Astro 6 + Starlight 0.38 (`.md` content collection pages), Playwright (existing runner) for end-to-end checks, GitHub Pages for static hosting.

**Spec:** `docs/superpowers/specs/2026-05-02-help-mirror-design.md` (read this before starting any task).

---

## Files this plan creates or modifies

**Created (source files, tracked):**
- `scripts/generate-help-pages.js` — new generator
- `scripts/generate-help-pages.test.js` — generator tests
- `tests/fixtures/help-pages/help-full.minimal.json` — minimal full-bundle fixture
- `tests/fixtures/help-pages/help-full.literals.json` — fixture with `<…>` and `{…}` in body
- `tests/fixtures/help-pages/help-full.with-children.json` — multi-level fixture
- `src/content/docs/help/index.mdx` — landing page
- `src/content/docs/help/topic-tree.mdx` — relocated from `/reference/cyoda-help.mdx`
- `tests/help-mirror.spec.ts` — Playwright spec

**Modified (source files, tracked):**
- `scripts/fetch-cyoda-help-index.js` — also writes `.cyoda-cache/cyoda-help-full.json`
- `scripts/fetch-cyoda-help-index.test.js` — assert both outputs
- `scripts/generate-llms-txt.js` — adds `## cyoda-go binary help` section
- `package.json` — add `generate:help-pages` script and insert into `build` chain
- `astro.config.mjs` — add Help sidebar section, add `/reference/cyoda-help/` redirect
- `.gitignore` — ignore generated help artefacts with negative-pattern exceptions for the two tracked files
- `CLAUDE.md` — rewrite build-pipeline section against `package.json`

**Removed (source files):**
- `src/content/docs/reference/cyoda-help.mdx` — moved to `src/content/docs/help/topic-tree.mdx`

**Generated (build artefacts, gitignored):**
- `.cyoda-cache/cyoda-help-full.json`
- `src/content/docs/help/<seg>/.../<leaf>.md`
- `public/help/index.json`
- `public/help/versions.json`
- `public/help/llms.txt`
- `public/help/<seg>/.../<leaf>.json`
- `public/help/<seg>/.../<leaf>.md`

---

## How to run things during this plan

- **Single test:** `node --test scripts/fetch-cyoda-help-index.test.js`
- **All script tests:** `npm run test:scripts`
- **Full test suite:** `npm test` (script tests + Playwright; needs `GA_MEASUREMENT_ID` set — `GA_MEASUREMENT_ID=G-test npm test`)
- **Dev server:** `npm run dev` → http://localhost:4321
- **Full production build:** `npm run build`
- **Astro-only build (skips fetch + generate steps):** `npm run build:only`

---

## Stage 1 — Extend the fetch script to cache the full bundle

### Task 1: `fetch-cyoda-help-index.js` writes `.cyoda-cache/cyoda-help-full.json` alongside the slim file

**Files:**
- Modify: `scripts/fetch-cyoda-help-index.js`
- Modify: `scripts/fetch-cyoda-help-index.test.js`

The existing fetch script downloads `cyoda_help_<v>.json`, sha256-verifies it, strips topic bodies, and writes the slim index to `src/data/cyoda-help-index.json`. We add a second write of the full validated payload to `.cyoda-cache/cyoda-help-full.json`. The slim output's signature, format, and consumer contract are unchanged.

A new error class `HelpJsonBodyMissing` fires if any topic in the upstream JSON lacks a `body` field — required because the new generator depends on bodies.

- [ ] **Step 1: Extend the test for the happy-path case to assert both outputs**

In `scripts/fetch-cyoda-help-index.test.js`, find the `'happy path: writes sorted, body-stripped index'` test and replace it with the version below. Add a new `fullOutputPath` argument to `run()` (we'll add support in step 3).

```js
function tmpFullOutputFile() {
  return path.join(os.tmpdir(), `help-full-${Date.now()}-${Math.random()}.json`);
}

test('happy path: writes sorted slim index AND full bundle', async () => {
  const versionFile = tmpVersionFile('test');
  const outputFile = tmpOutputFile();
  const fullOutputFile = tmpFullOutputFile();
  await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: validJson },
      [SUMS_URL]: { status: 200, text: sumsValid },
    }),
    versionFilePath: versionFile,
    outputPath: outputFile,
    fullOutputPath: fullOutputFile,
  });

  // --- slim file: unchanged shape ---
  const slim = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  assert.equal(slim.pinnedVersion, 'test');
  assert.equal(slim.schema, 1);
  assert.equal(slim.topics.length, 3);
  for (const t of slim.topics) {
    assert.ok(!('body' in t), `slim topic ${t.path.join('/')} still has body`);
  }

  // --- full file: new ---
  const full = JSON.parse(fs.readFileSync(fullOutputFile, 'utf8'));
  assert.equal(full.pinnedVersion, 'test');
  assert.equal(full.schema, 1);
  assert.equal(full.topics.length, 3);
  for (const t of full.topics) {
    assert.ok(typeof t.body === 'string' && t.body.length > 0,
      `full topic ${t.path.join('/')} missing body`);
    assert.ok(Array.isArray(t.path));
    assert.ok(t.title);
  }

  fs.rmSync(versionFile);
  fs.rmSync(outputFile);
  fs.rmSync(fullOutputFile);
});
```

- [ ] **Step 2: Add a test for `HelpJsonBodyMissing`**

Append after the existing `HelpJsonMalformed` tests:

```js
test('HelpJsonBodyMissing: full output requested, but a topic lacks body', async () => {
  const versionFile = tmpVersionFile('test');
  const noBodyJson = JSON.stringify({
    schema: 1,
    version: 'x',
    topics: [
      { topic: 'a', path: ['a'], title: 'A', synopsis: 's' },  // no body
    ],
  });
  const { createHash } = await import('node:crypto');
  const sha = createHash('sha256').update(noBodyJson).digest('hex');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: noBodyJson },
      [SUMS_URL]: { status: 200, text: `${sha}  cyoda_help_test.json\n` },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
    fullOutputPath: tmpFullOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /HelpJsonBodyMissing/);
  fs.rmSync(versionFile);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test scripts/fetch-cyoda-help-index.test.js`

Expected: FAIL — `fullOutputPath` is unknown to `run()`, so the full file isn't written and the assertions fail.

- [ ] **Step 4: Implement `fullOutputPath` and `HelpJsonBodyMissing` in `scripts/fetch-cyoda-help-index.js`**

Two changes:

1. Add a body-presence check inside `stripAndSort` (or alongside it) that throws `HelpJsonBodyMissing` when `fullOutputPath` is requested.
2. After the existing slim write, if `fullOutputPath` is set, also write the full validated payload there.

Find the `run()` function and replace it with:

```js
export async function run({ fetch, versionFilePath, outputPath, fullOutputPath, ifMissing }) {
  if (ifMissing && fs.existsSync(outputPath) && (!fullOutputPath || fs.existsSync(fullOutputPath))) {
    return;
  }
  const version = parsePinFile(versionFilePath);
  console.log(`📚 Fetching cyoda help index (pinned v${version})...`);

  const jsonUrl = JSON_URL(version);
  const sumsUrl = SUMS_URL(version);

  const jsonText = await fetchOrThrow(fetch, jsonUrl, 'ReleaseNotFound');
  const sumsText = await fetchOrThrow(fetch, sumsUrl, 'IntegrityManifestMissing');

  const expected = findChecksum(sumsText, ASSET_BASENAME(version));
  if (!expected) {
    throw err('IntegrityManifestIncomplete', `SHA256SUMS for v${version} has no entry for ${ASSET_BASENAME(version)}.`);
  }
  const actual = sha256Hex(jsonText);
  if (actual !== expected) {
    throw err('IntegrityCheckFailed', `expected sha256 ${expected}, got ${actual} for ${ASSET_BASENAME(version)}.`);
  }

  let helpJson;
  try {
    helpJson = JSON.parse(jsonText);
  } catch (cause) {
    throw err('HelpJsonMalformed', `JSON.parse failed: ${cause.message}`);
  }

  const topics = stripAndSort(helpJson);

  const generatedAt = new Date().toISOString();

  // --- slim file: existing behaviour, unchanged ---
  const slimIndex = {
    pinnedVersion: version,
    schema: helpJson.schema ?? 1,
    generatedAt,
    topics,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(slimIndex, null, 2) + '\n');
  console.log(`   wrote ${outputPath} (${topics.length} topics, bodies stripped)`);

  // --- full file: new ---
  if (fullOutputPath) {
    // Validate every topic has a body. The generator depends on this.
    for (const t of helpJson.topics) {
      if (typeof t.body !== 'string' || t.body.length === 0) {
        throw err(
          'HelpJsonBodyMissing',
          `topic ${(t.path || []).join('/') || t.topic || '(unnamed)'} has no body in upstream JSON; the help-pages generator requires a non-empty body for every topic.`
        );
      }
    }
    const fullBundle = {
      pinnedVersion: version,
      schema: helpJson.schema ?? 1,
      generatedAt,
      topics: helpJson.topics,
    };
    fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
    fs.writeFileSync(fullOutputPath, JSON.stringify(fullBundle, null, 2) + '\n');
    console.log(`   wrote ${fullOutputPath} (${helpJson.topics.length} topics, full)`);
  }
}
```

Then update the CLI entry point at the bottom of the file:

```js
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (invokedDirectly) {
  const projectRoot = path.resolve(__dirname, '..');
  const versionFilePath = path.join(projectRoot, 'cyoda-go-version.json');
  const outputPath = path.join(projectRoot, 'src', 'data', 'cyoda-help-index.json');
  const fullOutputPath = path.join(projectRoot, '.cyoda-cache', 'cyoda-help-full.json');
  const ifMissing = process.argv.includes('--if-missing');
  try {
    await run({ fetch: globalThis.fetch, versionFilePath, outputPath, fullOutputPath, ifMissing });
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test scripts/fetch-cyoda-help-index.test.js`

Expected: PASS for all tests including the two new assertions.

- [ ] **Step 6: Sanity-check that all existing fetch-script tests still pass**

Run: `npm run test:scripts`

Expected: PASS. (Existing `--if-missing` test in particular: the new short-circuit only skips work if BOTH outputs exist, so when only the slim is requested, behaviour is unchanged.)

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-cyoda-help-index.js scripts/fetch-cyoda-help-index.test.js
git commit -m "feat(scripts): cache full cyoda-go help bundle to .cyoda-cache/

Adds an optional fullOutputPath to fetch-cyoda-help-index.js that
mirrors the slim index but with topic bodies preserved. The new
generator (separate commit) consumes this. Also adds
HelpJsonBodyMissing validation: bodies are required when the full
output is requested.

The slim index's shape and existing consumers are unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Stage 2 — Build the generator iteratively

### Task 2: Generator skeleton — load full bundle, fail loud if missing

**Files:**
- Create: `scripts/generate-help-pages.js`
- Create: `scripts/generate-help-pages.test.js`
- Create: `tests/fixtures/help-pages/help-full.minimal.json`

We grow the generator one error class at a time, then add output stages, then atomicity. This task creates the entry point and the `MissingFullData` error.

- [ ] **Step 1: Create the minimal fixture**

Create `tests/fixtures/help-pages/help-full.minimal.json` with one topic:

```json
{
  "pinnedVersion": "test",
  "schema": 1,
  "topics": [
    {
      "topic": "cli",
      "path": ["cli"],
      "title": "cli — the cyoda command-line interface",
      "synopsis": "Subcommands and global flags.",
      "body": "# cli\n\n## NAME\n\ncli — the cyoda command-line interface.\n",
      "sections": [
        { "name": "NAME", "body": "cli — the cyoda command-line interface." }
      ],
      "see_also": [],
      "stability": "stable",
      "actions": [],
      "children": []
    }
  ]
}
```

- [ ] **Step 2: Write the failing test for `MissingFullData`**

Create `scripts/generate-help-pages.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { run } from './generate-help-pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(__dirname, '..', 'tests', 'fixtures', 'help-pages');

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

test('MissingFullData: full bundle file does not exist', async () => {
  const err = await run({
    fullDataPath: '/nonexistent/cyoda-help-full.json',
    docsHelpDir: tmpDir('docs'),
    publicHelpDir: tmpDir('public'),
    prefix: '',
  }).catch(e => e);
  assert.match(err.message, /MissingFullData/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL with `Cannot find module './generate-help-pages.js'` or similar.

- [ ] **Step 4: Implement minimal generator**

Create `scripts/generate-help-pages.js`:

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function err(cls, message) {
  return new Error(`${cls}: ${message}`);
}

/**
 * Generate static help mirror artefacts from the cached full bundle.
 *
 * @param {object} opts
 * @param {string} opts.fullDataPath  path to .cyoda-cache/cyoda-help-full.json
 * @param {string} opts.docsHelpDir   src/content/docs/help/  (for per-topic .md pages)
 * @param {string} opts.publicHelpDir public/help/            (for .json/.md/manifest)
 * @param {string} [opts.prefix]      optional URL prefix segment, e.g. "v0.6/"
 *                                    (default empty for current frontline tree)
 */
export async function run({ fullDataPath, docsHelpDir, publicHelpDir, prefix = '' }) {
  if (!fs.existsSync(fullDataPath)) {
    throw err(
      'MissingFullData',
      `${fullDataPath} not found. Run scripts/fetch-cyoda-help-index.js first to populate the cache.`
    );
  }
  const raw = fs.readFileSync(fullDataPath, 'utf8');
  const bundle = JSON.parse(raw);
  // Stages will be added in subsequent tasks.
  return { topicCount: bundle.topics.length };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (invokedDirectly) {
  const projectRoot = path.resolve(__dirname, '..');
  const fullDataPath = path.join(projectRoot, '.cyoda-cache', 'cyoda-help-full.json');
  const docsHelpDir = path.join(projectRoot, 'src', 'content', 'docs', 'help');
  const publicHelpDir = path.join(projectRoot, 'public', 'help');
  const prefix = (process.argv.find(a => a.startsWith('--prefix=')) || '--prefix=').slice('--prefix='.length);
  try {
    const result = await run({ fullDataPath, docsHelpDir, publicHelpDir, prefix });
    console.log(`✅ Generated help mirror (${result.topicCount} topics, prefix=${prefix || '<empty>'})`);
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS for the `MissingFullData` test.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js tests/fixtures/help-pages/help-full.minimal.json
git commit -m "feat(scripts): generate-help-pages skeleton + MissingFullData error

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Topic validation — invariant, reserved segments, slug conflicts

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`
- Create: `tests/fixtures/help-pages/help-full.with-children.json`

Add three guards before any output is produced:

- `MalformedTopic` if any topic's `topic !== path.join('.')`, or `path` is not a non-empty string array of `[A-Za-z0-9_-]+`, or `body` is missing/empty, or `title` is missing.
- `ReservedTopicSegment` if any topic's first path segment matches `^v\d+(\.\d+)?$`, or equals `index`, or equals `topic-tree`.
- `TopicSlugConflict` if two distinct topics derive the same slug.

- [ ] **Step 1: Create the with-children fixture**

`tests/fixtures/help-pages/help-full.with-children.json`:

```json
{
  "pinnedVersion": "test",
  "schema": 1,
  "topics": [
    {
      "topic": "config",
      "path": ["config"],
      "title": "configuration",
      "synopsis": "Environment-driven configuration for cyoda.",
      "body": "# config\n\nTop-level config doc.\n",
      "sections": [],
      "see_also": [],
      "stability": "stable",
      "actions": [],
      "children": ["config.database"]
    },
    {
      "topic": "config.database",
      "path": ["config", "database"],
      "title": "database configuration",
      "synopsis": "Storage backend selection and per-backend connection settings.",
      "body": "# config.database\n\nBackend selection.\n",
      "sections": [],
      "see_also": ["config", "run"],
      "stability": "stable",
      "actions": [],
      "children": []
    }
  ]
}
```

- [ ] **Step 2: Write failing tests for the three new error classes**

Append to `scripts/generate-help-pages.test.js`:

```js
function writeBundle(dir, bundle) {
  const file = path.join(dir, 'cyoda-help-full.json');
  fs.writeFileSync(file, JSON.stringify(bundle));
  return file;
}

test('MalformedTopic: topic field does not equal path.join(".")', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'wrong', path: ['config', 'database'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /MalformedTopic/);
  assert.match(err.message, /topic === path\.join/);
});

test('ReservedTopicSegment: first segment is a version pattern', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'v0.6', path: ['v0.6'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('ReservedTopicSegment: first segment is "index"', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'index', path: ['index'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('ReservedTopicSegment: first segment is "topic-tree"', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'topic-tree', path: ['topic-tree'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('TopicSlugConflict: two distinct topics derive the same slug', async () => {
  const cacheDir = tmpDir('cache');
  // Construct two topics with identical path arrays — degenerate but tests the guard.
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [
      {
        topic: 'a.b', path: ['a', 'b'],
        title: 'first', body: '# first\n', synopsis: '',
        sections: [], see_also: [], stability: 'stable', actions: [], children: [],
      },
      {
        topic: 'a.b', path: ['a', 'b'],
        title: 'second', body: '# second\n', synopsis: '',
        sections: [], see_also: [], stability: 'stable', actions: [], children: [],
      },
    ],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /TopicSlugConflict/);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: 5 new tests FAIL because the guards aren't implemented yet.

- [ ] **Step 4: Implement the three guards**

In `scripts/generate-help-pages.js`, replace `run()` with:

```js
const SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const VERSION_SEGMENT_RE = /^v\d+(\.\d+)?$/;
const RESERVED_FIRST_SEGMENTS = new Set(['index', 'topic-tree']);

function validateTopic(t) {
  if (!t || typeof t !== 'object') {
    throw err('MalformedTopic', `topic entry is not an object: ${JSON.stringify(t)}`);
  }
  if (!Array.isArray(t.path) || t.path.length === 0) {
    throw err('MalformedTopic', `topic missing non-empty path[]: ${JSON.stringify(t.path)}`);
  }
  for (const seg of t.path) {
    if (typeof seg !== 'string' || !SEGMENT_RE.test(seg)) {
      throw err('MalformedTopic', `path segment "${seg}" is not [A-Za-z0-9_-]+`);
    }
  }
  if (typeof t.topic !== 'string' || t.topic !== t.path.join('.')) {
    throw err(
      'MalformedTopic',
      `invariant violated: topic === path.join("."): topic=${JSON.stringify(t.topic)} path=${JSON.stringify(t.path)}`
    );
  }
  if (typeof t.title !== 'string' || t.title.length === 0) {
    throw err('MalformedTopic', `topic ${t.topic} missing title`);
  }
  if (typeof t.body !== 'string' || t.body.length === 0) {
    throw err('MalformedTopic', `topic ${t.topic} missing body`);
  }
}

function checkReservedSegment(t) {
  const first = t.path[0];
  if (VERSION_SEGMENT_RE.test(first) || RESERVED_FIRST_SEGMENTS.has(first)) {
    throw err(
      'ReservedTopicSegment',
      `topic ${t.topic} uses reserved first segment "${first}". Reserved: /^v\\d+(\\.\\d+)?$/, "index", "topic-tree".`
    );
  }
}

function slugFor(t) {
  return t.path.join('/').toLowerCase();
}

function checkSlugConflicts(topics) {
  const seen = new Map();
  for (const t of topics) {
    const slug = slugFor(t);
    if (seen.has(slug)) {
      throw err(
        'TopicSlugConflict',
        `topics ${seen.get(slug)} and ${t.topic} both derive slug "${slug}"`
      );
    }
    seen.set(slug, t.topic);
  }
}

export async function run({ fullDataPath, docsHelpDir, publicHelpDir, prefix = '' }) {
  if (!fs.existsSync(fullDataPath)) {
    throw err(
      'MissingFullData',
      `${fullDataPath} not found. Run scripts/fetch-cyoda-help-index.js first to populate the cache.`
    );
  }
  const raw = fs.readFileSync(fullDataPath, 'utf8');
  const bundle = JSON.parse(raw);

  for (const t of bundle.topics) {
    validateTopic(t);
    checkReservedSegment(t);
  }
  checkSlugConflicts(bundle.topics);

  return { topicCount: bundle.topics.length };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS for all 6 tests (1 from Task 2 + 5 new).

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js tests/fixtures/help-pages/help-full.with-children.json
git commit -m "feat(scripts): generator topic validation (invariant, reserved, conflicts)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Per-topic Starlight `.md` page generation

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

For each topic, write a Starlight content-collection `.md` page at `<docsHelpDir>/<slug>.md`. The file contains: frontmatter (`title`, `description`, `sidebar.hidden:true`), the canonical-reference `:::note[...]` aside, the body verbatim, and trailing "Subtopics" / "See also" / "Raw formats" sections (omitted when empty).

For now we still write directly to the destination (atomic-rename comes in Task 11).

- [ ] **Step 1: Write failing test for happy-path page rendering**

Append to `scripts/generate-help-pages.test.js`:

```js
test('writes per-topic .md page with frontmatter, aside, body, and Raw formats', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const pagePath = path.join(docsHelpDir, 'cli.md');
  const content = fs.readFileSync(pagePath, 'utf8');

  // frontmatter
  assert.match(content, /^---\n/);
  assert.match(content, /\ntitle: cli — the cyoda command-line interface\n/);
  assert.match(content, /\nsidebar:\n {2}hidden: true\n/);

  // canonical-reference aside
  assert.match(content, /:::note\[Canonical reference\]/);
  assert.match(content, /cyoda help cli/);
  assert.match(content, /cyoda-go v[\d.]+/);
  assert.match(content, /:::/);

  // body verbatim
  assert.match(content, /## NAME/);
  assert.match(content, /cli — the cyoda command-line interface\./);

  // raw formats section
  assert.match(content, /## Raw formats/);
  assert.match(content, /\/help\/cli\.json/);
  assert.match(content, /\/help\/cli\.md/);
});

test('multi-segment topic produces nested .md page with Subtopics and See also', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });

  // Parent page has Subtopics
  const parent = fs.readFileSync(path.join(docsHelpDir, 'config.md'), 'utf8');
  assert.match(parent, /## Subtopics/);
  assert.match(parent, /cyoda help config database/);

  // Child page is at config/database.md and has See also
  const child = fs.readFileSync(path.join(docsHelpDir, 'config', 'database.md'), 'utf8');
  assert.match(child, /## See also/);
  assert.match(child, /cyoda help config/);
  assert.match(child, /cyoda help run/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL — page files don't exist yet.

- [ ] **Step 3: Implement page rendering**

Add helpers and the rendering loop to `scripts/generate-help-pages.js`. Keep `run()` simple by delegating:

```js
function yamlEscape(s) {
  // YAML double-quoted scalar: escape backslash, double-quote, and control chars.
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function truncateForDescription(s, max = 155) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function topicBySlug(topics) {
  const map = new Map();
  for (const t of topics) map.set(slugFor(t), t);
  return map;
}

function findByTopic(topics, dottedId) {
  return topics.find(t => t.topic === dottedId);
}

function renderPage(t, allTopics, pinnedPatch, urlPrefix) {
  const slugPath = t.path.join('/');
  const cliInvocation = ['cyoda', 'help', ...t.path].join(' ');
  const description = truncateForDescription(t.synopsis || t.title);

  const fm = [
    '---',
    `title: ${yamlEscape(t.title)}`,
    `description: ${yamlEscape(description)}`,
    'sidebar:',
    '  hidden: true',
    '---',
    '',
  ].join('\n');

  const aside = [
    ':::note[Canonical reference]',
    `This page mirrors \`${cliInvocation}\` from`,
    `**cyoda-go v${pinnedPatch}** (pinned). The binary you run is authoritative`,
    `for the version you run.`,
    ':::',
    '',
  ].join('\n');

  const sections = [];

  // Subtopics
  if (Array.isArray(t.children) && t.children.length > 0) {
    const lines = ['## Subtopics', ''];
    for (const childId of t.children) {
      const child = findByTopic(allTopics, childId);
      if (!child) continue;
      const childCli = ['cyoda', 'help', ...child.path].join(' ');
      const childUrl = `/${urlPrefix}help/${child.path.join('/')}/`.replace(/\/+/g, '/');
      lines.push(`- [\`${childCli}\`](${childUrl}) — ${child.synopsis || ''}`);
    }
    lines.push('');
    sections.push(lines.join('\n'));
  }

  // See also
  if (Array.isArray(t.see_also) && t.see_also.length > 0) {
    const lines = ['## See also', ''];
    for (const peerId of t.see_also) {
      const peer = findByTopic(allTopics, peerId);
      if (!peer) {
        // Reference to a topic that isn't in the bundle — render a non-link entry.
        lines.push(`- \`cyoda help ${peerId.replaceAll('.', ' ')}\``);
        continue;
      }
      const peerCli = ['cyoda', 'help', ...peer.path].join(' ');
      const peerUrl = `/${urlPrefix}help/${peer.path.join('/')}/`.replace(/\/+/g, '/');
      lines.push(`- [\`${peerCli}\`](${peerUrl}) — ${peer.synopsis || ''}`);
    }
    lines.push('');
    sections.push(lines.join('\n'));
  }

  // Raw formats
  const rawJson = `/${urlPrefix}help/${slugPath}.json`.replace(/\/+/g, '/');
  const rawMd = `/${urlPrefix}help/${slugPath}.md`.replace(/\/+/g, '/');
  sections.push([
    '## Raw formats',
    '',
    `- [\`${rawJson}\`](${rawJson}) — full descriptor (matches \`GET /help/{topic}\` envelope)`,
    `- [\`${rawMd}\`](${rawMd}) — body only`,
    '',
  ].join('\n'));

  // Body — emit verbatim, then a single blank-line separator before sections.
  const body = t.body.endsWith('\n') ? t.body : t.body + '\n';

  return [fm, aside, body, sections.join('\n')].join('\n');
}

function writeFileEnsuringDir(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
```

Then in `run()`, after the validation block, add the rendering loop:

```js
  const pinnedPatch = bundle.pinnedVersion;
  const urlPrefix = prefix; // empty by default

  for (const t of bundle.topics) {
    const slug = slugFor(t);
    const pagePath = path.join(docsHelpDir, ...t.path) + '.md';
    writeFileEnsuringDir(pagePath, renderPage(t, bundle.topics, pinnedPatch, urlPrefix));
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): render per-topic .md pages from full bundle

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Per-topic JSON descriptor sibling under `public/help/`

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

For each topic, also write `<publicHelpDir>/<slug>.json` containing the topic descriptor verbatim — same shape the live cyoda-go API returns from `GET /help/{topic}`.

- [ ] **Step 1: Write failing test**

Append:

```js
test('writes per-topic JSON descriptor with live-API shape', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const desc = JSON.parse(fs.readFileSync(path.join(publicHelpDir, 'config', 'database.json'), 'utf8'));
  assert.equal(desc.topic, 'config.database');
  assert.deepEqual(desc.path, ['config', 'database']);
  assert.equal(desc.title, 'database configuration');
  assert.equal(typeof desc.body, 'string');
  assert.ok(desc.body.length > 0);
  assert.deepEqual(desc.see_also, ['config', 'run']);
  assert.equal(desc.stability, 'stable');
  assert.deepEqual(desc.children, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL — `config/database.json` doesn't exist.

- [ ] **Step 3: Implement the JSON write**

In `run()`'s topic loop, after the page write, add:

```js
    const descPath = path.join(publicHelpDir, ...t.path) + '.json';
    writeFileEnsuringDir(descPath, JSON.stringify(t, null, 2) + '\n');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): emit per-topic JSON descriptor (live-API shape)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Per-topic raw markdown body sibling

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

Write `<publicHelpDir>/<slug>.md` containing only the topic's `body` field — no frontmatter, no chrome. For agents that want raw markdown.

- [ ] **Step 1: Write failing test**

```js
test('writes per-topic raw markdown body, no frontmatter, byte-equal to body', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const raw = fs.readFileSync(path.join(publicHelpDir, 'cli.md'), 'utf8');
  const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8')).topics[0].body;
  assert.equal(raw, expected.endsWith('\n') ? expected : expected + '\n');
  // No frontmatter.
  assert.ok(!raw.startsWith('---'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Implement the raw .md write**

In `run()`'s topic loop, after the JSON write, add:

```js
    const rawMdPath = path.join(publicHelpDir, ...t.path) + '.md';
    writeFileEnsuringDir(rawMdPath, t.body.endsWith('\n') ? t.body : t.body + '\n');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): emit per-topic raw markdown body sibling

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Manifest at `public/help/index.json`

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

Write the manifest with envelope matching the live API's `GET /help` response: `{schema, version, topics: [{topic, title, stability, tagline, see_also}], _url_convention}`.

- [ ] **Step 1: Write failing test**

```js
test('writes manifest at public/help/index.json with live-API envelope', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const manifest = JSON.parse(fs.readFileSync(path.join(publicHelpDir, 'index.json'), 'utf8'));
  assert.equal(manifest.schema, 1);
  assert.equal(manifest.version, 'test');
  assert.ok(Array.isArray(manifest.topics));
  assert.equal(manifest.topics.length, 2);
  for (const t of manifest.topics) {
    assert.ok(t.topic);
    assert.ok(t.title);
    assert.ok(t.stability);
    assert.equal(typeof t.tagline, 'string');
    assert.ok(Array.isArray(t.see_also));
    assert.ok(!('body' in t), 'manifest must not include body');
  }
  // dotted topic IDs preserved
  assert.deepEqual(manifest.topics.map(t => t.topic).sort(), ['config', 'config.database']);
  // hint field
  assert.ok(typeof manifest._url_convention === 'string');
  assert.match(manifest._url_convention, /replace dots with slashes/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement manifest emission**

Add to `scripts/generate-help-pages.js`:

```js
function buildManifest(bundle) {
  return {
    schema: bundle.schema ?? 1,
    version: bundle.pinnedVersion,
    topics: bundle.topics.map(t => ({
      topic: t.topic,
      title: t.title,
      stability: t.stability ?? 'stable',
      tagline: t.synopsis ?? '',
      see_also: Array.isArray(t.see_also) ? t.see_also : [],
    })),
    _url_convention:
      'topic IDs use dots (e.g. "config.database"); build the URL by replacing dots with slashes, e.g. /help/config/database/',
  };
}
```

In `run()`, after the topic loop:

```js
  const manifestPath = path.join(publicHelpDir, 'index.json');
  writeFileEnsuringDir(manifestPath, JSON.stringify(buildManifest(bundle), null, 2) + '\n');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): emit manifest at public/help/index.json

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Versions registry at `public/help/versions.json`

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

Single-entry registry today; structured so future per-major.minor expansion is purely additive.

- [ ] **Step 1: Write failing test**

```js
test('writes versions.json with single current entry today', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const v = JSON.parse(fs.readFileSync(path.join(publicHelpDir, 'versions.json'), 'utf8'));
  assert.equal(v.current, 'test'); // pinnedVersion's major.minor — fixture uses "test", we keep it as-is for fixture
  assert.equal(v.versions.length, 1);
  assert.equal(v.versions[0].pinnedPatch, 'test');
  assert.equal(v.versions[0].current, true);
  assert.equal(v.versions[0].manifest, '/help/index.json');
  assert.equal(v.versions[0].root, '/help/');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement versions registry**

Add to `scripts/generate-help-pages.js`:

```js
function majorMinor(version) {
  // Accept "0.6.2" → "0.6", or non-semver fixture strings like "test" → "test".
  const parts = String(version).split('.');
  if (parts.length >= 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
    return `${parts[0]}.${parts[1]}`;
  }
  return String(version);
}

function buildVersionsRegistry(bundle, urlPrefix) {
  const mm = majorMinor(bundle.pinnedVersion);
  const root = `/${urlPrefix}help/`.replace(/\/+/g, '/');
  const manifest = `${root}index.json`;
  return {
    current: mm,
    versions: [
      {
        majorMinor: mm,
        pinnedPatch: bundle.pinnedVersion,
        current: true,
        manifest,
        root,
      },
    ],
  };
}
```

In `run()`:

```js
  const versionsPath = path.join(publicHelpDir, 'versions.json');
  writeFileEnsuringDir(versionsPath, JSON.stringify(buildVersionsRegistry(bundle, urlPrefix), null, 2) + '\n');
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): emit versions.json registry

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: `public/help/llms.txt` companion

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

Plain-text discovery file scoped to the help mirror. Site-wide `llms.txt` will gain a section that links here (Task 13).

- [ ] **Step 1: Write failing test**

```js
test('writes /help/llms.txt advertising manifest, conventions, raw formats', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const txt = fs.readFileSync(path.join(publicHelpDir, 'llms.txt'), 'utf8');
  assert.match(txt, /\/help\/index\.json/);
  assert.match(txt, /\/help\/<slug>\.json/);
  assert.match(txt, /\/help\/<slug>\.md/);
  assert.match(txt, /\/help\/versions\.json/);
  assert.match(txt, /replace dots with slashes/i);
  assert.match(txt, /Pinned: cyoda-go v/);
  assert.match(txt, /_url_convention/);  // strict-validator note
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL.

- [ ] **Step 3: Implement `llms.txt` emission**

```js
function buildHelpLlmsTxt(bundle) {
  return [
    '## cyoda-go binary help (mirror of CLI `cyoda help` and live HTTP API `/api/help`)',
    '',
    `Pinned: cyoda-go v${bundle.pinnedVersion}`,
    '',
    'Manifest:        https://docs.cyoda.net/help/index.json',
    'Per topic:       https://docs.cyoda.net/help/<slug>.json   (full descriptor)',
    '                 https://docs.cyoda.net/help/<slug>.md     (markdown body only)',
    '                 https://docs.cyoda.net/help/<slug>/       (rendered HTML)',
    'Version tree:    https://docs.cyoda.net/help/versions.json',
    '',
    'URL convention:  cyoda help A B C  ↔  /help/A/B/C/  (or .md / .json)',
    '                 Manifest topic IDs use dots (e.g. "config.database");',
    '                 replace dots with slashes to build the URL.',
    '',
    'Note: the manifest contains a non-API `_url_convention` hint field.',
    'Strict validators against the live cyoda-go GET /help schema should ignore it.',
    '',
  ].join('\n');
}
```

In `run()`:

```js
  const helpLlmsPath = path.join(publicHelpDir, 'llms.txt');
  writeFileEnsuringDir(helpLlmsPath, buildHelpLlmsTxt(bundle));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): emit /help/llms.txt agent-discovery file

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Body-with-literals fixture and round-trip test

**Files:**
- Create: `tests/fixtures/help-pages/help-full.literals.json`
- Modify: `scripts/generate-help-pages.test.js`

The whole reason per-topic pages are `.md` (not `.mdx`) is that bodies contain literal `{...}` and `<...>` constructs. We pin that as a regression test.

- [ ] **Step 1: Create the fixture**

`tests/fixtures/help-pages/help-full.literals.json`:

```json
{
  "pinnedVersion": "test",
  "schema": 1,
  "topics": [
    {
      "topic": "openapi",
      "path": ["openapi"],
      "title": "openapi — discovery endpoints",
      "synopsis": "OpenAPI spec and help endpoints.",
      "body": "# openapi\n\n## SYNOPSIS\n\n```\nGET /openapi.json\nGET {CYODA_CONTEXT_PATH}/help\nGET {CYODA_CONTEXT_PATH}/help/{topic}\n```\n\nUsage examples reference `cyoda [<subcommand>] [<flags>]` and `<topic>`.\n",
      "sections": [],
      "see_also": [],
      "stability": "stable",
      "actions": [],
      "children": []
    }
  ]
}
```

- [ ] **Step 2: Write the round-trip test**

Append:

```js
test('body containing literal {…} and <…> round-trips through .md without mangling', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.literals.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const page = fs.readFileSync(path.join(docsHelpDir, 'openapi.md'), 'utf8');
  // Literals appear verbatim in the page (inside their original code fence).
  assert.match(page, /\{CYODA_CONTEXT_PATH\}\/help\/\{topic\}/);
  assert.match(page, /cyoda \[<subcommand>\] \[<flags>\]/);
  assert.match(page, /<topic>/);

  // Raw markdown sibling is byte-equal to body.
  const raw = fs.readFileSync(path.join(publicHelpDir, 'openapi.md'), 'utf8');
  const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8')).topics[0].body;
  assert.equal(raw, expected.endsWith('\n') ? expected : expected + '\n');
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS (the generator already does no escaping, which is correct).

- [ ] **Step 4: Commit**

```bash
git add tests/fixtures/help-pages/help-full.literals.json scripts/generate-help-pages.test.js
git commit -m "test(scripts): pin body-with-literals round-trip for .md generator

Justifies the .md-not-.mdx decision: bodies contain literal {…} and
<…> that MDX would parse. This test would fail loudly if anyone
later switched the generator to .mdx output without escaping.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Atomic per-file writes from a side temp dir + orphan removal

**Files:**
- Modify: `scripts/generate-help-pages.js`
- Modify: `scripts/generate-help-pages.test.js`

So far the generator writes directly to destination paths. That risks half-written files on a kill-9 mid-run, and stale per-topic files when an upstream topic is removed. Replace with: stage all outputs to a side temp dir per output root, then `fs.rename` each file into place. After staging completes, walk the destination tree and unlink any per-topic files that aren't in the new staging tree (orphan removal). Hand-authored top-level files are explicitly excluded from orphan removal.

- [ ] **Step 1: Write failing tests**

Append:

```js
test('idempotency: two consecutive runs over the same input produce identical outputs', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');

  await run({ fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '' });
  const after1 = readAllFiles(docsHelpDir).concat(readAllFiles(publicHelpDir));

  await run({ fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '' });
  const after2 = readAllFiles(docsHelpDir).concat(readAllFiles(publicHelpDir));

  assert.deepEqual(after2, after1);
});

test('orphan removal: topic absent from new bundle gets unlinked', async () => {
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  const cacheDir = tmpDir('cache');

  // First run: two-topic bundle.
  const file1 = writeBundle(cacheDir, JSON.parse(fs.readFileSync(path.join(fixtureDir, 'help-full.with-children.json'), 'utf8')));
  await run({ fullDataPath: file1, docsHelpDir, publicHelpDir, prefix: '' });
  assert.ok(fs.existsSync(path.join(docsHelpDir, 'config', 'database.md')));
  assert.ok(fs.existsSync(path.join(publicHelpDir, 'config', 'database.json')));

  // Second run: bundle without the child topic.
  const file2 = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [
      JSON.parse(fs.readFileSync(path.join(fixtureDir, 'help-full.with-children.json'), 'utf8')).topics[0],
    ],
  });
  await run({ fullDataPath: file2, docsHelpDir, publicHelpDir, prefix: '' });
  assert.ok(!fs.existsSync(path.join(docsHelpDir, 'config', 'database.md')), 'orphan page should be removed');
  assert.ok(!fs.existsSync(path.join(publicHelpDir, 'config', 'database.json')), 'orphan json should be removed');
  assert.ok(!fs.existsSync(path.join(publicHelpDir, 'config', 'database.md')), 'orphan raw md should be removed');
});

test('hand-authored files preserved across runs', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');

  // Pre-seed with hand-authored files at the docsHelpDir root.
  fs.writeFileSync(path.join(docsHelpDir, 'index.mdx'), '---\ntitle: Help\n---\n\nLanding.\n');
  fs.writeFileSync(path.join(docsHelpDir, 'topic-tree.mdx'), '---\ntitle: Topic tree\n---\n\nTree.\n');

  await run({ fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '' });

  assert.equal(fs.readFileSync(path.join(docsHelpDir, 'index.mdx'), 'utf8'), '---\ntitle: Help\n---\n\nLanding.\n');
  assert.equal(fs.readFileSync(path.join(docsHelpDir, 'topic-tree.mdx'), 'utf8'), '---\ntitle: Topic tree\n---\n\nTree.\n');
});

// Helper used above.
function readAllFiles(dir) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else out.push({ path: path.relative(dir, p), content: fs.readFileSync(p, 'utf8') });
    }
  }
  walk(dir);
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: FAIL — orphan removal hasn't been implemented; idempotency may still pass since files are deterministic, but orphan removal definitely fails.

- [ ] **Step 3: Implement staging + orphan removal**

In `scripts/generate-help-pages.js`, replace the topic-loop section of `run()` with:

```js
  // --- Stage all outputs into side temp dirs ---
  const docsTmp = fs.mkdtempSync(path.join(path.dirname(docsHelpDir), `.help-tmp-docs-${process.pid}-`));
  const publicTmp = fs.mkdtempSync(path.join(path.dirname(publicHelpDir), `.help-tmp-public-${process.pid}-`));

  let stagedDocs = [];
  let stagedPublic = [];

  try {
    for (const t of bundle.topics) {
      const pageRel = path.join(...t.path) + '.md';
      writeFileEnsuringDir(path.join(docsTmp, pageRel), renderPage(t, bundle.topics, pinnedPatch, urlPrefix));
      stagedDocs.push(pageRel);

      const descRel = path.join(...t.path) + '.json';
      writeFileEnsuringDir(path.join(publicTmp, descRel), JSON.stringify(t, null, 2) + '\n');
      stagedPublic.push(descRel);

      const rawMdRel = path.join(...t.path) + '.md';
      writeFileEnsuringDir(path.join(publicTmp, rawMdRel), t.body.endsWith('\n') ? t.body : t.body + '\n');
      stagedPublic.push(rawMdRel);
    }

    writeFileEnsuringDir(path.join(publicTmp, 'index.json'), JSON.stringify(buildManifest(bundle), null, 2) + '\n');
    stagedPublic.push('index.json');

    writeFileEnsuringDir(path.join(publicTmp, 'versions.json'), JSON.stringify(buildVersionsRegistry(bundle, urlPrefix), null, 2) + '\n');
    stagedPublic.push('versions.json');

    writeFileEnsuringDir(path.join(publicTmp, 'llms.txt'), buildHelpLlmsTxt(bundle));
    stagedPublic.push('llms.txt');
  } catch (e) {
    fs.rmSync(docsTmp, { recursive: true, force: true });
    fs.rmSync(publicTmp, { recursive: true, force: true });
    throw err('IOFailed', `staging failed: ${e.message}`);
  }

  // --- Promote staged files into final locations (per-file rename) ---
  fs.mkdirSync(docsHelpDir, { recursive: true });
  fs.mkdirSync(publicHelpDir, { recursive: true });

  for (const rel of stagedDocs) {
    const dest = path.join(docsHelpDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(path.join(docsTmp, rel), dest);
  }
  for (const rel of stagedPublic) {
    const dest = path.join(publicHelpDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(path.join(publicTmp, rel), dest);
  }

  // --- Orphan removal in destination trees ---
  const docsKeep = new Set(stagedDocs.map(p => path.normalize(p)));
  const publicKeep = new Set(stagedPublic.map(p => path.normalize(p)));
  const HAND_AUTHORED_DOCS = new Set(['index.mdx', 'topic-tree.mdx']);

  function removeOrphans(dir, keep, skipTopLevel) {
    function walk(d, baseRel) {
      if (!fs.existsSync(d)) return;
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const rel = baseRel ? path.join(baseRel, entry.name) : entry.name;
        const abs = path.join(d, entry.name);
        if (entry.isDirectory()) {
          walk(abs, rel);
          // Remove now-empty directory.
          if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
        } else {
          if (skipTopLevel && !baseRel && skipTopLevel.has(entry.name)) continue;
          if (!keep.has(path.normalize(rel))) fs.unlinkSync(abs);
        }
      }
    }
    walk(dir, '');
  }
  removeOrphans(docsHelpDir, docsKeep, HAND_AUTHORED_DOCS);
  removeOrphans(publicHelpDir, publicKeep, null);

  // --- Cleanup temp dirs (now empty) ---
  fs.rmSync(docsTmp, { recursive: true, force: true });
  fs.rmSync(publicTmp, { recursive: true, force: true });

  return { topicCount: bundle.topics.length };
```

Delete the now-unused direct-write loop above; ensure there's no duplicate write code.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS for all tests including orphan removal, idempotency, and hand-authored preservation.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-help-pages.js scripts/generate-help-pages.test.js
git commit -m "feat(scripts): atomic per-file writes + orphan removal in help generator

Stages all outputs into side temp dirs, then renames each file into
place. Orphan removal walks destinations after the renames and
unlinks any file not in the new staging set, with hand-authored
index.mdx and topic-tree.mdx explicitly preserved at the docs root.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: `--prefix` flag plumbing (smoke test only; no current call site uses it)

**Files:**
- Modify: `scripts/generate-help-pages.test.js`

The `prefix` parameter is already threaded through `renderPage` and `buildVersionsRegistry`. Add a smoke test confirming it produces under `<prefix>` and that future versioned trees can coexist.

- [ ] **Step 1: Write a smoke test**

```js
test('--prefix=v0.6/ writes under that prefix in URLs and version registry root', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: 'v0.6/',
  });
  // Files still land at the same disk paths — prefix only affects URLs in content.
  assert.ok(fs.existsSync(path.join(docsHelpDir, 'cli.md')));
  // The page links use the prefix.
  const page = fs.readFileSync(path.join(docsHelpDir, 'cli.md'), 'utf8');
  assert.match(page, /\/v0\.6\/help\/cli\.json/);
  // versions.json root reflects the prefix.
  const v = JSON.parse(fs.readFileSync(path.join(publicHelpDir, 'versions.json'), 'utf8'));
  assert.equal(v.versions[0].root, '/v0.6/help/');
  assert.equal(v.versions[0].manifest, '/v0.6/help/index.json');
});
```

Note: in this current-tree-only deployment, the build always invokes the generator with empty prefix, so the on-disk paths under `docsHelpDir`/`publicHelpDir` do NOT include the prefix. When future versioned trees are added (out of scope), the build will invoke the generator a second time with separate `docsHelpDir`/`publicHelpDir` arguments pointing into `v0.6/` subdirs.

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test scripts/generate-help-pages.test.js`

Expected: PASS (the prefix plumbing is already in place from Task 4 and Task 8).

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-help-pages.test.js
git commit -m "test(scripts): smoke-test --prefix= plumbing for future versioned trees

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Stage 3 — Wire the generator into the build pipeline

### Task 13: Update site-level `generate-llms-txt.js` and add `generate:help-pages` npm script

**Files:**
- Modify: `package.json`
- Modify: `scripts/generate-llms-txt.js`
- Modify: `.gitignore`

Insert `generate:help-pages` into the build chain immediately after `fetch:help-index` and before `astro build`. Also update the site-level `llms.txt` generator to advertise the help mirror.

- [ ] **Step 1: Read the current `generate-llms-txt.js`**

Run: `cat scripts/generate-llms-txt.js | head -50`

You'll see how the file emits sections; the addition is straightforward — append a new section block for `## cyoda-go binary help` after the existing content. Include a line with the pinned version read from `.cyoda-cache/cyoda-help-full.json` (degrade gracefully if absent).

- [ ] **Step 2: Add the help section to `generate-llms-txt.js`**

Near the top of the file, add:

```js
function readPinnedVersion() {
  try {
    const p = path.resolve(__dirname, '..', '.cyoda-cache', 'cyoda-help-full.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8')).pinnedVersion ?? null;
  } catch {
    return null;
  }
}
```

(Adjust the import of `__dirname`/`__filename` as the existing file does — match its idiom; if it already has these locals, reuse them.)

Then append a section to the generated `llms.txt` content. Find where the current generator writes its final string (typically a function returning a multi-line template literal) and add to it:

```js
const pinned = readPinnedVersion();
const helpSection = [
  '',
  '## cyoda-go binary help (mirror of CLI `cyoda help` and live HTTP API `/api/help`)',
  '',
  pinned ? `Pinned: cyoda-go v${pinned}` : 'Pinned: (cyoda-go help cache not yet built)',
  '',
  'Manifest:        https://docs.cyoda.net/help/index.json',
  'Per topic:       https://docs.cyoda.net/help/<slug>.json   (full descriptor)',
  '                 https://docs.cyoda.net/help/<slug>.md     (markdown body only)',
  '                 https://docs.cyoda.net/help/<slug>/       (rendered HTML)',
  'Version tree:    https://docs.cyoda.net/help/versions.json',
  '',
  'URL convention:  cyoda help A B C  ↔  /help/A/B/C/  (or .md / .json)',
  '                 Manifest topic IDs use dots (e.g. "config.database");',
  '                 replace dots with slashes to build the URL.',
  '',
].join('\n');
```

Append `helpSection` to the final `llms.txt` content.

- [ ] **Step 3: Add the `generate:help-pages` npm script and insert into the build chain**

In `package.json`, add to `scripts`:

```json
"generate:help-pages": "node scripts/generate-help-pages.js",
```

Modify the `build` script. Current:

```
"build": "npm run fetch:help-index && npm run fetch:openapi && npm run fetch:schemas && npm run generate:schema-pages && astro build && npm run export:markdown && npm run generate:llms && npm run generate:llms-full && npm run generate:md-sitemap && npm run package:schemas",
```

New (insert `generate:help-pages` immediately after `fetch:help-index`):

```
"build": "npm run fetch:help-index && npm run generate:help-pages && npm run fetch:openapi && npm run fetch:schemas && npm run generate:schema-pages && astro build && npm run export:markdown && npm run generate:llms && npm run generate:llms-full && npm run generate:md-sitemap && npm run package:schemas",
```

Also update `predev` so dev iteration works without a fresh build:

Current:
```
"predev": "node scripts/fetch-cyoda-help-index.js --if-missing && node scripts/fetch-cyoda-openapi.js --if-missing && node scripts/fetch-cyoda-schemas.js --if-missing",
```

New:
```
"predev": "node scripts/fetch-cyoda-help-index.js --if-missing && node scripts/generate-help-pages.js && node scripts/fetch-cyoda-openapi.js --if-missing && node scripts/fetch-cyoda-schemas.js --if-missing",
```

(`generate-help-pages.js` is fast and idempotent, so unconditionally running it on `predev` is fine.)

- [ ] **Step 4: Update `.gitignore`**

Edit `.gitignore` and append:

```
# Auto-generated cyoda-go help mirror (regenerated each build).
# Two hand-authored files at the root are tracked exceptions.
src/content/docs/help/**/*.md
src/content/docs/help/**/*.mdx
!src/content/docs/help/index.mdx
!src/content/docs/help/topic-tree.mdx

public/help/
```

(`.cyoda-cache/` is already ignored, so the new `cyoda-help-full.json` cached there is covered.)

- [ ] **Step 5: Verify the build runs end-to-end**

Run: `npm run build`

Expected: exits 0. Verify these files exist after build:

```bash
ls dist/help/index.json dist/help/versions.json dist/help/llms.txt
ls dist/help/cli/index.html
ls dist/help/cli.json dist/help/cli.md
```

(All five `ls` invocations should succeed.)

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/generate-llms-txt.js .gitignore
git commit -m "build: wire generate-help-pages into build chain + advertise in llms.txt

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Stage 4 — Hand-authored pages and sidebar

### Task 14: Move `cyoda-help.mdx` → `topic-tree.mdx` with link rewrites and add redirect

**Files:**
- Remove: `src/content/docs/reference/cyoda-help.mdx`
- Create: `src/content/docs/help/topic-tree.mdx`
- Modify: `astro.config.mjs`

Relocate the existing navigator and rewrite its tree entries to link into the new rendered help pages. Add a redirect from the old URL.

- [ ] **Step 1: Move the file**

Run:

```bash
git mv src/content/docs/reference/cyoda-help.mdx src/content/docs/help/topic-tree.mdx
```

(If the destination dir isn't tracked yet because of the `.gitignore` rule, the negative-pattern exception added in Task 13 means `topic-tree.mdx` will still be allowed.)

- [ ] **Step 2: Rewrite the relocated file**

Replace the content of `src/content/docs/help/topic-tree.mdx` with:

```mdx
---
title: "Topic tree (`cyoda help`)"
description: "Every flag, env var, endpoint, error, metric, and operation — browsable from the binary. This page is a navigator over the full topic tree, with links into the rendered mirror."
sidebar:
  order: 1
---

import helpIndex from '../../../data/cyoda-help-index.json';

export const byTopLevel = (() => {
  const groups = new Map();
  for (const t of helpIndex.topics) {
    const top = t.path[0];
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top).push(t);
  }
  return Array.from(groups.entries()).map(([top, topics]) => {
    topics.sort((a, b) => a.path.join('/').localeCompare(b.path.join('/')));
    return { top, topics };
  });
})();

The cyoda binary is self-documenting. Every flag, environment variable,
endpoint, error code, metric, header, and operation is described by a
**help topic** that ships with the binary. Topics are structured; many
subdivide into drilldowns. The tree is stable across patch releases and
evolves with minor releases.

For each topic listed below, the rendered mirror under
[`/help/`](/help/) carries the same content the binary's `cyoda help`
prints (pinned to v{helpIndex.pinnedVersion}). The binary you run is
the authority for the version you run.

## How to use it

```bash
cyoda help                          # browse the whole tree
cyoda help <topic>                  # read one topic (e.g. `cyoda help search`)
cyoda help <topic> <subtopic>       # drill down (e.g. `cyoda help search async`)
cyoda help <topic> --format=json    # machine-readable
cyoda help <topic> --format=markdown # default off-TTY — paste into docs, PRs, chat
```

## The tree

<dl class="cyoda-help-tree">
  {byTopLevel.map(({ top, topics }) => {
    const topUrl = `/help/${top}/`;
    const topTopic = topics.find(t => t.path.length === 1);
    return (
      <>
        <dt><a href={topUrl}><code>cyoda help {top}</code></a></dt>
        <dd>
          <p>{topTopic?.synopsis ?? ''}</p>
          {topics.filter(t => t.path.length > 1).length > 0 && (
            <ul>
              {topics.filter(t => t.path.length > 1).map(t => {
                const url = `/help/${t.path.join('/')}/`;
                return (
                  <li>
                    <a href={url}><code>cyoda help {t.path.join(' ')}</code></a> — {t.synopsis}
                  </li>
                );
              })}
            </ul>
          )}
        </dd>
      </>
    );
  })}
</dl>

<style>{`
  .cyoda-help-tree dt {
    margin-top: 1.2rem;
    font-weight: 600;
  }
  .cyoda-help-tree dd {
    margin-left: 1.5rem;
    margin-top: 0.25rem;
  }
  .cyoda-help-tree dd p {
    margin: 0 0 0.4rem 0;
  }
  .cyoda-help-tree dd ul {
    margin: 0.25rem 0 0 0;
    padding-left: 1.2rem;
  }
  .cyoda-help-tree dd li {
    margin-block: 0.15rem;
  }
  .cyoda-help-tree dd code {
    font-size: 0.9em;
  }
`}</style>
```

- [ ] **Step 3: Add the redirect in `astro.config.mjs`**

Find the existing `redirects` block and add:

```js
'/reference/cyoda-help/': '/help/topic-tree/',
```

- [ ] **Step 4: Verify the page renders**

Run: `npm run dev`

Open http://localhost:4321/help/topic-tree/ in a browser. Expected: page renders with each topic invocation as a link to `/help/<slug>/`. Visit http://localhost:4321/reference/cyoda-help/ — expected: redirects to `/help/topic-tree/`.

Stop the dev server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs src/content/docs/help/topic-tree.mdx src/content/docs/reference/
git commit -m "docs: relocate cyoda-help navigator to /help/topic-tree/

Tree entries now link into the new /help/<slug>/ rendered mirror.
Redirect /reference/cyoda-help/ → /help/topic-tree/ keeps existing
inbound links working.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Create `src/content/docs/help/index.mdx` landing page

**Files:**
- Create: `src/content/docs/help/index.mdx`

Hand-authored entry point: prose introduction, top-level topic cards, and an explicit "For agents" subsection listing the four primitive URLs.

- [ ] **Step 1: Create the file**

`src/content/docs/help/index.mdx`:

```mdx
---
title: Help — browse rendered cyoda-go help
description: "Static mirror of cyoda-go's `cyoda help` and live HTTP help API, optimized for both humans and AI agents. Pinned to a specific cyoda-go release."
sidebar:
  order: 2
---

import { CardGrid, Card, Badge } from '@astrojs/starlight/components';
import helpIndex from '../../../data/cyoda-help-index.json';

export const topLevelTopics = helpIndex.topics
  .filter(t => t.path.length === 1)
  .sort((a, b) => a.path[0].localeCompare(b.path[0]));

This section is a static mirror of the cyoda-go binary's help surface
— both the CLI (`cyoda help …`) and the live HTTP API
(`{CYODA_CONTEXT_PATH}/help`, default `/api/help`). It exists for
readers who don't have a local cyoda-go runtime installed and for AI
agents that need to discover and consume cyoda-go's structured help
without running the binary.

The pages under `/help/` are pinned to **cyoda-go v{helpIndex.pinnedVersion}**.
The binary you run is the authority for the version you run; if your
binary is newer, prefer its output. Bumping `cyoda-go-version.json`
re-pulls and regenerates the entire mirror.

## Browse the tree

<CardGrid>
  {topLevelTopics.map(t => (
    <Card title={t.path[0]} icon="document">
      <p><strong>{t.title}</strong></p>
      <p>{t.synopsis}</p>
      <p><a href={`/help/${t.path[0]}/`}>Read →</a></p>
    </Card>
  ))}
</CardGrid>

For a flat view of every topic and subtopic, see
[Topic tree (`cyoda help`)](/help/topic-tree/).

## For agents

Agents navigate the mirror via three primitives plus a discovery file:

- [`/help/index.json`](/help/index.json) — manifest of every topic
  with `topic`, `title`, `stability`, `tagline`, `see_also`. The
  envelope is byte-equivalent to the live API's `GET /help` response.
- `/help/<slug>.json` — full topic descriptor including `body`,
  `sections[]`, `see_also`, `stability`, `actions`, `children`. Same
  shape as the live API's `GET /help/{topic}` response.
- `/help/<slug>.md` — body only, no frontmatter, no chrome.
- [`/help/versions.json`](/help/versions.json) — version registry.

Discovery hint: [`/help/llms.txt`](/help/llms.txt) and the site-level
[`/llms.txt`](/llms.txt) both advertise these endpoints and the URL
convention.

### URL convention

`cyoda help A B C` ↔ `https://docs.cyoda.net/help/A/B/C/` for the
rendered page, or `.md`/`.json` for the raw payloads. Manifest topic
IDs use the live API's dotted form (`config.database`); replace dots
with slashes to build the URL.

## Conventions

- Pinned, not live: this mirror reflects cyoda-go v{helpIndex.pinnedVersion}
  as captured by the docs build. Always check the binary you run for
  authoritative output on its version.
- No authentication: both these pages and the live binary's help
  endpoints (`/api/help`, `/api/help/{topic}`) require no auth.
- Divergence from the live API: prefix is `/help/` here vs
  `/api/help/` on the binary; URL form uses slashes here vs dots on
  the binary. JSON envelope shapes match.
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev`

Open http://localhost:4321/help/ — expected: landing page with cards for each top-level topic, "For agents" subsection with working links to `/help/index.json` and `/help/versions.json`.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/help/index.mdx
git commit -m "docs: add /help/ landing page for browse + agent discovery

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Add Help section to sidebar (between Cyoda Cloud and Reference)

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Edit the sidebar block**

In `astro.config.mjs`, find the `sidebar:` array (currently has Getting Started, Concepts, Build, Run, Cyoda Cloud, Reference). Insert a new entry between `Cyoda Cloud` and `Reference`:

```js
{
  label: 'Cyoda Cloud',
  collapsed: true,
  autogenerate: { directory: 'cyoda-cloud' }
},
{
  label: 'Help',
  collapsed: true,
  items: [
    { label: 'Topic tree (`cyoda help`)', link: '/help/topic-tree/' },
    { label: 'Browse rendered help', link: '/help/' },
  ],
},
{
  label: 'Reference',
  collapsed: true,
  autogenerate: { directory: 'reference' }
},
```

- [ ] **Step 2: Verify the sidebar shows the new section**

Run: `npm run dev`

Open any docs page. Expected: sidebar shows "Help" between "Cyoda Cloud" and "Reference", expandable into "Topic tree (`cyoda help`)" and "Browse rendered help". Each link works.

Per-topic pages (e.g. `/help/cli/`) should NOT appear in the sidebar.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "docs(sidebar): add Help section between Cyoda Cloud and Reference

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: Update `CLAUDE.md` build-pipeline section against `package.json`

**Files:**
- Modify: `CLAUDE.md`

The current build-pipeline list in `CLAUDE.md` has drifted (it lists fewer steps than the actual `package.json` build script). Rewrite it as part of this work.

- [ ] **Step 1: Read both sources**

Run: `grep -A5 '"build"' package.json` and `grep -A30 'Build pipeline' CLAUDE.md` and reconcile.

- [ ] **Step 2: Rewrite the build-pipeline section in `CLAUDE.md`**

Replace the existing `### Build pipeline (npm run build)` block with one that mirrors `package.json` step-for-step, in this order:

1. `fetch:help-index` (`scripts/fetch-cyoda-help-index.js`) — pulls cyoda-go help bundle, writes slim index to `src/data/cyoda-help-index.json` and full bundle to `.cyoda-cache/cyoda-help-full.json`.
2. `generate:help-pages` (`scripts/generate-help-pages.js`) — emits per-topic Starlight pages and `public/help/` artefacts from the cached full bundle.
3. `fetch:openapi` (`scripts/fetch-cyoda-openapi.js`) — fetches the OpenAPI spec.
4. `fetch:schemas` (`scripts/fetch-cyoda-schemas.js`) — fetches JSON schemas.
5. `generate:schema-pages` (`scripts/generate-schema-pages.js`) — emits schema viewer MDX pages.
6. `astro build` — produces `dist/`.
7. `export:markdown` (`scripts/export-markdown.js`) — markdown export of pages.
8. `generate:llms` (`scripts/generate-llms-txt.js`) — writes `dist/llms.txt`.
9. `generate:llms-full` (`scripts/generate-llms-full.js`) — writes the longer LLM-consumer artefact.
10. `generate:md-sitemap` (`scripts/generate-markdown-sitemap.js`).
11. `package:schemas` (`scripts/package-schemas.js`) — produces `dist/schemas.zip`.

Add to the "auto-generated" section:

```markdown
- `src/content/docs/help/<seg>/.../<leaf>.md` and everything under
  `public/help/` are auto-generated by `scripts/generate-help-pages.js`
  from the pinned cyoda-go release. The two files at the root of
  `src/content/docs/help/` (`index.mdx` and `topic-tree.mdx`) are
  hand-authored exceptions and are tracked.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): rewrite build-pipeline section against package.json

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Stage 5 — End-to-end validation

### Task 18: Playwright spec for the rendered surface

**Files:**
- Create: `tests/help-mirror.spec.ts`

End-to-end checks against a built `dist/`. Playwright already runs over the built site in this repo; follow the existing spec style (e.g. `tests/cookie-consent-test.spec.ts`).

- [ ] **Step 1: Read an existing spec to match style**

Run: `head -50 tests/cookie-consent-test.spec.ts`

Match its imports, fixtures, and `test.describe` style.

- [ ] **Step 2: Create the spec**

`tests/help-mirror.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('static help mirror', () => {
  test('landing page lists top-level topics and links to manifest', async ({ page }) => {
    await page.goto('/help/');
    await expect(page).toHaveTitle(/Help/);
    await expect(page.getByText(/cyoda-go v\d/)).toBeVisible();
    await expect(page.getByRole('link', { name: '/help/index.json' })).toHaveAttribute('href', /\/help\/index\.json$/);
    await expect(page.getByRole('link', { name: '/help/versions.json' })).toHaveAttribute('href', /\/help\/versions\.json$/);
  });

  test('topic tree page links into rendered mirror', async ({ page }) => {
    await page.goto('/help/topic-tree/');
    // At least one topic invocation appears as a link to /help/<top>/.
    const link = page.locator('a[href^="/help/"]').first();
    await expect(link).toBeVisible();
  });

  test('per-topic page renders body, canonical-reference aside, raw-format links', async ({ page }) => {
    await page.goto('/help/cli/');
    await expect(page.getByText(/Canonical reference/)).toBeVisible();
    await expect(page.getByText(/cyoda help cli/)).toBeVisible();
    await expect(page.getByRole('link', { name: '/help/cli.json' })).toBeVisible();
    await expect(page.getByRole('link', { name: '/help/cli.md' })).toBeVisible();
  });

  test('manifest endpoint returns valid JSON with live-API envelope', async ({ request }) => {
    const resp = await request.get('/help/index.json');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.schema).toBe(1);
    expect(typeof body.version).toBe('string');
    expect(Array.isArray(body.topics)).toBe(true);
    expect(body.topics.length).toBeGreaterThan(0);
    for (const t of body.topics) {
      expect(typeof t.topic).toBe('string');
      expect(typeof t.title).toBe('string');
      expect(typeof t.tagline).toBe('string');
      expect(Array.isArray(t.see_also)).toBe(true);
      expect('body' in t).toBe(false);
    }
  });

  test('per-topic JSON descriptor returns full body and sections', async ({ request }) => {
    const resp = await request.get('/help/cli.json');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.topic).toBe('cli');
    expect(body.path).toEqual(['cli']);
    expect(typeof body.body).toBe('string');
    expect(body.body.length).toBeGreaterThan(0);
    expect(Array.isArray(body.sections)).toBe(true);
  });

  test('per-topic raw markdown returns body without frontmatter', async ({ request }) => {
    const resp = await request.get('/help/cli.md');
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expect(text.startsWith('---')).toBe(false);
    expect(text).toContain('cli');
  });

  test('asset and Starlight page coexist at distinct URLs', async ({ request }) => {
    const asset = await request.get('/help/cli.md');
    expect(asset.status()).toBe(200);
    expect((await asset.text()).startsWith('---')).toBe(false);

    const pageResp = await request.get('/help/cli/');
    expect(pageResp.status()).toBe(200);
    expect(await pageResp.text()).toContain('<html');
  });

  test('versions.json returns the registry', async ({ request }) => {
    const resp = await request.get('/help/versions.json');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(typeof body.current).toBe('string');
    expect(Array.isArray(body.versions)).toBe(true);
    expect(body.versions[0].current).toBe(true);
  });

  test('legacy /reference/cyoda-help/ redirects to /help/topic-tree/', async ({ page }) => {
    await page.goto('/reference/cyoda-help/');
    await expect(page).toHaveURL(/\/help\/topic-tree\/?$/);
  });
});
```

- [ ] **Step 3: Run the full test suite**

Run: `GA_MEASUREMENT_ID=G-test npm test`

Expected: PASS (all script tests + Playwright suite, including the new spec).

If any Playwright assertion fails because of selector specificity (e.g. multiple links match `/help/index.json`), tighten the selectors using `getByRole('link', { name: /^\/help\/index\.json$/ }).first()` or similar.

- [ ] **Step 4: Commit**

```bash
git add tests/help-mirror.spec.ts
git commit -m "test(e2e): Playwright spec for static help mirror at /help/

Covers: landing page, topic-tree page, per-topic rendered page,
manifest, per-topic JSON descriptor, per-topic raw markdown,
asset/page coexistence, versions.json, legacy redirect.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: Final smoke test and PR-readiness check

**Files:** none (verification only)

- [ ] **Step 1: Clean build from scratch**

Run:

```bash
rm -rf dist .cyoda-cache src/content/docs/help/cli.md src/content/docs/help/cli/
npm run build
```

Expected: exits 0. The two hand-authored files (`index.mdx`, `topic-tree.mdx`) survive the build (they're not in `.cyoda-cache` and not regenerated).

- [ ] **Step 2: Confirm artefacts**

Run:

```bash
ls dist/help/index.json dist/help/versions.json dist/help/llms.txt
ls dist/help/cli/index.html dist/help/cli.json dist/help/cli.md
ls dist/help/topic-tree/index.html dist/help/index.html
test -f dist/llms.txt && grep -q 'cyoda-go binary help' dist/llms.txt && echo OK
```

Expected: all files exist; the `grep` prints `OK`.

- [ ] **Step 3: Manual smoke check**

Run: `npx serve dist -l 4321`

Open in a browser:
- http://localhost:4321/help/ — landing page with cards.
- http://localhost:4321/help/cli/ — rendered CLI topic with canonical-reference aside, body, and raw-format links.
- http://localhost:4321/help/cli.md — raw markdown served as text.
- http://localhost:4321/help/cli.json — full descriptor JSON.
- http://localhost:4321/help/index.json — manifest.
- http://localhost:4321/help/versions.json — version registry.
- http://localhost:4321/help/topic-tree/ — relocated navigator.
- http://localhost:4321/reference/cyoda-help/ — redirects to `/help/topic-tree/`.

Stop the static server (Ctrl-C).

- [ ] **Step 4: Verify gitignore is doing what we want**

Run:

```bash
git status
git ls-files src/content/docs/help/
```

Expected: only `index.mdx` and `topic-tree.mdx` are tracked under `src/content/docs/help/`. `git status` shows no per-topic generated `.md` files in the staging area.

- [ ] **Step 5: Final test run**

Run: `GA_MEASUREMENT_ID=G-test npm test`

Expected: PASS.

- [ ] **Step 6: Confirm no spec follow-ups slipped in**

Run: `git log --oneline main..HEAD`

Expected: roughly 17–19 commits, each scoped to a single task. Out-of-scope items from the spec ("Out of scope" list) are not implemented anywhere.

If everything is green, the branch is PR-ready.

---

## Self-review checklist (run before declaring the plan complete)

Spec coverage check — every "In scope" item from the spec has at least one task that implements it:

- [x] Static `/help/...` URL space generated at build time → Tasks 4–9, 11–13.
- [x] Per-topic Starlight pages → Task 4.
- [x] Per-topic raw payloads `.md` and `.json` → Tasks 5–6.
- [x] Manifest at `/help/index.json` → Task 7.
- [x] Version registry at `/help/versions.json` → Task 8.
- [x] Top-level "Help" sidebar section → Task 16.
- [x] Relocation of `/reference/cyoda-help/` with redirect → Task 14.
- [x] `llms.txt` advertisement + `/help/llms.txt` companion → Tasks 9, 13.
- [x] Reserved-segment guard, slug-conflict guard, topic invariant → Task 3.
- [x] Atomic per-file writes + orphan removal + hand-authored preservation → Task 11.
- [x] Body-with-literals round-trip → Task 10.
- [x] `--prefix=` plumbing for future versioning → Task 12.
- [x] CLAUDE.md updated → Task 17.
- [x] Playwright e2e for the rendered surface → Task 18.

Out-of-scope items the plan does NOT touch (matches spec): version-switcher UI, MCP reference server, `<FromTheBinary>` extension, dotted-URL inbound rewrites, version-diff/changelog rendering.
