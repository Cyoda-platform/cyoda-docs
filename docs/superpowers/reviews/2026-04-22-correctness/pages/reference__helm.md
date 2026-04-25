---
page: src/content/docs/reference/helm.mdx
section: reference
reviewed_by: wave2-reference
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Helm values — correctness review

## Summary
Navigation shim for the awaiting-upstream Helm values reference. It correctly links to the authoritative `values.yaml` in cyoda-go and references Run → Kubernetes for deployment context. No factual errors detected.

## Correctness findings

### F1 — Navigator role post-#80 — **Reframe post-#80**
**Doc says:** Awaiting-upstream banner with link to the chart's `values.yaml`.
**Ground truth:** Once `cyoda help helm` ships (cyoda-go #80), this page's role becomes a navigator: link to the help topic (authoritative, pinned to the installed release) and keep the Run → Kubernetes cross-reference for narrative.
**Citation:** N/A (planning).
**Remediation:** Post-#80, reframe with a "From the binary: `cyoda help helm`" callout pointing to the help topic; drop the awaiting-upstream banner once the help surface covers the values contract.

## Clarity suggestions
None.

## Coverage notes
The page correctly defers to `values.yaml` as the authoritative source. Link to Run → Kubernetes is appropriate.
