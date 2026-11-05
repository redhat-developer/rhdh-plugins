## Canonical Touchpoints

- No PRD or ADR files currently exist in this repository.
- On completion, the six change-local capability specs will be promoted to the matching paths under `openspec/specs/` listed in the proposal. Bundle serving remains subject to its owning architecture contract; the version-policy spec records direct policy and the inheritance deferral only.

## Context

RHDHPLAN-1508 still names `ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, and `ai-catalog.admin`, requires asset-to-version cascade, a configurable default posture, and a dedicated admin section. The September 8 Jira discussion and merged `rhdh-plugins` PR #4613 instead establish built-in Catalog permissions as the entity-visibility baseline and require demonstrated gaps before custom behavior. Boost has since published `ai-catalog.admin`; this design transitions that management contract without treating it as an entity-read permission.

Today, AI assets are ordinary Catalog entities. `catalog.entity.read` is a resource permission with built-in Catalog rules (`HAS_ANNOTATION`, `HAS_LABEL`, `HAS_METADATA`, `HAS_SPEC`, `IS_ENTITY_KIND`, and `IS_ENTITY_OWNER`). Unmatched RBAC requests are denied unless deployment configuration grants default permissions. The `ai-integrations` workspace owns upstream-aligned `AiResource` ingestion; Boost supplies AI Catalog experiences and future APIs. RHDHPLAN-1507 owns the normalized category, version, and source annotations, but its current acceptance criteria do not define the stable cross-version asset identifier assumed by RHDHPLAN-1508.

### Accepted PM scope, 2026-09-15

John Collier supplied the PM scope decision during review of this PR: use the existing Backstage/RHDH RBAC UI to manage permissions; whole-entity read is sufficient, with no graduated visibility; defer inheritance until RHDHPLAN-1507 supplies its required model. These are accepted scope decisions, not outstanding PM questions. The Jira description still needs reconciliation with this recorded decision. PR #4613 establishes the 2.1 baseline; this explicit decision supplies the scope clarification for the 2.2 feature.

## Goals / Non-Goals

**Goals:**

- Preserve one entity-authorization path through Catalog.
- Make whole-entity access, version deferral, audit, and bundle boundaries explicit.
- Define secure observable behavior while delaying mechanism choices that lack prerequisites.
- Keep policy metadata provider-owned and authorization decisions RBAC-owned.

**Non-Goals:**

- Implementing code during this session.
- Treating the published Boost backend's current permission names as immutable.
- Storing policy decisions on ingested entities.
- Replacing RHDH RBAC administration or auditing.
- Graduated visibility, a separate protected-detail permission or redaction layer, and automatic policy inheritance in v1.

## Decisions

### D1 — Whole-entity access uses `catalog.entity.read`

AI entities SHALL use the same discovery and direct-access path as other Catalog entities. A duplicate AI-specific entity-read permission would create ambiguous precedence and double authorization.

**Alternative considered:** retain `ai-catalog.asset.read`. Rejected as the default because no Catalog limitation has yet been demonstrated.

### D2 — Whole-entity read is sufficient for v1

The accepted PM scope authorizes an entity reader to access every value stored on that entity, including available usage instructions, configuration guidance, and connection details. V1 SHALL NOT add a separate protected-detail permission, graduated visibility, restricted-detail placeholders, or a field-redaction layer. API and UI consumers SHALL NOT require a second usage-detail grant for data already authorized by `catalog.entity.read`.

**Alternative considered:** retain graduated access to usage/configuration/connection fields. PM excluded that outcome from v1. The proposed `protected-asset-details` capability is removed from this change and its canonical promotion list.

### D3 — Existing conditional rules are the first choice

Category, source, namespace, owner, and label scopes SHALL use existing Catalog rules against exact provider-emitted values. A custom rule is allowed only with a documented, tested expression gap.

### D4 — Existing RBAC configuration and UI manage access

Unmatched requests remain denied. Evaluation/POC-wide access can be expressed through the existing deployment-managed default-role configuration. Per-category or per-source posture is expressed as ordinary conditional policy, not ingestion-time state.

The SMP Admin is a product persona, not a new built-in role or authorization system. Deployments grant that persona the existing RBAC policy-management permissions needed to use the existing RBAC UI. V1 does not add an AI-specific `defaultPolicy` setting or dedicated AI Catalog administration section. `ai-catalog.manage` does not replace the existing permissions that authorize RBAC policy management.

**Decision source:** the PM scope decision supplied on 2026-09-15 accepts the existing permission-management UI. The dedicated AI administration workflow is excluded from v1.

### D5 — AI Catalog management uses a global behavior permission

Boost common SHALL define `ai-catalog.manage` as the canonical global basic permission with `attributes.action: update`. The already-published `ai-catalog.admin` permission remains registered and accepted for legitimate AI Catalog management operations for one compatibility release, is marked deprecated, and is then removed through the normal breaking-change process.

Neither permission grants or bypasses `catalog.entity.read`. Existing management consumers SHALL remove any use of the old permission as an entity-visibility fallback. Each future feature decides whether its new operation requires `ai-catalog.manage` or a narrower permission rather than inheriting authority automatically.

### D6 — Inheritance is deferred until RHDHPLAN-1507 defines the model

The accepted PM scope retains direct Catalog policy for each entity and defers automatic asset-to-version inheritance and inherited-policy override precedence. This dependency does not block the current entity-authorization baseline.

RHDHPLAN-1507 must first define a stable identifier shared by versions, the multi-version entity representation, and a resolvable relationship contract. Once that contract exists, a separate reviewed follow-up must define inheritance, prove same-role and cross-role override precedence, and address removal, orphaned versions, migration, rollback, and resolver failure. Model metadata alone does not activate inheritance or expand this change's implementation scope.

### D7 — Existing administration and audit surfaces are reused

Registered permissions and conditions appear through existing RBAC administration. RHDHPLAN-1508's RBAC audit requirement applies to policy create, update, and delete events that affect AI Catalog permissions. The existing RBAC auditor is verified for the required actor, timestamp, role or policy, operation, and safe change summary; those events are not duplicated and permission-evaluation auditing is not added to this scope.

RHDHPLAN-1508 separately requires provider synchronization events. The owning provider or ingestion feature emits those non-RBAC events through the same RHDH audit channel, while this change verifies the combined Audit Log outcome.

### D8 — Bundle members are authorized by canonical Catalog identity

Each skill member is authorized with `catalog.entity.read` against its canonical Catalog entity regardless of whether bundle composition is represented in Catalog or returned as nested Neo4j/API data. Neo4j remains a derived index, not an authorization authority. A backend returning nested members resolves their canonical entity identifiers, filters unauthorized members before serialization, and does not expose hidden identifiers or counts. The frontend never reconstructs omitted members.

RHDHPLAN-1507 already specifies Neo4j `SkillBundle` nodes, `INCLUDES` relationships, and canonical skill identifiers. The remaining RHDHPLAN-1507/Skills architecture dependency is to reconcile ownership of bundle definitions with Neo4j's derived-index role and define the complete serving API and bundle-level authorization target. Resolving that dependency does not reopen member authorization or graduated visibility. Conditional implementation and mixed-access tests are tracked in tasks 2.9–2.11; that serving work does not block the direct Catalog baseline.

## Risks / Trade-offs

- **Jira contract drift** → Reconcile Jira with the accepted PM decision and retain traceability for the replaced administration and visibility requirements and deferred inheritance.
- **Version inheritance lacks an owning model contract** → Keep inheritance outside this implementation until RHDHPLAN-1507 supplies its prerequisite and a follow-up design is reviewed.
- **Stale usage-detail gates restrict authorized readers** → Verify APIs and UI expose authorized entity data without requiring a separate usage-detail grant.
- **Independent version deny has no proven specificity rule** → The D6 follow-up must prove same-role and cross-role precedence against the target RBAC version before selecting an inheritance design.
- **Policy-filter performance regression** → Retain Jira's p95 regression threshold and verify it without adding performance-test infrastructure to this change.
- **Cross-workspace ownership ambiguity** → Keep entity modeling/providers in `ai-integrations`; keep experience-specific APIs, UI integration, and the management-permission contract in Boost.

## Migration Plan

Baseline v1 reuses existing Catalog and RBAC behavior and requires no bespoke migration report or activation gate. Existing consumers must be checked for obsolete usage-detail gates so their behavior matches D2. The management-name compatibility path remains as specified in D5. Any later inheritance follow-up SHALL define migration and rollback before implementation.

## Open Questions and Decision Status

1. **D1/D2 — Resolved by PM, 2026-09-15:** Whole-entity `catalog.entity.read` is sufficient. Graduated visibility and a protected-detail permission are excluded from v1.
2. **D4 — Resolved by PM, 2026-09-15:** Use existing RBAC configuration, administration permissions, conditional policies, and UI. No dedicated AI Catalog permission-management workflow is required.
3. **D6 — Deferral accepted by PM, 2026-09-15:** Use direct per-entity policy now. Inheritance and override precedence await the RHDHPLAN-1507 model and a separate reviewed follow-up.
4. **D8 — Resolved for members; serving dependency remains:** Authorize canonical skill entities with `catalog.entity.read`. Complete bundle ownership, serving, and bundle-level authorization through RHDHPLAN-1507/Skills architecture before implementing the conditional serving tasks.
5. **D5 — Resolved:** Define global `ai-catalog.manage`; retain deprecated `ai-catalog.admin` compatibility for one release. Neither grants entity visibility or replaces RBAC policy-management permissions.
6. **D7 — Resolved:** Reuse existing policy-change audit events and retain provider-sync events. The audit-correlation warning in `audit.md` remains to be addressed.
7. **Resolved:** Retain Jira's 10 percent p95 requirement without prescribing new benchmark infrastructure; it may be verified manually against the stated comparison.
