# RHDHPLAN-1505 — AI Catalog Entity Model, RBAC, Connectors & Ingestion Ops — Staged GitHub Issues

These issues implement the AI Catalog backend across RHDHPLAN-1507 (Entity Model & Ingestion Framework), RHDHPLAN-1508 (RBAC & Versioning Policy), RHDHPLAN-1510 (MCP Registry & RHOAI Connector), and RHDHPLAN-1513 (Ingestion Operations & Schema Alignment). Issues are grouped in dependency tiers — Tier 0 issues have no dependencies and can run in parallel; Tier 1 depends on Tier 0; Tier 2 depends on Tier 1.

Each issue is scoped for a single fullsend `/fs-code` run. Frontend admin UI issues are included (RBAC Admin UI, Ingestion Health Dashboard, Connector Config Admin UI). Developer-facing discovery UI is covered by RHDHPLAN-1509 and is NOT in scope here.

**Feature → Epic mapping:**

| Feature       | Epics                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| RHDHPLAN-1507 | RHIDP-15258 (Entity Model), RHIDP-15294 (OCI Skill Registry), RHIDP-15295 (Neo4j Knowledge Graph)                                  |
| RHDHPLAN-1508 | RHIDP-15270 (Graduated Visibility), RHIDP-15274 (Version Policy Cascade), RHIDP-15277 (Audit Logging), RHIDP-15304 (RBAC Admin UI) |
| RHDHPLAN-1510 | RHIDP-15313 (MCP Registry), RHIDP-15314 (RHOAI Connector), RHIDP-15316 (Cross-Connector Shared Infra)                              |
| RHDHPLAN-1513 | RHIDP-15331 (Health Dashboard), RHIDP-15332 (Hot-Reload), RHIDP-15334 (Schema Alignment)                                           |

**Cross-feature dependencies (RHDHPLAN-1509, RHDHPLAN-393):**

- Issue 24 (RHIDP-15273 Graduated Visibility Frontend) depends on RHIDP-15167 (Entity page extensions, RHDHPLAN-1509)
- RHIDP-15167 (RHDHPLAN-1509) depends on RHIDP-15335 (Issue 5 — Health API), creating a cross-feature dependency chain that must be resolved by building the API (Issue 5) first
- Issues 7, 13, 14 (RHIDP-15317, RHIDP-15318, RHIDP-15319 — MCP Registry Connector productization under RHDHPLAN-1510) depend on RHIDP-15655 (Implement MCP Registry entity provider, RHDHPLAN-393). The upstream community entity provider must exist before the productization wrapper can configure its endpoint (Issue 7), integrate TLS/credentials (Issue 13), or intercept entity emission for annotation enrichment (Issue 14). RHIDP-15321 (RHOAI version normalization, also in Issue 7) and Issues 15–16 (RHOAI connector) have no RHDHPLAN-393 dependency — they query RHOAI's own MCP catalog API independently.

**Maximum parallelism:**

