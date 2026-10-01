## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-01T18:52:37Z

This focused follow-up reviews the task 2.1 acquisition/configuration changes
against the design, OCI connector scenarios, task status, runtime implementation,
and regression tests, including source-specific 404 diagnostics. The reporting
flag suppresses only discovered-image 404 warnings/errors; explicit image and
organization-listing diagnostics and raw API failure accounting are preserved.
The follow-up also covers optional `maxImages` configuration: the default remains
25, explicit images and discovered candidates share the configured total, explicit
references take priority, and discovery duplicates do not consume another slot.
Tests cover a 75-repository inventory, default and overridden limits, explicit
list validation, and invalid numeric values. This candidate budget is separate
from the unchanged four-operation concurrency bound and D2 snapshot limits.
It supplements the previously recorded independent
specification audit; it is not a new independent audit of all runtime code.
No new specification-coherence findings were identified within this scope.

Task 1.1 is implemented in `ai-skills-common` (PR #5061); task 1.4 documents the
completed shared-library portion and remaining connector tests. Task 2.1 is
implemented in PR #5057. Tasks 2.2–2.4 and the other unchecked tasks remain pending.
The footer in `tasks.md` and the task 2.1 follow-up in D7 now agree on that scope.

The OCI specification, design, and plugin README describe the same optional
settings, separate byte-limit scopes, retry boundaries, and cancellation behavior.
The existing retained-content budget is explicitly distinguished from the future
D7 per-image download/decompression budget. Shared redirect checks are not claimed
to complete D7's configured-origin policy. D2/D3/D5 contracts and the npx/provider
requirements are unchanged.

Strict OpenSpec validation passed. Runtime validation evidence is reported with
the implementation handoff; a live-cluster test remains the maintainer's next step.
Recheck this audit when changing the corresponding artifacts.

### Summary

| Category                               | CRITICAL | WARNING | SUGGESTION |
| -------------------------------------- | -------- | ------- | ---------- |
| A — Entity propagation                 | 0        | 0       | 0          |
| B — Enum / vocabulary                  | 0        | 0       | 0          |
| C — Semantic contradiction             | 0        | 0       | 0          |
| D — Codebase & convention grounding    | 0        | 0       | 0          |
| E — Namespace & cross-change ownership | 0        | 0       | 0          |
| F — Template/copy-paste residue        | 0        | 0       | 0          |
| G — Extended coherence                 | 0        | 0       | 0          |
| H — Security lint                      | 0        | 0       | 0          |
| **Total**                              | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None
