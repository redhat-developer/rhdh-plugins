# Tasks: AI Catalog Asset Governance

## 1. AI Catalog Permission Definitions (P0) — RHIDP-15271, RHIDP-15306

- [ ] 1.1 Define `AI_CATALOG_ASSET_RESOURCE_TYPE` constant in `boost-common/src/permissions.ts`
- [ ] 1.2 Define `ai-catalog.asset.read` resource permission with `resourceType: 'ai-catalog-asset'` (RHIDP-15271)
- [ ] 1.3 Define `ai-catalog.asset.read.usage-docs` resource permission with `resourceType: 'ai-catalog-asset'` (RHIDP-15272)
- [ ] 1.4 Define `ai-catalog.admin` basic permission (action: update) (RHIDP-15306)
- [ ] 1.5 Export all permission constants and resource type from `boost-common` package
- [ ] 1.6 Register all 3 permissions via `permissionsRegistry.addPermissions()` in backend module

## 2. Graduated Visibility — Backend (P0) — RHIDP-15271, RHIDP-15272

- [ ] 2.1 Implement Tier 2 field-level filtering in AI asset detail endpoint (omit usage-docs, connection endpoints, config when `ai-catalog.asset.read.usage-docs` is DENIED)
- [ ] 2.2 Implement entity-level filtering on list endpoint using `authorizeConditional()` + `toQuery()` for `ai-catalog.asset.read`
- [ ] 2.3 Implement batch `authorizeConditional()` for Tier 2 (single check, apply uniformly to response)
- [ ] 2.4 Add unit tests for field-level filtering (Tier 1 only, Tier 2 included, no access)

## 3. Graduated Visibility — Frontend (P1) — RHIDP-15273

- [ ] 3.1 Wrap Tier 2 sections in asset detail page with `<RequirePermission permission={aiCatalogAssetReadUsageDocsPermission}>`
- [ ] 3.2 Create restricted-access placeholder component for denied Tier 2 sections
- [ ] 3.3 Ensure asset list page displays filtered counts matching backend-filtered results
- [ ] 3.4 Add `usePermission` hook check for `ai-catalog.admin` to show/hide admin links

## 4. Conditional Permission Rules (P0) — RHIDP-15312

- [ ] 4.1 Implement `isAiAssetCategory` rule: `apply(resource, { category })` checking `rhdh.io/ai-asset-category` annotation
- [ ] 4.2 Implement `isAiAssetCategory.toQuery()` generating catalog query predicate for annotation filter
- [ ] 4.3 Implement `isFromConnector` rule: `apply(resource, { connector })` checking `rhdh.io/ai-asset-source` annotation
- [ ] 4.4 Implement `isFromConnector.toQuery()` generating catalog query predicate for annotation filter
- [ ] 4.5 Implement `isInTenant` rule: `apply(resource, { tenant })` checking entity namespace or tenant annotation
- [ ] 4.6 Implement `isInTenant.toQuery()` generating catalog query predicate for namespace/annotation filter
- [ ] 4.7 Register all 3 rules via `createPermissionIntegrationRouter` with `resourceType: 'ai-catalog-asset'`
- [ ] 4.8 Add unit tests for each rule's `apply()` and `toQuery()` methods

## 5. Version-Level Policy Cascade (P1) — RHIDP-15274, RHIDP-15275

- [ ] 5.1 Create `AICatalogRBACProvider` implementing `RBACProvider` interface (`connect()`, `refresh()`)
- [ ] 5.2 Register provider via `rbacProviderExtensionPoint` in backend module
- [ ] 5.3 Implement asset→version relationship discovery via `rhdh.io/ai-asset-version` annotation and `versionOf` relations
- [ ] 5.4 Implement `applyConditionalPermissions()` propagation from asset to version entities
- [ ] 5.5 Implement event-driven `refresh()` with debouncing for bulk ingestion
- [ ] 5.6 Handle edge cases: orphan versions (log warning), asset deletion (cascade removal), no-version assets (skip)
- [ ] 5.7 Support `policyDecisionPrecedence` config for version-specific override ordering
- [ ] 5.8 Add unit tests for cascade propagation, override precedence, and edge cases

## 6. Default-Deny Configuration (P1) — RHIDP-15306

