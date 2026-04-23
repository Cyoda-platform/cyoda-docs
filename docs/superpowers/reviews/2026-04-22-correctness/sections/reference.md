# reference section — Wave 2 review summary

**Pages reviewed:** 8
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture
The reference section is a mix of awaiting-upstream placeholders (CLI, Configuration, Helm) and fuller specifications (Trino, Entity Model Export, Schemas). The awaiting-upstream placeholders are appropriate and correctly signal the pre-#80 holding pattern. However: (a) the Trino page describes a Cloud-only feature as if general Cyoda, (b) the Configuration page claims TOML/YAML and a `--config` flag that do not exist, (c) the CLI page references a `cyoda serve` subcommand that does not exist. Fix-now count is moderate but the three items are material.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| reference__index | 0 | 0 | 0 | 0 |
| reference__api | 0 | 0 | 0 | 0 |
| reference__cli | 1 | 0 | 0 | 1 |
| reference__configuration | 2 | 0 | 0 | 2 |
| reference__helm | 0 | 1 | 0 | 0 |
| reference__trino | 1 | 0 | 1 | 1 |
| reference__entity-model-export | 0 | 0 | 0 | 3 |
| reference__schemas | 0 | 0 | 0 | 0 |
| **Total** | **4** | **1** | **1** | **7** |

## Cross-section issues noticed

1. **Scope boundary violation (Trino).** The Trino page describes a feature that does not exist in OSS cyoda-go. Third confirmation of Cloud-docs bleed into OSS-path pages (after concepts/apis-and-surfaces and build/analytics-with-sql).

2. **Configuration format misunderstanding.** The Configuration page claims TOML/YAML support and `--config` flag override; neither exists. `.env` is the only file format cyoda-go loads. This is a category-1 fix regardless of #80.

3. **`cyoda serve` phantom subcommand.** Third-ish occurrence (also in run/desktop.md). There is no `serve` subcommand; it happens to work by falling through to server-start. Any doc referring to `cyoda serve` should be corrected.

4. **Help surface dependency.** Post-#80, CLI, Configuration, and Helm pages transition from awaiting-upstream placeholders to navigator pages with "From the binary" callouts into `cyoda help <topic>`. Anticipated in the Reframe post-#80 column.

5. **Entity Model Export (SIMPLE_VIEW) completeness.** Technically complete and well-grounded. The three clarity suggestions strengthen reader confidence but are not blocking. The page is ready to remain stable post-#80.
