<!-- After each completed task, commit the changes. -->

## Canonical Touchpoints

- PRD/ADR updates: None currently exist in this repository.
- Long-lived capability specs: the six paths listed in `proposal.md`; promotion is tracked in section 5.
- Change type: feature-spec.

## 1. Record accepted scope and remaining dependencies

- [x] 1.1 Record the PM decision supplied by John Collier on 2026-09-15: defer inheritance until RHDHPLAN-1507 supplies stable cross-version identity, multi-version representation, and relationships; use direct per-entity policy now and review inheritance in a separate follow-up.
- [x] 1.2 Record the PM decision supplied on 2026-09-15: whole-entity `catalog.entity.read` is sufficient, graduated visibility is excluded from v1, and permissions are managed through the existing Backstage/RHDH RBAC UI.
- [ ] 1.3 Before bundle-serving work, obtain the remaining RHDHPLAN-1507/Skills contract for bundle-definition ownership, serving API, and bundle-level authorization. Build on its existing `SkillBundle`/`INCLUDES` model and canonical skill identifiers. If unavailable for v1, defer tasks 2.9–2.11 and bundle promotion; direct Catalog authorization remains independently deliverable.
- [ ] 1.4 Update RHDHPLAN-1508 or its linked implementation work with the resolved permission names, retained requirements, and explicitly deferred branches before implementation starts.

## 2. Establish the permission and entity-authorization baseline

- [ ] 2.1 Define and register global basic permission `ai-catalog.manage` in Boost common with `attributes.action: update`.
- [ ] 2.2 Retain `ai-catalog.admin` as a registered, deprecated compatibility permission for one release and document its removal path.
- [ ] 2.3 Update legitimate AI Catalog management consumers to accept either management permission during the compatibility release, remove either permission as a fallback for entity visibility, and test both behaviors.
- [ ] 2.4 Verify AI entity list, search, and direct access use the authorized Catalog path and `catalog.entity.read`.
- [ ] 2.5 Add automated backend tests proving denied AI entities are absent from list, search, and direct access.
- [ ] 2.6 Document conditional-policy examples using exact category, source, namespace, label, and owner values emitted by supported providers.
- [ ] 2.7 Add multi-team tests proving different authorized views over one ingested entity set without re-ingestion.
- [ ] 2.8 Verify API and UI consumers allow entity readers to access available usage, configuration, and connection details without a second usage-detail grant; remove stale detail gates if present and test the authorized-reader and denied-entity paths.
- [ ] 2.9 If task 1.3 confirms bundle serving for v1, implement backend resolution and `catalog.entity.read` checks for canonical members before serialization, with the bundle's own authorization taken from that contract.
- [ ] 2.10 If bundle serving proceeds, add automated tests for mixed-access and zero-visible-member responses, missing or unresolvable member identities, and omission of unauthorized member identifiers, names, counts, and metadata.
- [ ] 2.11 If bundle serving proceeds, render only returned members and document per-viewer bundle contents; verify partial-visibility and empty-state behavior against the approved serving contract.

## 3. Complete the required audit integration

- [ ] 3.1 Verify existing RBAC policy create, update, and delete events affecting AI Catalog permissions contain the required actor, timestamp, role or policy, operation, and safe change summary.
- [ ] 3.2 If task 3.1 identifies a concrete field gap, add only that missing integration and confirm no duplicate policy or permission-evaluation event is introduced.
- [ ] 3.3 Coordinate with the owning provider or ingestion feature to emit the asset/version synchronization events explicitly required by RHDHPLAN-1508 through the existing RHDH audit channel.
- [ ] 3.4 Add provider event-schema and secret-redaction tests covering add, update, remove or tombstone, and safe failure outcomes.
- [ ] 3.5 Verify RBAC policy changes and provider synchronization events are queryable through the existing Audit Log UI/export without a separate AI Catalog audit viewer.

## 4. Verify administration, performance, and documentation

- [ ] 4.1 Verify registered permissions and conditions are manageable through the existing RBAC administration surface and that existing RBAC policy-management permissions remain authoritative.
- [ ] 4.2 Verify AI Catalog permission checks do not increase p95 request latency by more than 10 percent compared with the same request against an equivalent volume of non-AI Catalog entities under existing RBAC.
- [ ] 4.3 Document `catalog.entity.read`, deny-by-default behavior, conditional-policy examples, and the one-release `ai-catalog.admin` to `ai-catalog.manage` transition.
- [ ] 4.4 Document that management permission does not grant entity visibility and source-system permissions are not translated into RHDH RBAC.
- [ ] 4.5 Document the RBAC policy-change and provider-sync event categories and their query/export fields.
- [ ] 4.6 Add worked examples for SMP Admin permission management and approved-skill access using existing RBAC UI/help; explain whole-entity visibility and verify the instructions with an admin unfamiliar with the feature. No graduated-visibility tutorial or custom administration UI is required.

## 5. Promote accepted specifications

- [ ] 5.1 Promote `catalog-entity-visibility`, `conditional-asset-access`, `ai-catalog-management-permission`, and `ai-catalog-audit-events` after acceptance.
- [ ] 5.2 Promote `asset-version-policy` with direct per-entity behavior and the explicit inheritance deferral; do not promote a protected-detail capability or inheritance implementation requirements.
- [ ] 5.3 Promote `skill-bundle-authorization` only after the owning architecture contract is confirmed.
