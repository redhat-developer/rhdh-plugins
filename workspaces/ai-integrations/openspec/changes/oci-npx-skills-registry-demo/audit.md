## Focused PR #5339 follow-up: test-boundary comment and prose wrapping

**Last audited:** 2026-10-26T17:03:01Z

The combined TechDocs test now documents why it replaces registry I/O through
an internal sibling-package OciClient path. The comment requires its Jest mock,
requireActual and requireMock references to move together if that module is
relocated, and states that missing targets fail Jest resolution. No public test
injection API or stability promise was added to production code.

The conditional-fetch prose in D8 and the reader README was soft-wrapped to match
surrounding paragraphs. Word-level comparisons confirm those edits preserve the
text exactly. Runtime behavior, configuration, public APIs, changesets and all task
statuses are unchanged. The prior 6.5 verification and maintainer regression
evidence remains below; this is not a new full-change audit.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

No unresolved artifact inconsistencies were identified in this focused scope.
Historical audit entries are preserved in full.

---

## Task 6.5 completion: integrated verification and conditional-reader correction

**Last audited:** 2026-10-26T15:45:44Z

PR #5339 now maps the whole task 6.5 matrix to focused new coverage and existing
6.1–6.4 regression suites. See [verification.md](verification.md) for test paths,
mock boundaries, commands, and reproducible maintainer instructions. Historical
audit entries below remain unchanged.

The new combined test uses actual annotated, tar and tar+gzip extraction and
normalization, a running authenticated connector HTTP backend with SQLite content
storage, a file-backed provider store, native fetch, provider annotations and
acknowledgments, and actual reader MkDocs files. Registry manifest/blob I/O and
processed Catalog API visibility are fixtures. Four distinct catalog entities
include same-digest aliases sharing documents; tag movement changes one document
URL without changing its entity reference. This is not a live catalog processing
worker or a full mkdocs build. Prior 6.4 maintainer rendering evidence remains
separate from this automated verification.

The native path exposed a real conditional-request interaction: default Node
fetch cache policy suppresses the connector's matching 304 via request cache
control. Explicit revalidation cache mode fixes this for conditional OCI skill
reads. The combined test failed before the fix and passed after it; a unit fetch
assertion guards the option. The maintainer approved this production correction
and requested a patch changeset. Model-card behavior and public APIs are unchanged;
the API report requires no content changes. Two provider development dependencies
and their lockfile references are test composition only, not production dependencies.

Other strengthened tests verify different content per digest, three byte-limited
partial refreshes, the real 1,000-retained-digest ceiling with repeated rejected
admissions followed by a retained-only inventory drain and successful re-admission,
a promise-held cleanup overlapping another refresh, and persisted content surviving
a recovered store's reduced-budget rejection. Existing durable acknowledgment,
visibility-delay, authorization/body-boundary, extraction-limit, redirect and
model-card suites are referenced instead of falsely claiming those all run in the
connector lifecycle fixture's in-memory store.

Automated suites pass: 630 connector tests, 142 provider tests and 70 reader tests
(842 total across 32 suites). Task 6.5 is checked at the maintainer's explicit
request. The maintainer waived another broad manual regression for test-only work,
then requested a quick manual regression of the approved reader correction; that
quick manual regression was subsequently confirmed successful by the maintainer.
This records the reported result without inventing specific manual cases or HTTP
observations. No app-config.yaml or other task statuses were changed.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

This focused artifact/evidence update is not a fresh independent full-change audit.
There are no unresolved artifact inconsistencies in this scope. The maintainer
confirmed successful regression testing and authorized this local commit; another
Fullsend review will follow signing and pushing.

---

## Task 6.4 completion: maintainer end-to-end TechDocs verification

**Last audited:** 2026-10-23T19:59:56Z

After rebasing PR #5330 onto merged task 6.3 (PR #5324), the maintainer
confirmed that SKILLS.md rendered as TechDocs from both imported OCI skill
entities. This verifies the provider annotation and URL-reader integration through
the running TechDocs path. The result is maintainer-reported manual verification;
it does not imply additional manual security, failure, or retention test coverage.

Task 6.4 is now checked in tasks.md. This entry supersedes the pending rendering
verification status in the historical 6.4 follow-up below. Prior automated evidence
remains valid: the rebased branch passed 70 reader tests and 141 provider tests,
full type checking, Prettier, and strict OpenSpec validation. Task 6.5 remains
unchecked; this completion does not claim its broader integration matrix is done.
No runtime code, configuration, or API contract changed in this documentation update.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

This is a focused completion/evidence update, not a new full-change audit.
All earlier audit entries are preserved below.

---

## Focused PR #5324 final review follow-up: logging and documentation

**Last audited:** 2026-10-23T19:34:52Z

The provider no longer logs delivery errors immediately before rethrowing them;
the initial-delivery or retry caller logs each failure once. Error propagation,
pending acknowledgment persistence, and retry source blocking are unchanged.
Blocked-source key reuse, import ordering, and migration JSDoc were tidied without
changing reconciliation or migration behavior.

README, D8 and the provider scenarios now distinguish snapshot acquisition's
individual step deadlines from the shared 30-second visibility phase (auth and
catalog queries) and shared 30-second delivery phase (discovery, auth and POST).
The code retains these stricter phase bounds. Eligible ready OCI snapshots with
revisions may acknowledge unchanged/repeated observations; idempotent connector
handling is intentional. Recovery blocks, stale observations, deferrals, and
failures prevent unconditional delivery on every scheduled run. A successful
catalog reconciliation can have a separately logged, durable pending acknowledgment.

The major changeset retains the required store/client/method contracts and now
explains removal of the implicit in-memory fallback without presenting removal of
a private class as an independent API break. Additive types and dependencies need
no compatibility remediation. No task status or app-config.yaml changes were made.

Regression verification: 141 provider tests across ten suites pass. Two new real
SQLite cases reproduced duplicate logs before the fix and now verify exactly one
error entry for initial and retry delivery failures, retained pending work, and
blocked polling on retry. This focused consistency update preserves all historical
audit entries and does not claim a new full-change audit or maintainer approval
of these uncommitted follow-up changes.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

No unresolved inconsistencies were identified within this focused scope.

---

## Focused task 6.4 review follow-up: trusted destinations and ETags

**Last audited:** 2026-10-23T19:06:42Z

This entry records PR #5330's OCI skill documentation reader implementation and
its review corrections. It supersedes earlier no-task-status-change wording only
for this follow-up; historical entries below retain their original scope.

