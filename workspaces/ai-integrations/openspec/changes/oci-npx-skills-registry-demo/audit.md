## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-08T17:37:21Z

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

### Fullsend review follow-up

The maintainer approved the review disposition against PR #5057 head
`f01d89dfc11eb0f781ac86bef77d8bf4dd7af5d6`. This focused artifact check covers
D7, task 2.4, and the added OCI DNS-change scenario. They consistently require
destination validation for the address used by the connection. Task 2.4 remains
unchecked; task 2.1 retains its existing preflight lookup and does not claim
protection against DNS rebinding between validation and connection. The connector
README now states that limitation and retains the network-egress guidance.

The shared-library changeset uses a minor release and explains the transition
from repository-only keys to tagged keys. Hashing and validators are unchanged,
and upgrading the library alone does not migrate identities. Configurable
fallback constants use `DEFAULT_*` names with unchanged values. Test grouping,
blob-limit documentation, and the aggregate-budget comment are cleanup only.
The maintainer's `app-config.yaml` is unchanged.

The 233 connector tests, workspace `tsc:full` and `build:all`, and strict OpenSpec
validation passed for this cleanup. No new runtime safety task is marked
complete. The maintainer subsequently reported successful sanity testing and
authorized a local commit. Signing, pushing, and the next Fullsend review remain
maintainer-owned.
The focused artifact check found no additional specification inconsistencies;
summary counts below remain zero. The earlier independent verification remains
recorded above and in the journal.

### Latest Fullsend review clarification

The maintainer accepted the review disposition for PR #5057 head
`c5b6dd7268d59c69a74bfc6417caebe2c485ede4`. A global review comment and replies
record the decisions; all ten current threads are resolved. Resolution records
planned fixes and deferred scope, not a claim that the local edits are pushed.

The internal 404 logging flag is named `logNotFoundAsError` in code and design.
It retains error logging for explicit images and debug logging for discovered
candidates. Configuration comments and the README clarify that an omitted or
blank organization skips discovery with a warning; the field remains optional.
A controlled integration test retains a discovered image before releasing a
pending explicit result, then verifies the retained-byte budget and cleanup of
the rejected explicit result. Candidate admission priority is unchanged.

This focused check found no specification contradictions. The minor changeset,
per-tag identities, task 2.4 connection safety, and task 2.5 partial-discovery
scope remain unchanged. The full connector suite passed with 234 tests, including
the reverse-completion case; workspace type checking and connector lint passed.
The maintainer's app-config.yaml is unchanged. The maintainer subsequently
reported successful testing and authorized a local commit. Signing, pushing,
and the next Fullsend review remain maintainer-owned.

### Task 2.1 documentation clarification

The maintainer approved the review disposition for PR #5057 head
`190bcba8814ef747a5b476991a13f65d1c71dae0`. This focused consistency check
covers the task 2.1 wording and the configuration documentation; it does not
replace the independent audits recorded above.

Task 2.1 now explicitly includes the seven optional acquisition settings and
shared HTTP/retry utilities already documented in D7. Configuration JSDoc states
the existing runtime ranges: byte limits and `maxImages` are positive safe
integers, `maxRetries` is a nonnegative safe integer, and timeout/base-delay
values are integers from 1 through 2,147,483,647 milliseconds. A comment explains
the separation between numeric option parsing and configuration parsing that
reuses OCI validators. No schema annotations, validation behavior, task status,
or acquisition behavior change.

D5 already documents the catalog identity transition, and D7/task 2.4 retain
connection-level destination validation as future work. The minor changeset and
shared pagination bounds remain unchanged. This focused check found no new
cross-artifact inconsistencies; summary counts below remain zero. The
maintainer's `app-config.yaml` edits are untouched. Strict OpenSpec validation
and formatting checks of the revised documentation passed. The workspace-wide
formatting check reports only the maintainer's existing `app-config.yaml`
formatting; that file was left untouched. The documentation changes remain
uncommitted for maintainer review.

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
