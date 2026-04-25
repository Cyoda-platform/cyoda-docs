---
page: src/content/docs/reference/cli.mdx
section: reference
reviewed_by: wave2-reference
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# CLI — correctness review

## Summary
The page correctly delegates to `cyoda --help` as the authoritative source during the awaiting-upstream phase. One factual error: it claims serving is via `cyoda serve`, but there is no `serve` subcommand — the default (no subcommand) invocation starts the server.

## Correctness findings

### F1 — Incorrect subcommand name for server — **Fix now**
**Doc says:** "serving (`cyoda serve`)" (L21)
**Ground truth:** The default (no subcommand) invocation starts the server. Subcommands are `--help`/`-h`, `init`, `health`, and `migrate` only. Any argument that doesn't match one of those falls through to the server-start path; `serve` happens to work today because the arg is ignored, but `serve` is not a recognized subcommand.
**Citation:** `cmd/cyoda/main.go:L36-48` (switch handles only --help/-h/init/health/migrate)
**Remediation:** Rewrite as "serving (run `cyoda` with no subcommand)" or "serving (`cyoda` — the default command when no subcommand is specified)".

## Clarity suggestions

### C1 — Explicit subcommand list
Consider explicitly listing all available subcommands with their purpose: `cyoda init` (initialize user config), `cyoda health` (probe readiness), `cyoda migrate` (schema migration), and the default (run server). This reduces friction for readers looking for the full list and preempts the same `cyoda serve` confusion.

## Coverage notes
The page correctly notes that each subcommand's flags mirror the configuration environment variables, and directs readers to the Configuration page for the cross-reference. Appropriate for the awaiting-upstream phase.
