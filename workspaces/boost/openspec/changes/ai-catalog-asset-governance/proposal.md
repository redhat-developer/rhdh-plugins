# Proposal: AI Catalog Asset Governance

## Why

Enterprise AI platforms expose heterogeneous AI assets (agents, skills, models, MCP servers) through a shared catalog. Without catalog-layer RBAC, all authenticated users see all asset details — including connection strings, configuration, and usage documentation — regardless of their role. RHDHPLAN-1508 specifies a graduated visibility model, version-level policy cascade, default-deny posture configuration, audit logging, and an admin UI so that organizations can govern AI asset visibility with the same rigor they apply to other RHDH catalog entities.

Boost already implements 23 application-layer permissions for agent/tool lifecycle governance. This change adds the complementary catalog-layer permissions that control _who can see_ AI assets, not just _who can act on_ them.

## What Changes

- **Three new AI Catalog permissions:** `ai-catalog.asset.read` (Tier 1 discovery), `ai-catalog.asset.read.usage-docs` (Tier 2 sensitive details), `ai-catalog.admin` (management actions)
- **Graduated visibility model:** Two-tier field-level filtering — Tier 1 shows name/description/type/stage; Tier 2 adds usage docs, connection endpoints, configuration
- **Frontend RequirePermission gating:** Entity detail pages gate Tier 2 sections with restricted-access placeholders; SkillBundle views show filtered skill counts
- **Version-level policy cascade:** Asset-level policies propagate to all version entities via RBACProvider; version-specific overrides take precedence
- **Default-deny configuration:** `ai-catalog.rbac.defaultPolicy` config key controls ingestion-time posture; per-category and per-connector conditional rules scope visibility
- **Conditional policy backend:** Custom permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`) enable RBAC policy scoping to categories, connectors, and tenants
- **Audit logging:** AI-catalog management events and ingestion sync events complement the RBAC plugin's existing `AuditorService` coverage
- **RBAC Admin UI:** Standalone `/ai-catalog/admin/rbac` page for SMP Admins to manage visibility policies without writing YAML

## Capabilities

### New Capabilities

- `graduated-visibility`: Three AI Catalog permission definitions, two-tier visibility model, field-level filtering
- `version-policy-cascade`: RBACProvider-based policy propagation from asset to version entities
- `default-deny-config`: Default-allow/deny posture configuration with per-category and per-connector scoping
- `conditional-policies`: Custom permission rules for category, connector, and tenant filtering
- `audit-logging`: AI-catalog management events and ingestion sync audit events
- `rbac-admin-ui`: Standalone admin page for AI Catalog policy management
- `skillbundle-filtering`: Backend read-time RBAC filtering for SkillBundle skill lists

### Modified Capabilities

- `fine-grained-permissions`: `boost.agent.list` upgraded to resource-based permission with 3-tier evaluation (already implemented in this branch)

## Impact

- `plugins/boost-common/src/permissions.ts` — 3 new AI Catalog permission definitions + resource type
- `plugins/boost-backend/` — Permission registration, conditional rule implementations, audit event emitters
- `plugins/boost/src/components/` — RequirePermission gating, restricted-access placeholder, SkillBundle filtered-view messaging
- New `catalog-backend-module-ai-catalog-rbac/` — RBACProvider for version-level policy cascade
- New admin page route at `/ai-catalog/admin/rbac` — RBAC REST API consumer
- `app-config.yaml` — `ai-catalog.rbac.defaultPolicy` config key
- Cross-references: RHDHPLAN-1507 entity model (provides AI asset entities), existing boost RBAC infrastructure (provides registration patterns)
