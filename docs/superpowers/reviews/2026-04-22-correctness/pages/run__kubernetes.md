---
page: src/content/docs/run/kubernetes.md
section: run
reviewed_by: wave2-run
reviewed_on: 2026-04-22
cyoda_go_ref: 6442de4696854ee8aa3b6d2ea9345b9c96eb6aad
status: reviewed
---

# Kubernetes — correctness review

## Summary

The Kubernetes page accurately describes the production deployment shape, architecture, and operational model. All claims about statelessness, active-active clustering, PostgreSQL as the only stateful dependency, and no leader election are grounded in cyoda-go. The Helm chart configuration is correct. No factual errors found.

## Correctness findings

None.

## Clarity suggestions

### C1 — HMAC secret coupling
The page mentions Pod Disruption Budgets but does not mention that the Helm chart auto-generates the HMAC secret (`cluster.hmacSecret.existingSecret`) on first install if not provided. GitOps operators must supply `existingSecret` to avoid Helm rendering a different secret on every reconcile. This is load-bearing for production GitOps workflows.

### C2 — Database migrations ordering
The page says "Check the release notes for whether a release requires a PostgreSQL schema migration step before the new binary starts serving." It does not mention that the Helm chart runs migrations as a pre-install/pre-upgrade hook and blocks pod startup until migrations complete. Worth noting so operators understand the migration safety posture.

### C3 — Cluster node coordination mechanism
The page says "Every pod is identical; any pod can serve any request. There is no leader election, no ZooKeeper, no etcd." Accurate but the mechanism is not mentioned. A sentence like "Coordination happens through PostgreSQL's SERIALIZABLE isolation for writes and a gossip protocol for membership" would ground the claim.

## Coverage notes

- **Present but thin:** The sizing guide is qualitative and does not mention that bottlenecks are write-driven (PostgreSQL throughput) not pod count. Could be more explicit: "Sizing is driven by write volume more than read volume, because reads scale horizontally across pods while writes serialize through PostgreSQL."
- **Expected but missing:** No mention of the Helm chart's `replicas` scaling. The `values.yaml` defaults to `replicas: 1` but the page says "3 to ten cyoda-go pods" without explaining how to get from 1 to 3 (via `--set replicas=3`).
- **Present but thin:** The Helm chart reference note says the chart's `values.yaml` is the source of truth "until that reference is published." The reference now exists at `/reference/helm/` — update the note to point there directly.