- [ ] 6.1 Add `ai-catalog.rbac.defaultPolicy` config schema (allow|deny, default: allow)
- [ ] 6.2 Add per-category config schema under `ai-catalog.rbac.categories.<name>.defaultPolicy`
- [ ] 6.3 Add per-connector config schema under `ai-catalog.rbac.connectors.<name>.defaultPolicy`
- [ ] 6.4 Implement catch-all DENY conditional rule application in `AICatalogRBACProvider` for deny-posture entities
- [ ] 6.5 Implement `rhdh.io/ai-catalog-ingested-at` annotation stamping at ingestion time
- [ ] 6.6 Implement configuration validation at startup (reject invalid values, warn on unknown categories/connectors)
- [ ] 6.7 Add unit tests for default-deny posture (global, per-category, per-connector)

## 7. Audit Logging (P1) — RHIDP-15277, RHIDP-15279, RHIDP-15280

- [ ] 7.1 Define audit event types: `posture-changed`, `policy-created`, `policy-updated`, `policy-deleted` (RHIDP-15279)
- [ ] 7.2 Define ingestion audit events: `sync-completed`, `sync-error`, `entity-created`, `entity-updated`, `entity-deleted` (RHIDP-15280)
- [ ] 7.3 Implement audit event emitters using `LoggerService` with structured metadata
- [ ] 7.4 Integrate audit events into posture change and policy CRUD flows in admin UI backend routes (RHIDP-15279)
- [ ] 7.5 Integrate audit events into entity provider sync cycle (RHIDP-15280)
- [ ] 7.6 Verify events do not duplicate RBAC plugin `AuditorService` coverage

## 8. RBAC Admin UI (P2) — RHIDP-15304, RHIDP-15307, RHIDP-15308, RHIDP-15309

- [ ] 8.1 Create standalone page component at `/ai-catalog/admin/rbac` with `RequirePermission` gating (RHIDP-15307)
- [ ] 8.2 Implement current policies view (fetch from RBAC REST API: `GET /api/permission/policies`, `GET /api/permission/roles`) (RHIDP-15307)
- [ ] 8.3 Implement policy creation form (permission, decision, condition rule, parameters, role) (RHIDP-15308)
- [ ] 8.4 Implement policy deletion with confirmation dialog and impact summary (RHIDP-15308)
- [ ] 8.5 Implement default posture view and change controls with confirmation dialog (RHIDP-15309)
- [ ] 8.6 Add sidebar navigation item with `usePermission` visibility gating (RHIDP-15307)
- [ ] 8.7 Add error handling for RBAC REST API failures (user-friendly messages, no internal details exposed)

## 9. SkillBundle Filtering (P1) — RHIDP-15310, RHIDP-15273

- [ ] 9.1 Implement backend skill filtering using batch `authorizeConditional()` for `ai-catalog.asset.read`
- [ ] 9.2 Add `totalSkills` and `visibleSkills` fields to SkillBundle API response
- [ ] 9.3 Ensure filtered-out skill references are not exposed (no IDs, names, or placeholders)
- [ ] 9.4 Implement frontend "N of M skills visible" count display with tooltip
- [ ] 9.5 Implement restricted-access placeholder for fully restricted bundles
- [ ] 9.6 Suppress additional messaging when all skills are visible (show standard count only)
- [ ] 9.7 Add unit tests for backend skill filtering (full access, partial, no access)

## 10. Verify

- [ ] 10.1 Verify Tier 1 access shows basic metadata without Tier 2 fields
- [ ] 10.2 Verify Tier 2 access shows all fields including usage docs and config
- [ ] 10.3 Verify conditional policies filter asset lists by category, connector, and tenant
- [ ] 10.4 Verify version-level cascade propagates asset policies to versions
- [ ] 10.5 Verify version-specific overrides take precedence over inherited policies
- [ ] 10.6 Verify default-deny posture applies catch-all DENY to newly ingested assets
- [ ] 10.7 Verify per-category and per-connector posture scoping
- [ ] 10.8 Verify audit events emit for posture changes and ingestion sync
- [ ] 10.9 Verify admin UI creates/deletes policies via RBAC REST API
- [ ] 10.10 Verify SkillBundle filtering shows correct visible/total counts
- [ ] 10.11 Verify `ai-catalog.admin` holders bypass default-deny for all assets
