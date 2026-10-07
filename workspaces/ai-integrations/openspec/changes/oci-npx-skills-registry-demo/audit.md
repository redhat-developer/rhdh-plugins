## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-07T17:44:41Z

This focused follow-up reviews the all-active-tag discovery pivot against the
proposal, design, OCI/common/provider specifications, task status, implementation,
and regression tests. It supplements the earlier independent specification
reviews, including the 2026-10-02 review; it is not a claim that the remaining
connector and provider tasks have been implemented.

An omitted or blank discovery tag now selects all active tags. Explicit tags
remain exact filters, and `tag: latest` preserves the former default. Repository
and tag pages share the existing request utilities and one 100-page budget.
Distinct repository/tag candidates remain separate even for identical digests;
`maxImages` counts those candidates together with explicit references.

The normalized OCI key changes from repository-only to repository plus exact,
case-sensitive tag. D3/D4/D5, the OCI/common/provider specs, and the shared fixtures
now agree: every valid skill-image tag yields its own record and catalog entity,
a moved tag retains its identity, and confirmed non-skills yield no entity.
Digest-addressed source URI serialization and declared-version mapping do not
change. The shared string-key validator and identity helper already support this
contract; regression tests cover same-digest tagged keys and distinct names.
The npx identity and acquisition requirements are unchanged.

Runtime work remains scoped to task 2.1. The current raw `/images` endpoint keeps
its response shape and existing failure accounting. Discovery truncation is
logged, and tag-list failures follow the existing discovery error path. Complete
normalized snapshot status, non-skill classification, digest-pinned acquisition,
periodic refresh, and actual catalog entity production remain in unchecked tasks
2.2–2.5 and section 4. Raw explicit digest references remain supported without
inventing a tag. Shared tasks 1.1 and 1.3 remain complete, with the shared-library
portion of 1.4 noted separately.

Independent verification passed with no outstanding findings. Complete package
suites passed (233 connector tests and 166 shared-library tests), along with
workspace type checking/build, package lint, and strict OpenSpec validation.
Verifier results and validation commands are recorded in the journal and handoff.
The maintainer subsequently reported successful testing and authorized a local
commit; signing, pushing, and the next Fullsend review remain maintainer-owned.

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
