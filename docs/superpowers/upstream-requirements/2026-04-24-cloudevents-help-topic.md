# cyoda-go upstream requirement — `cyoda help cloudevents json`

**Date:** 2026-04-24
**Target release:** cyoda-go v0.6.2
**Repo:** `Cyoda-platform/cyoda-go`
**Downstream consumer:** `Cyoda-platform/cyoda-docs` (build pipeline will switch `src/schemas/` sourcing from vendored-in-repo to binary-driven extraction once this action ships)

---

## Requirement

Add a `cloudevents` help topic that exposes the JSON Schema tree for all CloudEvent payload schemas, mirroring the existing `openapi json|yaml` and `grpc json|proto` topic-action pattern.

## Topic path

`cyoda help cloudevents` — new top-level topic.

Narrative body describes what CloudEvents are in cyoda: event-driven processing transport, CloudEvents v1.0 envelope, JSON Schema-validated payloads, relationship to the gRPC `CloudEventsService`. One-paragraph synopsis following the convention of existing topics.

## Topic action

`cyoda help cloudevents json` — emits the complete JSON Schema tree for every CloudEvent payload, as a single JSON document.

## Output shape

```json
{
  "schema": 1,
  "version": "0.6.2",
  "specVersion": "https://json-schema.org/draft/2020-12/schema",
  "baseId": "https://cyoda.com/cloud/event/",
  "schemas": {
    "common/BaseEvent.json":                             { /* complete JSON Schema */ },
    "entity/EntityTransactionResponse.json":             { /* ... */ },
    "entity/EntityTransitionRequest.json":               { /* ... */ },
    "model/ModelSnapshot.json":                          { /* ... */ },
    "processing/EntityCriteriaCalculationRequest.json":  { /* ... */ },
    "search/SearchJobSnapshot.json":                     { /* ... */ },
    "statemachine/WorkflowInfo.json":                    { /* ... */ }
  }
}
```

## Shape rules

- **`schemas` is a map.** Keys are relative paths identical to the current `vendored/schemas/<category>/<Name>.json` layout in cyoda-docs. This lets consumers fan out into a filesystem tree without renaming.
- **Values are complete JSON Schema documents** — identical byte-shape to the current vendored files (same `$schema`, `$id`, `title`, `type`, `properties`, `required`, etc.).
- **`$ref` values stay relative** (e.g. `"$ref": "../common/BaseEvent.json"`). Consumers that materialize the tree to disk get working resolution for free. Do **not** rewrite to absolute URLs.
- **`baseId`** is the URL prefix used in `$id` values across the tree (`https://cyoda.com/cloud/event/`). Expose it so consumers can construct absolute IDs if they want them.
- **Sorted keys**, lexicographic by path. Diff-stable across builds.
- **`specVersion`** points at the JSON Schema meta-schema the payloads conform to (Draft 2020-12 today).
- **`version`** is the cyoda-go binary version (same rule as other `--format=json` outputs).

## Parity with existing actions

The `--format=json` flag on the bare topic `cyoda help cloudevents` should emit the **topic descriptor** — same shape as other topics: `{ topic, path, title, synopsis, body }`. The `json` **action** is the *schemas tree*. This matches how `cyoda help openapi --format=json` emits the `openapi` *topic* while `cyoda help openapi json` emits the *spec*.

Alternative: if unifying makes more sense (make `cyoda help cloudevents --format=json` emit the schemas tree directly and skip the `json` action), that works too — pick one convention and document it. cyoda-docs will consume whichever.

## Acceptance criteria

- [ ] Every schema currently under `vendored/schemas/**/*.json` in cyoda-docs (~61 files across `common/`, `entity/`, `model/`, `processing/`, `search/`, `statemachine/`) appears as a key in the output.
- [ ] Each value byte-matches the current vendored file's shape after normalizing whitespace and key ordering (structural equality — deep-equal after `JSON.parse`).
- [ ] Output is stable across runs (sorted keys).
- [ ] `cyoda help` (top-level topic listing) surfaces `cloudevents` in the Stable or Evolving section as appropriate.
- [ ] Verified with `cyoda help cloudevents json | jq '.schemas | keys | length'` returning the expected count.
- [ ] No new binary dependencies introduced; implementation reads from embedded schemas (consistent with how `openapi json` reads from the embedded `api/openapi.yaml`).

## Why this shape

- **Map over array.** Consumers want to iterate by path or look up by path. A map is zero-overhead for both; an array would force an `indexBy` pass.
- **Relative `$ref`s.** The current schemas link to each other via relative paths; rewriting to absolute URLs would break tooling that expects filesystem layout.
- **Matches the `help openapi json|yaml` precedent.** One topic, one action per output format. Keeps the help surface discoverable via `cyoda help` alone.

## What cyoda-docs does once this ships

1. Bumps `cyoda-go-version.json` to `0.6.2`.
2. Replaces the checked-in `vendored/schemas/` tree with a build-time extraction driven by this action.
3. The docs pipeline will:
   a. Download the pinned binary.
   b. Run `cyoda help cloudevents json`.
   c. Parse the result, fan out `schemas` into `src/schemas/<key>.json` files.
   d. Feed into the existing `generate-schema-pages.js`.

No further upstream changes needed.

## Out of scope

- The OpenAPI component schemas (already accessible via `cyoda help openapi json`) are a separate surface and not affected by this requirement.
- The gRPC protobuf descriptors (already accessible via `cyoda help grpc json|proto`) are a separate surface and not affected.

## Context link

Drafted as part of the cyoda-docs post-#80 help-integration Phase A work
(branch `docs/post-80-pickup-handoff`). See
`docs/superpowers/specs/2026-04-24-post-80-help-integration-design.md` for the
broader design and
`docs/superpowers/plans/2026-04-24-post-80-help-integration.md` for the
implementation plan that this requirement unblocks.
