## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-14T18:26:26Z

### Summary

Independent audit of proposal, design, all four capability specifications, tasks,
and change metadata, grounded in repository/workspace conventions and ownership
claims from nine sibling changes. All required artifacts are present and done;
remaining unchecked implementation tasks are intentionally in progress.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 1          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **1**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- **G — Bare-digest snapshot completeness:** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:150` says “Explicit `images[].imageRef` parsing is unchanged.”. State the normalized-snapshot outcome for configured bare digest references. The existing README and plugin.ts preserve their raw acquisition without a tagged normalized identity, while D2/D4 require stable non-digest repository/tag keys. Specify whether those references remain raw-only and whether their deliberate omission affects normalized snapshot completeness; add a matching scenario and task if applicable. This is a task 2.5 contract decision, not an acquisition change for completed task 2.4. It remains unresolved; no snapshot policy was silently chosen.

### Corrections and validation

The first pass's capability-name mismatch and stale task footer are corrected:
`skills-common` names the capability, `ai-skills-common` names its package, and
the task footer identifies 2.5 as remaining snapshot/scheduling work. The second
independent pass confirms those corrections.

Task 2.4 is implemented and checked, and the maintainer reported successful
regression testing. Proposal, D7, and OCI scenarios cover validated DNS answer
sets with IPv4 fallback, generic same-port HTTPS registry-subdomain redirects,
credential stripping, and bounded decompression before non-skill classification.
The observed 5 MiB zlib rejection is a candidate failure, not evidence of absence;
independent candidates continue unless a shared source bound stops the operation.
Task 2.5 and the common provider remain pending.

Validation passed: 414 connector tests in 15 suites, workspace `tsc:full` and
`build:all`, connector lint, formatting, strict OpenSpec validation, and journal
validation. Live probes verified discovery with one IPv6-first DNS lookup and an
annotated image's manifest/blob through a registry-subdomain CDN redirect without
additional origin configuration. No runtime code changed during this audit.
Changes remain uncommitted; the maintainer's app-config.yaml is unchanged.

**Audit clean (no CRITICAL)**; one SUGGESTION remains for task 2.5.

Fixes to one file can introduce new drift elsewhere — re-run the audit after resolving remaining findings.
