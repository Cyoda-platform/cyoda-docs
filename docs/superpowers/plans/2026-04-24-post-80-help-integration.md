# Post-#80 help integration (Phase A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a build-pipeline step that fetches the `cyoda help` surface for a pinned cyoda-go release, use it as a build-time QA index, and reframe the three `awaiting-upstream` reference stubs (`cli`, `configuration`, `helm`) as navigator pages that point at `cyoda help <topic>` rather than mirroring its content.

**Architecture:** A new Node-ESM script (`scripts/fetch-cyoda-help-index.js`) reads a single-line pin file (`cyoda-go-version.json`), fetches `cyoda_help_<v>.json` + `SHA256SUMS` from GitHub Releases, verifies the checksum, strips every topic's `body`, sorts by path, and writes `src/data/cyoda-help-index.json` (gitignored). A small Astro component (`src/components/FromTheBinary.astro`) imports that index at build time and throws if its `topic` prop doesn't resolve. The three navigator pages import the same index, filter to their topic prefix, and render title+synopsis cards. The binary remains canonical; the website quotes no help bodies.

**Tech Stack:** Node 22 (`"type": "module"`), Astro 6 + Starlight 0.38, Playwright 1.55 for smoke tests, `node:test` for unit and build-integration tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-24-post-80-help-integration-design.md`

**Branch:** `docs/post-80-pickup-handoff` in `.worktrees/pivot`. Phase A commits land here; the branch eventually merges into `feature/cyoda-go-init` (PR #76) before PR #76 goes to `main`.

---

## File structure

**New files:**
- `cyoda-go-version.json` — repo-root pin (tracked)
- `scripts/fetch-cyoda-help-index.js` — fetcher CLI
- `scripts/fetch-cyoda-help-index.test.js` — unit tests for the fetcher
- `src/data/` — directory (empty placeholder with `.gitkeep`)
- `src/data/cyoda-help-index.json` — emitted by fetcher, **gitignored**
- `src/components/FromTheBinary.astro` — callout component
- `tests/fixtures/help/help.valid.json`
- `tests/fixtures/help/help.malformed.json`
- `tests/fixtures/help/SHA256SUMS.valid`
- `tests/fixtures/help/SHA256SUMS.wrong`
- `tests/fixtures/help/SHA256SUMS.missing-entry`
- `tests/build-help-integration.test.js` — spawns `astro build` to verify dangling-topic failure
- `tests/navigator-pages.spec.ts` — Playwright smoke

**Modified files:**
- `.gitignore` — add `src/data/cyoda-help-index.json`
- `package.json` — add `fetch:help-index`, `predev`, `test:scripts`; extend `build`; extend `test`
- `src/components/VendoredBanner.astro` — drop `awaiting-upstream` branch + `issue` prop + stylesheet rule
- `src/content/docs/reference/cli.mdx` — reframe as navigator
- `src/content/docs/reference/configuration.mdx` — reframe as navigator
- `src/content/docs/reference/helm.mdx` — reframe as navigator
- `CLAUDE.md` — document step 1a

---

## Task 1: Add version pin file and gitignore entry

**Files:**
- Create: `cyoda-go-version.json`
- Create: `src/data/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Create the pin file**

Write `cyoda-go-version.json` at repo root:

```json
{
  "version": "0.6.1"
}
```

- [ ] **Step 2: Create `src/data/` as a tracked directory**

```bash
mkdir -p src/data
touch src/data/.gitkeep
```

- [ ] **Step 3: Add gitignore entry**

Append to `.gitignore`:

```
# Auto-generated at build time by scripts/fetch-cyoda-help-index.js
src/data/cyoda-help-index.json
```

Place it next to the existing `Materialised from vendored/schemas/` block so related patterns cluster.

- [ ] **Step 4: Verify `.gitkeep` is tracked but index is ignored**

Run: `git check-ignore src/data/cyoda-help-index.json && ! git check-ignore src/data/.gitkeep && echo OK`
Expected: prints `src/data/cyoda-help-index.json` then `OK`.

- [ ] **Step 5: Commit**

```bash
git add cyoda-go-version.json src/data/.gitkeep .gitignore
git commit -m "chore: pin cyoda-go version and reserve src/data/ for build artefacts"
```

---

## Task 2: TDD the fetch script end-to-end

This task follows TDD discipline but batches fixtures + tests + implementation into one commit to avoid an intermediate state where tests exist without the script. The test file and implementation file are committed together.

**Files:**
- Create: `tests/fixtures/help/help.valid.json`
- Create: `tests/fixtures/help/help.malformed.json`
- Create: `tests/fixtures/help/SHA256SUMS.valid`
- Create: `tests/fixtures/help/SHA256SUMS.wrong`
- Create: `tests/fixtures/help/SHA256SUMS.missing-entry`
- Create: `scripts/fetch-cyoda-help-index.test.js`
- Create: `scripts/fetch-cyoda-help-index.js`
- Modify: `package.json` (add `test:scripts`; temporary — wired more fully in Task 3)

- [ ] **Step 1: Create fixture `help.valid.json`**

Minimal but realistic. Three topics, one with a two-segment path to exercise drilldown handling. Note we write the *unsorted* order intentionally so the sort assertion has something to prove.

