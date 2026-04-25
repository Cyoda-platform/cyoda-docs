---
page: src/content/docs/run/desktop.md
section: run
reviewed_by: wave2-run
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Desktop (single binary) — correctness review

## Summary

The page accurately describes the desktop packaging, its two storage modes, and the lifecycle of the binary. However, two concrete claims are incorrect: the shell command to start the server and the environment variable name for storage selection. Both are verifiable bugs that will cause user confusion and failures.

## Correctness findings

### F1 — Shell command to start server — **Fix now**
**Doc says:** "To start the server: `cyoda serve`" (L45)
**Ground truth:** The binary has no `serve` subcommand. `cmd/cyoda/main.go:L36-48` switches only on `--help`/`-h`, `init`, `health`, `migrate`; any other argument falls through to the default path (LoadEnvFiles + DefaultConfig + server start). Running `cyoda serve` technically starts the server because the `serve` argument is ignored, but it misleads readers into thinking `serve` is a supported subcommand and would stop working if a real `serve` subcommand (e.g. a future noop lint) were added.
**Citation:** `cmd/cyoda/main.go:L36-48`
**Remediation:** Change line 45 from `` `cyoda serve` `` to `` `cyoda` ``. The binary is invoked with no subcommand to start the server.

### F2 — Storage backend environment variable name — **Fix now**
**Doc says:** "the defaults are fine, and you only set a handful of variables (`CYODA_STORAGE`, listen ports, JWT keys)" (L57)
**Ground truth:** The environment variable is `CYODA_STORAGE_BACKEND`, not `CYODA_STORAGE`. `cmd/cyoda/init.go` writes `CYODA_STORAGE_BACKEND=sqlite` to the user config, and `app/config.go:L110` reads from `CYODA_STORAGE_BACKEND`. A user typing `export CYODA_STORAGE=postgres` will silently see no effect (the wrong env var is ignored; the hardcoded default "memory" is used).
**Citation:** `app/config.go:L110`, `cmd/cyoda/init.go` (writes CYODA_STORAGE_BACKEND)
**Remediation:** Change `CYODA_STORAGE` to `CYODA_STORAGE_BACKEND` on line 57.

### F3 — Storage backend default clarification — **Reframe post-#80**
**Doc says:** "SQLite (default)"
**Ground truth:** SQLite is the default *only after* `cyoda init` is run. The application default (`app/config.go:L110`) is `memory`. The page frames this as the user running Homebrew, which does run `cyoda init`, so the claim is not wrong — but the phrasing "default" could mislead readers who skip init or run the binary directly without init.
**Citation:** `app/config.go:L110`; `cmd/cyoda/init.go`
**Remediation:** Clarify that SQLite is the default *after* the Homebrew installer runs `cyoda init`. Post-#80, replace the inline clarification with a pointer to `cyoda help config storage`.

## Clarity suggestions

### C1 — Upgrade path ordering
The page lists "Upgrading" before "When you outgrow desktop". For a reader deciding whether to use desktop at all, the "When you outgrow" section should come first. Reorder these sections so the reader sees growth-path warning before upgrade mechanics.

### C2 — SQLite durability emphasis
The page says SQLite data "survives restarts; backup is a file copy" but does not mention that SQLite is single-writer (writes serialize through the file). Readers choosing SQLite should know about the concurrency limitation upfront before reading the "outgrow" section.

## Coverage notes

- **Present but thin:** The CLI reference link and Configuration reference link assume the reader knows what "Reference → CLI" and "Reference → Configuration" point to. A brief parenthetical like "(see Reference → CLI for health, migrate subcommands)" would help.
- **Expected but missing:** No mention of the data directory location on each OS (e.g. `~/.local/share/cyoda/cyoda.db` on Linux via XDG). Desktop users later migrating to Docker (which pre-stages `/var/lib/cyoda`) will need to know where their data lives.
