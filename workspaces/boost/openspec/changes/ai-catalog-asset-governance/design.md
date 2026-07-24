# Design: AI Catalog Asset Governance

## Context

RHDHPLAN-1508 defines the RBAC and Versioning Policy Model for AI catalog assets in RHDH. Boost's existing security layer provides 23 application-layer permissions governing agent/tool lifecycle transitions (`boost.agent.*`, `boost.tool.*`). The AI Catalog layer adds a complementary set of permissions governing _visibility_ — which users can discover AI assets and at what level of detail.

The feasibility analysis (2026-07-07) confirmed all 7 original epics are implementable within the existing Backstage permission framework and RBAC plugin capabilities. Post-consolidation (2026-07-13), the scope reduced to 4 surviving epics with 6 stories under RHIDP-15270, plus 3 additional epics (RHIDP-15274, RHIDP-15277, RHIDP-15304).

This design covers the catalog-layer RBAC system. It is informed by:

- RHDHPLAN-1508 feasibility report (confirmed all patterns use standard Backstage extensions)
- Existing boost permission infrastructure (`boost-common/src/permissions.ts`, `authorizeLifecycleAction` middleware)
- RBAC plugin capabilities (`RBACProvider`, `AuditorService`, REST API)
- Augment workspace alignment (PR #3331 — shared 3-tier evaluation model)

## RHDHPLAN-1508 Consolidation (2026-07-13)

> Post-consolidation, 4 epics remain with the following story distribution:
>
> - **RHIDP-15270** (Graduated Visibility) — 6 stories: RHIDP-15271, 15272, 15273, 15306, 15310, 15312
> - **RHIDP-15274** (Version-Level Policy Cascade) — 1 story: RHIDP-15275
> - **RHIDP-15277** (Audit Logging) — 2 stories: RHIDP-15279, 15280; absorbs RHIDP-15333 from RHDHPLAN-1513
> - **RHIDP-15304** (RBAC Admin UI) — 3 stories: RHIDP-15307, 15308, 15309
>
> Closed epics: RHIDP-15276 (Default-Deny → absorbed into 15270), RHIDP-15281 (Perf/Multi-Tenancy → absorbed into 15270), RHIDP-15305 (SkillBundle Filtering → absorbed into 15270)

## Goals

- Define 3 AI Catalog permissions (`ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, `ai-catalog.admin`) using standard Backstage registration patterns
- Implement two-tier graduated visibility with field-level filtering at the API layer
- Support conditional policies scoped to asset category, source connector, and tenant
- Implement version-level policy cascade via RBACProvider extension point
- Add configurable default-deny posture with per-category and per-connector scoping
- Emit structured audit events for AI-catalog management and ingestion sync actions
- Provide a standalone admin UI for SMP Admins to manage AI Catalog RBAC without writing YAML
- Implement backend read-time RBAC filtering for SkillBundle skill lists

## Non-Goals

- Modifying the existing application-layer `boost.*` permissions (agent/tool lifecycle) beyond upgrading `boost.agent.list` to `ResourcePermission` for 3-tier list evaluation
- Changing Backstage permission framework core behavior or upstream RBAC plugin
- Creating new upstream entity kinds (covered by RHDHPLAN-1507/RHDHPLAN-1113)
- Implementing specific entity provider connectors (covered by RHDHPLAN-1507, RHDHPLAN-1510)
- Neo4j knowledge graph design (covered by separate change)

## Decisions

### Decision 1: Three permissions with resource-based conditional evaluation

Three permissions are defined using `createPermission` from `@backstage/plugin-permission-common`:

| Permission                         | Action | Resource Type      | Purpose                                                  |
| ---------------------------------- | ------ | ------------------ | -------------------------------------------------------- |
| `ai-catalog.asset.read`            | read   | `ai-catalog-asset` | Tier 1: basic discovery (name, description, type, stage) |
| `ai-catalog.asset.read.usage-docs` | read   | `ai-catalog-asset` | Tier 2: usage docs, connection endpoints, configuration  |
| `ai-catalog.admin`                 | update | — (basic)          | Management: posture config, policy management, admin UI  |

Both read permissions are resource-based (`resourceType: 'ai-catalog-asset'`) to support CONDITIONAL evaluation — deployers can configure category-scoped, connector-scoped, or tenant-scoped visibility via RBAC conditional policies. `ai-catalog.admin` is a basic permission (binary ALLOW/DENY) because management actions are not scoped to individual assets.

This follows the same pattern as boost's `boost.agent.list` upgrade to resource-based (implemented in this branch).

### Decision 2: Field-level filtering at the API layer, not database layer

Tier 2 fields (usage documentation, connection endpoints, configuration) are filtered at the API response layer, not the database query layer. The backend fetches the full entity, checks `ai-catalog.asset.read.usage-docs` for the requesting user, and omits Tier 2 fields if DENIED.

**Why not database-level filtering?** Tier 2 filtering is field-level (omit specific fields from the response), not entity-level (omit entire entities). Database-level `toQuery()` is designed for entity-level filtering. Field-level filtering is simpler and more maintainable at the API layer.

**Entity-level filtering** (which entities appear in lists) uses `authorizeConditional()` + `toQuery()` for database-level filtering when conditional policies are configured. This is the same pattern as the Backstage catalog's `AuthorizedEntitiesCatalog`.

### Decision 3: RBACProvider for version-level policy cascade (Option C from feasibility)

Version-level policy cascade uses the RBAC plugin's `RBACProvider` extension point:

1. A custom `AICatalogRBACProvider` implements `RBACProvider` with `connect()` and `refresh()`
2. On catalog entity changes, `refresh()` identifies asset→version relationships via `rhdh.io/ai-asset-version` annotation or `versionOf` relation
3. Asset-level conditional permissions are propagated to version entities via `applyConditionalPermissions()`
4. Version-specific overrides are stored as separate conditional policies — `policyDecisionPrecedence` config controls evaluation order
5. Removing a version override causes automatic fallback to asset-level policy on next `refresh()`

This was recommended by the feasibility analysis over Option A (runtime catalog lookups — performance concern) and Option B (denormalized policies at ingestion — entity provider coupling).

### Decision 4: Default-deny via conditional policies, not config toggle

The `ai-catalog.rbac.defaultPolicy: allow|deny` config key is read at ingestion time. When set to `deny`, the `AICatalogRBACProvider` applies a catch-all DENY conditional rule for `ai-catalog.asset.read` on newly ingested entities. When set to `allow`, no catch-all rule is applied (standard Backstage behavior).

Per-category defaults use conditional rules scoped to `rhdh.io/ai-asset-category` annotation values. Per-connector defaults use conditional rules scoped to a source-connector annotation.

**Key design choice:** The config setting affects only _subsequently ingested_ assets — existing assets retain their current policy state. This is implemented by tagging entities with an `rhdh.io/ai-catalog-ingested-at` annotation at ingestion time and having the conditional rule check this timestamp against a policy-change timestamp. The policy-change timestamp is persisted in the database (via `AdminConfigService.setOverride()`) when an admin changes the default posture, and read by `AICatalogRBACProvider` during `refresh()` to determine which entities are "new" relative to the last policy change. See task 6.8 in tasks.md.

### Decision 5: Standalone admin page, not RBAC plugin extension

The AI Catalog RBAC admin UI is a standalone frontend page at `/ai-catalog/admin/rbac`, gated by `ai-catalog.admin`. It calls the RBAC REST API (23+ routes) directly for all policy CRUD operations.

**Why standalone?** The upstream RBAC admin UI (`@backstage-community/plugin-rbac`) has no frontend extension points — no `ExtensionPoint`, no slot system, no component override mechanism. A standalone page is the standard RHDH pattern used by other features (Homepage, Scorecard, Learning Paths).

### Decision 6: Audit events complement AuditorService, not replace it

The RBAC plugin's `AuditorService` already covers policy/role/condition CRUD and permission evaluation events. This design adds only the events the `AuditorService` does not cover:

- AI-catalog management events (posture changes, category/connector policy CRUD)
- Ingestion sync events (provider name, counts, duration, errors)
- Per-asset ingestion events (entity ref, operation, source provider)

Events use the same structured JSON format as existing RHDH audit logs.

### Decision 7: Custom permission rules for conditional filtering

Three custom permission rules inspect entity annotations:

| Rule                              | Purpose                    | Inspects                               |
| --------------------------------- | -------------------------- | -------------------------------------- |
| `isAiAssetCategory({ category })` | Filter by asset category   | `rhdh.io/ai-asset-category` annotation |
| `isFromConnector({ connector })`  | Filter by source connector | `rhdh.io/ai-asset-source` annotation   |
| `isInTenant({ tenant })`          | Filter by tenant identity  | Entity namespace or tenant annotation  |

Rules are synchronous `apply(resource, params) → boolean` functions. For database-level filtering, each rule implements `toQuery()` to generate catalog query predicates.

## Risks / Trade-offs

- **Policy cascade performance** → Mitigated by `RBACProvider` batch sync (not per-request evaluation). `refresh()` runs on schedule or on catalog event, not per permission check.
- **Conditional rule complexity** → Mitigated by limiting to 3 well-defined rules. Custom rules beyond these require explicit design review.
- **Admin UI maintenance** → Standalone page is independent of upstream RBAC plugin changes. Trade-off: no automatic integration with future RBAC UI improvements.
- **Default-deny "only new assets" behavior** → Requires ingestion-time annotation and timestamp comparison. Simpler alternative (retroactive application) should be discussed with PM per feasibility analysis recommendation.
- **Cross-workspace alignment** → AI Catalog permissions live in boost-common but are conceptually catalog-layer. If RHDHPLAN-1113 lands AIResource kinds, permission resource types may need updating.