- All 7 original Tier 0 issues can start simultaneously.
- Follow-up slots under those parents (`4.1`/`4.2`, `6.1`/`6.2`/`6.3`) do **not** bump the 29-issue numbering.
- Issue 4.1 (#4223 / PR #4225) was **closed without merging**; RHIDP-15302 design work lives on issue 4 (PR #4221).
- Issue 4.2 is independent of issue 4.
- `6.1`/`6.2`/`6.3` are unblocked now that issue 6 (#4044) is closed and are independent of each other.
- Within Tier 1, issues [17–19] (Neo4j) are independent of [9–12] (OCI) and [13–16] (MCP/RHOAI); issues [23–24] (RBAC frontend) and [26] (Ingestion Health UI) are also independent of the connector issues.
- Within Tier 2, issues [25] (RBAC Admin UI) and [27–29] (Ingestion/Analytics UI) can run in parallel.

**Jira-to-GitHub issue mapping is not 1:1.** GitHub issues are scoped for single fullsend `/fs-code` runs, while Jira stories are scoped by feature deliverable. When a Jira story defines an interface or foundation that later issues adopt or extend, the story's work naturally splits across dependency tiers — you define the annotation scheme in Tier 0 before providers can emit those annotations in Tier 1. The alternative (combining tiers into one larger issue) would defeat single-fullsend scoping and block parallelism. Five RHIDP stories have work split this way; three additional stories are referenced after completion as dependencies. The Jira story cannot be closed until the "Completed" issue finishes.

For now, we will be employing the RHDH process convention used for our Jira tracking for upstream work, where we'll remove RHIDP stories from sprints as needed, and put into Waiting, if there are sprint wide gaps for implementing various stages of a story.
But as we progress, if further break up of a story is more seamless, we'll pursue that. But in other words, we will be honoring the Story granularity conventions in the RHDH skills used to craft our stories.

| RHIDP Story                                   | Started (definition/foundation)                                                 | Completed (adoption/extension)                       | Referenced after completion                   |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| RHIDP-15255 (Annotation Scheme)               | Issue 2 — define annotations + validator                                        | Issue 8 — update providers to emit annotations       | —                                             |
| RHIDP-15260 (SDK Package)                     | Issue 2 — create package + interfaces                                           | Issue 8 — delta sync framework + publish             | —                                             |
| RHIDP-15273 (Graduated Visibility)            | Issue 23 — SkillBundle filtered-skill UX                                        | Issue 24 — RequirePermission gating on entity detail | —                                             |
| RHIDP-15280 (Audit Logging)                   | Issue 21 — define + emit audit events                                           | Issue 29 — analytics REST API consuming audit data   | —                                             |
| RHIDP-15306 (Admin Permission + Default-Deny) | Issue 3 — define `ai-catalog.admin` permission                                  | Issue 20 — implement default-deny config             | —                                             |
| RHIDP-15316 (Shared Infra)                    | Issue 1 — build `@red-hat-developer-hub/backstage-plugin-boost-connector-utils` | Issue 1                                              | Issues 13, 16 (integrate CA bundle utility)   |
| RHIDP-15335 (Health API)                      | Issue 5 — health API + data model                                               | Issue 26 — force sync routes using health data       | Issue 6.3 (#4285, runtimeEnabled handoff)     |
| RHIDP-15259 (SDK Interface)                   | Issue 2 — define `AIAssetEntityProvider` interface                              | Issue 2                                              | Issue 8 (providers compile against interface) |
| RHIDP-15302 (Migration Design)                | Issue 4 (#4042) / PR #4221 — `migration-plan.md` (8.1–8.4)                      | Issue 4 (#4042) — architect sign-off (8.5–8.6)       | Issue 4.1 (#4223/#4225) closed without merge  |
| RHIDP-15346 / 15347 (Annotation Spec + CLI)   | Issue 4.2 (#4220) — split from original issue 4                                 | Issue 4.2                                            | —                                             |
| RHIDP-15340 (Connector Config Schemas)        | Issue 6 (#4044) — Zod leaves + resolver                                         | Issues 6.1 (#4313), 6.2 (#4286)                      | Issue 6.3 (#4285, health reader)              |

---

# Tier 0 — No Dependencies (7 original issues, plus 4.x / 6.x follow-up slots)

---

## Cross-Connector Shared Infrastructure Package (issue 1 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4039

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15265, RHIDP-15266, RHIDP-15329, RHIDP-15330
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15316

Create the `@red-hat-developer-hub/backstage-plugin-boost-connector-utils` shared package providing CA bundle resolution, fault isolation wrappers (including `createSafeRefresh()` for scheduled refresh callbacks), enable/disable patterns, and configurable endpoint/credential validation. All entity-provider connectors (MCP Registry, RHOAI, OCI Skill) depend on this package. Includes reference app-config YAML for air-gapped deployment with Helm and Operator CR examples.

**Config note:** `ai-catalog.providers.<id>.enabled` controls **startup registration** (YAML-only). `boost.connectors.<id>.enabled` controls **runtime sync-skip** (db-overridable). Do not treat them as the same flag — see `openspec/changes/connector-config-hot-reload/design.md`.

### Tasks

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 1 (RHIDP-15329):

- 1.1 Create `@red-hat-developer-hub/backstage-plugin-boost-connector-utils` package with `package.json`, TypeScript config, and README
- 1.2 Define `loadCaBundle(connectorConfig: Config): Buffer | undefined` function signature — caller passes the Config subtree containing the `tls` block
- 1.3 Implement caFile resolution — read CA from `tls.caFile` within the provided Config subtree
- 1.4 Implement caSecret resolution — read CA from `tls.caSecret.$env` within the provided Config subtree
- 1.5 Add per-connector config isolation — each connector resolves its own Config nesting before calling `loadCaBundle()` (e.g., MCP passes `config.getConfig('ai-catalog.providers.mcpRegistry')`, RHOAI passes `config.getConfig('ai-catalog.providers.rhoai.mcpCatalog')`, OCI passes per-registry Config node)
- 1.6 Create `https.Agent` factory utility: `createHttpsAgent(caBundle?: Buffer): https.Agent | undefined`
- 1.7 Handle missing CA file: log WARN-level warning with expected file path, return `undefined` (don't crash)
- 1.8 Handle invalid/expired CA certificate: log ERROR with certificate details
- 1.9 Support CA certificate chains (concatenated PEM blocks)
- 1.10–1.15 Unit tests for CA bundle utility (file path, env var, missing, invalid, chain, isolation)

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 2 (RHIDP-15330):

- 2.1 Define `ConnectorErrorContext` interface
- 2.2 Create `createProviderWrapper(provider: EntityProvider, logger: LoggerService): EntityProvider` function
- 2.3 Implement try/catch wrapper around provider `connect()` via `createProviderWrapper()` to catch unhandled rejections
- 2.4 Implement `createSafeRefresh()` — try/catch wrapper around scheduled refresh callback to catch unhandled rejections
- 2.5 Implement structured error logging with connector context fields
- 2.6 Log errors via Backstage `LoggerService` for structured JSON output
- 2.7 Ensure wrappers do NOT rethrow errors — allow catalog backend to continue
- 2.8 Verify Backstage entity bucket isolation per provider (documentation + integration test)
- 2.9–2.11 Unit tests for fault isolation wrapper

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 3 (RHIDP-15330):

- 3.1 Define enable/disable config schema: `ai-catalog.providers.<id>.enabled: boolean`
- 3.2 Create `isConnectorEnabled(connectorConfig: Config): boolean` utility — caller passes the Config subtree (same pattern as `loadCaBundle`)
- 3.3 Implement config reader: return `true` if `enabled` is omitted (default enabled)
- 3.4 Create registration guard pattern for backend module `init()` example in README
- 3.5 Log INFO-level message when connector is disabled
- 3.6 Verify disabled connector uses zero resources
- 3.7–3.10 Unit tests for enable/disable pattern

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 4:

- 4.1 Export shared utilities from `src/index.ts`: `loadCaBundle`, `createHttpsAgent`, `createProviderWrapper`, `createSafeRefresh`, `isConnectorEnabled`, `ConnectorErrorContext`
- 4.2–4.7 Documentation: app-config schema, enable/disable, error logging, examples for each connector
- 4.8 Add JSDoc comments for all exported functions

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 5:

- 5.1–5.6 Integration tests: CA from file, CA from env, https.Agent with custom CA, provider failure containment, disabled connector skip, structured error log

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 6 (RHIDP-15266):

- 6.1 Create reference `app-config.yaml` snippet (endpoint URL, CA bundle, Secret-based creds, sync schedule)
- 6.2 Include MCP Registry connector example
- 6.3 Include RHOAI connector example
- 6.4 Include OCI Skill connector example
- 6.5 Document each config field with inline comments
- 6.6 Add air-gapped deployment variant
- 6.7 Place reference YAML in `workspaces/boost/examples/`

~~From `openspec/changes/connector-shared-infrastructure/tasks.md` group 7 (Connector Integration) — **deferred**: these tasks require connectors that are created in Tier 1 (Issues 9–16). Each connector issue will consume `boost-connector-utils` as part of its own implementation. See Issues 9 (OCI), 13–14 (MCP Registry), 15–16 (RHOAI).~~

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 6 (RHIDP-15265 — moved to RHIDP-15316):

- 6.3 Implement startup validation rejecting plaintext credentials with descriptive error message
- 6.4 Add `$secret` reference support for all credential fields
- 6.5 Implement configurable endpoint URLs (`baseUrl`) for all providers with startup validation

### Specifications

- `openspec/changes/connector-shared-infrastructure/specs/ca-bundle-resolution/spec.md`
- `openspec/changes/connector-shared-infrastructure/specs/fault-isolation/spec.md`
- `openspec/changes/connector-shared-infrastructure/specs/reference-app-config/spec.md`
- `openspec/changes/ai-catalog-entity-model/specs/air-gapped-deployment/spec.md`

---

## Entity-Provider SDK — Types, Interfaces, Annotation Validation (issue 2 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4040

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15255, RHIDP-15259, RHIDP-15303
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15258

Create the `@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk` package with the AI Asset annotation scheme (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`), version normalization utility, CatalogProcessor validator, `AIAssetEntityProvider` interface definition, `Neo4jSyncAdapter` interface, and `SkillBundleMetadata` type. This issue establishes all type contracts — the delta sync framework and package publishing are in Issue 8.

### Tasks

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 1 (RHIDP-15255):

- 1.1 Define `rhdh.io/ai-asset-category` annotation constant and allowed values enum (`agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`)
- 1.2 Define `rhdh.io/ai-asset-version` annotation constant
- 1.3 Define `rhdh.io/ai-asset-source` annotation constant
- 1.4 Implement `normalizeAIAssetVersion(sourceVersion)` utility with all four normalization rules
- 1.5 Add unit tests for `normalizeAIAssetVersion()`
- 1.6 Implement CatalogProcessor validator rejecting entities with missing/invalid annotations
- 1.7 Add unit tests for CatalogProcessor validator

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 2 (RHIDP-15259, RHIDP-15260 — package+interface):

- 2.1 Create `@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk` package with `package.json`, `tsconfig.json`, `README.md`
- 2.2 Define `AIAssetEntityProvider` TypeScript interface with required methods: `connect()`, `* entities()`, `getProviderName()`, `getProviderId()`
- 2.3 Define optional `delta(cursor?: string)` method for incremental sync pattern
- 2.4 Export annotation constants: `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`
- 2.5 Implement `validateAIAssetEntity(entity)` utility throwing on missing/invalid annotations
- 2.6 Add unit tests for `validateAIAssetEntity()`

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 3 (RHIDP-15303):

- 3.1 Define `Neo4jSyncAdapter` TypeScript interface with methods: `createNode()`, `updateNode()`, `deleteNode()`, `createRelationship()`
- 3.2 Define `RelationshipType` union type with constants: `DEPENDS_ON`, `USES_TOOL`, `BELONGS_TO`, `SIMILAR_TO`, `IMPLEMENTED_BY`, `INCLUDES`
- 3.3 Export `Neo4jSyncAdapter` interface from SDK package
- 3.4 Add JSDoc documentation to interface

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 4 (RHIDP-15303):

- 4.1 Define `SkillBundleMetadata` TypeScript type with fields
- 4.2 Export `SkillBundleMetadata` type from SDK package
- 4.3 Add JSDoc documentation with example skillcard.yaml structure

### Specifications

- `openspec/changes/ai-catalog-entity-model/specs/annotation-scheme/spec.md`
- `openspec/changes/ai-catalog-entity-model/specs/entity-provider-sdk/spec.md`

---

## AI Catalog Permissions, Backend Enforcement, Conditional Rules (issue 3 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4041

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15271, RHIDP-15272, RHIDP-15306 (permission definitions), RHIDP-15312
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15270

Define AI Catalog permission constants (`ai-catalog.asset.access`, `ai-catalog.asset.access.usage-docs`, `ai-catalog.admin`), implement graduated visibility backend enforcement (Tier 1 entity-level + Tier 2 field-level filtering), and implement conditional permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`) with `toQuery()` support. The default-deny config implementation is in Issue 20.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 1 (RHIDP-15271, RHIDP-15306):

- 1.1 Define `AI_CATALOG_ASSET_RESOURCE_TYPE` constant in `boost-common/src/permissions.ts`
- 1.2 Define `ai-catalog.asset.access` resource permission
- 1.3 Define `ai-catalog.asset.access.usage-docs` resource permission
- 1.4 Define `ai-catalog.admin` basic permission
- 1.5 Export all permission constants and resource type
- 1.6 Register all 3 permissions via `permissionsRegistry.addPermissions()`

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 2 (RHIDP-15271, RHIDP-15272):

- 2.1 Implement Tier 2 field-level filtering in AI asset detail endpoint
- 2.2 Implement entity-level filtering on list endpoint using `authorizeConditional()`
- 2.3 Implement batch `authorizeConditional()` for Tier 2
- 2.4 Add unit tests for field-level filtering

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 4 (RHIDP-15312):

- 4.1 Implement `isAiAssetCategory` rule with `apply()` and `toQuery()`
- 4.2 Implement `isAiAssetCategory.toQuery()` generating catalog query predicate
- 4.3 Implement `isFromConnector` rule with `apply()` and `toQuery()`
- 4.4 Implement `isFromConnector.toQuery()` generating catalog query predicate
- 4.5 Implement `isInTenant` rule with `apply()` and `toQuery()`
- 4.6 Implement `isInTenant.toQuery()` generating catalog query predicate
- 4.7 Register all 3 rules via `createPermissionIntegrationRouter` with `resourceType: 'ai-catalog-asset'`
- 4.8 Add unit tests for each rule's `apply()` and `toQuery()` methods

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/graduated-visibility/spec.md`
- `openspec/changes/ai-catalog-asset-governance/specs/conditional-policies/spec.md`

---

## Upstream Schema Alignment — Migration Design & Sign-off (issue 4 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4042

**Status:** OPEN (active PR [#4221](https://github.com/redhat-developer/rhdh-plugins/pull/4221))
**Labels:** `documentation`, `ready-to-code`, `workspace/boost`
**Depends on:** Mapping reconciliation (#4188 / #4189) — done. Does **not** depend on Issue 4.1.
**RHIDP Stories:** RHIDP-15302
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15258

**Narrowed from the original “issue 4 of 29” bundle.** This issue covers **RHIDP-15302 only**: the migration design document (tasks 8.1–8.4) **and** RHDH architect / tech-lead sign-off (8.5–8.6). That matches the current [#4042 body](https://github.com/redhat-developer/rhdh-plugins/issues/4042).

RHIDP-15346 (annotation specification publish) and RHIDP-15347 (migration-readiness CLI) were **split out** to Issue 4.2 (#4220). A parallel 8.1–8.4 split (#4223 / PR #4225) was started and then **closed without merging** (2026-08-19). The canonical design SoT is OpenSpec `migration-plan.md` via PR #4221, with a thin `specifications/` pointer (no duplicate mapping tables). 4.2 does not block this issue.

**Prerequisites (done):**

- Gate decisions: [#4042 comment](https://github.com/redhat-developer/rhdh-plugins/issues/4042#issuecomment-5204217995)
- Mapping table reconciliation: [#4188](https://github.com/redhat-developer/rhdh-plugins/issues/4188) / [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189)

This is **readiness design**, not executing migration and not building the CLI.

### Remaining (after 4.2 / #4220 is split out)

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 8 (RHIDP-15302):

- 8.1–8.4 Migration design document — **this issue**, PR [#4221](https://github.com/redhat-developer/rhdh-plugins/pull/4221) (`openspec/.../migration-readiness/migration-plan.md` as SoT; `specifications/ai-asset-upstream-migration-design.md` is a pointer only). Held pending related catalog entity-type PRs (#4164, #4211) so the plan stays aligned.
- 8.5 Obtain RHDH architect / tech-lead sign-off (not upstream maintainer required) — **after #4221 merges**; unsigned placeholder in the plan until then
- 8.6 Document sign-off in the design doc (reviewer, role, date, status)

### Out of scope (moved)

- RHIDP-15346 annotation specification publish → Issue 4.2 (#4220)
- RHIDP-15347 migration-readiness CLI → Issue 4.2 (#4220)
- Duplicate full design doc on the #4223 / #4225 track — **closed without merging** (2026-08-19)
- Actual entity migration / catalog processor
- Re-opening Decision 1 or MCP Option 3

### Specifications

- `openspec/changes/ai-catalog-entity-model/specs/migration-readiness/spec.md`
- `openspec/changes/ai-catalog-entity-model/specs/migration-readiness/migration-plan.md` (canonical SoT on PR #4221)

---

## Upstream Schema Alignment — Migration Design Document (issue 4.1 of 29) — CLOSED without merge

https://github.com/redhat-developer/rhdh-plugins/issues/4223

**Status:** CLOSED (2026-08-19) without merging PR [#4225](https://github.com/redhat-developer/rhdh-plugins/pull/4225)
**Parent:** Split from #4042 (issue 4 of 29), then folded back

Parallel experiment for RHIDP-15302 tasks 8.1–8.4 (full `specifications/ai-asset-upstream-migration-design.md`). Replaced by Issue 4 / PR [#4221](https://github.com/redhat-developer/rhdh-plugins/pull/4221) (`migration-plan.md` as OpenSpec SoT, thin specifications pointer). Kept here only so the 4.1 number is explained.

---

## Upstream Schema Alignment — Annotation Spec & Migration-Readiness CLI (issue 4.2 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4220

**Status:** OPEN
**Labels:** `feature`, `triaged`, `workspace/boost`
**Depends on:** None (independent of Issue 4). Mapping reconciliation (#4188 / #4189) — done.
**RHIDP Stories:** RHIDP-15346, RHIDP-15347
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15334
**Parent:** Split from #4042 (issue 4 of 29)

Publish the annotation/mapping specification under `workspaces/boost/specifications/` and implement the read-only `@red-hat-developer-hub/backstage-plugin-boost-migration-readiness` CLI using the post-#4189 tables. Does **not** block Issue 4 (#4042) sign-off.

> **Deferral note:** This is the RHDHPLAN-1513 slice that was originally bundled into issue 4. If RHDHPLAN-1513 is deferred from 2.1, defer this slot (RHIDP-15346/15347) with it. RHIDP-15302 stays on Issue 4 (RHDHPLAN-1507). See `RHDHPLAN-1513-defer-from-2-1-staging-and-jira-impact.md` for full deferral analysis.

### Tasks

From `openspec/changes/upstream-schema-alignment/tasks.md` group 1 (RHIDP-15346):

- 1.1–1.12 Document and publish annotation/mapping spec (seven categories; MCP kind already aligned via backstage#34016 — field/module/fallback only, **not** `kind: McpServer`)

From `openspec/changes/upstream-schema-alignment/tasks.md` groups 2–5 (RHIDP-15347):

- 2.1–2.12 CLI package, catalog client, mapping logic, JSON + text formatters, missing/partial handling, args, assessment footer
- 3.1–3.10 Tests
- 4.1–4.8 Package README / usage / confidence / future-work messaging
- 5.1–5.5 Cross-refs (RHDHPLAN-1507 / #4042 RHIDP-15302, RFCs, related stories)

### Out of scope

- RHIDP-15302 migration design + sign-off → Issue 4 (#4042) / PR #4221 (not #4223 / #4225)
- Actual catalog entity migration / processor
- `vector-store` / `ai-tool` categories

### Specifications

- `openspec/changes/upstream-schema-alignment/specs/annotation-specification/spec.md`
- `openspec/changes/upstream-schema-alignment/specs/migration-readiness-tooling/spec.md`

---

## Ingestion Health — API, Data Model, Error Classification (issue 5 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4043

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15335, RHIDP-15337
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15331

Implement the ingestion health backend: `boost_sync_attempts` table with database migration, `SyncAttemptsRepository`, `HealthStatusService` with status derivation (healthy/degraded/failing/unknown based on last 3 attempts; unknown = zero sync attempts recorded), `GET /api/boost/ingestion-health` REST endpoint, and `ErrorClassifier` utility with actionable diagnostic guidance for auth failures, network errors, schema mismatches, and rate limits. RBAC gating (`ai-catalog.admin`) for this endpoint is deferred to Issue 26. The admin UI consuming this API is also in Issue 26.

### Tasks

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 1 (RHIDP-15335):

- 1.1 Define `boost_sync_attempts` table schema in database migration (connector_id, timestamp, outcome, error_type, error_message, assets_added/updated/removed, duration_ms)
- 1.2 Create database migration file for `boost_sync_attempts` table with indexes on (connector_id, timestamp DESC)
- 1.3 Implement `SyncAttemptsRepository` class with methods: `insertSyncAttempt()`, `getLatestAttempts()`, `cleanupOldAttempts()`
- 1.4 Add retention policy config schema (`boost.ingestion.healthRetention.maxAttemptsPerConnector`, default 100)
- 1.5 Implement scheduled cleanup job for sync attempts (daily, enforces retention)
- 1.6 Add database indexes for efficient health status queries

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 2 (RHIDP-15335):

- 2.1 Define `ConnectorHealthStatus` type in `plugins/boost-common/src/types/ingestion-health.ts`
- 2.2 Implement `GET /api/boost/ingestion-health` route returning array of connector health objects
- 2.3 Implement health status derivation logic in `HealthStatusService.deriveStatus(attempts)` (healthy/degraded/failing/unknown based on last 3 attempts; unknown = zero sync attempts recorded)
- 2.4 Add `?includeDisabled=true` query parameter support
- ~~2.5 Implement RBAC gating via `ai-catalog.admin` permission check in route handler (using `permissions.authorize()`)~~ — deferred to Issue 26
- 2.6 Add structured logging for health API requests via Backstage `LoggerService` (full audit event emitters deferred to Issue 21 / RHIDP-15277)
- 2.7 Implement empty state handling
- 2.8 Add health API integration tests

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 3 (RHIDP-15337):

- 3.1 Create `ErrorClassifier` utility class
- 3.2 Implement `classify(error, options?)` method returning `{ errorType, errorMessage, diagnosticGuidance }`
- 3.3 Add auth failure detection patterns (401/403, "Invalid token", "OAuth expired")
- 3.4 Add network failure detection patterns (ECONNREFUSED, ETIMEDOUT, DNS, TLS)
- 3.5 Add schema mismatch detection patterns (JSON parsing, "Unexpected field", GraphQL)
- 3.6 Add rate limit detection patterns (429, X-RateLimit-Remaining)
- 3.7 Implement connector-specific error matchers
- 3.8 Implement unknown error fallback classification
- 3.9 Add diagnostic guidance text for each error type
- 3.10 Add error classification unit tests

### Specifications

- `openspec/changes/ingestion-health-dashboard/specs/health-status-api/spec.md`
- `openspec/changes/ingestion-health-dashboard/specs/error-classification/spec.md`

---

## Connector Config — Zod Schemas and RuntimeConfigResolver Extension (issue 6 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4044

**Status:** CLOSED
**Labels:** `feature`, `triaged`, `workspace/boost`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15340
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

**Done.** Registered Zod connector config leaves for Jira, GitHub, and GitLab (`boost.connectors` fields only — all `configScope: db-overridable`) and extended `RuntimeConfigResolver` with two-layer merge (YAML baseline + DB overrides), 30s TTL cache with immediate invalidation, and schema validation during merge. MCP/RHOAI/OCI runtime `boost.connectors` Zod/hot-reload remains out of scope; the Issue 6 → 22 → 28 chain stays Jira/GitHub/GitLab.

Deferred OpenSpec slices (do **not** re-open this issue for them):

- Task **1.8** (optional-field defaults at resolve time) → Issue 6.1 (#4313)
- Task **2.8** / group 9 (`__schemaVersion` leaf + migration) → Issue 6.2 (#4286, closed)
- Health `runtimeEnabled` handoff → Issue 6.3 (#4285)

Hot-reload propagation to connectors is Issue 22 (depends on 6 **and** 6.1); admin UI is Issue 28.

**Config note:** `ai-catalog.providers.<id>.enabled` controls **startup registration** (YAML-only). `boost.connectors.<id>.enabled` controls **runtime sync-skip** (db-overridable). Do not treat them as the same flag — see `openspec/changes/connector-config-hot-reload/design.md`.

### Tasks

From `openspec/changes/connector-config-hot-reload/tasks.md` group 1 (RHIDP-15340):

- 1.1 Define Jira connector config Zod schema with `boost.connectors` fields only: `enabled` (boolean), `endpoint` (URL), `schedule.intervalMs` (number), `schedule.cron` (string), `batchSize` (number), `timeout.connectionMs` (number). Note: `tls.caFile`, `credentials.*`, and `namespace` are `ai-catalog.providers` fields — not part of the `boost.connectors` schema.
- 1.2 All `boost.connectors` fields are `configScope: db-overridable` (deployment-time fields like `credentials.*`, `tls.*`, and `namespace` live under `ai-catalog.providers.<id>.*`)
- 1.3 Define GitHub connector config Zod schema
- 1.4 Define GitLab connector config Zod schema
- 1.5 Add URL validation for `endpoint` field
- 1.6 Add positive number validation for numeric fields
- 1.7 Add cron expression validation for `schedule.cron`
- ~~1.8 Define default values in schemas~~ — deferred to Issue 6.1 (#4313). Applied as `ConfigFieldMeta.defaultValue` at resolve time, **not** Zod `.default()`.
- 1.9 Add schema versioning field
- 1.10 Add unit tests for schema validation

From `openspec/changes/connector-config-hot-reload/tasks.md` group 2 (RHIDP-15340):

- 2.1 Extend `RuntimeConfigResolver` to support connector config scope
- 2.2 Extend `resolve(key: BoostConfigKey)` method to support connector leaf config keys (e.g., `boost.connectors.jira.enabled`)
- 2.3 Implement two-layer merge: YAML baseline from `ConfigApi` + DB overrides from `AdminConfigService`
- 2.4 Implement cache with 30s TTL for merged connector config
- 2.5 Implement immediate cache invalidation on DB override write
- 2.6 Add Zod schema validation during merge
- 2.7 Implement `configScope` enforcement: reject DB override writes for `yaml-only` fields
- ~~2.8 Add schema version migration logic for backward compatibility~~ — deferred to Issue 6.2 (#4286, closed)
- 2.9 Add unit tests for two-layer merge
- 2.10 Add integration tests for `RuntimeConfigResolver` with connector schemas

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/config-schemas/spec.md`

---

## Connector Config — Apply optional-field defaults at resolve time (issue 6.1 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4313

**Status:** OPEN (PR [#4314](https://github.com/redhat-developer/rhdh-plugins/pull/4314))
**Labels:** `enhancement`, `feature`, `triaged`, `ai-integrations`
**Depends on:** Issue 6 (#4044, closed — connector leaves + resolver exist)
**Unblocks:** Issue 22 (#4060) — hot-reload consumers must not invent their own fallbacks for unset optional numerics
**RHIDP Stories:** RHIDP-15340 (deferred slice from #4044)
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332
**Parent:** Deferred from #4044 (issue 6 of 29)

#4044 registered connector Zod leaves and extended `RuntimeConfigResolver`, but **did not apply OpenSpec task 1.8 defaults**. Apply them as a read-time fallback after the two-layer cache merge: DB override → YAML baseline → field default → `undefined`.

**Do not** add Zod `.default()` — that would collapse “unset” during `validateConfigValue` and break resolver precedence.

Default values (exact):

| Key pattern                                  | Default          | Notes                |
| -------------------------------------------- | ---------------- | -------------------- |
| `boost.connectors.<id>.schedule.intervalMs`  | `300000` (5 min) | jira, github, gitlab |
| `boost.connectors.<id>.batchSize`            | `100`            | jira, github, gitlab |
| `boost.connectors.jira.timeout.connectionMs` | `30000` (30 s)   | Jira only            |

Fields **without** defaults (`enabled`, `endpoint`, `schedule.cron`) stay `undefined` when absent.

### Out of scope

- Validation rules (HTTPS, `.int()`, `.max()`, cron) — already landed in #4044
- `__schemaVersion` leaves or migration — Issue 6.2 (#4286)
- Provider / hot-reload wiring — Issue 22 (#4060)
- Admin UI — Issue 28 (#4066)

### Specifications

- `openspec/changes/connector-config-hot-reload/tasks.md` — task 1.8
- `openspec/changes/connector-config-hot-reload/specs/config-schemas/spec.md` — Requirement: Default Values

---

## Connector Config — Schema versioning leaf and migration (issue 6.2 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4286

**Status:** CLOSED (PR [#4315](https://github.com/redhat-developer/rhdh-plugins/pull/4315) merged)
**Labels:** `feature`, `triaged`, `workspace/boost`
**Depends on:** Issue 6 (#4044, closed). Independent of Issue 6.1.
**RHIDP Stories:** RHIDP-15340 (deferred slice) + OpenSpec group 9
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332
**Parent:** Deferred from #4044 (issue 6 of 29)

**Done.** Registered per-connector `boost.connectors.<id>.__schemaVersion` (`configScope: db-only`) and migration when stored connector schema version is below current (OpenSpec task 2.8 / group 9). Isolated from #4044 because there was no prior connector override data to migrate at first ship.

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/config-schemas/spec.md` (Schema Versioning)
- `openspec/changes/connector-config-hot-reload/tasks.md` group 9

---

## Ingestion Health — Wire ConnectorConfigReader runtimeEnabled to RuntimeConfigResolver (issue 6.3 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4285

**Status:** OPEN (PR [#4316](https://github.com/redhat-developer/rhdh-plugins/pull/4316))
**Labels:** `feature`, `triaged`, `workspace/boost`
**Depends on:** Issue 6 (#4044, closed — connector leaf keys registered). Independent of Issues 6.1 and 6.2.
**Unblocks:** correct health `enabled` / `?includeDisabled` under DB overrides; soft prerequisite for connector admin UX that relies on health reflecting runtime toggles (Issues 5 / 26)
**RHIDP / Feature:** RHDHPLAN-1513 — follows #4043 handoff contract
**Parent:** Deferred from #4044 (issue 6 of 29)

After #4044, `boost.connectors.<id>.enabled` is db-overridable via `RuntimeConfigResolver`, but `ConnectorConfigReader` still reads both enabled flags from YAML/`ConfigApi` only. This slot injects the resolver, makes discovery async (`listCandidates()` is synchronous today; `resolve()` is async), and updates `HealthStatusService` / routes / tests.

Startup `ai-catalog.providers.<id>.enabled` stays YAML/`ConfigApi`. `runtimeEnabled` ← `await resolver.resolve('boost.connectors.<id>.enabled')` with default `true` when unset.

### Out of scope

- Registering connector Zod leaves — Issue 6 (#4044)
- Provider hot-reload — Issue 22 (#4060)
- Admin UI / admin config HTTP API — Issue 28 (#4066)
- Schema migration / `__schemaVersion` — Issue 6.2 (#4286)

### Specifications / refs

- [#4043 implementation gate](https://github.com/redhat-developer/rhdh-plugins/issues/4043#issuecomment-5252823127) — “Contract #4044 must preserve / complete”
- `plugins/boost-backend/src/ingestion/ConnectorConfigReader.ts`
- `openspec/changes/connector-config-hot-reload/design.md` (namespace table)

---

## MCP Mirror Endpoint + RHOAI Version Normalization (issue 7 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4045

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15317, RHIDP-15321
**Feature:** RHDHPLAN-1510 — Epics RHIDP-15313, RHIDP-15314
**Cross-feature dependency:** RHIDP-15317 depends on RHIDP-15655 (Implement MCP Registry entity provider, RHDHPLAN-393). The upstream community provider must exist before the productization layer can override its endpoint configuration. RHIDP-15321 (RHOAI version normalization) has no RHDHPLAN-393 dependency and can start immediately.

Implement the MCP Registry mirror endpoint configuration with zero-internet validation (no outbound traffic to public endpoint when mirror is configured), startup health check, and non-HTTPS security warnings. Also implement RHOAI version normalization utility for MCP server entity `rhdh.io/ai-asset-version` annotation population. RHIDP-15321 has no cross-connector dependencies and can start immediately; RHIDP-15317 is blocked on the upstream MCP Registry entity provider (RHDHPLAN-393 RHIDP-15655).

### Tasks

From `openspec/changes/mcp-registry-connector/tasks.md` group 1 (RHIDP-15317):

- 1.1 Add `ai-catalog.providers.mcpRegistry.endpoint` config schema in `config.d.ts`
- 1.2 Implement endpoint configuration loading from app-config
- 1.3 Add environment variable override support (`MCP_REGISTRY_ENDPOINT`)
- 1.4 Implement endpoint URL validation
- 1.5 Add endpoint fallback logic (app-config > env var > default public endpoint)
- 1.6 Implement startup endpoint validation health check
- 1.7 Add endpoint configuration logging at connector startup
- 1.8 Add security warning for non-HTTPS endpoints
- 1.9 Implement HTTP client configuration with mirror endpoint URL
- 1.10 Add Prometheus metrics for endpoint request count, latency, error rate
- 1.11 Add Prometheus metric for public endpoint violation detection
- 1.12–1.18 Integration tests: zero outbound traffic, mirror targeting, DNS resolution, retry backoff, invalid URL, non-HTTPS warning, override precedence
- 1.19–1.20 Documentation: mirror endpoint examples, zero-internet validation

From `openspec/changes/rhoai-connector/tasks.md` group 7 (RHIDP-15321):

- 7.1 Define version normalization rules
- 7.2 Implement `normalizeVersion(rawVersion)` utility — semver normalization, strip `v` prefix, handle `latest`/`nightly`
- 7.3 Populate `rhdh.io/ai-asset-version` annotation with normalized version
- 7.4 Handle missing version metadata: set `"unknown"` with DEBUG log
- 7.5 Handle invalid version strings: set `"unknown"` with WARNING log
- 7.6 Unit tests for version normalization
- 7.7 Integration test: emitted entities carry correct annotation

### Specifications

- `openspec/changes/mcp-registry-connector/specs/mirror-endpoint/spec.md`
- `openspec/changes/rhoai-connector/specs/mcp-catalog-source/spec.md`

---

# Tier 1 — Depends on Tier 0 (18 issues)

---

## SDK — Delta Sync Framework and Package Publish (issue 8 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4046

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra exports), Issue 2 (types/interfaces)
**RHIDP Stories:** RHIDP-15260, RHIDP-15262
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15258

Implement the `DeltaSyncManager` class with `applyDelta()` method translating connector deltas to catalog mutations, sync cursor persistence in catalog database, and fallback to full refresh when cursor is invalid. Update existing providers (Kagenti, LlamaStack) to emit entities with required AI Asset annotations. Publish SDK package to npm registry. Write SDK documentation with interface contract, annotation scheme, and code examples.

### Tasks

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 2 (RHIDP-15260, RHIDP-15262):

- 2.7 Publish SDK package to npm registry with semver versioning (RHIDP-15260)
- 2.8 Implement `DeltaSyncManager` class wrapping `applyMutation({ type: 'delta' })` API (RHIDP-15262)
- 2.9 Add `applyDelta({ added, updated, removed, nextCursor })` method (RHIDP-15262)
- 2.10 Implement sync cursor persistence using catalog database (RHIDP-15262)
- 2.11 Implement `getCursor(providerId)` method retrieving last persisted cursor (RHIDP-15262)
- 2.12 Implement fallback to full refresh when cursor invalid or missing (RHIDP-15262)
- 2.13 Add unit tests for delta sync framework (RHIDP-15262)

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 5 (RHIDP-15255, RHIDP-15259):

- 5.1 Update Kagenti provider to emit entities with all three required annotations
- 5.2 Update LlamaStack provider to emit entities with all three required annotations
- 5.3 Verify Kagenti provider compiles against SDK interface without errors
- 5.4 Verify LlamaStack provider compiles against SDK interface without errors

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 9 (RHIDP-15260):

- 9.1 Write SDK package README documenting interface contract, annotation constants, validation usage
- 9.2 Add code examples to README showing provider implementation
- 9.3 Document version normalization rules in SDK README
- 9.5 Create `CHANGELOG.md` with initial version entry

### Specifications

- `openspec/changes/ai-catalog-entity-model/specs/entity-provider-sdk/spec.md`
- `openspec/changes/ai-catalog-entity-model/specs/delta-sync-framework/spec.md`

---

## OCI Skill Registry — Core Connector (issue 9 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4047

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 8 (SDK)
**RHIDP Stories:** RHIDP-15296
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15294

Implement the core OCI Skill Registry connector: OCI Distribution Spec client for tag listing, manifest fetching, and blob download; skillcard extraction from OCI image layers with YAML parsing and SDK schema validation; entity emission as `kind: AIResource` with `spec.type: skill` and all required annotations; backend module registration with `createBackendModule`. This is the foundational OCI connector — multi-registry config, incremental sync, and load testing are separate issues.

### Tasks

From `openspec/changes/oci-skill-registry/tasks.md` group 1 (RHIDP-15296):

- 1.1 Evaluate and select Node.js OCI Distribution Spec client library
- 1.2 Implement `OciRegistryClient` class with methods: `listTags()`, `getManifest()`, `getBlob()`
- 1.5 Write unit tests for OCI client with mocked registry responses

From `openspec/changes/oci-skill-registry/tasks.md` group 2 (RHIDP-15296):

- 2.1 Implement layer blob download with streaming decompression
- 2.2 Implement tar stream parser to extract `skillcard.yaml`
- 2.3 Integrate SDK schema validator for `skillcard.yaml` validation
- 2.4 Implement error handling for missing/invalid `skillcard.yaml`
- 2.5–2.6 Unit tests for skillcard extraction and schema validation

From `openspec/changes/oci-skill-registry/tasks.md` group 3 (RHIDP-15296):

- 3.1 Implement `OciSkillRegistryProvider` class extending `EntityProvider` interface
- 3.2 Implement entity factory: convert `skillcard.yaml` to Backstage `AIResource` entity
- 3.3 Populate required annotations: `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`
- 3.4 Implement entity ref sanitization
- 3.5 Write unit tests for entity emission

From `openspec/changes/oci-skill-registry/tasks.md` group 6 (RHIDP-15296):

- 6.1 Implement backend module with `createBackendModule({ pluginId: 'catalog', moduleId: 'ai-catalog-oci-skill-registry' })`
- 6.2 Register entity provider via `catalogProcessingExtensionPoint`
- 6.4 Write integration test for module registration

From `openspec/changes/oci-skill-connector/tasks.md` group 1 (RHIDP-15324):

- 1.1–1.11 OCI registry client: tag listing, manifest fetching, Docker v2 fallback, digest extraction, pagination, namespace filtering, parallel manifest fetch, OCI annotations, blob download, gzip decompression, unit tests

From `openspec/changes/oci-skill-connector/tasks.md` group 2 (RHIDP-15325):

- 2.1–2.15 Skillcard parsing: layer identification, YAML parsing, Zod validation, error logging, entity building as `kind: AIResource`, annotation population, default values, invalid skill rejection, aggregate summary, unit tests

### Specifications

- `openspec/changes/oci-skill-registry/specs/oci-artifact-ingestion/spec.md`
- `openspec/changes/oci-skill-connector/specs/registry-discovery/spec.md`
- `openspec/changes/oci-skill-connector/specs/skillcard-parsing/spec.md`

---

## OCI — Multi-Registry and Air-Gapped Support (issue 10 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4048

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 9 (core connector)
**RHIDP Stories:** RHIDP-15297
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15294

Add multi-registry configuration support (distinct credentials, CA bundles, and sync schedules per registry instance), K8s pull secret loader with Docker `config.json` parsing, custom CA bundle integration via shared `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`, and air-gapped registry support with no external DNS resolution.

### Tasks

From `openspec/changes/oci-skill-registry/tasks.md` group 4 (RHIDP-15297):

- 4.1 Define app-config schema for `ai-catalog-oci-skill-registry` with registry instances
- 4.2 Implement config parser with validation
- 4.3 Implement Secret loader for registry credentials
- 4.4 Implement ConfigMap/Secret loader for custom CA bundles
- 4.5 Implement per-registry sync interval scheduling
- 4.6–4.7 Unit tests and integration test for multi-registry

From `openspec/changes/oci-skill-connector/tasks.md` group 4 (RHIDP-15327):

- 4.1–4.15 Auth and air-gapped: K8s pull secret loader, Docker config.json parsing, Basic Auth, missing pull secret handling, custom CA bundle, shared CA utility integration, system CA fallback, per-registry auth, credential reuse, air-gapped registry support, DNS resolution failure handling, unit and integration tests

### Specifications

- `openspec/changes/oci-skill-registry/specs/multi-registry-config/spec.md`

---

## OCI — Digest-Based Incremental Sync (issue 11 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4049

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 9 (core connector)
**RHIDP Stories:** RHIDP-15298
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15294

Implement digest-based incremental sync: cursor storage schema (registryId, namespace, tagDigestMap, lastSync), tag-to-digest comparison detecting new/changed/removed tags, change detection algorithm translating to add/update/delete entity mutations, full refresh fallback for invalid cursors, and in-memory digest cache with 5-minute TTL and disk persistence.

### Tasks

From `openspec/changes/oci-skill-registry/tasks.md` group 5 (RHIDP-15298):

- 5.1 Define cursor storage schema
- 5.2 Implement cursor persistence layer
- 5.3 Implement tag-to-digest comparison logic
- 5.4 Implement change detection algorithm
- 5.5 Implement full refresh fallback
- 5.6–5.7 Unit tests and performance test for incremental sync

From `openspec/changes/oci-skill-connector/tasks.md` group 3 (RHIDP-15326):

- 3.1 Implement in-memory digest cache
- 3.2 Implement 5-minute TTL on cache entries
- 3.3 Implement digest comparison logic: detect added, changed, removed skills
- 3.4 Implement delta mutation emission via `applyMutation({ type: 'delta' })`
- 3.5 Implement full mutation on first sync
- 3.6 Implement disk persistence
- 3.7 Implement disk cache loading on startup
- 3.8 Implement cache re-validation after TTL expiration
- 3.9–3.10 Unit and integration tests for cache logic

### Specifications

- `openspec/changes/oci-skill-registry/specs/digest-based-sync/spec.md`
- `openspec/changes/oci-skill-connector/specs/incremental-sync-scale/spec.md`

---

## OCI — Load Testing and Scale Validation (issue 12 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4050

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 9 (core connector)
**RHIDP Stories:** RHIDP-15268
**Feature:** RHDHPLAN-1507 — Epics RHIDP-15258, RHIDP-15294

Create load test harness generating 5,000+ AI asset entities, measure baseline vs with-AI-Catalog p95 latency (SLA: ≤10% degradation), validate processing-loop duration (entity emission → catalog API availability), and validate 2,000-image OCI sync completes within 5 minutes with peak memory under 500 MB.

### Tasks

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 7 (RHIDP-15268):

- 7.1 Create load test harness generating 5,000+ AI asset entities
- 7.2 Measure baseline p95 latency without AI Catalog entities
- 7.3 Measure with-AI-Catalog p95 latency with 5,000+ entities
- 7.4 Validate p95 latency degradation ≤10% SLA
- 7.5 Measure processing-loop duration
- 7.6 Document load test execution steps in `tests/load/README.md`

From `openspec/changes/oci-skill-connector/tasks.md` group 5 (RHIDP-15328):

- 5.1 Create mock OCI registry test harness with 2,000 synthetic skill images
- 5.2 Implement mock registry endpoints
- 5.3 Implement parallel manifest fetch with configurable concurrency
- 5.4 Implement batch processing (100 per batch)
- 5.5 Implement memory-bounded processing
- 5.6 Validate full sync of 2,000 images within 5 minutes
- 5.7 Validate incremental sync with 10% churn within 2 minutes
- 5.8 Log throughput and memory usage
- 5.9 Fail if throughput drops below 6 images/second
- 5.10 Verify peak memory under 500 MB

### Specifications

- `openspec/changes/ai-catalog-entity-model/specs/performance-resilience/spec.md`
- `openspec/changes/oci-skill-connector/specs/incremental-sync-scale/spec.md`

---

## MCP Registry — TLS and Credential Hardening (issue 13 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4051

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 7 (mirror endpoint)
**RHIDP Stories:** RHIDP-15318
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15313
**Cross-feature dependency:** RHIDP-15318 depends on RHIDP-15655 (Implement MCP Registry entity provider, RHDHPLAN-393). The upstream community provider must exist as the integration target for TLS/credential wrapping.

Integrate shared CA bundle utility (`loadCaBundle()`) from `@red-hat-developer-hub/backstage-plugin-boost-connector-utils`, implement K8s Secret-based authentication (Basic Auth and Bearer token), Secret data caching with 5-minute TTL and invalidation on 401, and per-connector TLS configuration isolation.

### Tasks

From `openspec/changes/mcp-registry-connector/tasks.md` group 2 (RHIDP-15318):

- 2.1 Integrate shared CA bundle utility from RHIDP-15316
- 2.2 Add `ai-catalog.providers.mcpRegistry.tls.caFile` config schema
- 2.3 Implement custom CA bundle loading from file path
- 2.4 Add graceful degradation: invalid CA bundle falls back to system CA
- 2.5 Add warning logging for invalid CA bundle files
- 2.6 Implement HTTPS agent configuration with custom CA bundle
- 2.7 Enforce TLS certificate validation (`rejectUnauthorized: true`)
- 2.8 Add `ai-catalog.providers.mcpRegistry.auth.secretRef` config schema
- 2.9 Implement K8s Secret reading
- 2.10 Implement credential extraction from Secret
- 2.11 Implement HTTP Basic Auth for username/password
- 2.12 Implement Bearer token authentication
- 2.13 Implement Secret data caching with 5-minute TTL
- 2.14 Implement cache invalidation on HTTP 401
- 2.15 Add error handling: missing Secret, missing credential keys, invalid Secret data
- 2.16 Add per-connector TLS configuration isolation
- 2.17–2.18 Prometheus metrics for TLS and auth
- 2.19–2.26 Integration tests for CA bundle, K8s Secret, cache invalidation, per-connector isolation
- 2.27–2.29 Documentation: CA bundle config, K8s Secret auth, Secret rotation

### Specifications

- `openspec/changes/mcp-registry-connector/specs/auth-tls-hardening/spec.md`

---

## MCP Registry — AI Asset Annotation Enrichment (issue 14 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4052

**Labels:** `ready-to-code`
**Depends on:** Issue 8 (SDK validation layer), Issue 13 (TLS hardening)
**RHIDP Stories:** RHIDP-15319
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15313
**Cross-feature dependency:** RHIDP-15319 depends on RHIDP-15655 (Implement MCP Registry entity provider, RHDHPLAN-393) and RHIDP-15658 (Implement MCP Registry to entity mapping, RHDHPLAN-393). The upstream provider and its entity mapping must exist before the productization wrapper can intercept entity emission for annotation enrichment.

Implement `RhdhMcpRegistryProviderWrapper` class intercepting entity emission to enrich with AI Asset annotations (`rhdh.io/ai-asset-category: "mcp-server"`, `rhdh.io/ai-asset-source: "mcp-registry"`, extracted version), integrate with SDK validation layer, and preserve existing annotations.

### Tasks

From `openspec/changes/mcp-registry-connector/tasks.md` group 3 (RHIDP-15319):

- 3.1 Implement `RhdhMcpRegistryProviderWrapper` class wrapping upstream connector
- 3.2 Implement entity emission interception before `applyMutation`
- 3.3 Implement annotation enrichment logic (`enrichWithAiAssetAnnotations()`)
- 3.4 Add `rhdh.io/ai-asset-category: "mcp-server"` annotation
- 3.5 Add `rhdh.io/ai-asset-source: "mcp-registry"` annotation
- 3.6 Implement version metadata extraction from MCP server manifest
- 3.7 Add `rhdh.io/ai-asset-version` annotation (extracted or "unknown")
- 3.8 Add graceful degradation: enrichment failure logs warning, emits entity without annotations
- 3.9 Add preservation logic: do not overwrite existing AI Asset annotations
- 3.10 Add DEBUG-level logging for enriched entities
- 3.11 Integrate with RHDHPLAN-1507's SDK validation layer
- 3.12–3.14 Prometheus metrics for enrichment
- 3.15–3.21 Unit and integration tests
- 3.22–3.23 Documentation

### Specifications

- `openspec/changes/mcp-registry-connector/specs/annotation-enrichment/spec.md`

---

## RHOAI — MCP Catalog Source and Module Scaffold (issue 15 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4053

**Labels:** `ready-to-code`
**Depends on:** Issue 8 (SDK annotation scheme)
**RHIDP Stories:** RHIDP-15322
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15314

Implement `RhoaiMcpCatalogProvider` with graceful 404 handling for developer-preview MCP catalog API, entity mapping (MCP catalog entry → API with `spec.type: mcp-server`), API response schema validation with Zod, and retry logic for unavailable API. Scaffold `catalog-backend-module-rhoai` backend module package.

### Tasks

From `openspec/changes/rhoai-connector/tasks.md` group 1 (RHIDP-15322):

- 1.1 Define RHOAI MCP catalog API response types with Zod schemas
- 1.2 Implement `McpCatalogApiClient` with typed fetch
- 1.3 Implement `RhoaiMcpCatalogProvider` extending `EntityProvider`
- 1.4 Implement entity mapper: MCP catalog entry → API with `spec.type: mcp-server`
- 1.5 Add MCP-specific annotations
- 1.6 Implement `connect()` method with graceful 404 handling and `mcpApiAvailable` flag
- 1.7 Implement `read()` method returning empty array when API unavailable
- 1.8 Implement retry logic: every 10th refresh cycle
- 1.9 Implement API response schema validation with Zod
- 1.10 Add `rhdh.io/api-version-mismatch` annotation when API version differs
- 1.11 Add standard RHDH annotations
- 1.12 Implement logging for API availability transitions

From `openspec/changes/rhoai-connector/tasks.md` group 3:

- 3.1 Create `plugins/catalog-backend-module-rhoai/` package directory
- 3.2 Create `package.json` with Backstage backend module role
- 3.3 Create module entry point with `createBackendModule`
- 3.4 Register `RhoaiMcpCatalogProvider` when enabled
- 3.5 Add module to `backend/src/index.ts`
- 3.6 Configure TypeScript build
- 3.7 Add ESLint and Prettier configuration

### Specifications

- `openspec/changes/rhoai-connector/specs/mcp-catalog-source/spec.md`

---

## RHOAI — Deployment Config and Cross-Cluster Endpoint (issue 16 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4054

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra CA/credential utils), Issue 15 (MCP catalog provider)
**RHIDP Stories:** RHIDP-15323
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15314

Implement deployment configuration for RHOAI connector: Zod config schema for `ai-catalog.providers.rhoai.mcpCatalog`, enable/disable toggle, K8s Secret loader for credentials, shared CA bundle integration, Secret refresh per reconciliation cycle (no credential caching), and startup logging with graceful error handling.

### Tasks

From `openspec/changes/rhoai-connector/tasks.md` group 2 (RHIDP-15323):

- 2.1 Define Zod config schema for `ai-catalog.providers.rhoai.mcpCatalog`
- 2.2 Implement config validation in module startup
- 2.3 Implement enable/disable toggle
- 2.4 Implement K8s Secret loader utility
- 2.5 Integrate shared CA bundle utility from RHIDP-15316
- 2.6 Implement Secret refresh on each `refresh()` cycle
- 2.7 Implement CA bundle fallback to system CA
- 2.8 Add startup logging: enabled/disabled status, endpoint URL, Secret ref
- 2.9 Add error logging for missing/invalid config without crashing

### Specifications

- `openspec/changes/rhoai-connector/specs/deployment-config/spec.md`

---

## Neo4j Knowledge Graph — Core Sync Adapter (issue 17 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4055

**Labels:** `ready-to-code`
**Depends on:** Issue 2 (SDK interfaces — `Neo4jSyncAdapter`)
**RHIDP Stories:** RHIDP-15299
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15295

Implement the Neo4j sync adapter: Neo4j driver factory, catalog API polling with AI asset annotation filtering, entity revision tracking, incremental sync logic, scheduled sync task, graph node creation for Skill/Tool/Domain/Agent/ModelServer types, relationship mapping (DEPENDS_ON, USES_TOOL, BELONGS_TO, SIMILAR_TO, IMPLEMENTED_BY), and SDK interface implementation (`createNeo4jSyncAdapter()` factory, `connect()`/`disconnect()` lifecycle, `triggerFullSync()`).

### Tasks

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 1 (RHIDP-15299):

- 1.1 Create backend plugin package at `workspaces/boost/plugins/catalog-backend-module-neo4j-sync/`
- 1.2 Implement Neo4j driver factory with configuration loading
- 1.3 Implement catalog API polling with entity filtering
- 1.4 Implement entity revision tracking using `_syncedRevision`
- 1.5 Implement incremental sync logic
- 1.6 Implement scheduled sync task
- 1.7 Implement sync failure isolation
- 1.8 Implement full sync trigger API endpoint

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 2 (RHIDP-15299):

- 2.1 Implement Skill node creation
- 2.2 Implement Tool node creation
- 2.3 Implement Domain node creation
- 2.4 Implement Agent node creation
- 2.5 Implement ModelServer node creation
- 2.6 Implement node update logic
- 2.7 Implement node deletion logic

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 3 (RHIDP-15299):

- 3.1 Implement DEPENDS_ON relationship creation
- 3.2 Implement USES_TOOL relationship creation
- 3.3 Implement BELONGS_TO relationship creation
- 3.4 Implement SIMILAR_TO relationship creation with Jaccard similarity
- 3.5 Implement IMPLEMENTED_BY relationship creation
- 3.6 Implement relationship deletion logic
- 3.7 Implement deferred relationship creation

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 5 (RHIDP-15299):

- 5.1 Implement `createNeo4jSyncAdapter()` factory function
- 5.2 Implement `connect()` lifecycle hook
- 5.3 Implement `disconnect()` lifecycle hook
- 5.4 Implement `startSync()` method
- 5.5 Implement `stopSync()` method
- 5.6 Implement `triggerFullSync()` with `SyncReport` return type
- 5.7 Validate configuration via `config.getConfig('aiCatalog.neo4j')`

### Specifications

- `openspec/changes/neo4j-knowledge-graph/specs/relationship-mapping/spec.md`

---

## Neo4j — SkillBundle Support (issue 18 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4056

**Labels:** `ready-to-code`
**Depends on:** Issue 17 (core sync adapter)
**RHIDP Stories:** RHIDP-15300
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15295

Add SkillBundle node creation with INCLUDES relationships linking bundles to their constituent skills, bundle update propagation, deletion cleanup, and metadata validation.

### Tasks

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 4 (RHIDP-15300):

- 4.1 Implement SkillBundle node creation with properties
- 4.2 Implement INCLUDES relationship creation from `spec.skills` list
- 4.3 Implement SkillBundle update propagation
- 4.4 Implement SkillBundle deletion cleanup
- 4.5 Implement SkillBundle metadata validation
- 4.6 Add bundle composition example queries to `examples/neo4j-queries.cypher`

### Specifications

- `openspec/changes/neo4j-knowledge-graph/specs/skill-bundles/spec.md`

---

## Neo4j — Setup Documentation and Observability (issue 19 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4057

**Labels:** `ready-to-code`
**Depends on:** Issue 17 (core sync adapter), Issue 18 (SkillBundle support)
**RHIDP Stories:** RHIDP-15301
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15295

Write setup documentation (configuration examples, K8s Secret setup, graph schema reference, example Cypher queries), implement Prometheus metrics export (`neo4j_sync_total`, `neo4j_sync_success`, etc.), and add structured logging for sync cycles. Includes testing and performance optimization (batch writes, similarity throttling).

### Tasks

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 6 (RHIDP-15301):

- 6.1 Write `neo4j-sync-setup.md` with configuration examples
- 6.2 Document K8s Secret setup for Neo4j credentials
- 6.3 Document manual sync trigger API usage
- 6.4 Write `neo4j-graph-schema.md` with node/relationship type tables
- 6.5 Document catalog-as-source-of-truth architecture
- 6.6 Document relationship derivation rules
- 6.7 Write `examples/neo4j-queries.cypher` with 5+ example queries

From `openspec/changes/neo4j-knowledge-graph/tasks.md` group 7 (RHIDP-15301):

- 7.1 Document sync failure troubleshooting steps
- 7.2 Document Neo4j connection troubleshooting
- 7.3 Document schema migration procedure
- 7.4 Implement Prometheus metrics export
- 7.5 Document Prometheus metrics and example Grafana queries
- 7.6 Add structured logging for sync cycles

From `openspec/changes/neo4j-knowledge-graph/tasks.md` groups 8–9:

- 8.1–8.7 Testing (revision tracking, relationship derivation, in-memory Neo4j, SkillBundle, Cypher queries, full sync rebuild, failure isolation)
- 9.1–9.6 Performance optimization (batch writes, similarity throttling, similarity threshold config, disable flag, profiling, performance tuning docs)

### Specifications

- `openspec/changes/neo4j-knowledge-graph/specs/setup-documentation/spec.md`

---

## Version-Level Policy Cascade and Default-Deny Configuration (issue 20 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4058

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15275, RHIDP-15306 (implementation)
**Feature:** RHDHPLAN-1508 — Epics RHIDP-15274, RHIDP-15270

Create `AICatalogRBACProvider` implementing the `RBACProvider` interface via `rbacProviderExtensionPoint`, with asset→version policy cascade propagation, event-driven `refresh()` with debouncing, and `policyDecisionPrecedence` config for version-specific override ordering. Implement default-deny configuration with global, per-category, and per-connector posture scoping, `rhdh.io/ai-catalog-ingested-at` annotation stamping, and startup validation.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 5 (RHIDP-15274, RHIDP-15275):

- 5.1 Create `AICatalogRBACProvider` implementing `RBACProvider` interface
- 5.2 Register provider via `rbacProviderExtensionPoint`
- 5.3 Implement asset→version relationship discovery
- 5.4 Implement `applyConditionalPermissions()` propagation from asset to version entities
- 5.5 Implement event-driven `refresh()` with debouncing
- 5.6 Handle edge cases: orphan versions, asset deletion, no-version assets
- 5.7 Support `policyDecisionPrecedence` config for version-specific override ordering
- 5.8 Add unit tests for cascade propagation, override precedence, and edge cases

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 6 (RHIDP-15306):

- 6.1 Add `ai-catalog.rbac.defaultPolicy` config schema (allow|deny, default: allow)
- 6.2 Add per-category config schema
- 6.3 Add per-connector config schema
- 6.4 Implement catch-all DENY conditional rule for deny-posture entities
- 6.5 Implement `rhdh.io/ai-catalog-ingested-at` annotation stamping at ingestion time
- 6.6 Implement configuration validation at startup
- 6.7 Add unit tests for default-deny posture
- 6.8 Persist policy-change timestamp (via `AdminConfigService.setOverride()`) when admin changes default posture; read in `AICatalogRBACProvider.refresh()` to compare against `rhdh.io/ai-catalog-ingested-at`

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/version-policy-cascade/spec.md`
- `openspec/changes/ai-catalog-asset-governance/specs/default-deny-config/spec.md`

---

## RBAC Audit Logging (issue 21 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4059

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15279, RHIDP-15280
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15277

Implement audit event infrastructure: define posture-change and policy CRUD event types, define ingestion sync events (start/success/failure), integrate with RHDH audit log channel, add config change tracking with actor identification and before/after capture, and implement disconnected cluster support with local audit log fallback and event queuing.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 7 (RHIDP-15277, RHIDP-15279, RHIDP-15280):

- 7.1 Define audit event types: `posture-changed`, `policy-created`, `policy-updated`, `policy-deleted` (RHIDP-15279)
- 7.2 Define ingestion audit events: `sync-completed`, `sync-error`, `entity-created`, `entity-updated`, `entity-deleted` (RHIDP-15280)
- 7.3 Implement audit event emitters using `LoggerService` with structured metadata
- 7.4 Integrate audit events into posture change and policy CRUD flows
- 7.5 Integrate audit events into entity provider sync cycle
- 7.6 Verify events do not duplicate RBAC plugin `AuditorService` coverage

From `openspec/changes/ingestion-audit-metrics/tasks.md` groups 1–4:

Group 1 (Audit Event Infrastructure):

- 1.1–1.8 Define ingestion audit event types, payload schema, emission helpers, RHDH audit log integration, serialization, validation, unit tests

Group 2 (Sync Audit Integration):

- 2.1–2.10 Lifecycle hooks (`onSyncStart`, `onSyncSuccess`, `onSyncFailure`), event emission, connector integration, asset count tracking, error serialization, integration tests

Group 3 (Config Change Audit):

- 3.1–3.6 Config change tracking, event emission, actor capture, before/after values, field serialization, integration tests

Group 4 (Disconnected Cluster Support):

- 4.1–4.5 Local audit log fallback, event queuing, file system persistence, replay mechanism, unit tests

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/audit-logging/spec.md`
- `openspec/changes/ingestion-audit-metrics/specs/audit-events/spec.md`

---

## Hot-Reload Propagation to Active Connectors (issue 22 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4060

**Labels:** `ready-to-code`
**Depends on:** Issue 6 (#4044 — Zod schemas, RuntimeConfigResolver) **and** Issue 6.1 (#4313 — resolve-time defaults for optional numeric fields)
**RHIDP Stories:** RHIDP-15341
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

Update Jira, GitHub, and GitLab entity providers to read config via `RuntimeConfigResolver.resolve()` (leaf keys like `boost.connectors.jira.enabled`) at each reconciliation cycle start, implementing enable/disable check, endpoint URL propagation, schedule change propagation (reschedule task with new `schedule.intervalMs` or `schedule.cron`), credential re-read from mounted Secret per cycle, and config change logging.

### Tasks

From `openspec/changes/connector-config-hot-reload/tasks.md` group 3 (RHIDP-15341):

- 3.1 Update Jira entity provider to read config via `RuntimeConfigResolver.resolve('boost.connectors.jira.enabled')` (and other leaf keys) at reconciliation cycle start
- 3.2 Implement enable/disable check: skip sync if `enabled: false`
- 3.3 Implement endpoint URL propagation
- 3.4 Implement schedule change propagation: reschedule task with new `schedule.intervalMs` or `schedule.cron` from merged config
- 3.5 Update GitHub entity provider with same hot-reload pattern
- 3.6 Update GitLab entity provider with same hot-reload pattern
- 3.7 Add config change logging: log old → new values
- 3.8 Implement credential re-read: provider reads mounted Secret file at each cycle start
- 3.9–3.11 Integration tests: disable connector, change endpoint, change schedule
- 3.12 Document propagation latency: 30s TTL + reconciliation interval

From `openspec/changes/connector-config-hot-reload/tasks.md` group 5 (RHIDP-15341):

- 5.1 Integration test: update K8s Secret content, wait for kubelet sync, verify new credentials
- 5.2 Document credential rotation latency
- 5.3 Add manual test procedure: emergency credential rotation with pod restart

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/hot-reload-propagation/spec.md`

---

## SkillBundle RBAC Filtering (issue 23 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4061

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15310
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15270

Implement backend skill filtering using batch `authorizeConditional()` for `ai-catalog.asset.access`, add `totalSkills`/`visibleSkills` fields to SkillBundle API response, ensure filtered-out skill references are not exposed, and implement frontend "N of M skills visible" count display with restricted-access placeholder for fully restricted bundles.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 9 (RHIDP-15310, RHIDP-15273):

- 9.1 Implement backend skill filtering using batch `authorizeConditional()`
- 9.2 Add `totalSkills` and `visibleSkills` fields to SkillBundle API response
- 9.3 Ensure filtered-out skill references are not exposed
- 9.4 Implement frontend "N of M skills visible" count display with tooltip
- 9.5 Implement restricted-access placeholder for fully restricted bundles
- 9.6 Suppress additional messaging when all skills are visible
- 9.7 Add unit tests for backend skill filtering

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/skillbundle-filtering/spec.md`

---

## Graduated Visibility — Frontend (issue 24 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4062

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15273
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15270
**Cross-feature dependency:** RHIDP-15273 depends on RHIDP-15167 (RHDHPLAN-1509 — Entity page extensions). Graduated visibility wraps RHIDP-15167's entity page components with `RequirePermission` gating. Cannot gate what hasn't been built yet.

Wrap Tier 2 sections in asset detail page with `<RequirePermission permission={aiCatalogAssetAccessUsageDocsPermission}>`, create restricted-access placeholder for denied fields, implement filtered counts on asset list page, and add `usePermission` hook check for `ai-catalog.admin` to show/hide admin links.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 3 (RHIDP-15273):

- 3.1 Wrap Tier 2 sections in asset detail page with `<RequirePermission>`
- 3.2 Create restricted-access placeholder component for denied Tier 2 sections
- 3.3 Ensure asset list page displays filtered counts matching backend-filtered results
- 3.4 Add `usePermission` hook check for `ai-catalog.admin` to show/hide admin links

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/graduated-visibility/spec.md`

---

## Ingestion Health Admin UI and Disconnected-Cluster View (issue 26 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4064

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (#4041 — defines `ai-catalog.admin` permission), Issue 5 (#4043 — health API, error classification)
**RHIDP Stories:** RHIDP-15336, RHIDP-15339
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15331

Implement `IngestionHealthPanel.tsx` with per-connector health cards (PatternFly Card/Label), status badges (healthy/degraded/failing/disabled), timestamps, error summaries with diagnostic guidance, "Force Sync" buttons, disabled connector visual treatment (grey badge, no error indicators), disconnected-cluster differentiation, and health data polling via `useSWR` with 30s refresh. Includes Force Sync backend routes, connector provider integration, and RBAC gating for the health API endpoint (deferred from Issue 5). Issue 6.3 (#4285) should land so health `enabled` / `?includeDisabled` honors DB overrides of `boost.connectors.<id>.enabled`.

### Tasks

Deferred from Issue 5 (RHIDP-15335 — health API RBAC gating):

- 2.5 Implement RBAC gating via `ai-catalog.admin` permission check in `GET /api/boost/ingestion-health` route handler (using `permissions.authorize()`)

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 4 (RHIDP-15336, RHIDP-15339):

- 4.1 Create `IngestionHealthPanel.tsx` component
- 4.2 Implement health card rendering with PatternFly components
- 4.3 Add status badge rendering (success/warning/danger/outline variants)
- 4.4 Add timestamp rendering with `react-time-ago`
- 4.5 Add sync metrics display
- 4.6 Add error summary section with diagnostic guidance
- 4.7 Add "Force Sync" button with disabled state during run
- 4.8 Implement disabled connector visual treatment (RHIDP-15339)
- 4.9 Add loading state
- 4.10 Add error state
- 4.11 Add empty state
- 4.12 Implement health data polling via `useSWR` with 30s refresh
- 4.13 Add responsive grid layout (PatternFly `Gallery`)

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 6 (RHIDP-15335, RHIDP-15336):

- 6.1 Implement `POST /api/boost/ingestion-health/:connectorId/force-sync` route
- 6.2 Add connector run state registry
- 6.3 Implement concurrent Force Sync prevention (409 if already running)
- 6.4 Implement Force Sync trigger
- 6.5 Add Force Sync timeout wrapper
- 6.6 Implement status polling route
- 6.7 Add Force Sync UI polling
- 6.8 Add Force Sync error handling in UI
- 6.9 Add Force Sync integration tests

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 7:

- 7.1–7.6 Connector provider integration (health tracking hooks in GitHub/GitLab/Jira providers, sync metrics, error capture)

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 8:

- 8.1–8.4 Navigation integration (sidebar item, route, active state highlighting, pattern consistency)

### Specifications

- `openspec/changes/ingestion-health-dashboard/specs/admin-health-ui/spec.md`

---

# Tier 2 — Depends on Tier 1 (4 issues)

---

## RBAC Admin UI — Dashboard, Policy Editor, Default Posture (issue 25 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4063

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions), Issue 20 (policy cascade + default-deny backend)
**RHIDP Stories:** RHIDP-15307, RHIDP-15308, RHIDP-15309
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15304

Create standalone page at `/ai-catalog/admin/rbac` with `RequirePermission` gating, implement current policies view fetching from RBAC REST API, policy creation/deletion forms with confirmation dialogs, default posture view and change controls, and sidebar navigation item with permission-based visibility.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 8 (RHIDP-15304, RHIDP-15307, RHIDP-15308, RHIDP-15309):

- 8.1 Create standalone page component at `/ai-catalog/admin/rbac` with `RequirePermission` gating (RHIDP-15307)
- 8.2 Implement current policies view from RBAC REST API (RHIDP-15307)
- 8.3 Implement policy creation form (RHIDP-15308)
- 8.4 Implement policy deletion with confirmation dialog (RHIDP-15308)
- 8.5 Implement default posture view and change controls (RHIDP-15309)
- 8.6 Add sidebar navigation item with `usePermission` visibility gating (RHIDP-15307)
- 8.7 Add error handling for RBAC REST API failures

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/rbac-admin-ui/spec.md`
- `openspec/changes/ai-catalog-asset-governance/specs/default-deny-config/spec.md`

---

## Neo4j Graph Sync Status Panel (issue 27 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4065

**Labels:** `ready-to-code`
**Depends on:** Issue 5 (health API), Issue 17 (Neo4j core sync adapter)
**RHIDP Stories:** RHIDP-15338
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15331

Add Neo4j sync status panel within the ingestion health admin dashboard: sync timestamps, outcome badge, node/relationship counts, "Force Re-sync" button with Full/Incremental toggle (PatternFly `ToggleGroup`), backend routes for Neo4j health status and force sync, and Neo4j sync adapter health tracking hook integration.

### Tasks

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 5 (RHIDP-15338):

- 5.1 Implement `GET /api/boost/ingestion-health/neo4j` route returning Neo4j sync status
- 5.2 Add Neo4j panel rendering in `IngestionHealthPanel.tsx` below connector cards
- 5.3 Add Neo4j panel header with "Knowledge Graph Sync" title and graph icon
- 5.4 Add sync status display (last sync timestamp, outcome badge, node count, relationship count)
- 5.5 Add "Force Re-sync" button with mode toggle (Full/Incremental)
- 5.6 Implement `POST /api/boost/ingestion-health/neo4j/force-sync` route with mode parameter
- 5.7 Add Neo4j panel error state
- 5.8 Add Neo4j panel loading state
- 5.9 Integrate Neo4j sync adapter health tracking hooks

### Specifications

- `openspec/changes/ingestion-health-dashboard/specs/admin-health-ui/spec.md`

---

## Connector Config Admin UI (issue 28 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4066

**Labels:** `ready-to-code`
**Depends on:** Issue 6 (Zod schemas), Issue 22 (hot-reload propagation)
**RHIDP Stories:** RHIDP-15342
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

Create connector config section in admin panel at `/admin/connectors` for Jira, GitHub, and GitLab connectors with toggle switches for enable/disable, form fields for endpoint URL and sync schedule, read-only K8s Secret reference display, client-side and server-side Zod validation, RBAC gating, and config change history view from audit log.

### Tasks

From `openspec/changes/connector-config-hot-reload/tasks.md` group 4 (RHIDP-15342):

- 4.1 Create connector config section in admin panel (`/admin/connectors`)
- 4.2 Implement connector list view with toggle switches for `enabled` state
- 4.3 Implement connector detail view with form fields
- 4.4 Display K8s Secret references as read-only fields with tooltip
- 4.5 Implement client-side validation
- 4.6 Implement save handler: call `POST /api/boost/admin/config`
- 4.7 Implement success notification with propagation latency note
- 4.8 Implement validation error feedback
- 4.9 Implement RBAC gating
- 4.10 Implement read-only view for non-admin users
- 4.11 Implement config change history view
- 4.12–4.13 UI tests

From `openspec/changes/connector-config-hot-reload/tasks.md` group 6:

- 6.1 Extend existing `POST /api/boost/admin/config` endpoint to accept connector config keys (e.g., `{ key: "boost.connectors.jira.enabled", value: false }`). Add `GET /api/boost/admin/config?key=boost.connectors.<connectorId>` for reading merged connector config.
- 6.2 Implement Zod schema validation in `setOverride()` method before DB write
- 6.3 Implement `configScope` enforcement: reject writes for `yaml-only` fields
- 6.4 Implement cache invalidation call to `RuntimeConfigResolver.invalidate()` after DB write
- 6.5 Implement `removeOverride(key: BoostConfigKey)` method and `DELETE /api/boost/admin/config?key=<BoostConfigKey>` endpoint — deletes the DB override row, calls `RuntimeConfigResolver.invalidate()`, and returns the reverted YAML baseline value. Used when switching schedule types (e.g., removing `intervalMs` override when switching to `cron`).
- 6.6 Add audit logging for connector config changes (timestamp, user, changed fields, old/new values)
- 6.7 Add unit tests for `AdminConfigService` connector config methods (including `removeOverride`)

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/config-admin-ui/spec.md`

---

## Ingestion Analytics API and Eval Hub Integration (issue 29 of 29)

https://github.com/redhat-developer/rhdh-plugins/issues/4067

**Labels:** `ready-to-code`
**Depends on:** Issue 5 (health data model), Issue 21 (audit logging)
**RHIDP Stories:** RHIDP-15280 (analytics scope)
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15277 (consolidated from RHDHPLAN-1513 RHIDP-15333)

Implement analytics REST API endpoints (sync history, quality scores, match coverage) with RBAC gating and pagination, quality score storage (DB table + store), match coverage calculator, Neo4j sync status embedding, Eval Hub client for external quality score ingestion, and multi-eval backend support (LightEval, IBM Clear, GuideLLM).

### Tasks

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 5 (RHIDP-15280 / former RHIDP-15344):

- 5.1 Define analytics API routes
- 5.2 Add `GET /api/boost/admin/analytics/sync-history` endpoint
- 5.3 Add `GET /api/boost/admin/analytics/quality-scores` endpoint
- 5.4 Add `GET /api/boost/admin/analytics/match-coverage` endpoint
- 5.5 Add RBAC gating to all endpoints
- 5.6–5.10 Pagination, date range filtering, connector filtering, eval source filtering, route registration
- 5.11 Add integration tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 6:

- 6.1–6.7 Sync history service: `AnalyticsService`, `getSyncHistory()`, pagination, date range filtering, connector filtering, duration calculation, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 7:

- 7.1–7.8 Quality score storage: DB table schema, migration, `QualityScoresStore`, `insertScore()`, `getScoresBySkill()`, `getLatestScores()`, indexes, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 8:

- 8.1–8.6 Quality score analytics: `getQualityScores()`, per-skill scores, aggregate distribution, normalization, eval source filtering, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 9:

- 9.1–9.8 Match coverage calculator: agent capability extraction, skill ID extraction, matching logic, coverage ratio, unmatched capabilities list, caching, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 10:

- 10.1–10.6 Neo4j sync status: connection check, last sync timestamp, entity count, embed in analytics responses, graceful unavailable handling, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 11:

- 11.1–11.8 Eval Hub client: interface, `fetchQualityScores()`, app-config schema, client init, HTTP client, error handling, score normalization, unit tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 12:

- 12.1–12.8 Eval Hub ingestion service: background task, refresh interval config, score fetching/storage, graceful unavailable handling, manual trigger endpoint, status logging, integration tests

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 13:

- 13.1–13.6 Multi-eval backend support: `eval_source` field, source normalization, source filtering, per-source aggregation, LightEval/IBM Clear/GuideLLM support, unit tests

### Specifications

- `openspec/changes/ingestion-audit-metrics/specs/analytics-api/spec.md`
- `openspec/changes/ingestion-audit-metrics/specs/eval-hub-integration/spec.md`

---

# Dependency Graph

```
Tier 0 (no dependencies — all parallel):
  [1] Cross-Connector Shared Infrastructure
  [2] Entity-Provider SDK Types & Interfaces
  [3] AI Catalog Permissions & Conditional Rules
  [4] Upstream Schema Alignment (#4042 / PR #4221)
  [4.1] CLOSED without merge (#4223 / #4225)
  [4.2] Annotation spec + migration CLI (#4220)
  [5] Ingestion Health API & Error Classification
  [6] Connector Config Zod Schemas           (CLOSED)
  [6.1] Resolve-time field defaults (#4313)  → [6]
  [6.2] __schemaVersion + migration (#4286)  → [6]  (CLOSED)
  [6.3] Health runtimeEnabled handoff (#4285) → [6]
  [7] MCP Mirror Endpoint + RHOAI Version Normalization

Tier 1 (depends on Tier 0):
  [8]  SDK Delta Sync + Publish          → [1], [2]
  [9]  OCI Core Connector                → [1], [8]
  [10] OCI Multi-Registry + Air-Gapped   → [1], [9]
  [11] OCI Digest-Based Sync             → [1], [9]
  [12] OCI Load Testing                  → [1], [9]
  [13] MCP TLS + Credential Hardening    → [1], [7]
  [14] MCP Annotation Enrichment         → [8], [13]
  [15] RHOAI MCP Catalog Source          → [8]
  [16] RHOAI Deployment Config           → [1], [15]
  [17] Neo4j Core Sync Adapter           → [2]
  [18] Neo4j SkillBundle Support         → [17]
  [19] Neo4j Docs + Observability        → [17], [18]
  [20] Version Policy Cascade + Default-Deny → [3]
  [21] RBAC Audit Logging                → [3]
  [22] Hot-Reload Propagation            → [6], [6.1]
  [23] SkillBundle RBAC Filtering        → [3]
  [24] Graduated Visibility Frontend     → [3], RHIDP-15167 (RHDHPLAN-1509)
  [26] Ingestion Health Admin UI         → [3], [5]  (6.3 soft prereq)

Tier 2 (depends on Tier 1):
  [25] RBAC Admin UI                     → [3], [20]
  [27] Neo4j Sync Status Panel           → [5], [17]
  [28] Connector Config Admin UI         → [6], [22]
  [29] Analytics API + Eval Hub          → [5], [21]
```
