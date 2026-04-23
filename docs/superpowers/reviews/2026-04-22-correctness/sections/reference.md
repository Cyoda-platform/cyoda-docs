# reference section — Wave 2 review summary

**Pages reviewed:** 8
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture
The reference section is a mix of awaiting-upstream placeholders (CLI, Configuration, Helm) and fuller specifications (Trino, Entity Model Export, Schemas). The awaiting-upstream placeholders are appropriate and correctly signal the pre-#80 holding pattern. Two concrete fix-nows: (a) the Configuration page claims TOML/YAML and a `--config` flag that do not exist; (b) the CLI page references a `cyoda serve` subcommand that does not exist. The Trino page is a roadmap feature and needs an explicit "upcoming" banner rather than correctness edits against unshipped specifics.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| reference__index | 0 | 0 | 0 | 0 |
| reference__api | 0 | 0 | 0 | 0 |
| reference__cli | 1 | 0 | 0 | 1 |
| reference__configuration | 2 | 0 | 0 | 2 |
| reference__helm | 0 | 1 | 0 | 0 |
| reference__trino | 0 | 0 | 0 | 2 |
| reference__entity-model-export | 0 | 0 | 0 | 3 |
| reference__schemas | 0 | 0 | 0 | 0 |
| **Total** | **3** | **1** | **0** | **8** |

## Cross-section issues noticed

1. **Trino as roadmap feature.** The Trino page documents a surface that is on the roadmap and not yet callable at the pinned cyoda-go commit. Site-wide remedy: an "upcoming / roadmap" banner on this page and on its sibling Trino-bearing pages (concepts/apis-and-surfaces, build/analytics-with-sql, build/testing-with-digital-twins). Correctness of the documented specifics will be reviewed once Trino ships.

2. **Configuration format misunderstanding.** The Configuration page claims TOML/YAML support and `--config` flag override; neither exists. `.env` is the only file format cyoda-go loads. This is a category-1 fix regardless of #80.

3. **`cyoda serve` phantom subcommand.** Third-ish occurrence (also in run/desktop.md). There is no `serve` subcommand; it happens to work by falling through to server-start. Any doc referring to `cyoda serve` should be corrected.

4. **Help surface dependency.** Post-#80, CLI, Configuration, and Helm pages transition from awaiting-upstream placeholders to navigator pages with "From the binary" callouts into `cyoda help <topic>`. Anticipated in the Reframe post-#80 column.

5. **Entity Model Export (SIMPLE_VIEW) completeness.** Technically complete and well-grounded. The three clarity suggestions strengthen reader confidence but are not blocking. The page is ready to remain stable post-#80.
