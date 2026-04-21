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
