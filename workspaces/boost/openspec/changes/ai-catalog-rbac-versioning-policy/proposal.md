## Why

RHDHPLAN-1508's written acceptance criteria overlap with Backstage Catalog permissions and RHDHPLAN-1169. The PM scope decision supplied by John Collier on 2026-09-15 accepts whole-entity read access and existing permission-management UI, excludes graduated visibility from v1, and defers inheritance until RHDHPLAN-1507 supplies the required model.

## What Changes

- Establish `catalog.entity.read` as the baseline gate for whole-entity discovery and direct access.
- Use existing Catalog conditional rules and provider-emitted metadata for owner, namespace, label, category, and source scoping.
- Treat `catalog.entity.read` as sufficient for all data stored on an authorized AI Catalog entity; v1 has no separate usage-detail permission or graduated visibility.
- Use direct per-entity policy and defer asset-to-version inheritance and override precedence until RHDHPLAN-1507 defines stable cross-version identity and the multi-version relationship contract, followed by a reviewed inheritance design.
- Define global `ai-catalog.manage` administration permission in Boost common, retain the published `ai-catalog.admin` name as a one-release compatibility permission, and keep both independent from entity visibility.
- Reuse RHDH RBAC administration and policy-change audit surfaces; retain the separate provider-sync audit outcome explicitly required by RHDHPLAN-1508.
- Use the existing Backstage/RHDH RBAC UI for permission management; record the accepted replacements and deferrals for Jira reconciliation.

## Capabilities

### New Capabilities

- `catalog-entity-visibility`: Whole-entity discovery, direct access, default posture, and performance.
- `conditional-asset-access`: Existing conditional-policy use for scoped and multi-tenant access.
- `ai-catalog-management-permission`: Global AI Catalog management authorization and compatibility behavior.
- `asset-version-policy`: Direct per-entity policy and the explicit deferral of inheritance pending RHDHPLAN-1507 and a follow-up design.
- `ai-catalog-audit-events`: RBAC and ingestion-event audit requirements.
- `skill-bundle-authorization`: Canonical Catalog authorization and read-time filtering for bundle members returned through Catalog or nested APIs.

### Modified Capabilities

None.

## Non-goals

- Defining the AI asset entity model or annotations owned by RHDHPLAN-1507.
- Translating source-registry permissions into RHDH RBAC.
- Building a new policy engine, audit store, or standalone AI Catalog RBAC UI.
- Deciding in advance that every future AI Catalog operation requires `ai-catalog.manage`; each owning feature classifies its own operations.
- Implementing connector ingestion, Neo4j storage, or application code in this change-authoring session.
- Graduated visibility, a protected-detail permission or redaction layer, and automatic asset-to-version inheritance in v1.

## Canonical Touchpoints

- PRDs/ADRs under `specifications/`: None currently exist in this repository.
- Planned long-lived specs: `openspec/specs/catalog-entity-visibility/spec.md`, `conditional-asset-access/spec.md`, `ai-catalog-management-permission/spec.md`, `asset-version-policy/spec.md`, `ai-catalog-audit-events/spec.md`, and `skill-bundle-authorization/spec.md`.
- Change type: feature-spec.

## Impact

- Jira: RHDHPLAN-1508; depends on RHDHPLAN-1507 and overlaps RHDHPLAN-1169.
- Target workspaces: `rhdh-plugins/workspaces/boost` and `rhdh-plugins/workspaces/ai-integrations`.
- Systems: Backstage Catalog, RHDH permission/RBAC plugin, Audit Log, AI entity providers, and future SkillBundle APIs.