The URL-reader service factory now resolves configured OCI connector bases through
Backstage discovery before publishing the synchronous reader factory. Both reader
selection and direct reads require the exact trusted origin and complete base
pathname, preserving deployment prefixes and decoding each route segment once.
Malformed percent escapes produce no match. Skill-documentation paths cannot
fall through to the legacy model-card substring matcher. Untrusted skill URLs are
rejected before requesting or sending a service token.

Successful skill-docs responses must supply a nonblank ETag, validated before the
response body is adapted or locked. Missing validators produce a protocol error
rather than an empty cache key. Valid ETags pass through unchanged; conditional
requests, 404/304 propagation, and minimal MkDocs generation remain covered.
Model-card requests now reject redirects while retaining their cache behavior.
Delivery-plan wording was removed from source comments. The optional routing
metadata refactor was deferred because the current priority is consistent.

D8, the TechDocs scenarios, README, changeset and task note describe the same
behavior. Task 6.4 is unchecked pending maintainer rendering/regression testing;
this entry does not claim task 6.3 or 6.5 completion. No app-config.yaml changes
were made.

Automated verification: 70 tests across two reader suites passed, including
red/green reproductions of off-origin matching, missing discovery prefixes,
malformed encoding, absent ETags, redirect policy and service-factory discovery
wiring. A real Response/body adapter test covers authenticated prefixed reads
and ETag passthrough; a missing-ETag case verifies rejection before body locking.
Full workspace type checking/build, package lint and API report CI checks passed.
Reader HTTP/auth/discovery boundaries are fixtures; live TechDocs rendering remains
the maintainer's next verification step.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

No unresolved artifact inconsistencies were found in this focused scope. This is
not a new full-change audit or an end-to-end rendering result.

---

## Focused task 6.3 completion follow-up: release context and visibility

**Last audited:** 2026-10-23T18:13:03Z

This focused consistency check covers the provider implementation, D8, provider
scenarios, task 6.3, README, and major changeset. It does not re-audit unrelated
pending tasks. Historical entries below retain their original scope and dates.

The provider now requires processed catalog visibility verification and persists
complete release context before a ready OCI mutation. Recovery uses that context
before retrying acknowledgments or polling newer snapshots. Deferred visibility
blocks only its source; incomplete query responses cannot prove removal. Partial
and stale observations cannot authorize release. An unchanged digest/timestamp
still permits the annotation upgrade required by 6.3. External provider operations
have deadlines and authenticated HTTP requests reject redirects.

The additive migration preserves existing state. Revision-only pending OCI deltas
from pre-release builds fail closed for operator investigation; their ready versus
partial provenance cannot be reconstructed safely. This limitation is documented
in D8 and the README rather than silently dropping pending obligations.

Automated provider coverage passes: 139 tests across 10 suites, including real
SQLite crash/reopen and transaction rollback, delayed catalog processing while
connector revisions advance, partial replay, stale URLs, annotation upgrades,
encoded source IDs, duplicate retention owners, deadlines, and cancellation.
Maintainer regression verification passed: the OCI TechDocs annotation is present.
End-to-end rendering awaits the separate task 6.4 reader.
Task 6.3 remains checked; this check makes no completion claim for 6.4 or 6.5.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

No unresolved inconsistencies were identified within this focused scope.

---

## Task 6.3 implementation: PR #5324 OCI TechDocs acknowledgment

**Last audited:** 2026-10-23T12:00:00Z

Task 6.3 is now implemented. The catalog provider sets
`backstage.io/techdocs-ref` on OCI skill entities, captures
`X-Skilldocs-Revision`, persists durable acknowledgments with catalog
visibility verification, retries pending acknowledgments before polling,
handles superseded revisions (409), persists revision in pending deltas
for crash-safe replay, acknowledges no-op ready OCI plans, isolates
per-ack errors in the retry loop, and rejects duplicate retention-owner
assignments at startup. The `ReconciliationStore` interface now requires
four acknowledgment lifecycle methods (breaking change, `major` bump).

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

This is a focused task-completion update, not a new full-change audit.

---

## Focused review follow-up: PR #5319 test precision and initialization docs

**Last audited:** 2026-10-22T20:17:54Z

The partial-retention test now aligns its previously owned A tuple with the
incoming fixture, verifies exactly two resulting identities, verifies A's updated
digest, and compares absent B against its unchanged saved entity. The stronger
assertion reproduced the old three-entity fixture mismatch before correction.
Constructor documentation and README now explicitly assign custom-store
initialization to the supplying caller before provider connection. The module
already performs that step; production behavior and public signatures are unchanged.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

This is a focused consistency update, not a new independent full-change audit.
Earlier successful runtime verification remains below. No production behavior
change, new configuration, or task-status change is introduced by this follow-up.

---

## Focused review follow-up: PR #5319 namespace and migrations

**Last audited:** 2026-10-22T17:53:23Z

This focused update covers the namespace and schema-management corrections after
the prior maintainer regression verification. It is not a new full-change audit;
previous reports and their verification evidence remain below.

Removal plans now carry original catalog entity references. Repeated observations
do not suppress namespace migration. Partial observations preserve both old and
new identities until ready cleanup. Legacy pending removals resolve against
persisted ownership and block safely if it cannot be recovered unambiguously.
Production schema setup uses a packaged module-scoped Knex migration and lock,
adopts compatible existing tables without deleting rows, rejects missing-column
schemas, and honors Backstage migration skipping. The shared helper follows the
flat testUtils.ts convention with a development-only dependency lint exception.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

Design, provider scenarios, task annotations, README, and changeset now cover these
behaviors. Task 4.5 remains implemented. Maintainer regression testing of these newest
corrections passed. Inspection of /tmp/ggm-dev.log and read-only SQLite queries
confirmed recovery of two previously stored Markdown entries, preservation of two
catalog ownership records during loading, and successful refresh of both configured
images without duplicate catalog mutations. Namespace and migration failure cases
are covered by automated tests; they are not claimed as separate manual exercises. Public store methods remain
required and the internal implementation remains absent from the package entry
point. API and automated check results are recorded in the implementation handoff.

---

## Focused implementation verification: PR #5319 (RHIDP-17331)

**Last audited:** 2026-10-22T16:41:01Z

This entry supersedes earlier pending-work descriptions only for the provider
implementation addressed by PR #5319. Historical reports below are preserved.
This is a focused consistency check, not a new audit of the entire change.

