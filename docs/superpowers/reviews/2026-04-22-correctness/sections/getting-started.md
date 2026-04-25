# getting-started + root — Wave 2 review summary

**Pages reviewed:** 2 (getting-started/install-and-first-entity + root index.mdx)
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

install-and-first-entity is **misaligned with cyoda-go** in critical paths: the `cyoda serve` subcommand is wrong, all three REST endpoint paths are wrong, one env var name is wrong, and the workflow `initialState` example diverges from the default without explaining the relationship. These are not clarity issues — they are failures in the executable onramp. An OSS user following the page's curl commands will not successfully create and transition their first entity. Requires **5 correctness fixes** (4 Fix-now, 1 Reframe-post-#80). The root landing is factually clean.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| install-and-first-entity | 4 | 1 | 0 | 3 |
| root__index | 0 | 0 | 0 | 0 |
| **Total** | **4** | **1** | **0** | **3** |

## Cross-section issues noticed

1. **Endpoint path drift is endemic to the onramp.** All three endpoint examples in install-and-first-entity use `/api/models/{entityName}/entities`. Same systematic error seen in build/working-with-entities and build/searching-entities. The canonical shape is `/api/entity/{format}/{entityName}/{modelVersion}`. Wave 3 should propose one authoritative endpoint reference that all example pages cite.

2. **`cyoda serve` phantom subcommand.** Now the **fourth** page observed to reference `cyoda serve`: also present in run/desktop.md and reference/cli.mdx. There is no `serve` subcommand; it happens to work by falling through to server-start. Wave 3 should flag this as a site-wide typo and recommend a single sed/grep pass.

3. **`CYODA_STORAGE` vs `CYODA_STORAGE_BACKEND`.** Third page with this bug after run/desktop.md and run/docker.md. Wave 3 should flag as site-wide.

4. **Default workflow invisibility.** The page introduces a custom workflow example without explaining that cyoda-go ships with a default workflow (NONE → CREATED → DELETED) that applies if no custom workflow is imported. Readers don't know whether they are observing defaults or overriding them.

5. **Homebrew formula claim out of repo scope.** Install page makes a claim about Homebrew postinstall behavior that can't be verified from cyoda-go. Either pin it to the actual formula or hedge it.
