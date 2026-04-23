# run section — Wave 2 review summary

**Pages reviewed:** 4
**cyoda-go ref:** 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad

## Posture

The `run` section frames the packaging ladder accurately: desktop, docker, kubernetes, and cloud tiers are correctly differentiated by operational model and storage backend. Statelessness, active-active architecture, and no leader election are correctly described. However, **two concrete bugs affect user success**: the storage backend variable name (`CYODA_STORAGE_BACKEND` not `CYODA_STORAGE`) appears incorrectly in both desktop.md and docker.md, and the shell command to start the server in desktop.md is wrong (`cyoda` not `cyoda serve`). These are not subtle clarifications — they are failures-to-run or silently-misconfigured deployments.

## Per-page bucket counts

| Page | Fix now | Reframe post-#80 | Delete post-#80 | Clarity |
|------|---------|------------------|-----------------|---------|
| run__index | 0 | 0 | 0 | 0 |
| run__desktop | 2 | 1 | 0 | 2 |
| run__docker | 1 | 0 | 0 | 3 |
| run__kubernetes | 0 | 0 | 0 | 3 |
| **Total** | **3** | **1** | **0** | **8** |

## Cross-section issues noticed

1. **Variable name `CYODA_STORAGE_BACKEND` documented as `CYODA_STORAGE`.** Appears incorrectly in desktop.md:L57 and docker.md:L41. Verified against `app/config.go:L110` (`envString("CYODA_STORAGE_BACKEND", "memory")`). A user typing `export CYODA_STORAGE=postgres` sees no effect (the wrong env var is ignored; hardcoded default "memory" is used, masking the misconfiguration). Audit the entire docs site for this pattern; may affect reference pages and examples too.

2. **Shell command `cyoda serve` not a valid subcommand.** `cmd/cyoda/main.go:L36-48` recognizes only `--help`/`-h`, `init`, `health`, `migrate`. Any other arg (including `serve`) falls through to the server-start path, so `cyoda serve` technically works today — but is misleading, not documented, and would break if a real `serve` subcommand were ever added. Fix in desktop.md:L45.

3. **Helm chart reference forward-looking note.** kubernetes.md:L54-57 says the chart's `values.yaml` is "the source of truth until that reference is published." The reference now exists at `/reference/helm/`. Update to point there directly.

4. **SQLite-as-default ambiguity on desktop.** The desktop.md page frames SQLite as "(default)" without noting the application default (`memory`) vs. the post-`cyoda init` default (`sqlite`). Homebrew path runs `cyoda init`, so the claim is correct for that flow — but a from-source or from-release-tarball user will see `memory` until they run init.

5. **Data directory location difference.** Desktop uses XDG paths; Docker pre-stages `/var/lib/cyoda`. Neither page mentions the other's location, so migrators will be confused about database file placement.

6. **PostgreSQL DSN variable not named.** docker.md references "the DSN" without saying `CYODA_POSTGRES_URL` or pointing at the `_FILE` secret pattern.

## Recommendations for post-#80 reframing

Once `cyoda help <topic>` ships, desktop.md and docker.md should link users to `cyoda help config storage` and `cyoda help config database` for env-var details rather than inline references. This keeps docs in sync with the binary's builtin help.