The provider blocks newer observations for a source whose pending mutation
replay or ownership commit fails. Other sources continue independently. Real
file-backed SQLite tests replace the in-memory stand-in previously used for
store tests, verify state through a new connection, and exercise atomic rollback.
Provider lifecycle tests cover outages, interrupted additions followed by removal,
replay failure, repeated replay, partial retention, invalid responses, both source
types, same-digest tag aliases, and stable identity when a tag moves. Existing
config/consumer/planner tests supply duplicate-config, validation, and collision
coverage. The internal database class is removed from package exports and the
API report is regenerated.

| Severity   | Count |
| ---------- | ----- |
| CRITICAL   | 0     |
| WARNING    | 0     |
| SUGGESTION | 0     |

No new cross-artifact contradiction was identified in this focused update.
Task 4.5 is marked implemented; maintainer basic regression testing passed.
File-backed SQLite restart and rollback verification is automated; the local
app-config.yaml still uses in-memory storage on this branch. Automated verification passed (96 provider tests, type check,
build, package lint, API report validation, formatting, and strict OpenSpec validation);
automated coverage does not claim live demo acceptance or completion of future
TechDocs acknowledgment tasks. Automated command results are reported in the
implementation handoff.

---

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-21T19:03:14Z

### Summary

Focused implementation/specification consistency update for PR #5297's retention
review corrections. This is not a new independent full-change audit. The connector
now commits an acknowledgment and its exact eligible deletions in one database
transaction, updating memory only after commit. Startup recovers remaining rows
without inferring deletions from historical retain sets. Configured database,
migration, and recovery errors prevent startup instead of enabling volatile
publication. Every completed ready/partial/failed snapshot receives a durable
revision; only the current ready revision may authorize new cleanup.

README and D8 now describe the transaction, restart protection, failure behavior,
completed-observation revisions, and controlled inventory drain. Optional blank
catalogProviderPluginId values use catalog; wrong types are rejected. ContentStore
requires external per-source serialization, provided by the connector's lock.
Task 6.1 is checked based on merged PR #5292 and the maintainer's earlier endpoint
verification. Task 4.2 completion remains intact. Tasks 4.3–4.5 and 6.3–6.5 are not
completed by these changes. The maintainer reported successful regression testing of these retention
corrections before authorizing the commit; earlier historical verification is
not reinterpreted as that sign-off.

| Focused artifact consistency            | CRITICAL | WARNING | SUGGESTION |
| --------------------------------------- | -------- | ------- | ---------- |
| Remaining findings in this focused pass | 0        | 1       | 0          |

### Findings

- CRITICAL: None in this focused pass.
- WARNING: The current journal helper does not recognize two pre-existing
  historical event names, `status.correction` and `status.completion`, introduced
  by the earlier status-tracking PRs. Those entries are preserved unchanged;
  the new `artifact.revised` entries were accepted by the helper. This is a
  historical journal/helper compatibility issue, not a retention code failure.
- SUGGESTION: None in this focused pass.

### Verification scope

Regression coverage uses real SQLite through initialize(database), including
migration/recovery reads, protection of newer unacknowledged content and current
snapshot content, transaction rollback on an actual SQL DELETE failure, retry
after recovery, and database startup failures. HTTP coverage verifies revisions
on partial/failed observations, rejection of partial cleanup requests, retained
Markdown, and idempotent retry of a prior successful acknowledgment. These tests
reconstruct the store over the database; they do not claim abrupt-process crash
or PostgreSQL verification. Connector tests pass (598 tests across 18 suites),
including migration failures and SQL-trigger rollback. Workspace type checking,
build, formatting, strict OpenSpec validation, and changed-package lint pass.
Workspace-wide lint exits with a worker out-of-memory error, including a host
retry with an increased heap; it is not reported as passing.

---

## Historical reports before PR #5297 retention corrections

**Last audited:** 2026-10-21T19:00:00Z

### Summary

Covers PR #5315 (RHIDP-17330): source-scoped reconciliation planner for
skill entity deltas. Adds `calculateReconciliationPlan`, a pure function
computing deterministic upsert/removal deltas from committed ownership
state and a validated connector snapshot. Implements design D6's status
table (ready/partial/loading/failed), stale/repeated observation
detection, and cross-source identity collision diagnosis. Includes 29
unit tests covering partial-result retention, ready-result removal,
successful empty discovery, source isolation, digest/content changes,
stale/repeated observations, collision detection (internal, external,
partial-snapshot retention), and edge cases. design.md updated with a
task 4.4 partial-completion progress note in the D6 blockquote. tasks.md
updated with a progress note on task 4.4 crediting the pure decision
logic and noting remaining durable persistence and runtime integration
work gated by RHIDP-17331. This is a focused audit of the new source
files and documentation annotations; no new independent full-change
audit of previous specifications was performed.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Scope and validation

- reconciliation-planner.ts: pure function with no database/network side
  effects; handles loading/failed short-circuit, stale/repeated observation
  detection, internal and external collision diagnosis, ready-snapshot
  removals, and partial-snapshot retention.
- types.ts: nine new public types exported (`OwnedEntity`,
  `CommittedSourceState`, `ExternalOwnership`, `ReconciliationPlanInput`,
  `PlannedUpsert`, `PlannedRemoval`, `IdentityCollision`,
  `ReconciliationPlan`, `MappedSkillEntity` was pre-existing).
  `ReconciliationPlan` is a discriminated union on `noOp` with typed
  `reason` values for short-circuit and computed-empty plans.
- reconciliation-planner.test.ts: 29 tests across loading/failed statuses,
  stale/repeated observations, ready upserts/removals, partial retention,
  identity collision detection (internal, external, ready + previously-owned,
  partial + previously-owned, same-tuple dedup), source isolation,
  digest/content changes, and edge cases (empty input, null observedAt,
  observation-time-only advancement).
- design.md: D6 blockquote extended with task 4.4 partial-completion note.
- tasks.md: task 4.4 annotated with progress note.
- README.md: behavior section updated to note `calculateReconciliationPlan`
  export.
- No new independent full-change audit was performed. Verification evidence
  is from this PR's test results.

---

## Previous audit reports

The following report covers the state before PR #5315.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-21T15:30:00Z

### Summary

Focused documentation update restoring task 4.2 completion after PR #5304
merged the remaining source-reference validation and owner/lifecycle
defaulting work (RHIDP-17329). PR #5304 adds upfront source-reference
validation before mapping entities (rejecting malformed OCI references,
OCI URI/digest disagreement, and invalid npx references without mutations),
applies configured owner/lifecycle defaults to invalid nonblank hints, adds
eight consumer regression tests, updates the provider README behavior, and
adds three scenarios and npx-reference validation wording to
`specs/skills-catalog-provider/spec.md`. PR #5304 reports 45 passing
package tests and successful lint, TypeScript, formatting, and API-report
checks. This evidence is attributed to #5304; no new independent audit or
additional manual verification was performed.

