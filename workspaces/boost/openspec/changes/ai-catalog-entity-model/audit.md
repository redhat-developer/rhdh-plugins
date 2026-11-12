## Audit Report: ai-catalog-entity-model

**Last audited:** 2026-11-10T16:40:16Z

### Scope

PR #5474 follow-up limited to the four approved package-reference and scope-deferral corrections and the current-taxonomy documentation correction. Independent re-audits checked the edited contracts and their cross-artifact propagation. This is not a full re-audit of inherited requirements.

The 26 inherited observations are preserved for validation and ownership triage in [RHIDP-18929](https://redhat.atlassian.net/browse/RHIDP-18929). They are not merge conditions for this PR. Only confirmed SDK ambiguities may become prerequisites for RHIDP-18762.

### Summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 0          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 0          |
| H        | 0        | 0       | 0          |

### CRITICAL

- None

### WARNING

- None

### SUGGESTION

- None

### Resolved PR-scoped findings

- Corrected the migration plan and companion annotation specification against the current shared taxonomy: retired `ai-tool`/`vector-store` values stay retired, and model-server browsing is already supported. Updated duplicate claims in the same migration plan without changing the minimum annotation categories.

- Propagated the existing ai-catalog-entity-provider-sdk package name and paths through proposal, design, and import/install scenarios.
- Removed full air-gap qualification and new configuration/CA re-exports as minimum SDK prerequisites. Retained generic endpoint, CA, Secret, and schedule references plus minimum per-entity fault isolation.
- Marked historical qualification tasks 6.1–6.5 and verification 10.4–10.5 deferred/stretch; retained generic reference tasks 6.6–6.8 and documentation task 9.4.

### Outcome

**Audit clean (no CRITICAL)** within the stated PR scope. The independent scoped re-audit returned no remaining findings.

Fixes to one file can introduce new drift elsewhere — re-run the audit after resolving remaining findings.

## Retained historical audit and reconciliation record

The following record predates this scoped follow-up. Its counts and findings are historical and are not included in the current PR-scoped summary.

**Historical full-artifact audit:** 2026-08-14T20:15:00Z

### Historical summary

| Category | CRITICAL | WARNING | SUGGESTION |
| -------- | -------- | ------- | ---------- |
| A        | 0        | 0       | 0          |
| B        | 0        | 0       | 0          |
| C        | 0        | 0       | 0          |
| D        | 0        | 0       | 1          |
| E        | 0        | 0       | 0          |
| F        | 0        | 0       | 0          |
| G        | 0        | 0       | 1          |
| H        | 0        | 0       | 0          |

### Historical CRITICAL

- None

### Historical WARNING

- None

### Historical SUGGESTION

- **[D] `openspec/changes/ai-catalog-entity-model/tasks.md:52-54`** — Tasks 5.2 and 5.4 reference "LlamaStack provider" (`plugins/boost-backend-module-llamastack`), but this module was renamed to OGX (`plugins/boost-backend-module-ogx`). The "LlamaStack" name also appears in proposal.md, design.md, annotation-scheme/spec.md, and entity-provider-sdk/spec.md within this change, plus several sibling changes (agent-creation-discovery, pluggable-ai-platform-architecture, platform-operations-deployment). **Recommendation:** Coordinate a cross-change LlamaStack → OGX rename. **Post-cleanup note (#5548):** The `agent-creation-discovery`, `pluggable-ai-platform-architecture`, and `ai-chat-interaction-experience` sibling changes were removed; `platform-operations-deployment` was moved to `RHDHPLAN-1513-potential-openspecs/`. The LlamaStack → OGX rename recommendation applies only to surviving files within this `ai-catalog-entity-model` change.
- **[G] `openspec/changes/ai-catalog-entity-model/specs/annotation-scheme/spec.md:70`** — `normalizeAIAssetVersion` described as "a function accepting `sourceVersion: string`" but the implementation accepts an optional second `options` parameter (for entity context and custom warning callback). Design.md D6 and tasks.md 1.4 were already updated to reflect this. The spec describes behavioral contract (which is still satisfied) — the `options` param is additive. **Recommendation:** Consider adding "and optional `options` for entity context" to the spec for completeness.

### Fixes Applied (Pass 1)

- **[B] proposal.md:37** — Updated "five defined values" → "seven defined values" and added `rule`, `skill-bundle` to match design.md D1 and implementation.
- **[D] proposal.md:92-96** — Updated SDK package, validator, and OGX provider paths in the Impact section.
- **[G] annotation-scheme/spec.md:21-27** — Split combined "Missing or invalid category rejected" scenario into two: "Missing category rejected" (uses `"Invalid or missing …"` message) and "Invalid category rejected with value shown" (uses `"Invalid … value 'foo'. Allowed: …"` message), matching entity-provider-sdk spec and implementation.

### Recovery follow-up, 2026-11-05 (limited check)

The delta-sync cursor-store scenario's example now names `locationKey`, matching
the `CursorStore` parameter and the scenario's existing storage-key requirement.
This terminology correction does not change cursor behavior or resolve the
conceptual `DeltaSyncCursor.providerId` design. The full audit timestamp and
findings above remain historical; broader reconciliation belongs to RHIDP-18761.

The shared-validator missing-category scenario now includes the allowed-values
suffix emitted by `validateAIAssetEntity`, matching the companion annotation
scenario. This records the diagnostic correction without changing annotation
policy, categories, or the broader SDK design. The recovered processor methods
also have descriptive public documentation; regenerated declarations retain both
methods.

The rejected-category diagnostics now escape Unicode control characters and
line/paragraph separators as literal `\uXXXX` sequences in both validators.
Validation still uses the original value. Regression cases cover newline, tab,
terminal escape, NUL, carriage return, DEL, C1, Unicode separators, and a control
character embedded in an otherwise valid category. Missing-category assertions
also compare the complete error message, including the allowed-values hint.

### RHIDP-18761 reconciliation, 2026-11-06

Reconciled recovered RHDHPLAN-1507 specifications with the agreed 2.2 minimum
scope. Changes applied:

- Removed Neo4j adapter interface (Decision 7), SkillBundle metadata contract
  (Decision 8), and their task groups (3, 4) from the minimum baseline.
- Archived `neo4j-knowledge-graph`, `oci-skill-registry`, and
  `oci-skill-connector` change directories.
- Removed `skill-bundle` from minimum annotation obligations. The curated
  vocabulary distinguishes five minimum feature categories from existing
  `rule` compatibility. SDK implementation changes remain with RHIDP-18762.
- Removed the `air-gapped-deployment` spec from active minimum specs
  (configuration examples preserved in `connector-shared-infrastructure`).
- Separated 5,000-entity load/SLA acceptance requirements as stretch.
- Noted deferred items in delta-sync-framework (durable storage,
  invalid-cursor orchestration, incremental entity providers).
- Updated migration-readiness mappings: removed skill-bundle rows,
  updated category counts. Sign-off remains pending.
- Updated the companion documents `specifications/annotation-specification.md`
  and `specifications/ai-asset-upstream-migration-design.md` to describe the
  five-category minimum and retain `rule` mappings as compatibility references.
  Corrected the remaining stale category counts.
- Reconciled proposal, Decision 3, delta scenarios, SDK integration prose,
  and tasks with the existing helper: consumers own scheduling, source
  fetching, refresh selection, and rejected-cursor recovery. The helper
  translates deltas and reads/writes/clears state through `CursorStore`.
- Withdrew the historical automatic-method-detection claim and the rejection
  of Backstage incremental providers. Durable storage and shared orchestration
  remain deferred to RHIDP-18840; shared/per-kind contracts remain deferred
  to RHIDP-18839. This reconciliation implements neither design.
- Corrected migration-readiness links to Decision 1 and the archived
  catalog-entities reference. Other features' OpenSpecs and SDK source/API
  reports remain unchanged.

### Maintainer-directed removal of obsolete provider material, 2026-11-06

Removed obsolete provider-specific scenarios, configuration, examples, impact
paths, and cancelled tasks 5.1/5.3 from non-archived planning. Remaining task
identifiers stay unchanged. Generic reference configuration remains available.
Also removed the earlier POC-specific capability-matching design and its
analytics endpoint, scenarios, tasks, goal, and risk references from
`ingestion-audit-metrics`.
This cleanup does not select a replacement source or capability schema.

### Review follow-up, 2026-11-09

- Extended the retired-provider cleanup to the companion annotation
  specification, current-status document, and frontend architecture reference.
  Removed the obsolete connector row, source examples, permission entry,
  status endpoint, and provider-specific UI assumptions. No replacement
  provider or runtime permission change is introduced.
- Restored individual historical load-task entries 7.1–7.6 with their original
  descriptions and identifiers. Every entry remains struck through and marked
  deferred/stretch, outside minimum implementation scope.
- Replaced the deleted air-gap dependency in the shared-infrastructure
  proposal with its surviving CA and reference-configuration specifications.
  This changes the cross-reference, not that feature's requirements.
- Preserved the analytics scenario identifiers after the deliberate removal
  of Scenario 3. Other features' category and bundle contract reconciliation
  remains follow-on work.

### Agent mapping follow-up, 2026-11-10 (limited check)

Confirmed `kind: AiResource`, `spec.type: agent` against the OGX agent provider
and the shared taxonomy. Reconciled Decision 1, the proposal, SDK contract,
migration-readiness scenario, and upstream annotation references to that settled
mapping. The former Component migration remains explicitly historical. Future
upstream schema alignment does not reopen the chosen RHDH kind/type. This check
does not implement SDK changes or resolve the deferred metadata/incremental-sync
design. The earlier full-audit findings above retain their original scope.
