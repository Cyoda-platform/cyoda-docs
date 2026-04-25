# Post-#80 help integration — Phase A design

**Date:** 2026-04-24
**Scope:** Phase A of cyoda-docs #69 — pipeline infrastructure and
reference-navigator reframing. The per-page Reframe/Delete dispatch and
the ledger↔help.json alignment test are Phase B, tracked by the same
issue but separated into a follow-up spec.
**Branch:** Commits land on `feature/cyoda-go-init`, bundled into
PR #76 so the whole change is team-testable as one drop.
**Pinned cyoda-go version for Phase A:** `v0.6.1`.

## Guiding principle

> **The binary is the canonical reference. The website never mirrors
> help bodies. Callouts *point at* `cyoda help <topic>`; they do not
> render it.**

Practical consequences that shape the whole design:

- The build-pipeline step that consumes `cyoda_help_<v>.json` is a
  *build-time QA index*, not a content import. It answers one
  question: "does every `cyoda help <topic>` reference on the
  website resolve in the pinned help surface?"
- No help topic body lands in `dist/`. The only bytes of help content
  surfaced to readers are topic *titles* and one-line *synopses* on
  the three reference-navigator pages.
- No version number appears in reader-facing callouts. The binary
  the reader is running is their authority; the docs' pin is a
  private QA target.

## Scope

**In scope (Phase A):**

1. Build-pipeline fetch and validation of `cyoda_help_<v>.json` from
   the pinned cyoda-go release.
2. A small `<FromTheBinary topic="…">` Astro component that renders
   the "canonical reference" callout and asserts at build time that
   `topic` exists in the pinned index.
3. Reframing the three `awaiting-upstream` reference stubs
   (`reference/cli.mdx`, `reference/configuration.mdx`,
   `reference/helm.mdx`) as navigator pages with hand-authored
   conceptual framing plus a topic enumeration sourced from the index.
4. Dropping the `awaiting-upstream` stability branch from
   `VendoredBanner` once those three pages no longer use it.
5. Tests covering the fetch script's happy path and each fatal error
   class, plus one build-level integration test for the "dangling
   topic" invariant and one Playwright smoke test for the navigator
   pages.

**Out of scope (Phase B or later):**

- Placing `<FromTheBinary>` on narrative pages across `build/`, `run/`,
  `concepts/`. The component ships in Phase A; the rollout is Phase B,
  pre-enumerated by the 5 `Reframe post-#80` findings in the
  2026-04-22 correctness review.
- The one `Delete post-#80` finding in
  `concepts/workflows-and-events.md`.
- The ledger↔`help.json` alignment test (`alignment-post-80.md`).
- Multi-version docs (Antora-style version selector). Filed separately
  and revisited once ≥ 2 cyoda-go releases ship a help surface.
