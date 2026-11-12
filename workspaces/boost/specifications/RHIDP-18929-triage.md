# RHIDP-18929: Inherited OpenSpec Findings Triage

> **Audit snapshot:** `f557f4b73d306c0783eb645b366130ae3f435310`
> (compared with PR base `391d5beea476d52f6b11a0c81759ffd7c0638c50`).
>
> **Source:** Cross-artifact audit performed during RHIDP-18761 and
> [rhdh-plugins PR #5474](https://github.com/redhat-developer/rhdh-plugins/pull/5474).
>
> **Purpose:** Triage all 26 inherited observations, record a
> disposition for each, identify the exact subset (if any) that must
> be resolved before RHIDP-18762 (SDK reconciliation).

## SDK-Readiness Decision

No additional SDK prerequisite was identified among these 26 findings.
The confirmed corrections in this PR clarify the baseline documentation;
owning-feature follow-ups and deferred design decisions remain separate.

- **#7 and #22 (model-server kind):** The current kind is
  `AiModelServerAPI`, with `spec.type: ai-model-server`. The dedicated
  catalog model and existing providers agree. Current-state references
  are corrected accordingly. A candidate upstream `API` mapping remains
  conditional future migration work, not the current mapping.
- **#17 (audit-events secret redaction):** The traceability snapshot now
  includes config-change redaction. Authoritative audit-event work remains
  with RHIDP-15280. The restored SDK has no audit-event or config-change API,
  so this observation does not add auditing work to RHIDP-18762.

This decision covers the inherited observations only. RHIDP-18762 still
must satisfy its own SDK reconciliation acceptance criteria and dependencies.

## Disposition Legend

| Disposition                  | Meaning                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **Spec correction**          | Observation confirmed; correction applied in this PR.                             |
| **Not reproducible**         | Observation was valid at audit time but the file has already been reconciled.     |
| **Deferred design**          | Observation confirmed; resolution requires a design decision beyond this triage.  |
| **Owning-feature follow-up** | Observation confirmed; owned by another feature or workspace.                     |
| **SDK prerequisite**         | Observation confirmed; must be resolved before RHIDP-18762. Corrected in this PR. |

## Inventory Dispositions

### 1. ai-integrations/airesource-agent-typed-schema (G / SUGGESTION)

**File:** `workspaces/ai-integrations/openspec/changes/airesource-agent-typed-schema/design.md:82`
**Observation:** Structured toolChoice object shape undefined.
**Disposition:** Owning-feature follow-up.
**Rationale:** This is in the `ai-integrations` workspace, not `boost`.
The structured branch shape for toolChoice needs defining by the
ai-integrations feature owner.

---

### 2. ai-integrations/mcp-registry-provider (C / SUGGESTION)

**File:** `workspaces/ai-integrations/openspec/changes/mcp-registry-provider/specs/mcp-registry-provider/spec.md:210`
**Observation:** "unchanged" should be "mapping-owned fields unchanged" plus degraded sync-status annotation.
**Disposition:** Owning-feature follow-up.
**Rationale:** This is in the `ai-integrations` workspace. Line 220
already specifies the detailed behavior; the summary at line 210 does
not reflect it. The MCP registry provider feature owner should
reconcile.

---

### 3. ai-integrations/mcp-registry-server-mapping — annotation projection (A / WARNING)

**File:** `workspaces/ai-integrations/openspec/changes/mcp-registry-server-mapping/specs/mcp-registry-annotation-projection/spec.md:18`
**Observation:** `modelcontextprotocol.io/icons.0.mimeType` should be lowercase `mimetype`.
**Disposition:** Owning-feature follow-up.
**Rationale:** This is in the `ai-integrations` workspace. The
annotation key must comply with catalog-valid-key mandatory lowercase
sanitization per D3. The MCP server-mapping feature owner should fix.

---

### 4. ai-integrations/mcp-registry-server-mapping — design D7 (C / SUGGESTION)

**File:** `workspaces/ai-integrations/openspec/changes/mcp-registry-server-mapping/design.md:145`
**Observation:** D7 fail-open/no-data-loss claims should include D9 secret redaction and D12 null/empty omissions.
**Disposition:** Owning-feature follow-up.
**Rationale:** This is in the `ai-integrations` workspace. The
MCP server-mapping feature owner should qualify D7 with all
established omissions.

---

### 5. boost/ai-catalog-entity-model — design skill/rule casing (A / SUGGESTION)

**File:** `workspaces/boost/openspec/changes/ai-catalog-entity-model/design.md:69`
**Observation:** Mapping table uses `AIResource` for skill and rule rows.
**Authoritative contract:** AGENTS.md entity kind naming convention.
**Disposition:** Spec correction.
**Correction:** Changed `AIResource` → `AiResource` in the mapping
table skill/rule rows and the stakeholder alignment note at line 31.
The migration-path description at line 79 retains `AIResource` as the
historical "from" value.

---

### 6. boost/ai-catalog-entity-model — migration-plan ai-model removal (C / WARNING)

**File:** `workspaces/boost/openspec/changes/ai-catalog-entity-model/specs/migration-readiness/migration-plan.md:330`
**Observation:** Migration plan removes standalone ai-model entities while spec retains the mapping.
**Disposition:** Deferred design.
**Rationale:** The spec describes the current-state mapping ("continue
using current mapping"), while the migration plan describes the future
action (removal when migration executes). This is an intentional
spec/plan distinction — the ai-model migration policy will be
reconciled when migration actually begins.

---

### 7. boost/ai-catalog-entity-model — migration-readiness kind (E / WARNING)

**File:** `workspaces/boost/openspec/changes/ai-catalog-entity-model/specs/migration-readiness/spec.md:82`
**Observation:** "Current: kind: API, spec.type: ai-model-server" vs AiModelServerAPI.
**Authoritative contract:** `ai-integrations/plugins/catalog-model-ai-model-server/src/types.ts`
defines `kind: AiModelServerAPI`; Boost's `OgxModelEntityProvider` emits it
and `ai-catalog-common/src/aiAssetTaxonomy.ts` recognizes it.
**Disposition:** Spec correction.
**Owner:** RHDHPLAN-1507 / RHIDP-18929 current-state reconciliation.
**Correction:** Use `AiModelServerAPI` / `ai-model-server` in Decision 1
and migration-readiness current-state tables, filters, queries, and entity
refs. Historical `Resource` / `API` inputs remain legacy examples only.
A candidate upstream `API` kind is conditional future migration work;
it is not a type-import-only change and is not implemented by this PR.

---

### 8. boost/ai-catalog-entity-model — proposal capabilities (D / SUGGESTION)

**File:** `workspaces/boost/openspec/changes/ai-catalog-entity-model/proposal.md:36`
**Observation:** Missing installed-schema Capabilities section.
**Authoritative contract:** `ai-catalog-rbac-versioning-policy/proposal.md` Capabilities pattern.
**Disposition:** Spec correction.
**Correction:** Added `## Capabilities` section listing
`annotation-scheme`, `entity-provider-sdk`, `delta-sync-framework`,
`migration-readiness` as new capabilities and `performance-resilience`
as modified.

---

### 9. boost/ai-catalog-rbac-versioning-policy — audit events correlation (G / WARNING)

**File:** `workspaces/boost/openspec/changes/ai-catalog-rbac-versioning-policy/specs/ai-catalog-audit-events/spec.md:39`
**Observation:** RBAC event correlation with affected asset/connector undefined.
**Disposition:** Deferred design.
**Owner:** RHDHPLAN-1508 / RHIDP-15277.
**Rationale:** Defining how RBAC policy-change events are correlated
with assets/connectors (especially policies matching multiple entities)
requires a design decision. The RBAC event fields identify a
role/policy while provider events identify a connector/version —
the correlation mechanism is new design work.

---

### 10. boost/ai-catalog-rbac-versioning-policy — asset-version-policy scenario discipline (D / SUGGESTION)

**File:** `workspaces/boost/openspec/changes/ai-catalog-rbac-versioning-policy/specs/asset-version-policy/spec.md:26`
**Observation:** Non-testable process prerequisites in scenario steps.
**Authoritative contract:** AGENTS.md OpenSpec scenario step discipline.
**Disposition:** Spec correction.
**Correction:** Moved the non-testable process prerequisites
(follow-up authoring, integration spike, safe behavior definition)
from scenario steps into normative prose above the scenario. Retained
the testable assertion ("model metadata alone does not activate
inheritance") as the scenario step.

---

### 11. boost/connector-shared-infrastructure — tasks CA handling (C / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/tasks.md:12`
**Observation:** Task 1.8 conflates malformed PEM and expired certificate handling.
**Authoritative contract:** `ca-bundle-resolution/spec.md` scenarios.
**Disposition:** Spec correction.
**Correction:** Clarified task 1.8 to "Handle invalid/malformed PEM
data" and noted that expired certificates are returned unchanged per
the CA bundle spec and detected at TLS connection time.

---

### 12. boost/connector-shared-infrastructure — createSafeRefresh context (G / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/design.md:150`
**Observation:** createSafeRefresh signature lacks context needed for logging scenarios.
**Disposition:** Owning-feature follow-up.
**Owner:** RHIDP-15330 (Fault Isolation Wrapper).
**Rationale:** The design example signatures and catch blocks omit
`endpoint`, `retryable`, and `nextRetryAt` fields required by
`ConnectorErrorContext`. The implementation should pass
`FaultIsolationContext` per tasks 2.2 and 4.1. This is a design
example completeness issue for the implementation to address.

---

### 13. boost/connector-shared-infrastructure — error normalization (G / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/design.md:139`
**Observation:** Caught unknown values not normalized before reading constructor/message/stack.
**Authoritative contract:** No-rethrow and process-survival contracts in fault-isolation spec.
**Disposition:** Spec correction.
**Correction:** Updated both `createProviderWrapper` and
`createSafeRefresh` catch blocks to normalize the caught value:
`const error = thrown instanceof Error ? thrown : new Error(String(thrown))`.

---

### 14. boost/connector-shared-infrastructure — fault-isolation bucket assertion (C / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/specs/fault-isolation/spec.md:35`
**Observation:** "entity bucket remains empty" unscoped — fails on restart after prior success.
**Authoritative contract:** Backstage entity bucket isolation semantics.
**Disposition:** Spec correction.
**Correction:** Scoped the assertion to first startup: "on first
startup the failed connector's entity bucket remains empty." A
provider-owned cleanup operation for existing entities after restart
is separate design work.

---

### 15. boost/connector-shared-infrastructure — integration test mocks (D / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/tasks.md:64`
**Observation:** Task 5.4 uses mock providers instead of real persistence/cache backends.
**Authoritative contract:** AGENTS.md testing conventions ("Integration tests use real database and cache backends, not mocks").
**Disposition:** Spec correction.
**Correction:** Updated task 5.4 to specify real persistence/cache
backends per AGENTS.md, verifying retained entities in the unaffected
provider bucket.

---

### 16. boost/connector-shared-infrastructure — EXISTING delta operation (D / WARNING)

**File:** `workspaces/boost/openspec/changes/connector-shared-infrastructure/specs/ca-bundle-resolution/spec.md:7`
**Observation:** `EXISTING` is not a valid delta operation in the installed spec-driven schema.
**Authoritative contract:** Installed spec-driven schema delta operations (ADDED, MODIFIED, REMOVED).
**Disposition:** Spec correction.
**Correction:** Replaced `## EXISTING Requirements` with
`## ADDED Requirements` in both `ca-bundle-resolution/spec.md` and
`fault-isolation/spec.md`. These are baseline requirements being
formally documented for the first time.
The same review follow-up removed the empty `EXISTING Requirements: None`
template section from `reference-app-config/spec.md`. Its substantive
requirements already use `ADDED`; this is related cleanup under finding #16,
not an additional inventory finding.

---

### 17. boost/ingestion-audit-metrics — audit-events secret redaction (H / WARNING)

**File:** `workspaces/boost/openspec/changes/ingestion-audit-metrics/specs/audit-events/spec.md:56`
**Observation:** Config-change event serializes before/after values without redacting secret-bearing fields.
**Authoritative contract:** `openspec/changes/ai-catalog-rbac-versioning-policy/specs/ai-catalog-audit-events/spec.md`,
"Synchronization failure" scenario, prohibits recording credentials,
tokens, and secret configuration values in failure events. The config-change
safeguard applies the same secret-handling principle; that failure-event
assertion is not in the ingestion snapshot.
**Disposition:** Owning-feature follow-up.
**Owner:** RHDHPLAN-1508 / RHIDP-15280.
**Correction:** Added a redaction assertion to Scenario 4 requiring
secret-bearing configuration fields to be redacted before serialization.
This file remains a traceability snapshot. RHIDP-15280 owns propagation
into the authoritative config-change audit contract and its implementation
and verification tasks.
**SDK impact:** No affected SDK export, validator, or delta-helper
contract was identified. The restored SDK exposes no audit-event or
config-change API. This finding does not block RHIDP-18762 or authorize
new audit functionality in that story.

---

### 18. boost/ingestion-audit-metrics — eval-hub latest-per-skill aggregation (C / WARNING)

**File:** `workspaces/boost/openspec/changes/ingestion-audit-metrics/specs/eval-hub-integration/spec.md:55`
**Observation:** "latest score per skill" ambiguous — Scenario 4 vs Scenario 6 disagree on filtering.
**Disposition:** Deferred design.
**Owner:** Ingestion audit/metrics feature.
**Rationale:** Whether "latest" means per `(skill, eval_source)` or
a single score per skill across all sources needs a design decision.
Scenario 4 says latest-per-skill, while Scenario 6 requires an
unfiltered distribution. The counting unit and timestamp tie handling
also need specification.

---

### 19. boost/ingestion-audit-metrics — eval-hub entity ref casing (D / WARNING)

**File:** `workspaces/boost/openspec/changes/ingestion-audit-metrics/specs/eval-hub-integration/spec.md:43`
**Observation:** Entity ref uses `skill:default/code-review` instead of `airesource:default/code-review`.
**Authoritative contract:** AGENTS.md entity kind naming (`AiResource` for skills).
**Disposition:** Spec correction.
**Correction:** Updated entity refs from `skill:default/code-review`
to `airesource:default/code-review` in Scenario 3.

---

### 20. boost/ingestion-audit-metrics — tasks getSyncHistory store (G / SUGGESTION)

**File:** `workspaces/boost/openspec/changes/ingestion-audit-metrics/tasks.md:63`
**Observation:** getSyncHistory() method references "audit log DB" without naming the persistent store.
**Disposition:** Deferred design.
**Owner:** Ingestion health dashboard (`ingestion-health-dashboard` change).
**Rationale:** The design commits only to the RHDH audit log channel
and local-file fallback. The queryable store for sync history is
assigned to the ingestion-health-dashboard's database per its
ownership map, not a separate unspecified store.

---

### 21. boost/upstream-schema-alignment — proposal Skill/Rule casing (D / WARNING)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/proposal.md:60`
**Observation:** Mapping table uses `AIResource` for Skill and Rule rows.
**Authoritative contract:** AGENTS.md entity kind naming convention.
**Disposition:** Spec correction.
**Correction:** Updated Current Kind column from `AIResource` to
`AiResource` for Skill and Rule rows. Updated Notes to reflect
kind/name alignment is complete (removed `AIResource → AiResource`
migration arrow notation).

---

### 22. boost/upstream-schema-alignment — design model-server kind (A / WARNING)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/design.md:73`
**Observation:** Model Server Current Kind column shows `Resource` instead of `AiModelServerAPI`.
**Authoritative contract:** The dedicated catalog model and existing
provider emission described in finding #7, plus the companion annotation
specification's current connector-emitted mapping.
**Disposition:** Spec correction.
**Owner:** RHDHPLAN-1507 / RHIDP-18929 current-state reconciliation.
**Correction:** Use `AiModelServerAPI` in the current-kind columns of
the upstream-alignment proposal and design. Any candidate upstream
transformation starts from that dedicated kind. No runtime migration
or new upstream-kind decision is included.

---

### 23. boost/upstream-schema-alignment — annotation-spec scenario headings (D / WARNING)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/specs/annotation-specification/spec.md:26`
**Observation:** Level-two `## Scenario` headings outside any `### Requirement` block.
**Authoritative contract:** Installed spec-driven schema structure (scenarios as `####` under `### Requirement`).
**Disposition:** Spec correction.
**Correction:** Grouped 11 orphan `## Scenario` headings into 4
`### Requirement` blocks:

- Requirement: Complete annotation and entity-kind documentation (2 scenarios)
- Requirement: Per-kind mapping with upstream target (5 scenarios)
- Requirement: Confidence-level classification (1 scenario)
- Requirement: Future-work boundary and publication (3 scenarios)

Each scenario demoted from `##` to `####`. Also fixed `AIResource` →
`AiResource` for the spec.type documentation lines (skill and rule
kinds). Migration-path descriptions retain `AIResource` as the
historical "from" value.

---

### 24. boost/upstream-schema-alignment — migration-readiness-tooling scenario headings (D / WARNING)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/specs/migration-readiness-tooling/spec.md:25`
**Observation:** Level-two `## Scenario` headings outside any `### Requirement` block.
**Authoritative contract:** Installed spec-driven schema structure.
**Disposition:** Spec correction.
**Correction:** Grouped 8 orphan `## Scenario` headings into 5
`### Requirement` blocks:

- Requirement: Catalog entity enumeration (1 scenario)
- Requirement: Per-entity migration report (3 scenarios)
- Requirement: No destructive changes (1 scenario)
- Requirement: Output format support (2 scenarios)
- Requirement: Graceful handling of partial data (1 scenario)

---

### 25. boost/upstream-schema-alignment — design broken reference (E / WARNING)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/design.md:7`
**Observation:** Broken link to `../agent-creation-discovery/specs/catalog-entities/spec.md` (directory does not exist under `openspec/changes/`).
**Authoritative contract:** `RHDH-2-1-Legacy-Content/Pre-RHDHPLAN-15xx-Content/agent-creation-discovery/specs/catalog-entities/spec.md` (verified to exist).
**Disposition:** Spec correction.
**Correction:** Updated the link in `design.md` to point to the
correct legacy content path. Updated the same broken reference in
`proposal.md` (lines 53, 64). Updated task descriptions in `tasks.md`
(tasks 1.11, 5.2) to note the spec resides in RHDH-2-1-Legacy-Content.
**Post-cleanup note (#5548):** The `agent-creation-discovery` directory
was removed entirely. The supplementary catalog-entities references
were removed from design.md, proposal.md, and tasks.md; Decision 1 in
`ai-catalog-entity-model/design.md` is the sole mapping SoT.

---

### 26. boost/upstream-schema-alignment — proposal capabilities (D / SUGGESTION)

**File:** `workspaces/boost/openspec/changes/upstream-schema-alignment/proposal.md:23`
**Observation:** Missing installed-schema Capabilities section.
**Authoritative contract:** `ai-catalog-rbac-versioning-policy/proposal.md` Capabilities pattern.
**Disposition:** Spec correction.
**Correction:** Added `## Capabilities` section listing
`annotation-specification` and `migration-readiness-tooling` as new
capabilities.

---

## Summary

| Disposition                                | Count | Entries                                                                     |
| ------------------------------------------ | ----- | --------------------------------------------------------------------------- |
| Spec correction                            | 16    | #5, #7, #8, #10, #11, #13, #14, #15, #16, #19, #21, #22, #23, #24, #25, #26 |
| Not reproducible                           | 0     | None                                                                        |
| Deferred design                            | 4     | #6, #9, #18, #20                                                            |
| Owning-feature follow-up (ai-integrations) | 4     | #1, #2, #3, #4                                                              |
| Owning-feature follow-up (boost)           | 2     | #12, #17                                                                    |
| SDK prerequisite                           | 0     | None                                                                        |

## Metadata/Per-Kind SDK Design Decisions

Per the acceptance criteria: metadata/per-kind SDK design and
incremental-provider decisions remain in their existing planning epics.
This triage does not choose those designs. Specifically:

- AI model migration policy (finding #6) remains under RHDHPLAN-404.
- RBAC event correlation (finding #9) remains under RHDHPLAN-1508.
- Eval-hub aggregation semantics (finding #18) remains with the ingestion metrics feature.
- getSyncHistory() store (finding #20) remains with the ingestion health dashboard.

## SDK Handoff

At RHIDP-18762 implementation start, record this PR's final merged revision
and the relevant numbered OpenSpec tasks. This review does not claim an
unmerged revision is accepted or that historical completed tasks finish
SDK reconciliation.

No additional SDK prerequisite was identified in this inventory. Finding
#17 remains audit-owner work under RHIDP-15280; it does not expand the
SDK's exports, validators, or delta-helper responsibilities.

Relevant task references:

- RHIDP-18762 (SDK reconciliation) — downstream consumer of this triage
- RHIDP-18761 (source audit) — closed; produced the 26 findings
- RHIDP-15258 (Entity-Provider SDK Package) — owns the SDK exports,
  validators, and delta-helper contract
- RHIDP-15280 (audit-events) — carries the authoritative audit-event
  contract; the redaction correction should be propagated there