```json
{
  "schema": 1,
  "version": "test-fixture",
  "topics": [
    {
      "topic": "search",
      "path": ["search"],
      "title": "search — entity search API",
      "synopsis": "Query entities by predicate.",
      "body": "# search\n\nThis body will be stripped.\n"
    },
    {
      "topic": "async",
      "path": ["search", "async"],
      "title": "search async — asynchronous snapshot search",
      "synopsis": "Queued, unbounded, paged.",
      "body": "# search async\n\nAlso stripped.\n"
    },
    {
      "topic": "cli",
      "path": ["cli"],
      "title": "cli — the cyoda command-line interface",
      "synopsis": "Subcommands and global flags.",
      "body": "# cli\n\nStripped too.\n"
    }
  ]
}
```

- [ ] **Step 2: Create fixture `help.malformed.json`**

```json
{ "schema": 1, "version": "test-fixture" }
```

(Missing the `topics` array.)

- [ ] **Step 3: Compute the valid fixture's sha256**

Run: `sha256sum tests/fixtures/help/help.valid.json | cut -d' ' -f1`

Copy the printed hex digest; call it `<VALID_SHA>` for the next step.

- [ ] **Step 4: Create fixture `SHA256SUMS.valid`**

Write `tests/fixtures/help/SHA256SUMS.valid` with one line, substituting `<VALID_SHA>`:

```
<VALID_SHA>  cyoda_help_test.json
```

(Trailing newline required. Two spaces between digest and filename — matches GNU coreutils format, which is what `goreleaser` emits.)

- [ ] **Step 5: Create fixture `SHA256SUMS.wrong`**

```
0000000000000000000000000000000000000000000000000000000000000000  cyoda_help_test.json
```

- [ ] **Step 6: Create fixture `SHA256SUMS.missing-entry`**

```
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  some_other_asset.tar.gz
```

- [ ] **Step 7: Write `scripts/fetch-cyoda-help-index.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { run } from './fetch-cyoda-help-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(__dirname, '..', 'tests', 'fixtures', 'help');

function tmpVersionFile(version) {
  const file = path.join(os.tmpdir(), `cyoda-go-version-${Date.now()}-${Math.random()}.json`);
  if (version !== undefined) fs.writeFileSync(file, JSON.stringify({ version }));
  return file;
}

function tmpOutputFile() {
  return path.join(os.tmpdir(), `help-index-${Date.now()}-${Math.random()}.json`);
}

function makeFetch(responses) {
  // responses: { [url]: { status, text, throw? } }
  return async (url) => {
    const r = responses[url];
    if (!r) throw new Error(`unexpected fetch: ${url}`);
    if (r.throw) throw r.throw;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => r.text,
    };
  };
}

const JSON_URL = 'https://github.com/Cyoda-platform/cyoda-go/releases/download/vtest/cyoda_help_test.json';
const SUMS_URL = 'https://github.com/Cyoda-platform/cyoda-go/releases/download/vtest/SHA256SUMS';

const validJson = fs.readFileSync(path.join(fixtureDir, 'help.valid.json'), 'utf8');
const malformedJson = fs.readFileSync(path.join(fixtureDir, 'help.malformed.json'), 'utf8');
const sumsValid = fs.readFileSync(path.join(fixtureDir, 'SHA256SUMS.valid'), 'utf8');
const sumsWrong = fs.readFileSync(path.join(fixtureDir, 'SHA256SUMS.wrong'), 'utf8');
const sumsMissing = fs.readFileSync(path.join(fixtureDir, 'SHA256SUMS.missing-entry'), 'utf8');

test('happy path: writes sorted, body-stripped index', async () => {
  const versionFile = tmpVersionFile('test');
  const outputFile = tmpOutputFile();
  await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: validJson },
      [SUMS_URL]: { status: 200, text: sumsValid },
    }),
    versionFilePath: versionFile,
    outputPath: outputFile,
  });
  const out = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
  assert.equal(out.pinnedVersion, 'test');
  assert.equal(out.schema, 1);
  assert.ok(out.generatedAt);
  assert.equal(out.topics.length, 3);
  // sort order: by path.join('/') ascending
  assert.deepEqual(out.topics.map(t => t.path.join('/')), ['cli', 'search', 'search/async']);
  // no body field
  for (const t of out.topics) {
    assert.ok(!('body' in t), `topic ${t.path.join('/')} still has body`);
    assert.ok(t.title);
    assert.ok(t.synopsis);
  }
  fs.rmSync(versionFile);
  fs.rmSync(outputFile);
});

test('InvalidVersionPin: missing pin file', async () => {
  const err = await run({
    fetch: makeFetch({}),
    versionFilePath: '/nonexistent/cyoda-go-version.json',
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.ok(err instanceof Error);
  assert.match(err.message, /InvalidVersionPin/);
});

test('InvalidVersionPin: malformed pin file', async () => {
  const versionFile = path.join(os.tmpdir(), `pin-bad-${Date.now()}.json`);
  fs.writeFileSync(versionFile, '{ not json }');
  const err = await run({
    fetch: makeFetch({}),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /InvalidVersionPin/);
  fs.rmSync(versionFile);
});

test('FetchFailed: network error on help asset', async () => {
  const versionFile = tmpVersionFile('test');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { throw: new Error('ECONNREFUSED') },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /FetchFailed/);
  fs.rmSync(versionFile);
});

test('ReleaseNotFound: 404 on help asset', async () => {
  const versionFile = tmpVersionFile('test');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 404, text: 'Not Found' },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /ReleaseNotFound/);
  fs.rmSync(versionFile);
});

test('IntegrityManifestMissing: 404 on SHA256SUMS', async () => {
  const versionFile = tmpVersionFile('test');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: validJson },
      [SUMS_URL]: { status: 404, text: 'Not Found' },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /IntegrityManifestMissing/);
  fs.rmSync(versionFile);
});

test('IntegrityManifestIncomplete: SHA256SUMS lacks the filename', async () => {
  const versionFile = tmpVersionFile('test');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: validJson },
      [SUMS_URL]: { status: 200, text: sumsMissing },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /IntegrityManifestIncomplete/);
  fs.rmSync(versionFile);
});

test('IntegrityCheckFailed: wrong checksum', async () => {
  const versionFile = tmpVersionFile('test');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: validJson },
      [SUMS_URL]: { status: 200, text: sumsWrong },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /IntegrityCheckFailed/);
  fs.rmSync(versionFile);
});

test('HelpJsonMalformed: missing topics array', async () => {
  const versionFile = tmpVersionFile('test');
  // checksum must validate, so regenerate SHA256SUMS line for the malformed fixture
  const { createHash } = await import('node:crypto');
  const sha = createHash('sha256').update(malformedJson).digest('hex');
  const err = await run({
    fetch: makeFetch({
      [JSON_URL]: { status: 200, text: malformedJson },
      [SUMS_URL]: { status: 200, text: `${sha}  cyoda_help_test.json\n` },
    }),
    versionFilePath: versionFile,
    outputPath: tmpOutputFile(),
  }).catch(e => e);
  assert.match(err.message, /HelpJsonMalformed/);
  fs.rmSync(versionFile);
});

test('--if-missing: short-circuits when output exists', async () => {
  const versionFile = tmpVersionFile('test');
  const outputFile = tmpOutputFile();
  fs.writeFileSync(outputFile, '{"pinnedVersion":"already-here","topics":[]}');
  let fetchCalled = false;
  await run({
    fetch: async () => { fetchCalled = true; throw new Error('should not be called'); },
    versionFilePath: versionFile,
    outputPath: outputFile,
    ifMissing: true,
  });
  assert.equal(fetchCalled, false);
  // File left untouched
  assert.equal(JSON.parse(fs.readFileSync(outputFile, 'utf8')).pinnedVersion, 'already-here');
  fs.rmSync(versionFile);
  fs.rmSync(outputFile);
});
```

