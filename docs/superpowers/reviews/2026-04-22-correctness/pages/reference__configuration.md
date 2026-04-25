---
page: src/content/docs/reference/configuration.mdx
section: reference
reviewed_by: wave2-reference
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Configuration — correctness review

## Summary
The page states configuration precedence and references the Config struct. Two significant factual errors: it claims TOML/YAML support and a `--config` flag, neither of which exists. The precedence item "CLI flags" is also imprecise about what "CLI flags" means in this context (the server process has no flag parser for config override).

## Correctness findings

### F1 — Unsupported TOML/YAML config file format and `--config` flag — **Fix now**
**Doc says:** "Config file — TOML/YAML at a default path, or passed via `--config`." (L15)
**Ground truth:** cyoda-go reads configuration exclusively from environment variables and `.env` files (via godotenv). There is no TOML or YAML loader and no `--config` flag in the server-start path.
**Citation:** `app/envfiles.go` (loads only `.env` files); `app/config.go:L80-146` (DefaultConfig() reads exclusively from environment variables via envInt/envString/envDuration/...); no `--config` flag present anywhere.
**Remediation:** Remove the TOML/YAML/`--config` claim. Reframe as: "Configuration sources: shell environment, `.env.{profile}` files (loaded per `CYODA_PROFILES`), `.env`, and user/system config files in `.env` format. See the ledger and the Run section for the full precedence order."

### F2 — Mischaracterization of "CLI flags" precedence — **Fix now**
**Doc says:** "CLI flags — the highest-precedence override for any single run."
**Ground truth:** The subcommands (`init`, `health`, `migrate`) accept operation-specific flags like `--force` and `--timeout`, but the main server process has no flag parser for configuration override. Subcommand flags are operation-specific, not configuration overrides.
**Citation:** `cmd/cyoda/init.go`, `cmd/cyoda/health.go`, `cmd/cyoda/migrate.go` (subcommand flags); `cmd/cyoda/main.go` (server-start path has no flag parsing for config)
**Remediation:** Rewrite as: "Configuration precedence (highest to lowest): shell environment > `.env.{profile}` > `.env` > user config > system config > hardcoded defaults. (Subcommands like `cyoda init` accept operation-specific flags that do NOT override server-runtime configuration.)"

## Clarity suggestions

### C1 — Profile loading detail missing
The page does not explain profile loading order. Readers benefit from knowing that `CYODA_PROFILES` is comma-separated and evaluated in declaration order, with later profiles overriding earlier ones.

### C2 — Config location OS-specificity
The page mentions "a default path" but does not note that user config paths vary by OS. This detail belongs in a reference.

## Coverage notes
The page correctly references the Config struct as the authoritative source during the awaiting-upstream phase. Post-#80, reframe to link to `cyoda help config <topic>` rather than citing the struct directly.