- An MCP server over the help index (cyoda-docs #67).
- The new Build-side `searching-entities.md` page (cyoda-docs #68).

## Architecture

One new build-pipeline step between the existing schema-pages
generator and `astro build`:

```
1.  scripts/generate-schema-pages.js      (existing)
1a. scripts/fetch-cyoda-help-index.js     (NEW)
2.  astro build                            (existing)
3.  scripts/export-markdown.js             (existing)
4.  scripts/generate-llms-txt.js           (existing)
5.  scripts/package-schemas.js             (existing)
```

The new step:

1. Reads `cyoda-go-version.json` at repo root.
2. GETs `https://github.com/Cyoda-platform/cyoda-go/releases/download/v<v>/cyoda_help_<v>.json`
   and the matching `SHA256SUMS`.
3. Verifies the JSON's sha256 against the `SHA256SUMS` entry for
   `cyoda_help_<v>.json`. Fails the build on mismatch.
4. Parses the JSON, strips `body` from every topic, writes a thin
   index to `src/data/cyoda-help-index.json` (gitignored).
5. Does **no** topic-existence validation itself — that
   responsibility lives in `<FromTheBinary>` and in each navigator
   page's filter expression, so the error message can name the
   specific source file that needs editing.

Downstream consumers:

- `<FromTheBinary topic="…">` imports the index at build time and
  throws if the topic doesn't resolve.
- Each of the three navigator MDX pages imports the index directly
  and maps over the subset matching its topic prefix.

**Fetch mechanism.** Node-native `fetch` (available on Node 22, which
CI uses post-#71). No `gh` dependency; the asset and the checksum
manifest are public and served unauthenticated over HTTPS.

**No offline fallback.** CI and dev both have network. A genuinely
offline contributor gets a clear error pointing at the step they
need to retry once online. Introducing a committed fallback would add
a second code path exercised only when something else is already
wrong.

## Components

### `cyoda-go-version.json` (NEW, tracked)

```json
{ "version": "0.6.1" }
```

Repo root. Single source of truth for the pipeline's pin. Bump = one
line diff. Optional `sha` field for ledger parity may be added in a
later phase.

### `scripts/fetch-cyoda-help-index.js` (NEW)

Exports a `run({ fetch, versionFilePath, outputPath, ifMissing })`
function so tests can inject a mocked `fetch` without
monkey-patching globals. The CLI entry point wires it to
`globalThis.fetch` and real paths, and parses a single `--if-missing`
flag that sets `ifMissing: true`: when set, the script is a no-op if
`outputPath` already exists. This is the single mechanism `npm run
dev` uses to avoid refetching on every dev-server restart; no second
ensure-script exists.

Logger style matches `scripts/generate-schema-pages.js` — emoji-
prefixed `console.log` for progress lines and `console.error` for
failures. Operators reading `npm run build` output see a consistent
step header (`📚 Fetching cyoda help index (pinned v<version>)…`)
next to the existing schema generator's header.

The emitted index's `topics` array is sorted lexicographically by
`path.join("/")` so the artifact is diff-stable across builds. This
eliminates churn in any downstream that snapshots the file, and
makes manual inspection during debugging trivial.

Writes `src/data/cyoda-help-index.json` with this shape:

```json
{
  "pinnedVersion": "0.6.1",
  "schema": 1,
  "generatedAt": "2026-04-24T12:34:56.789Z",
  "topics": [
    {
      "topic": "cli",
      "path": ["cli"],
      "title": "cli — the cyoda command-line interface",
      "synopsis": "…"
    }
  ]
}
```

No `body` fields. No help-source `version` string from the payload
(that field is known to be `"dev"` on v0.6.1 upstream; a separate
remediation prompt is queued for cyoda-go).

### `src/data/cyoda-help-index.json` (NEW, gitignored)

Regenerated each build. Added to `.gitignore` alongside
`src/content/docs/schemas/` (same pattern as the schema-pages
generator).

### `src/components/FromTheBinary.astro` (NEW)

Props:

- `topic: string` — space-separated to match the CLI invocation
  (e.g. `"cli"`, `"search async"`). Not dotted, not slashed. One
  syntax, the one the reader types.

Build-time behavior:

1. Splits `topic` on whitespace to get the path array.
2. Looks up the matching entry in `src/data/cyoda-help-index.json`.
3. If missing, throws with class `DanglingHelpTopic`, including the
   source file path that invoked the component.

Render:

> **Canonical reference:** `cyoda help <topic>`
> This page is the narrative; the binary is authoritative.

Inline block, unobtrusive styling consistent with existing asides.
The `<code>` element wraps the full `cyoda help <topic>` string so
readers can copy-paste.

### Three reframed navigator pages

`src/content/docs/reference/cli.mdx`,
`src/content/docs/reference/configuration.mdx`,
`src/content/docs/reference/helm.mdx`.

Shape of each:

1. Frontmatter (title, description) — preserved from the current stub
   where still accurate.
2. `<FromTheBinary topic="cli" />` (resp. `"config"`, `"helm"`) at
   the top.
3. Hand-authored conceptual framing, ~150–300 words per page. Scope:
   - `cli` — command shape, output-format flag, how drilldowns work.
   - `configuration` — precedence rules (flag > env > .env.profile >
     .env > user config > system config > default), `_FILE` secrets
     pattern, profile model. No flag or env-var listing — that's
     `cyoda help config`'s job.
   - `helm` — chart layout, values model, secret provisioning. No
     values-table mirror — that's `cyoda help helm`'s job.
4. A topic enumeration section: import the index in the MDX
   script, filter to `topics.filter(t => t.path[0] === "<topic>")`
   (topic prefix is `cli`, `config`, `helm` respectively — note
   `configuration.mdx` filters on `"config"`), render each match as a
   small card with `title` + `synopsis` + the copyable
   `cyoda help <path>` invocation. If the filter yields zero
   entries, the MDX frontmatter script throws `EmptyNavigator` with
   the page path and the prefix it queried — same message-contract as
   `DanglingHelpTopic`.
5. Drop `<VendoredBanner stability="awaiting-upstream" …/>`.

### `src/components/VendoredBanner.astro` (MODIFIED)

Delete the `awaiting-upstream` branch, its corresponding stylesheet
rule, and the `issue` prop. Keep `stable`, `evolving`, `upcoming`.
Audit confirmed the three navigator pages are the only callers of
`awaiting-upstream`.

### `package.json` (MODIFIED)

Add `fetch-help` script that runs `scripts/fetch-cyoda-help-index.js`.
Extend `build` to invoke it before `astro build`. Extend `dev` to
invoke `scripts/fetch-cyoda-help-index.js --if-missing` so
contributors don't need to remember a separate command on first run
and repeat dev-server starts don't re-fetch. Same script, one flag —
no second ensure-script.

### `.gitignore` (MODIFIED)

Add `src/data/cyoda-help-index.json`.

### `.github/workflows/static.yml`

No change required. `npm run build` picks up the new step; the asset
host is public; no secrets are introduced.

### `CLAUDE.md` (MODIFIED)

One line in the build-pipeline description documenting step 1a and
its input (`cyoda-go-version.json`).

## Data flow

```
repo clone
  └─> read cyoda-go-version.json
        └─> fetch cyoda_help_<v>.json from GitHub Releases
              └─> fetch SHA256SUMS
                    └─> verify checksum
                          └─> strip bodies
                                └─> write src/data/cyoda-help-index.json
                                      ├─> FromTheBinary.astro imports
                                      │     └─> build-time assert: topic exists
                                      └─> Navigator MDX pages import
                                            └─> filter + render topic cards
```

## Error handling

All nine fatal error classes name the class and the file in the repo
that needs to change to fix the error. This is the most expensive
line of error copy to get right, because the alternative ("topic X
does not exist") forces the reader to grep their own pages.

| Condition | Error class |
|---|---|
| `cyoda-go-version.json` missing / malformed | `InvalidVersionPin` |
| Network failure (DNS / TLS / timeout) | `FetchFailed` |
| GitHub returns 404 on the help asset | `ReleaseNotFound` |
| `SHA256SUMS` fetch fails | `IntegrityManifestMissing` |
| `SHA256SUMS` doesn't list the expected file | `IntegrityManifestIncomplete` |
| Checksum mismatch | `IntegrityCheckFailed` |
| Downloaded JSON isn't `{schema:1, topics:[…]}` | `HelpJsonMalformed` |
| `<FromTheBinary>` refers to a path not in the index | `DanglingHelpTopic` |
| Navigator page filters to zero topics | `EmptyNavigator` |

**Deliberately non-fatal.**

- `version: "dev"` inside the downloaded JSON payload. We pin by
  filename; the payload's internal `version` is informational. Fix is
  tracked upstream.
- Topics in the index that the website never references. The index
  is a superset of what the site cites; many topics live only in the
  binary.

## Testing

### Unit — `scripts/fetch-cyoda-help-index.test.js`

Runs under `node --test` (Node 22 native; no new dependencies).
Fixtures live under `tests/fixtures/help/`:

- `help.valid.json`, `help.malformed.json`
- `SHA256SUMS.valid`, `SHA256SUMS.wrong`, `SHA256SUMS.missing-entry`

One test per fatal error class plus one happy path. Happy path
asserts the emitted index has no `body` fields, carries the pinned
version + `generatedAt`, and is sorted lexicographically by
`path.join("/")`. An additional test exercises `--if-missing`: a
pre-existing output file short-circuits the run and no network call
happens.

### Integration — `tests/build-help-integration.spec.ts`

Two cases, both exercising a fresh `astro build`:

1. **Positive:** test-only pin points at a local file-URL help index;
   build succeeds; the three navigator pages appear in `dist/`.
2. **DanglingHelpTopic:** test-fixture MDX page with
   `<FromTheBinary topic="does-not-exist" />`; build exits non-zero;
   stderr contains `DanglingHelpTopic` and the source file path.

### Smoke — `tests/navigator-pages.spec.ts`

One Playwright test per navigator page:

- `<FromTheBinary>` callout rendered with the expected topic in a
  `<code>` element.
- At least one topic card present (guards `EmptyNavigator`).
- No `awaiting-upstream` banner copy present (guards
  `VendoredBanner` regression).

### CI wiring

New `npm run test:scripts` runs `node --test scripts/**/*.test.js`.
Folded into `npm test` so the existing `static.yml` workflow picks up
the unit tests without a YAML change. Playwright cases go into the
existing config.

### Deliberately not tested

- Live GitHub fetch in CI (flaky, upstream-dependent, covered by the
  file-URL integration test).
- Help body content (we don't render it).
- The hand-written conceptual prose on the navigator pages (ordinary
  MDX, covered by build success).
- TypeScript types for the index JSON (Astro infers from the import;
  revisit if DX friction appears).

## Acceptance criteria

- [ ] `npm run build` on a fresh clone succeeds end-to-end, emits
      `dist/` with the three navigator pages rendered.
- [ ] `cyoda-go-version.json` exists, pins `0.6.1`.
- [ ] `scripts/fetch-cyoda-help-index.js` exists, is called from
      `npm run build`, and writes `src/data/cyoda-help-index.json`.
- [ ] `src/data/cyoda-help-index.json` is gitignored.
- [ ] `<FromTheBinary>` component exists, throws on dangling topics,
      renders on each of the three navigator pages.
- [ ] Three navigator pages no longer include `VendoredBanner`.
- [ ] `VendoredBanner` no longer accepts `awaiting-upstream`.
- [ ] All nine fatal error classes are covered by a passing unit
      test.
- [ ] `npm test` runs unit + integration + Playwright; all pass in CI.
- [ ] `CLAUDE.md` build-pipeline section mentions step 1a and its
      input file.

## Follow-ups filed / to file

- Tracked: cyoda-docs #69 (this issue), cyoda-go #80 (upstream
  dependency, landed).
- To file: upstream fix for `"version": "dev"` in
  `cyoda_help_<v>.json` (remediation prompt drafted on 2026-04-24).
- To file: multi-version docs selector — revisit when ≥ 2
  help-shipping cyoda-go releases exist.
- Inherited, unaffected by this spec: cyoda-docs #67 (MCP server),
  cyoda-docs #68 (`build/searching-entities.md`), Trino `upcoming`
  banner on four pages.

## Non-goals worth naming explicitly

- Not fixing cyoda-go-side issues (help bodies, topic choices, schema
  shape). That's the binary's job; divergences become Fix-now findings
  in the Phase B alignment test.
- Not restructuring the reference sidebar. The three pages keep their
  existing slugs and sidebar positions; only their contents change.
- Not adding an MCP server, a search interface, or any kind of
  reader-facing version selector. All separately tracked.