- [ ] **Step 8: Write `scripts/fetch-cyoda-help-index.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSET_BASENAME = (version) => `cyoda_help_${version}.json`;
const JSON_URL = (version) =>
  `https://github.com/Cyoda-platform/cyoda-go/releases/download/v${version}/${ASSET_BASENAME(version)}`;
const SUMS_URL = (version) =>
  `https://github.com/Cyoda-platform/cyoda-go/releases/download/v${version}/SHA256SUMS`;

function err(cls, message) {
  return new Error(`${cls}: ${message}`);
}

function parsePinFile(versionFilePath) {
  let raw;
  try {
    raw = fs.readFileSync(versionFilePath, 'utf8');
  } catch (cause) {
    throw err('InvalidVersionPin', `cannot read ${versionFilePath}: ${cause.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw err('InvalidVersionPin', `not valid JSON: ${cause.message}. Expected { "version": "<semver>" }.`);
  }
  if (!parsed || typeof parsed.version !== 'string' || !parsed.version) {
    throw err('InvalidVersionPin', `missing string "version". Expected { "version": "<semver>" }.`);
  }
  return parsed.version;
}

async function fetchOrThrow(fetchFn, url, integrityClass) {
  let resp;
  try {
    resp = await fetchFn(url);
  } catch (cause) {
    throw err('FetchFailed', `${url}: ${cause.message}. Help-index step requires network access; offline builds are not supported.`);
  }
  if (!resp.ok) {
    throw err(integrityClass, `HTTP ${resp.status} on ${url}. Check cyoda-go-version.json: does the tagged release exist and include the expected asset?`);
  }
  return await resp.text();
}

function findChecksum(sumsText, filename) {
  for (const line of sumsText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && parts[parts.length - 1] === filename) {
      return parts[0];
    }
  }
  return null;
}

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

function stripAndSort(helpJson) {
  if (!helpJson || !Array.isArray(helpJson.topics)) {
    throw err('HelpJsonMalformed', `expected { schema, version, topics: [...] }; got ${JSON.stringify(Object.keys(helpJson || {}))}`);
  }
  const stripped = helpJson.topics.map((t) => {
    if (!t || typeof t !== 'object' || !Array.isArray(t.path) || typeof t.title !== 'string') {
      throw err('HelpJsonMalformed', `topic entry missing required fields path/title: ${JSON.stringify(t)}`);
    }
    return {
      topic: t.topic ?? t.path[t.path.length - 1],
      path: t.path,
      title: t.title,
      synopsis: t.synopsis ?? '',
    };
  });
  stripped.sort((a, b) => {
    const aKey = a.path.join('/');
    const bKey = b.path.join('/');
    return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
  });
  return stripped;
}

/**
 * Main fetcher entry point.
 * @param {object} opts
 * @param {typeof globalThis.fetch} opts.fetch
 * @param {string} opts.versionFilePath
 * @param {string} opts.outputPath
 * @param {boolean} [opts.ifMissing] - when true, no-op if outputPath exists
 */
export async function run({ fetch, versionFilePath, outputPath, ifMissing }) {
  if (ifMissing && fs.existsSync(outputPath)) {
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

  const index = {
    pinnedVersion: version,
    schema: helpJson.schema ?? 1,
    generatedAt: new Date().toISOString(),
    topics,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2) + '\n');
  console.log(`   wrote ${outputPath} (${topics.length} topics, bodies stripped)`);
}

// CLI entry point
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (invokedDirectly) {
  const projectRoot = path.resolve(__dirname, '..');
  const versionFilePath = path.join(projectRoot, 'cyoda-go-version.json');
  const outputPath = path.join(projectRoot, 'src', 'data', 'cyoda-help-index.json');
  const ifMissing = process.argv.includes('--if-missing');
  try {
    await run({ fetch: globalThis.fetch, versionFilePath, outputPath, ifMissing });
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 9: Add `test:scripts` npm script**

In `package.json` `"scripts"` block, add:

```json
    "test:scripts": "node --test scripts/*.test.js",
```

(Place alphabetically near other `test:*` entries.)

- [ ] **Step 10: Run the unit tests**

Run: `npm run test:scripts`
Expected: 10 tests pass (happy path + 2 `InvalidVersionPin` cases + `FetchFailed` + `ReleaseNotFound` + `IntegrityManifestMissing` + `IntegrityManifestIncomplete` + `IntegrityCheckFailed` + `HelpJsonMalformed` + `--if-missing`).

If any test fails, fix the implementation (not the test) until all pass.

- [ ] **Step 11: Commit**

```bash
git add cyoda-go-version.json src/data/.gitkeep .gitignore \
        scripts/fetch-cyoda-help-index.js scripts/fetch-cyoda-help-index.test.js \
        tests/fixtures/help/ package.json
git commit -m "feat(build): fetch cyoda-go help index, verify, and emit gitignored data/ artefact

Adds scripts/fetch-cyoda-help-index.js (10 node --test cases, all passing)
and the associated fixtures. Script reads cyoda-go-version.json, fetches
cyoda_help_<v>.json + SHA256SUMS over HTTPS, verifies integrity, strips
bodies, sorts topics by path, and writes src/data/cyoda-help-index.json
(gitignored). Exposes npm run test:scripts."
```

---

## Task 3: Wire fetcher into build and dev scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `fetch:help-index` and `predev` scripts; extend `build` and `test`**

Current `scripts` block has a long `build` chain and `"dev": "astro dev"`. Change the following entries (leave unmentioned ones unchanged):

```json
    "dev": "astro dev",
    "predev": "node scripts/fetch-cyoda-help-index.js --if-missing",
    "build": "npm run sync:vendored && npm run generate:schema-pages && npm run fetch:help-index && astro build && npm run export:markdown && npm run generate:llms && npm run generate:llms-full && npm run generate:md-sitemap && npm run package:schemas",
    "fetch:help-index": "node scripts/fetch-cyoda-help-index.js",
    "test": "npm run test:scripts && playwright test",
```

Insertion order matters: `fetch:help-index` sits between `generate:schema-pages` and `astro build`, exactly where the spec specifies. `predev` is the npm-lifecycle hook (runs automatically before `dev`); no manual chaining needed.

- [ ] **Step 2: Run the fetcher manually to populate the artefact**

Run: `npm run fetch:help-index`
Expected: prints `📚 Fetching cyoda help index (pinned v0.6.1)...` followed by a `wrote …` line with a topic count ≥ 12 (cli, config, crud, errors, grpc, helm, models, openapi, quickstart, run, search, workflows, analytics, plus any subtopics).

- [ ] **Step 3: Verify the emitted artefact**

Run: `jq '.pinnedVersion, (.topics | length), (.topics[0:3] | map(.path | join("/")))' src/data/cyoda-help-index.json`
Expected: `"0.6.1"`, an integer, then the first three topic paths in sorted order (likely `["analytics", "cli", "config"]` or similar depending on upstream topic set).

- [ ] **Step 4: Verify the artefact is gitignored**

Run: `git check-ignore src/data/cyoda-help-index.json && echo OK`
Expected: prints the path, then `OK`.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore(build): wire fetch:help-index into build and predev"
```

---

## Task 4: Create FromTheBinary component

**Files:**
- Create: `src/components/FromTheBinary.astro`

- [ ] **Step 1: Write the component**

```astro
---
// src/components/FromTheBinary.astro
// Callout pointing readers at a specific `cyoda help <topic>` invocation.
// Throws DanglingHelpTopic at build time if `topic` isn't in the pinned index.

import helpIndex from '../data/cyoda-help-index.json';

interface Props {
  topic: string;
}

const { topic } = Astro.props;
const pathParts = topic.trim().split(/\s+/);
const match = helpIndex.topics.find(
  (t) =>
    t.path.length === pathParts.length &&
    t.path.every((segment, i) => segment === pathParts[i])
);

if (!match) {
  throw new Error(
    `DanglingHelpTopic: <FromTheBinary topic="${topic}" /> — no such topic in pinned cyoda-go v${helpIndex.pinnedVersion}. ` +
      `Either fix the prop or bump cyoda-go-version.json.`
  );
}
---
<aside class="from-the-binary" aria-label="Canonical reference in the cyoda-go binary">
  <p class="ftb-line">
    <strong>Canonical reference:</strong> <code>cyoda help {topic}</code>
  </p>
  <p class="ftb-line ftb-secondary">
    This page is the narrative; the binary is authoritative.
  </p>
</aside>

<style>
  .from-the-binary {
    border-left: 4px solid hsl(var(--cyoda-orange));
    background: hsl(var(--cyoda-orange) / 0.08);
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    margin-block-end: 1.5rem;
    font-size: 0.9rem;
  }
  .from-the-binary .ftb-line {
    margin: 0;
  }
  .from-the-binary .ftb-secondary {
    margin-top: 0.25rem;
    opacity: 0.85;
  }
  .from-the-binary code {
    font-size: 0.95em;
  }
</style>
```

- [ ] **Step 2: Sanity-check with a quick build**

Run: `npm run build:only`
Expected: success, dist/ emitted. No existing page uses `<FromTheBinary>` yet, so the component is only compiled, not rendered — proving the import resolves.

- [ ] **Step 3: Commit**

```bash
git add src/components/FromTheBinary.astro
git commit -m "feat(components): add FromTheBinary callout with build-time topic validation"
```

---

## Task 5: Add dangling-topic build-integration test

**Files:**
- Create: `tests/build-help-integration.test.js`

This test runs `astro build` in a subprocess against a temporary fixture page with a bad topic prop and asserts the build fails with `DanglingHelpTopic`.

- [ ] **Step 1: Write the integration test**

```js
// tests/build-help-integration.test.js
// Spawns `astro build` with a temporary dangling-topic fixture page;
// asserts the build fails fast with the DanglingHelpTopic class.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  projectRoot,
  'src',
  'content',
  'docs',
  '_ftb-integration-fixture.mdx'
);

const FIXTURE_CONTENT = `---
title: "FromTheBinary integration fixture"
description: "Temporary fixture used by build-help-integration.test.js; should never ship."
sidebar:
  hidden: true
---

import FromTheBinary from '../../components/FromTheBinary.astro';

<FromTheBinary topic="this-topic-absolutely-does-not-exist" />
`;

test('astro build fails with DanglingHelpTopic when FromTheBinary gets a bad topic', { timeout: 180_000 }, async (t) => {
  // Pre-condition: the index artefact must exist; the build runs the fetcher anyway,
  // but we still require a clean starting state for the fixture.
  assert.ok(!fs.existsSync(fixturePath), 'stale fixture from a previous run; clean it up manually');

  fs.writeFileSync(fixturePath, FIXTURE_CONTENT);
  t.after(() => {
    if (fs.existsSync(fixturePath)) fs.rmSync(fixturePath);
  });

  const result = spawnSync('npx', ['astro', 'build'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
  });

  assert.notEqual(result.status, 0, 'expected astro build to fail, but it exited 0');
  const combined = (result.stdout || '') + (result.stderr || '');
  assert.match(combined, /DanglingHelpTopic/, 'expected DanglingHelpTopic in build output');
  assert.match(
    combined,
    /this-topic-absolutely-does-not-exist/,
    'expected the bad topic string in build output'
  );
});
```

- [ ] **Step 2: Run the integration test**

Run: `node --test tests/build-help-integration.test.js`
Expected: one test passes. Elapsed time ~30-60s depending on machine (astro build is not fast).

- [ ] **Step 3: Confirm the fixture file was cleaned up**

Run: `test ! -f src/content/docs/_ftb-integration-fixture.mdx && echo "OK cleaned"`
Expected: `OK cleaned`.

- [ ] **Step 4: Fold the integration test into `test:scripts`**

Modify `package.json` — change `test:scripts` to include the tests/ directory:

```json
    "test:scripts": "node --test scripts/*.test.js tests/*.test.js",
```

- [ ] **Step 5: Re-run the combined command**

Run: `npm run test:scripts`
Expected: all unit tests + integration test pass.

- [ ] **Step 6: Commit**

```bash
git add tests/build-help-integration.test.js package.json
git commit -m "test(build): verify astro build fails on dangling FromTheBinary topic"
```

---

## Task 6: Reframe `reference/cli.mdx` as a navigator

**Files:**
- Modify: `src/content/docs/reference/cli.mdx`

The existing page has an `awaiting-upstream` banner and a hand-maintained subcommand table that duplicates what `cyoda help cli` now owns. Replace with a navigator.

- [ ] **Step 1: Rewrite `src/content/docs/reference/cli.mdx`**

Replace the file's entire contents with:

```mdx
---
title: "CLI"
description: "cyoda-go command-line interface — narrative navigator over `cyoda help cli`."
sidebar:
  order: 30
---

import FromTheBinary from '../../../components/FromTheBinary.astro';
import helpIndex from '../../../data/cyoda-help-index.json';

export const cliTopics = (() => {
  const found = helpIndex.topics.filter(t => t.path[0] === 'cli');
  if (found.length === 0) {
    throw new Error(`EmptyNavigator: reference/cli.mdx filtered helpIndex to zero topics under prefix "cli" (pinned v${helpIndex.pinnedVersion}). Likely a topic rename upstream.`);
  }
  return found;
})();

<FromTheBinary topic="cli" />

The `cyoda` binary is the server and its own control surface. It runs as a
single long-lived process by default, with a small number of subcommands
for bootstrapping, health, and migration. Every flag, subcommand, and env
var is documented in-binary via `cyoda help <topic>` and is version-
accurate to whatever binary you are running.

## Output formats

Every help topic supports three output formats via `--format`:

- `text` (default on a TTY) — human reading.
- `markdown` (default off-TTY) — paste into docs, PRs, chat.
- `json` — machine-readable, stable schema; consumed by tools like
  cyoda-docs' own build pipeline.

## Drilldowns

Topics that naturally subdivide take a multi-word path on the CLI: `cyoda
help search async`, `cyoda help grpc compute`, and so on. The same path
appears in the JSON surface as an array.

## Related topics

The subset of `cyoda help` topics directly relevant to the CLI surface
itself is below. Topic enumeration stable across cyoda-go 0.6.x.

<ul>
  {cliTopics.map((t) => (
    <li>
      <strong><code>cyoda help {t.path.join(' ')}</code></strong> — {t.title.replace(/^[^—]*—\s*/, '')}
      <br />
      <span style="opacity: 0.8;">{t.synopsis}</span>
    </li>
  ))}
</ul>
```

Note the path depth: `reference/cli.mdx` lives at `src/content/docs/reference/cli.mdx`. Imports go up three levels (`../../../components/…`, `../../../data/…`).

- [ ] **Step 2: Build and verify**

Run: `npm run build:only`
Expected: success. The page renders without errors.

- [ ] **Step 3: Visually verify**

Run: `npm run preview` in a background terminal; open `http://localhost:4321/reference/cli/`. Confirm:
- No `awaiting-upstream` banner.
- The orange "Canonical reference" callout renders with `cyoda help cli`.
- At least one related-topic bullet appears.

Kill the preview server.

- [ ] **Step 4: Commit**

```bash
git add src/content/docs/reference/cli.mdx
git commit -m "refactor(reference/cli): reframe as navigator over cyoda help cli"
```

---

## Task 7: Reframe `reference/configuration.mdx` as a navigator

**Files:**
- Modify: `src/content/docs/reference/configuration.mdx`

- [ ] **Step 1: Rewrite `src/content/docs/reference/configuration.mdx`**

```mdx
---
title: "Configuration"
description: "cyoda-go configuration model — narrative navigator over `cyoda help config`."
sidebar:
  order: 40
---

import FromTheBinary from '../../../components/FromTheBinary.astro';
import helpIndex from '../../../data/cyoda-help-index.json';

export const configTopics = (() => {
  const found = helpIndex.topics.filter(t => t.path[0] === 'config');
  if (found.length === 0) {
    throw new Error(`EmptyNavigator: reference/configuration.mdx filtered helpIndex to zero topics under prefix "config" (pinned v${helpIndex.pinnedVersion}). Likely a topic rename upstream.`);
  }
  return found;
})();

<FromTheBinary topic="config" />

cyoda-go reads configuration from `CYODA_*` environment variables and
from `.env`-format files. The authoritative key list — every variable,
its type, its default — lives in the binary. This page covers the
*model*: how sources compose, how profiles work, and how secrets are
mounted from files.

## Sources and precedence

Values resolve in this order, highest to lowest:

1. Shell environment
2. `.env.{profile}` files (in `CYODA_PROFILES` declaration order; later profiles override earlier ones within their group)
3. `.env` in the project directory
4. User config file
5. System config file
6. Hardcoded defaults

Format is `.env` only (godotenv-parsed). No TOML, no YAML, no `--config`
flag. Subcommand flags (e.g. `cyoda init --force`) are operation-scoped
and do not override server-runtime configuration.

**User config path** varies by OS: `~/.config/cyoda/cyoda.env` (Linux,
macOS with XDG), `%AppData%\cyoda\cyoda.env` (Windows). **System config**
lives at `/etc/cyoda/cyoda.env` on POSIX.

## Profiles

`CYODA_PROFILES` is comma-separated and evaluated in declaration order.
Within a profile, regular `.env` precedence applies; across profiles,
later entries in the list override earlier ones.

## Secrets via `_FILE` suffix

Any variable that accepts a credential (Postgres URL, JWT signing key,
metrics bearer, gossip HMAC, bootstrap client secret) accepts a
companion `*_FILE` variable that reads from a mounted file. Trailing
whitespace is stripped. The `_FILE` variant takes precedence when both
are set — the pattern designed for Kubernetes Secrets and Docker
secrets mounts.

## Related topics

Topic enumeration stable across cyoda-go 0.6.x.

<ul>
  {configTopics.map((t) => (
    <li>
      <strong><code>cyoda help {t.path.join(' ')}</code></strong> — {t.title.replace(/^[^—]*—\s*/, '')}
      <br />
      <span style="opacity: 0.8;">{t.synopsis}</span>
    </li>
  ))}
</ul>
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:only`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/reference/configuration.mdx
git commit -m "refactor(reference/configuration): reframe as navigator over cyoda help config"
```

---

## Task 8: Reframe `reference/helm.mdx` as a navigator

**Files:**
- Modify: `src/content/docs/reference/helm.mdx`

- [ ] **Step 1: Rewrite `src/content/docs/reference/helm.mdx`**

```mdx
---
title: "Helm values"
description: "cyoda-go Helm chart — narrative navigator over `cyoda help helm`."
sidebar:
  order: 50
---

import FromTheBinary from '../../../components/FromTheBinary.astro';
import helpIndex from '../../../data/cyoda-help-index.json';

export const helmTopics = (() => {
  const found = helpIndex.topics.filter(t => t.path[0] === 'helm');
  if (found.length === 0) {
    throw new Error(`EmptyNavigator: reference/helm.mdx filtered helpIndex to zero topics under prefix "helm" (pinned v${helpIndex.pinnedVersion}). Likely a topic rename upstream.`);
  }
  return found;
})();

<FromTheBinary topic="helm" />

The `deploy/helm/cyoda` chart packages cyoda-go for Kubernetes. The
chart's own `values.yaml` enumerates every configurable key; this page
covers the model that shapes how those values map to Kubernetes objects
and how secrets are provisioned.

## What the chart provisions

A standard deployment per release: a `Deployment`, a `Service` for HTTP
+ gRPC + admin ports, a `ConfigMap` materialising the `.env`-format
configuration, and a `Secret` for credential material. An optional
`ServiceMonitor` (Prometheus Operator) and `HorizontalPodAutoscaler`
are wired off per-value flags.

## Values model

Values split into two groups:

- **Configuration values** — map one-to-one to the `CYODA_*` env vars
  documented in the binary. Changing them alters runtime behaviour but
  not Kubernetes shape. See `cyoda help config` for the list.
- **Deployment values** — image tag, replica count, resource requests,
  service type, ingress glue. These shape the Kubernetes objects the
  chart renders; they never reach the binary.

## Secret provisioning

Credentials follow the same `_FILE` pattern as bare-metal deployments.
The chart mounts the `Secret` at a known path and sets `CYODA_*_FILE`
env vars accordingly, so the binary reads each secret at startup. You
never put raw credentials into the chart's `values.yaml` in a
production deployment — wire an existing `Secret` via `existingSecret`
or equivalent.

## Related topics

Topic enumeration stable across cyoda-go 0.6.x.

<ul>
  {helmTopics.map((t) => (
    <li>
      <strong><code>cyoda help {t.path.join(' ')}</code></strong> — {t.title.replace(/^[^—]*—\s*/, '')}
      <br />
      <span style="opacity: 0.8;">{t.synopsis}</span>
    </li>
  ))}
</ul>

See [Run → Kubernetes](/run/kubernetes/) for the deployment pattern and
production-sizing guidance.
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:only`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/reference/helm.mdx
git commit -m "refactor(reference/helm): reframe as navigator over cyoda help helm"
```

---

## Task 9: Drop `awaiting-upstream` mode from VendoredBanner

**Files:**
- Modify: `src/components/VendoredBanner.astro`

No page now uses `awaiting-upstream` (audited in Task 6/7/8). Remove the branch.

- [ ] **Step 1: Confirm no usages remain**

Run: `grep -rn 'awaiting-upstream' src/content/ src/components/`
Expected: no matches (everything under src/content is clean; the component itself still has them — that's what the next step removes).

Re-run without `src/components/`:

Run: `grep -rn 'awaiting-upstream' src/content/`
Expected: no output.

- [ ] **Step 2: Rewrite `src/components/VendoredBanner.astro`**

Replace with:

```astro
---
// src/components/VendoredBanner.astro — banner on pages sourced from cyoda-go
interface Props {
  source?: { repo?: string; path?: string; vendored_at?: string };
  stability?: 'stable' | 'evolving' | 'upcoming';
}
const { source, stability = 'stable' } = Astro.props;
const showBanner = stability !== 'stable' || source;
---
{showBanner && (
  <aside class="vendored-banner" data-stability={stability}>
    {stability === 'evolving' && (
      <><strong>Evolving.</strong> This page may change rapidly with cyoda-go releases.</>
    )}
    {stability === 'upcoming' && (
      <><strong>Upcoming.</strong> This describes a feature on the roadmap; it is not yet available in cyoda-go at this release. Names and shapes may change before release.</>
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
  .vendored-banner[data-stability='upcoming'] {
    border-left-color: hsl(var(--cyoda-blue, 210 80% 55%));
    background: hsl(var(--cyoda-blue, 210 80% 55%) / 0.08);
  }
</style>
```

Changes vs. the original: dropped the `'awaiting-upstream'` union member from `stability`, the `issue` prop entirely, the `{stability === 'awaiting-upstream' && …}` branch, and the `.vendored-banner[data-stability='awaiting-upstream']` stylesheet rule.

- [ ] **Step 3: Build and verify**

Run: `npm run build:only`
Expected: success. Any page still passing `stability="awaiting-upstream"` would break here; we verified in Step 1 that none do.

- [ ] **Step 4: Commit**

```bash
git add src/components/VendoredBanner.astro
git commit -m "refactor(components): drop awaiting-upstream mode from VendoredBanner

All three reference pages that used this mode are now navigators over
their corresponding cyoda help topic. Stable/evolving/upcoming remain."
```

---

## Task 10: Playwright smoke tests for navigator pages

**Files:**
- Create: `tests/navigator-pages.spec.ts`

- [ ] **Step 1: Write the Playwright test**

```ts
// tests/navigator-pages.spec.ts
// Smoke tests for the three reference navigator pages.
// Each asserts the FromTheBinary callout renders, at least one topic card
// appears, and no 'awaiting-upstream' banner copy is present.

import { test, expect } from '@playwright/test';

const pages = [
  { path: '/reference/cli/', topic: 'cli' },
  { path: '/reference/configuration/', topic: 'config' },
  { path: '/reference/helm/', topic: 'helm' },
];

for (const { path, topic } of pages) {
  test.describe(`Navigator: ${path}`, () => {
    test(`renders FromTheBinary callout with topic "${topic}"`, async ({ page }) => {
      await page.goto(path);
      const callout = page.locator('aside.from-the-binary');
      await expect(callout).toBeVisible();
      await expect(callout.locator('code').first()).toHaveText(`cyoda help ${topic}`);
    });

    test('has at least one related-topic bullet', async ({ page }) => {
      await page.goto(path);
      // The related-topics UL follows the h2 'Related topics'
      const bullets = page.locator('h2:has-text("Related topics") ~ ul li');
      await expect(bullets.first()).toBeVisible();
    });

    test('shows no Awaiting upstream copy', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('text=Awaiting upstream')).toHaveCount(0);
    });
  });
}
```

- [ ] **Step 2: Verify Playwright config serves the built site**

Run: `cat playwright.config.ts | grep -E 'baseURL|webServer' | head -5`
Expected: a `baseURL` set to a localhost URL and a `webServer` command that runs against `dist/` (e.g. `astro preview` or a static server). If this is already the case (it should be — other tests like `content-correctness.spec.ts` depend on it), no change needed.

- [ ] **Step 3: Run the Playwright suite**

Run: `npm run build && npx playwright test tests/navigator-pages.spec.ts`
Expected: all 9 cases pass (3 pages × 3 assertions).

- [ ] **Step 4: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: all node --test + all Playwright pass.

- [ ] **Step 5: Commit**

```bash
git add tests/navigator-pages.spec.ts
git commit -m "test(navigators): smoke test FromTheBinary callout and topic bullets"
```

---

## Task 11: Update CLAUDE.md to document step 1a

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Check the current Build-pipeline section**

Run: `grep -n 'Build pipeline\|npm run build\|generate-schema-pages\|export-markdown' CLAUDE.md | head -10`

Locate the "Build pipeline" section (it enumerates the numbered build steps).

- [ ] **Step 2: Insert a step describing `fetch-cyoda-help-index.js`**

After the line describing `scripts/generate-schema-pages.js` and before the line describing `astro build`, insert:

```
1a. `scripts/fetch-cyoda-help-index.js` — reads `cyoda-go-version.json`, fetches `cyoda_help_<v>.json` + `SHA256SUMS` from the pinned cyoda-go release, verifies the checksum, strips topic bodies, and writes `src/data/cyoda-help-index.json` (git-ignored). The `FromTheBinary` component and the three navigator pages (`reference/cli|configuration|helm.mdx`) import this index at build time; a dangling `<FromTheBinary topic="…">` fails the build.
```

If the existing numbering uses `1.`, `2.`, `3.` rather than the format shown here, renumber to `1.`, `2.`, `3.`, `4.` or add `1a.` as shown — match the style of the surrounding text.

- [ ] **Step 3: Add a conventions note**

Under the `## Conventions for AI assistants` section in `CLAUDE.md`, append a bullet:

```
- **Never hand-edit `src/data/cyoda-help-index.json`** — it is regenerated by `scripts/fetch-cyoda-help-index.js` from the pinned cyoda-go release asset. Bump `cyoda-go-version.json` at repo root to change which release the build targets.
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document help-index fetch step and src/data/ convention"
```

---

## Task 12: Final end-to-end verification

**Files:** none modified.

- [ ] **Step 1: Clean rebuild from a fresh state**

```bash
rm -rf dist/ src/data/cyoda-help-index.json
npm run build
```

Expected: the build sequence prints `📚 Fetching cyoda help index (pinned v0.6.1)...` among the other steps and exits 0. `dist/` contains `reference/cli/index.html`, `reference/configuration/index.html`, `reference/helm/index.html`.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all node --test (10 fetcher + 1 build-integration = 11) and all Playwright tests pass.

- [ ] **Step 3: Spot-check the rendered pages**

Run: `npx serve dist -l 4173 &` (or similar), then curl:

```bash
curl -s http://localhost:4173/reference/cli/ | grep -E 'Canonical reference|cyoda help cli' | head -3
curl -s http://localhost:4173/reference/configuration/ | grep -E 'Canonical reference|cyoda help config' | head -3
curl -s http://localhost:4173/reference/helm/ | grep -E 'Canonical reference|cyoda help helm' | head -3
```

Expected: each page shows a callout line. Kill the background server.

- [ ] **Step 4: Confirm no `awaiting-upstream` copy or banner anywhere**

Run: `grep -rn 'awaiting-upstream\|Awaiting upstream' src/ dist/ | grep -v node_modules`
Expected: no matches.

- [ ] **Step 5: Verify the gitignore boundary**

Run: `git status --short | grep -E 'src/data|cyoda-help-index'`
Expected: no tracked changes under `src/data/cyoda-help-index.json`. The `.gitkeep` should already be committed from Task 1.

- [ ] **Step 6: If anything is off, create a small fixup commit now**

Only if Steps 1-5 surfaced an issue. Otherwise skip.

- [ ] **Step 7: Push the branch**

```bash
git push origin docs/post-80-pickup-handoff
```

- [ ] **Step 8: Manually verify on the Surge preview**

PR #76's preview URL (https://cyoda-docs-feature-cyoda-go-init.surge.sh/) will refresh once this branch lands in `feature/cyoda-go-init`. Don't merge into `feature/cyoda-go-init` yet — hand the branch to the user for team testing first, per the handoff.

---

## Acceptance checklist (copy of spec §Acceptance)

- [ ] `npm run build` on a fresh clone succeeds end-to-end, emits `dist/` with the three navigator pages rendered.
- [ ] `cyoda-go-version.json` exists, pins `0.6.1`.
- [ ] `scripts/fetch-cyoda-help-index.js` exists, is called from `npm run build`, and writes `src/data/cyoda-help-index.json`.
- [ ] `src/data/cyoda-help-index.json` is gitignored.
- [ ] `<FromTheBinary>` component exists, throws on dangling topics, renders on each of the three navigator pages.
- [ ] Three navigator pages no longer include `VendoredBanner`.
- [ ] `VendoredBanner` no longer accepts `awaiting-upstream`.
- [ ] All seven fetch-script-responsible fatal error classes are covered by a passing unit test.
- [ ] `DanglingHelpTopic` is covered by the build-integration test.
- [ ] `npm test` runs unit + integration + Playwright; all pass in CI.
- [ ] `CLAUDE.md` build-pipeline section mentions step 1a and its input file.
