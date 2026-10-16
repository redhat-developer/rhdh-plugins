## Audit Report: oci-npx-skills-registry-demo

**Last audited:** 2026-10-16T15:37:24Z

### Summary

Focused cross-artifact documentation review for task 2.5 corrections in PR #5284,
covering snapshots, configuration, scheduling, and digest-only identity policy.
This supplements the retained historical audits; it is not a new independent
full-change audit. Tasks 2.1–2.4 remain checked. Task 2.5 stays unchecked pending
maintainer verification testing.

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

- None outstanding in this focused documentation review. Runtime corrections
  and maintainer testing are still required; these are not completed gates.

### Corrections and validation

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

Implementation and additional tests are under review in PR #5284. Automated
verification passed: 467 connector tests across 16 suites with
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

- **G — Bare-digest snapshot completeness:** `workspaces/ai-integrations/openspec/changes/oci-npx-skills-registry-demo/design.md:150` says “Explicit `images[].imageRef` parsing is unchanged.”. State the normalized-snapshot outcome for configured bare digest references. The existing README and plugin.ts preserve their raw acquisition without a tagged normalized identity, while D2/D4 require stable non-digest repository/tag keys. Specify whether those references remain raw-only and whether their deliberate omission affects normalized snapshot completeness; add a matching scenario and task if applicable. This is a task 2.5 contract decision, not an acquisition change for completed task 2.4. It remains unresolved; no snapshot policy was silently chosen.

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