Task 4.2 is checked in tasks.md with a completion note crediting the initial
mapping in PR #5291 and the validation/defaulting completion in PR #5304.
The design.md simplification note is updated to describe the complete
implementation timeline. The 2026-10-20 status correction (which reopened
4.2) and the 2026-10-18 historical report are preserved below with their
original verification scope. The scope clarification reconciling the
earlier RHIDP-17331 completion gate is explicit: task 4.2's
snapshot-validation and entity-construction scope is complete through
#5291 + #5304, while RHIDP-17331's broader runtime/reconciliation work
remains tracked separately under tasks 4.3–4.5. This does not imply
RHIDP-17331 has merged or its acceptance criteria have passed. Tasks
4.3–4.5, 6.3, and all other unchecked tasks remain pending. This is a
documentation-only change — no TypeScript, tests, or runtime modifications.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Scope and validation

- tasks.md: task 4.2 checked with completion note crediting #5291 + #5304;
  task 4.1 and all other completed tasks remain checked; tasks 4.3–4.5, 6.3,
  and other unchecked tasks remain pending.
- design.md: simplification note updated to describe the complete 4.2
  implementation timeline (#5291 initial mapping, #5304 validation/defaulting);
  consumer validation failure rejection requirement preserved; scope
  clarification reconciling the earlier RHIDP-17331 completion gate is
  explicit.
- audit.md: new dated status update supersedes the 2026-10-20 reopening
  report's current status; the reopening report and the 2026-10-18 historical
  report are preserved below with their original scope. Cross-reference note
  added adjacent to the historical correction so the "reopened" statement
  cannot be mistaken for current state.
- proposal.md and specs/: inspected for stale current claims that
  validation/defaulting work is outstanding; no stale claims found. The #5304
  scenarios and stronger whole-snapshot validation requirement are preserved.
  Legitimate downstream dependencies on completed 4.2 (including task 6.3)
  are preserved.
- journal.jsonl: completion event appended referencing #5304; #5301 correction
  event and all earlier history preserved.
- No new independent full-change audit was performed. Verification evidence
  is attributed to #5304's reported results.

---

## Historical audits before task 4.2 completion restoration

The following reports describe earlier states and retain their original
verification scope.

## Audit Report: oci-npx-skills-registry-demo (task 6.2 implementation)

**Last audited:** 2026-10-21T12:00:00Z

### Summary

Updated for task 6.2 implementation in PR #5297. Task 6.2 (bounded durable Markdown content storage per source with revision tracking, provider-authorized reconciliation, and restart recovery) is now checked. This supplements the retained historical audits; it is not a new independent full-change audit. Historical audit reports and their verification scope are preserved below.

---

## Audit Report: oci-npx-skills-registry-demo (2026-10-20 status correction)

> **Status update (2026-10-21):** The two code gaps identified below
> (source-reference validation and owner hint defaulting) were addressed by
> PR #5304, which merged on 2026-10-21. Task 4.2 is now checked; see the
> current report above for the complete timeline. This reopening report
> remains valid historical evidence that the earlier completion claim in
> the 2026-10-18 audit was premature.

**Last audited:** 2026-10-20T19:37:00Z

### Summary

Focused status correction reopening task 4.2, which was prematurely marked
complete during task 4.1 implementation in PR #5291. This is a documentation-only
correction — no TypeScript, tests, or runtime changes. Targeted probes reproduced
two remaining gaps: `consumeSnapshot` silently skips records with source-reference
construction/validation errors while still returning success, allowing an
incomplete full mutation that can remove previously cataloged entities; and
nonblank invalid owner hints are emitted unchanged instead of falling back to the
configured default. Task 4.2 is reopened in tasks.md with a progress note
acknowledging the substantial mapping already implemented (OCI/npx entity
construction, separate tag aliases, stable identities). The 2026-10-18 historical
audit summary claiming 4.2 completion is annotated with a dated correction
preserving the original report. The design.md simplification note is clarified to
describe initial 4.1 implementation and partial 4.2 progress, not completion or
waiver. No unrelated completed tasks are reopened. RHIDP-17329 requires re-triage;
RHIDP-17331 is the integration/completion gate. Historical audit reports and their
verification scope are preserved below.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Scope and validation

- tasks.md: task 4.2 unchecked with progress note; task 4.1 and all other
  completed tasks remain checked.
- audit.md: dated correction on the 2026-10-18 historical summary; original
  report preserved below the correction block.
- design.md: simplification note clarified for initial implementation and
  partial 4.2 progress; consumer validation failure rejection requirement added.
- proposal.md and specs/: no additional explicit 4.2 completion claims found;
  no changes needed.
- journal.jsonl: correction event appended; historical events preserved.
- No new independent full-change audit was performed. Remaining gaps and the
  RHIDP-17331 completion gate are explicit for RHIDP-17329 re-triage.

---

## Historical audits before task 4.2 status correction

The following reports describe earlier states and retain their original
verification scope.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-19T19:19:03Z

### Summary

Focused direct review of the two low-severity documentation findings against PR #5273 head 3cd7882042. This is a scenario-organization and authentication-prose correction, not another independent full-change audit. Historical audit reports and their verification scope are preserved below.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Corrections and verification scope

- The unauthorized GET scenario now contains only its credential condition, authentication failure, and URL-reader outcome. Default GET authentication is stated in the dedicated Markdown endpoint requirement. The provider-service-only retention POST contract is stated in the connector retention acknowledgment requirement. Authentication behavior remains unchanged.
- Extraction equivalence has its own requirement, with the existing scenario and per-image manifest identity preserved. The unauthorized GET scenario is grouped with authentication, the size scenario with MkDocs generation, and only conditional-request scenarios remain under ETag semantics.
- Direct checks preserve all existing scenario headings and task completion markers. Strict OpenSpec validation, workspace Prettier, and diff whitespace checks verify this documentation-only correction.

---

## Historical audits before scenario organization corrections

The following reports describe earlier states and retain their original verification scope.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-19T18:35:14Z

### Summary

Focused cross-artifact follow-up to the four low-severity findings in Fullsend review 5575766203 against PR #5273 head d04abad2b4. This records direct verification of these corrections, not another independent full-change audit. Historical independent audit reports and their scope are preserved below. No findings remain outstanding within this focused review.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Corrections and verification scope

- D8, the OCI requirements/scenarios, and tasks 6.2/6.5 now define optional backend-only `skillImageConnector.maxRetainedMarkdownSizeBytes`: positive safe integer, default 50 MiB (52,428,800 bytes), independently applied per source. Extraction continues to use `maxAggregateContentSizeBytes`; omission does not couple either default to the other setting. Invalid values and startup limits below retained content are rejected without deletion.
- The fixed 1,000-retained-digest limit remains aligned with the protocol/acknowledgment bounds. Raising bytes cannot fix count exhaustion. D8 specifies a controlled inventory drain under the same source ID: reconcile retained-only tagged inputs or a valid raw-only digest input, confirm catalog processing, acknowledge cleanup, then restore discovery within both bounds. Excluded catalog entities are deliberately removed; retention resets and source disablement are not shortcuts.
- The TechDocs capability is described only under Modified Capabilities, preserving the existing model-card capability ownership. Inline prose uses "added requirements."
- Existing task completion states and incoming OCI scenarios are preserved. Section 6 remains pending implementation; this change adds no runtime configuration handling or TypeScript code.

Validation: strict OpenSpec validation, workspace Prettier, direct cross-artifact checks of default/independence/recovery behavior, and `git diff --check`. See the append-only journal for the focused review result.

---

## Historical audits before this focused Fullsend follow-up

The following reports describe earlier states and retain their original verification scope.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-19T17:45:07Z

### Summary

PR #5273 follow-up: applied the six approved audit recommendations across the
proposal, design, three affected capability specs, and section 6 tasks. All
required artifacts passed the apply-ready minimum. Three isolated auditor passes
in this correction round evaluated categories A–H with convention documents,
sibling ownership claims, and light code grounding. The table records findings
from the final isolated pass, not outstanding findings: its two findings were
subsequently corrected and directly checked as documented below. No fourth
independent pass was run, respecting the three-pass limit. Historical reports
are preserved in full below; their findings describe earlier states.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 1       | 1          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **1**   | **1**      |

### CRITICAL

- None

### WARNING

- **G — Catalog processing can lag mutation acceptance. Addressed after the
  final isolated pass; directly checked.**
  `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:558`.
  Recommendation: do not release old documentation solely because a provider
  mutation and ownership commit succeeded. The design, provider scenarios, and
  task 6.3 now require persisted expected entity references and documentation
  URLs, catalog visibility confirmation before acknowledgment, and bounded
  retries without cleanup on processing errors or timeouts. The new delayed
  processing scenario covers the transition explicitly.

### SUGGESTION

- **G — Dot source IDs cannot round-trip through URL parsing. Addressed after
  the final isolated pass; directly checked.**
  `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:621`.
  Recommendation: reject source IDs exactly equal to `.` or `..` in source
  configuration validation. D8, the documentation-safe source identifier
  scenario, and task 6.4 now require this restriction and validation coverage.

### Approved recommendations resolved

- Preserve the full discovery-resolved connector base pathname when constructing
  and matching documentation URLs; encode and decode segments once and reject
  off-base destinations and redirects without forwarding credentials.
- Require durable provider acknowledgments after ready reconciliation and catalog
  visibility confirmation before releasing old Markdown. Define revision matching,
  authorization, idempotency, superseded requests, and restart recovery. State the
  demo's single connector instance and single active provider runner per source.
- Store content before publishing its record. Bound retained bytes and digest count;
  preserve retained content and report failed new admissions as partial snapshots.
- Trust the authenticated connector's manifest-to-Markdown binding; do not compare
  a Markdown hash to a manifest digest.
- Require equivalent rendered content across extraction layouts, with each image's
  own verified manifest digest in its URL.
- Restore the OCI capability bullet and classify TechDocs as an extension of the
  existing model-card capability, preserving that capability during spec sync.

Interim audit suggestions also clarified that default Markdown GET authentication
accepts valid user or service credentials, while retention POST requires the
configured provider service principal; a missing recovered document does not
promise a cached TechDocs build already exists. Unavailable content is consistently 404. All task 2.1–2.5 completion states and incoming OCI scenario headings remain
preserved; section 6 implementation tasks remain unchecked.

### Validation

Strict OpenSpec validation, workspace `yarn prettier:check`, `yarn tsc`, immutable
workspace dependency installation, and `git diff --check` passed. Installation
reported existing peer-dependency warnings. This PR changes documentation only;
no runtime implementation or new unit tests were introduced. The final two
corrections received direct cross-artifact checks rather than another isolated
pass; Fullsend review provides the next independent review.

**Audit clean (no CRITICAL)**. No findings remain unapplied; the scope and limits
of independent versus direct verification are stated above.

Fixes to one file can introduce new drift elsewhere — re-run the audit after resolving remaining findings.

---

## Historical audit before approved corrections

The following material is historical and does not describe the current finding status.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-19T17:36:14Z

### Summary

Independent cross-artifact audit of PR #5273 after restoring incoming task 2.5 scenarios and completion notes lost in the main-branch merge. Proposal, design, tasks, and all five capability specs passed the apply-ready minimum. Categories A–H were evaluated against workspace conventions, condensed sibling ownership claims, and relevant existing plugin code. This is an artifact audit, not implementation verification. Historical audit material is preserved below.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 1       | 2          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 1          |
| G — Extended coherence     | 0        | 2       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **3**   | **3**      |

### CRITICAL

- None

### WARNING

- **C: Match URLs relative to the complete connector base.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/specs/techdocs-integration/spec.md:7`. Match the skilldocs route beneath the complete discovery-resolved connector base, including its pathname. Backstage normally produces /api/skill-image-connector/skilldocs/..., which does not start with /skilldocs/. Align D8 and the reader scenarios.
- **G: Coordinate cleanup with successful catalog reconciliation.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:530`. A connector ready snapshot can advance before the independently scheduled provider updates the catalog. Define an acknowledgment or explicit retention protocol before deleting old digests; test provider outages and failed catalog mutations.
- **G: Define storage admission when retained documentation fills the bound.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/specs/oci-skills-connector/spec.md:381`. Repeated partial refreshes can accumulate active documentation beyond a fixed bound. Specify rejection of new records whose documentation cannot be retained, preserve existing content, mark the snapshot partial, and align connector/provider tasks and tests.

### SUGGESTION

- **C: Clarify what digest validation means.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/proposal.md:30`. A manifest digest is not a hash of extracted Markdown. State that the reader validates the digest-addressed route and trusts authenticated connector storage, or define a separate Markdown digest/proof contract if independent byte verification is intended.
- **C: Require equivalent Markdown rather than identical manifest digests across layouts.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/specs/techdocs-integration/spec.md:130`. Annotated and archive images normally have different manifests and digests. Require equivalent rendered documentation, with each URL containing its own image's verified manifest digest.
- **F: Restore the missing OCI capability bullet.** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/proposal.md:69`. Restore an oci-skills-connector capability bullet and attach the dedicated Markdown endpoint description to it. The fragment currently follows skills-common, incorrectly suggesting endpoint ownership by the pure shared library.

**Audit clean (no CRITICAL)**. Recommendations remain unapplied for maintainer review.

Fixes to one file can introduce new drift elsewhere — re-run the audit after resolving remaining findings.

---

## Historical audits preserved from the rebased branch

The following reports describe earlier states and scopes; their timestamps, findings, and verification notes are historical.

## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-18T16:09:12Z

> **Correction (2026-10-20):** The summary below declared task 4.2 complete
> alongside 4.1; that declaration was premature. PR #5291 introduced substantial
> snapshot validation and AiResource entity construction (OCI/npx entity
> construction, separate tag aliases sharing a digest, stable identities across
> title/content changes), but the complete 4.2 contract was not verified.
> Remaining gaps reproduced in targeted probes: `consumeSnapshot` returns
> success when a source-reference validation error causes a record to be
> skipped, allowing an incomplete full mutation that can remove previously
> cataloged entities; and nonblank invalid owner hints (e.g., `group:default/`)
> are emitted unchanged instead of falling back to the configured default.
> Task 4.2 is reopened in tasks.md. RHIDP-17329 requires re-triage; the
> integration/completion gate (RHIDP-17331) must wire the mapper to the
> validation path and verify complete provider behavior before 4.2 can be
> rechecked. Task 4.1 and all previously completed tasks (1.1–1.3, 2.1–2.5)
> remain checked. This correction does not erase the genuine testing that
> confirmed 4.1 and the partial 4.2 mapping implementation.

> **Status update (2026-10-21):** The two gaps identified above were
> subsequently addressed by PR #5304 (merged 2026-10-21): upfront
> source-reference validation and owner/lifecycle hint defaulting. Task 4.2
> is now checked; see the current report at the top of this file.

### Summary

Updated for task 4.1 and 4.2 completion in PR #5291, covering the common skills
catalog entity provider implementation. Tasks 4.1 (provider scaffolding with
independently configured source instances, Backstage discovery, and service
tokens) and 4.2 (snapshot validation and AiResource entity construction using
D3/D5 mappings) are now checked. This supplements the retained historical audits;
it is not a new independent full-change audit. Tasks 2.1–2.5 and 4.1–4.2 are
checked. The maintainer confirmed successful testing and review.

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A — Entity propagation     | 0        | 0       | 0          |
| B — Enum / vocabulary      | 0        | 0       | 0          |
| C — Semantic contradiction | 0        | 0       | 0          |
| D — Codebase / conventions | 0        | 0       | 0          |
| E — Ownership              | 0        | 0       | 0          |
| F — Template residue       | 0        | 0       | 0          |
| G — Extended coherence     | 0        | 0       | 0          |
| H — Security lint          | 0        | 0       | 0          |
| **Total**                  | **0**    | **0**   | **0**      |

### CRITICAL

- None identified in this focused documentation review.

### WARNING

- None identified in this focused documentation review.

### SUGGESTION

- None outstanding in this focused documentation review. Maintainer verification of the
  latest normalization/budget corrections remains pending; earlier maintainer testing
  supports the existing task 2.5 completion marker.

### Corrections and validation

The latest focused review corrections always mark retained-content budget
rejections incomplete, even for bare-digest inputs without tagged failure keys.
Normalization explicitly handles ambiguous, non-skill, inconsistent normalized,
and unsupported outcomes, releasing rejected/skipped files. The structural source
parser omits placeholder acquisition fields, and the README documents 404 error
objects without promising exact diagnostic wording.

Automated verification passed: 513 connector tests across 16 suites with
`--watchAll=false --runInBand`, workspace `yarn tsc:full` and `yarn build:all`,
and connector lint. These are implementation checks, not a new independent
full-change audit. Maintainer regression testing of these latest corrections is
pending; the existing task 2.5 completion reflects the prior confirmed testing.

The former bare-digest completeness suggestion is resolved explicitly: digest-only
inputs remain raw-only without invented tagged identities or normalized failure
keys. Their deliberate exclusion alone does not prevent `ready`; replacing tagged
inputs with digest-only inputs may remove those tagged records and permit future
catalog ready-result removals. Design D5, OCI scenarios, and README state this
consequence consistently.

D6 and OCI scenarios distinguish empty `partial` results from total discovery
failure, preserve candidates from successful listing pages, and require incomplete
pagination and limits to prevent `ready`. Snapshots are cached, authenticated,
published atomically, and refreshed with local Backstage tasks per backend instance.
Source IDs are required and decoded only once by routing. Redirect origins are
isolated per source; flat origins apply only to legacy source `default`. Numeric
acquisition limits stay top-level. Raw readiness is independent of normalization.

The latest review corrections retain raw extraction maps per source and rebuild
`/images` atomically at source publication. Duplicate image references use the
first configured successful source; aggregate failed references exclude any
retained success. Source refresh cleanup must not delete another source's files,
and shutdown includes duplicate extractions hidden from the aggregate inventory.
The OCI specification and README now state these ownership and aggregation rules.
Mixed explicit/flat configuration emits a field-name-only warning while preserving
the documented ignore policy. Task 5.1 credits task 2.5 for its OCI schema and
examples; npx and common-provider configuration remain unchecked scope, not merely
integration verification. Automated verification passed for these corrections:
507 connector tests across 16 suites with `--watchAll=false --runInBand`,
workspace `yarn tsc:full` and `yarn build:all`, connector lint, and workspace
Prettier. Independent code verification passed. The mixed-configuration path
also skips validation of ignored flat origins. The maintainer subsequently
confirmed successful regression testing of those source-ownership corrections.
Task 2.5 stays checked based on the prior maintainer verification below.

**Previously verified implementation:** The standard-schedule migration is implemented and maintainer testing passed. Documentation describes
Backstage-parsed frequency and timeout, optional initial delay, cron and manual
frequency, enforced local scope, and the default timeout derived from the source
deadline. Manual mode does not automatically acquire at startup; configured
initial delays are honored. Automated verification passed: 492 connector tests
across 16 suites with `--watchAll=false --runInBand`, workspace `yarn tsc:full`
and `yarn build:all`, connector lint, and workspace Prettier. Independent review
of the migration passed. The maintainer confirmed successful regression testing
and review; task 2.5 is complete.

**Earlier verification before the standard-schedule migration:** The custom
`refreshIntervalMinutes` implementation and review corrections previously passed: 467 connector tests across 16 suites with
`--watchAll=false --runInBand`, workspace `yarn tsc:full` and `yarn build:all`,
and connector lint. Independent code verification passed after correcting
cancellation following a usable discovery page. Tests cover retained discovery
prefixes, empty partial results, once-decoded IDs, isolated source origins,
startup loading, subsequent refresh publication, reverse-order budget retention,
and abort-listener cleanup. This is not a new full-change artifact audit or live
cluster verification. Task 2.5 stays unchecked until maintainer verification
testing succeeds. Common catalog provider implementation remains outside this
connector task.

### Prior current report — task 2.4 acquisition safety

The report below is retained apart from heading depth and its timestamp label.
Its counts, results, and task 2.5 suggestion describe the state before PR #5284;
the current assessment above supersedes those statements.

#### Audit Report: oci-npx-skills-registry-demo

**Historical audit timestamp:** 2026-10-14T18:26:26Z

##### Summary

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

##### CRITICAL

- None

##### WARNING

- None

##### SUGGESTION

- **G — Bare-digest snapshot completeness:** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:150` says "Explicit `images[].imageRef` parsing is unchanged.". State the normalized-snapshot outcome for configured bare digest references. The existing README and plugin.ts preserve their raw acquisition without a tagged normalized identity, while D2/D4 require stable non-digest repository/tag keys. Specify whether those references remain raw-only and whether their deliberate omission affects normalized snapshot completeness; add a matching scenario and task if applicable. This is a task 2.5 contract decision, not an acquisition change for completed task 2.4. It remains unresolved; no snapshot policy was silently chosen.

##### Corrections and validation

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

### Historical audit record — through task 2.3

**History restored:** 2026-10-15T17:05:29Z, from commit `827f5cf93987`.

The following record restores the earlier audit narrative and results. Its task
statuses, finding counts, test totals, and commit/push notes describe the state
at the time and are superseded by the current assessment above. In particular,
references to task 2.4 and connection-level DNS protection as pending are historical;
task 2.4 is now checked. The historical summary table is separate from the current
summary and does not replace the current task 2.5 verification status. Only heading levels
and the historical timestamp label have been adjusted; the prior narrative is retained.

#### Audit Report: oci-npx-skills-registry-demo

**Historical audit timestamp:** 2026-10-13T16:25:09Z

This focused follow-up reviews the all-active-tag discovery pivot against the
proposal, design, OCI/common/provider specifications, task status, implementation,
and regression tests. It supplements the earlier independent specification
reviews, including the 2026-10-02 review; it is not a claim that the remaining
connector and provider tasks have been implemented.

Strict OpenSpec validation, relative links, workspace TypeScript, and workspace
Prettier checks passed. This audit evaluates specification coherence, not runtime
implementation; task 1.1 is checked (implemented in `ai-skills-common` PR #5061),
task 1.2 is checked (implemented in `ai-skills-common` PR #5072, adding
`normalizeOciMetadata` and `normalizeNpxMetadata` with D3 precedence, tag/author
normalization, allowlisted extensions, diagnostics, and native metadata fixtures),
task 1.3 is checked (implemented in `ai-skills-common` PR #5071), and task 1.4
is annotated with shared-library completion status.
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

At the time of the task 2.1 review, runtime work remained scoped to task 2.1. The current raw `/images` endpoint keeps
its response shape and existing failure accounting. Discovery truncation is
logged, and tag-list failures follow the existing discovery error path. Complete
normalized snapshot status, non-skill classification, digest-pinned acquisition,
periodic refresh, and actual catalog entity production remained in unchecked tasks
2.2–2.5 and section 4. The task 2.2 completion check below supersedes that
historical acquisition status. Raw explicit digest references remain supported without
inventing a tag. Shared tasks 1.1 and 1.3 remain complete, with the shared-library
portion of 1.4 noted separately.

Independent verification passed with no outstanding findings. Complete package
suites passed (233 connector tests and 166 shared-library tests), along with
workspace type checking/build, package lint, and strict OpenSpec validation.
Verifier results and validation commands are recorded in the journal and handoff.
The maintainer subsequently reported successful testing and authorized a local
commit; signing, pushing, and the next Fullsend review remain maintainer-owned.

##### Fullsend review follow-up

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

##### Latest Fullsend review clarification

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

##### Task 2.1 documentation clarification

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

##### Task 2.2 completion check

This focused consistency check covers PR #5152 against task 2.2 and the
RHIDP-17781 acceptance criteria. It supplements the earlier audits; it is not
an independent full-change audit or a claim that tasks 2.3–2.5 are complete.

Tagged acquisitions resolve a SHA-256 manifest digest once per acquisition,
after any resolution retries. Extraction retries reuse that digest. Raw manifest
bytes are verified before parsing or layer retrieval. Both annotated-layer and
tar extraction paths already use `OciClient.fetchBlob`, which verifies descriptor
size and blob digest before extraction. The former partial-task note incorrectly
identified blob digest verification as missing and has been removed.

The connector now reuses `ai-skills-common`'s digest validator, OCI reference
builder, and `OciSkillRecord` field types for internal acquisition metadata.
Invalid or missing resolved digests fail before extraction. Metadata preserves
a stable case-sensitive tagged key across tag movement, distinguishes aliases
that share a digest, and records a verified digest-addressed source URI.
Explicit digest references remain supported without an invented tag, and the
raw `/images` API response remains unchanged.

New integration tests exercise the real plugin, OCI client, and extraction
service with mocked registry HTTP responses. They verify a transient blob
failure after resolution, a tag moving between acquisitions, same-digest tag
aliases, resolution retries, invalid resolution digests, explicit digest input,
and rejection of manifest, blob digest, and blob size mismatches. Manifest
mismatch tests verify that no layer is fetched.

The complete connector suite passed (264 tests), as did the shared-library suite
(166 tests), workspace `tsc:full`, `build:all`, API report validation, and
connector lint, and strict OpenSpec validation. Dependency installation and
deduplication completed with install scripts disabled. The workspace formatting
check reports only the maintainer's existing `app-config.yaml` formatting; all
other checked files pass. Task 2.2 is marked complete; normalization, connection-level
DNS protection, snapshots, scheduling, and catalog production remain pending.
The maintainer's `app-config.yaml` edits are untouched. The maintainer subsequently reported successful sanity testing and authorized
a local commit. Signing, pushing, and the next Fullsend review remain
maintainer-owned.

##### Task 1.2 review follow-up

This focused consistency check covers the latest PR #5072 review. Both D3
normalizers and the D5 `normalizeTags` helper now use Backstage's default
catalog tag pattern. Dots, underscores, and consecutive hyphens are omitted
with diagnostics. Colons, plus signs, and hash characters remain supported.
The earlier extended-pattern documentation contradicted D3's catalog-valid
requirement and has been corrected in the JSDoc, README, and changeset.

Development-only tests compare the shared pattern and 63-character limit
with `makeValidator().isValidTag`, then check OCI, npx, and catalog-helper
normalization against that validator. These regressions failed before the
correction and now pass. Backstage remains absent from runtime dependencies.
The redundant normalizer-module constants re-export is removed; package-root
exports remain. Tag diagnostic wording is explicitly informational.

The task narrative no longer duplicates task 1.4 or describes completed 2.1
and 2.2 as future implementation. Task definitions and completion states are
unchanged. Internal diagnostic assertions and the frontmatter type aliases
remain intentional; neither requires a public API refactor. This focused
check does not replace the earlier independent audits.

All 239 shared-library tests passed with `--watchAll=false --runInBand`.
Workspace type checking, API report validation, package build/lint, workspace
formatting, strict OpenSpec validation, and dependency installation/deduplication
passed. Review replies record fixes and retained behavior. Changes remain local
until maintainer signing and pushing.

##### Task 2.3 completion and review follow-up

This focused consistency check covers PR #5230 and RHIDP-17842. It supplements
the earlier audits and task 2.2 completion check; it does not claim that tasks
2.4 or 2.5 are complete.

Verified annotated raw files, tar files, gzip tar files, and valid file pairs
split between supported layouts feed SkillCard YAML and optional Markdown
frontmatter into the shared D3 normalizer. Both SkillCard and Markdown filename
aliases are covered. Manifest metadata annotations are not mandatory for valid
skillctl-style archives. Trusted tagged identity, digest, and source URI remain
separate from native fields.

Partial annotated matches retain their descriptors and content. Annotated raw
file descriptors are excluded from tar parsing even when their media type says
tar. Matching files are counted across supported layouts, duplicate archive
entries, and archive layers. Competing matches raise the typed ambiguity error;
a confirmed missing pair raises the typed non-skill error. Plugin integration
tests verify debug-level non-skill skips, ambiguity failures, continued processing,
cleanup, and no retries for these terminal classifications.

Frontmatter parsing distinguishes absent/empty optional frontmatter from
malformed content. Delimiters must occupy a line, including CRLF support.
Unclosed, invalid, scalar, or array frontmatter produces a malformed result even
when the SkillCard could otherwise supply sufficient metadata. The OCI spec now
records this scenario and valid split-layout extraction explicitly.

Real acquisition-to-normalization tests use registry HTTP fixtures with actual
manifest/blob hashes and descriptor sizes. They validate resulting records with
the shared snapshot validator and cover D3 precedence, annotation-free archives,
case-sensitive same-digest aliases, stable identity after tag movement, and raw
explicit digest acquisition. The raw `/images` payload remains compatible;
malformed normalization has no normalized record while successful raw extraction
remains available with diagnostics. No separate unused normalization map remains.

The complete connector suite passed: 333 tests in 13 suites. Workspace
`tsc:full`, `build:all`, API report checks, package lint, and workspace formatting
passed. The targeted regressions reproduced nine failures before the fixes.
Task 2.3 is checked; task definitions and completed prerequisites are preserved.
Connection-level DNS protection and exhaustive hardening remain task 2.4.
Authenticated snapshots, source configuration, failure publication, and periodic
refresh remain task 2.5. The maintainer reported successful debugger and live
registry testing with both the skillctl archive image and the ORAS annotated
raw-layer image, then authorized a local commit including their current
`app-config.yaml` examples. Signing, pushing, and the next Fullsend review
remain maintainer-owned.

### OCI skill TechDocs scope extension

This scope extension adds design D8 (OCI skill TechDocs), a new
`specs/techdocs-integration/spec.md`, and updates to the proposal, design
(D2/D5/D6/D7 cross-references), OCI connector spec (dedicated Markdown
endpoint, content storage/lifecycle), provider spec (`backstage.io/techdocs-ref`
annotation), and tasks (section 6). The extension reuses the HTTP-based
model-card TechDocs integration pattern established in the
`techdocs-modelcard-finalization` change.

Cross-artifact consistency was reviewed for endpoint addressing
(`/skilldocs/:sourceId/:digest`), authentication (service tokens targeted to
the receiving connector plugin), digest identity (verified manifest digest binds
documentation to the entity), content lifecycle (retention through partial
refreshes and restarts, cleanup after `ready` snapshots), failure behavior
(no successful empty documentation on failure), frontmatter handling (preserved
as-is), scope (OCI only, single document, no bundled assets), and dependencies
(tasks 2.5, 4.2, 2.4, 4.3–4.4).

The following scenarios are specified across the connector, provider, and
URL-reader specs: annotated-layer and tar/tar+gzip Markdown producing
equivalent documentation; unauthorized access; unknown source/content; a moving
tag updating the TechDocs annotation; same-digest aliases sharing
documentation; partial refresh/restart content retention; size limits; and
existing model-card integration remaining functional.

No new raw-content fields are added to shared v1 records. No new core entity
schema, runtime implementation, TypeScript, app-config.yaml, package files,
lockfiles, workflow/agent configuration, or unrelated OpenSpec changes are
included. No changeset is needed for this specification-only change. The
TechDocs feature is not implemented or tested; all section 6 tasks are
unchecked. Dependencies on tasks 2.5, 4.2, 2.4, and 4.3–4.4 are identified
in the task descriptions.

Existing task numbering, completed checkboxes, and task definitions are
unchanged. Task 2.4 (connection safety, RHIDP-17933) is not enlarged; the
TechDocs endpoint uses Backstage's default backend authentication, separate
from D7's upstream egress restrictions.

##### Summary

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

##### CRITICAL

- None

##### WARNING

- None

##### SUGGESTION

- None
