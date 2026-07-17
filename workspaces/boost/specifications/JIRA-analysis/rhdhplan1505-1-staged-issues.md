# RHDHPLAN-1505 — AI Catalog Entity Model, RBAC, Connectors & Ingestion Ops — Staged GitHub Issues

These issues implement the AI Catalog backend across RHDHPLAN-1507 (Entity Model & Ingestion Framework), RHDHPLAN-1508 (RBAC & Versioning Policy), RHDHPLAN-1510 (MCP Registry & RHOAI Connector), and RHDHPLAN-1513 (Ingestion Operations & Schema Alignment). Issues are grouped in dependency tiers — Tier 0 issues have no dependencies and can run in parallel; Tier 1 depends on Tier 0; Tier 2 depends on Tier 1.

Each issue is scoped for a single fullsend `/fs-code` run. Frontend admin UI issues are included (RBAC Admin UI, Ingestion Health Dashboard, Connector Config Admin UI). Developer-facing discovery UI is covered by RHDHPLAN-1509 and is NOT in scope here.

**Feature → Epic mapping:**

| Feature       | Epics                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RHDHPLAN-1507 | RHIDP-15258 (Entity Model), RHIDP-15294 (OCI Skill Registry), RHIDP-15295 (Neo4j Knowledge Graph)                                                                   |
| RHDHPLAN-1508 | RHIDP-15270 (Graduated Visibility), RHIDP-15274 (Version Policy Cascade), RHIDP-15277 (Audit Logging), RHIDP-15304 (RBAC Admin UI), RHIDP-15305 (Conditional Rules) |
| RHDHPLAN-1510 | RHIDP-15313 (MCP Registry), RHIDP-15314 (RHOAI Connector), RHIDP-15316 (Cross-Connector Shared Infra)                                                               |
| RHDHPLAN-1513 | RHIDP-15331 (Health Dashboard), RHIDP-15332 (Hot-Reload), RHIDP-15334 (Schema Alignment)                                                                            |

**Cross-feature dependencies (RHDHPLAN-1509):**

- Issue 24 (RHIDP-15273 Graduated Visibility Frontend) depends on RHIDP-15167 (Entity page extensions, RHDHPLAN-1509)
- RHIDP-15167 (RHDHPLAN-1509) depends on RHIDP-15335 (Issue 5 — Health API), creating a cross-feature cycle that must be resolved by building the API (Issue 5) first

**Maximum parallelism:** All 7 Tier 0 issues can start simultaneously. Within Tier 1, issues [17–19] (Neo4j) are independent of [9–12] (OCI) and [13–16] (MCP/RHOAI). Within Tier 2, issues [23–25] (RBAC UI) are independent of [26–29] (Ingestion UI).

**Jira-to-GitHub issue mapping is not 1:1.** GitHub issues are scoped for single fullsend `/fs-code` runs, while Jira stories are scoped by feature deliverable. When a Jira story defines an interface or foundation that later issues adopt or extend, the story's work naturally splits across dependency tiers — you define the annotation scheme in Tier 0 before providers can emit those annotations in Tier 1. The alternative (combining tiers into one larger issue) would defeat single-fullsend scoping and block parallelism. Five RHIDP stories have work split this way; three additional stories are referenced after completion as dependencies. The Jira story cannot be closed until the "Completed" issue finishes.

For now, we will be employing the RHDH process convention used for our Jira tracking for upstream work, where we'll remove RHDIP stories from sprints as needed, and put into Waiting, if there are sprint wide gaps for implementing various stages of a story.
But as we progress, if further break up of a story is more seamless, we'll pursue that. But in other words, we will be honoring the Story granularity conventions in the RHDH skills used to craft our stories.

| RHIDP Story                                   | Started (definition/foundation)                    | Completed (adoption/extension)                       | Referenced after completion                   |
| --------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| RHIDP-15255 (Annotation Scheme)               | Issue 2 — define annotations + validator           | Issue 8 — update providers to emit annotations       | —                                             |
| RHIDP-15260 (SDK Package)                     | Issue 2 — create package + interfaces              | Issue 8 — delta sync framework + publish             | —                                             |
| RHIDP-15273 (Graduated Visibility)            | Issue 23 — SkillBundle filtered-skill UX           | Issue 24 — RequirePermission gating on entity detail | —                                             |
| RHIDP-15280 (Audit Logging)                   | Issue 21 — define + emit audit events              | Issue 29 — analytics REST API consuming audit data   | —                                             |
| RHIDP-15306 (Admin Permission + Default-Deny) | Issue 3 — define `ai-catalog.admin` permission     | Issue 20 — implement default-deny config             | —                                             |
| RHIDP-15316 (Shared Infra)                    | Issue 1 — build `@boost/connector-utils`           | Issue 1                                              | Issues 13, 16 (integrate CA bundle utility)   |
| RHIDP-15335 (Health API)                      | Issue 5 — health API + data model                  | Issue 26 — force sync routes using health data       | —                                             |
| RHIDP-15259 (SDK Interface)                   | Issue 2 — define `AIAssetEntityProvider` interface | Issue 2                                              | Issue 8 (providers compile against interface) |

---

# Tier 0 — No Dependencies (7 issues, all parallelizable)

---

## Cross-Connector Shared Infrastructure Package (issue 1 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15265, RHIDP-15266, RHIDP-15329, RHIDP-15330
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15316

Create the `@boost/connector-utils` shared package providing CA bundle resolution, fault isolation wrappers, enable/disable patterns, and configurable endpoint/credential validation. All entity-provider connectors (MCP Registry, RHOAI, OCI Skill) depend on this package. Includes reference app-config YAML for air-gapped deployment with Helm and Operator CR examples.

### Tasks

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 1 (RHIDP-15329):

- 1.1 Create `@boost/connector-utils` package with `package.json`, TypeScript config, and README
- 1.2 Define `loadCaBundle(config: Config, connectorId: string): Buffer | undefined` function signature
- 1.3 Implement caFile resolution — read CA from `catalog.providers.<id>.tls.caFile` mount path
- 1.4 Implement caSecret resolution — read CA from `catalog.providers.<id>.tls.caSecret.$env` environment variable
- 1.5 Add per-connector config isolation — `loadCaBundle()` reads only the specified connector's CA config
- 1.6 Create `https.Agent` factory utility: `createHttpsAgent(caBundle?: Buffer): https.Agent | undefined`
- 1.7 Handle missing CA file: log INFO-level warning with expected file path, return `undefined`
- 1.8 Handle invalid/expired CA certificate: log ERROR with certificate details
- 1.9 Support CA certificate chains (concatenated PEM blocks)
- 1.10–1.15 Unit tests for CA bundle utility (file path, env var, missing, invalid, chain, isolation)

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 2 (RHIDP-15330):

- 2.1 Define `ConnectorErrorContext` interface
- 2.2 Create `createProviderWrapper(provider, logger): EntityProvider` function
- 2.3 Implement try/catch wrapper around `provider.run()` to catch unhandled rejections
- 2.4 Implement structured error logging with connector context fields
- 2.5 Log errors via Backstage `LoggerService` for structured JSON output
- 2.6 Ensure wrapper does NOT rethrow errors — allow catalog backend to continue
- 2.7 Verify Backstage entity bucket isolation per provider
- 2.8–2.10 Unit tests for fault isolation wrapper

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 3 (RHIDP-15330):

- 3.1 Define enable/disable config schema: `catalog.providers.<id>.enabled: boolean`
- 3.2 Create `isConnectorEnabled(config, connectorId): boolean` utility
- 3.3 Implement config reader: return `true` if `enabled` is omitted (default enabled)
- 3.4 Create registration guard pattern for backend module `init()` example in README
- 3.5 Log INFO-level message when connector is disabled
- 3.6 Verify disabled connector uses zero resources
- 3.7–3.10 Unit tests for enable/disable pattern

From `openspec/changes/connector-shared-infrastructure/tasks.md` group 4:

- 4.1 Export shared utilities from `src/index.ts`
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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15255, RHIDP-15259, RHIDP-15303
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15258

Create the `@boost/entity-provider-sdk` package with the AI Asset annotation scheme (`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`), version normalization utility, CatalogProcessor validator, `AIAssetEntityProvider` interface definition, `Neo4jSyncAdapter` interface, and `SkillBundleMetadata` type. This issue establishes all type contracts — the delta sync framework and package publishing are in Issue 8.

### Tasks

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 1 (RHIDP-15255):

- 1.1 Define `rhdh.io/ai-asset-category` annotation constant and allowed values enum
- 1.2 Define `rhdh.io/ai-asset-version` annotation constant
- 1.3 Define `rhdh.io/ai-asset-source` annotation constant
- 1.4 Implement `normalizeAIAssetVersion(sourceVersion)` utility with all four normalization rules
- 1.5 Add unit tests for `normalizeAIAssetVersion()`
- 1.6 Implement CatalogProcessor validator rejecting entities with missing/invalid annotations
- 1.7 Add unit tests for CatalogProcessor validator

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 2 (RHIDP-15259, RHIDP-15260 — package+interface):

- 2.1 Create `@boost/entity-provider-sdk` package with `package.json`, `tsconfig.json`, `README.md`
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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15271, RHIDP-15272, RHIDP-15306 (permission definitions), RHIDP-15312
**Feature:** RHDHPLAN-1508 — Epics RHIDP-15270, RHIDP-15305

Define AI Catalog permission constants (`ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, `ai-catalog.admin`), implement graduated visibility backend enforcement (Tier 1 entity-level + Tier 2 field-level filtering), and implement conditional permission rules (`isAiAssetCategory`, `isFromConnector`, `isInTenant`) with `toQuery()` support. The default-deny config implementation is in Issue 20.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 1 (RHIDP-15271, RHIDP-15306):

- 1.1 Define `AI_CATALOG_ASSET_RESOURCE_TYPE` constant in `boost-common/src/permissions.ts`
- 1.2 Define `ai-catalog.asset.read` resource permission
- 1.3 Define `ai-catalog.asset.read.usage-docs` resource permission
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

## Upstream Schema Alignment — Annotation Spec, Migration Design & Tooling (issue 4 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15346, RHIDP-15347, RHIDP-15302
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15334 + RHDHPLAN-1507 — Epic RHIDP-15258

Document the annotation specification mapping `rhdh.io/ai-asset-*` annotations to upstream Backstage RFCs (#32062 McpServer, #33060 ai-model/ai-model-server), with confidence levels and transformation rules. Create the `@boost/migration-readiness` CLI scaffold for dry-run migration assessments. Create the migration design document with mapping tables and backward compatibility strategy. This is readiness assessment — actual migration is future work.

### Tasks

From `openspec/changes/upstream-schema-alignment/tasks.md` group 1 (RHIDP-15346):

- 1.1 Document all `rhdh.io/ai-asset-category` values
- 1.2 Document `rhdh.io/ai-asset-version` annotation format and normalization rules
- 1.3 Document `rhdh.io/ai-asset-source` annotation format
- 1.4 Document entity kind + `spec.type` mapping table
- 1.5 Map each entity type to RFC #32062 (McpServer) target
- 1.6 Map each entity type to RFC #33060 (ai-model/ai-model-server) targets
- 1.7 Assign confidence levels to each mapping
- 1.8 Document fields requiring transformation per entity type
- 1.9 Add explicit "Future Work" section
- 1.10 Add header with draft status and last-updated date
- 1.11 Cross-reference `agent-creation-discovery/catalog-entities` spec
- 1.12 Publish spec in `workspaces/boost/specifications/` directory

From `openspec/changes/upstream-schema-alignment/tasks.md` group 2 (RHIDP-15347):

- 2.1 Create `@boost/migration-readiness` CLI package structure
- 2.2 Set up TypeScript configuration and build pipeline
- 2.3 Implement catalog API client for entity enumeration
- 2.4 Filter entities by `rhdh.io/ai-asset-category` annotation presence
- 2.5 Implement per-entity mapping logic using annotation spec rules
- 2.6 Generate per-entity report (current → target, transformations, confidence)
- 2.7 Implement JSON output formatter
- 2.8 Implement human-readable output formatter
- 2.9 Handle entities with missing annotation (exclude gracefully)
- 2.10 Handle entities with partial annotations (include with warning)
- 2.11 CLI argument parsing (`--catalog-url`, `--output-format`, `--filter`)
- 2.12 Add footer message: "This is a migration-readiness assessment"

From `openspec/changes/upstream-schema-alignment/tasks.md` groups 3–5:

- 3.1–3.10 Testing (mapping logic, confidence, transformations, mock catalog, edge cases)
- 4.1–4.8 Documentation (README, usage, output interpretation, confidence levels, future work)
- 5.1–5.5 Cross-references (RHDHPLAN-1507, RFCs, RHIDP-15302/15303)

From `openspec/changes/ai-catalog-entity-model/tasks.md` group 8 (RHIDP-15302):

- 8.1 Create migration design document with mapping table: current → target upstream kind
- 8.2 Document transformation rules for each AI asset category
- 8.3 Identify consumer-facing changes: catalog UI filters, entity refs, API queries
- 8.4 Document backward compatibility strategy
- 8.5 Obtain upstream Backstage maintainer or RHDH architect sign-off
- 8.6 Document sign-off in spec

### Specifications

- `openspec/changes/upstream-schema-alignment/specs/annotation-specification/spec.md`
- `openspec/changes/upstream-schema-alignment/specs/migration-readiness-tooling/spec.md`
- `openspec/changes/ai-catalog-entity-model/specs/migration-readiness/spec.md`

---

## Ingestion Health — API, Data Model, Error Classification (issue 5 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15335, RHIDP-15337
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15331

Implement the ingestion health backend: `sync_attempts` table with database migration, `SyncAttemptsRepository`, `HealthStatusService` with status derivation (healthy/degraded/failing based on last 3 attempts), `GET /api/boost/ingestion-health` REST endpoint, and `ErrorClassifier` utility with actionable diagnostic guidance for auth failures, network errors, schema mismatches, and rate limits. The admin UI consuming this API is in Issue 26.

### Tasks

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 1 (RHIDP-15335):

- 1.1 Define `sync_attempts` table schema in database migration
- 1.2 Create database migration file with indexes on (connector_id, timestamp DESC)
- 1.3 Implement `SyncAttemptsRepository` class with methods: `insertSyncAttempt()`, `getLatestAttempts()`, `cleanupOldAttempts()`
- 1.4 Add retention policy config schema (`boost.ingestion.healthRetention.maxAttemptsPerConnector`, default 100)
- 1.5 Implement scheduled cleanup job for sync attempts (daily, enforces retention)
- 1.6 Add database indexes for efficient health status queries

From `openspec/changes/ingestion-health-dashboard/tasks.md` group 2 (RHIDP-15335):

- 2.1 Define `ConnectorHealthStatus` type in `plugins/boost-common/src/types/ingestion-health.ts`
- 2.2 Implement `GET /api/boost/ingestion-health` route returning array of connector health objects
- 2.3 Implement health status derivation logic in `HealthStatusService.deriveStatus(attempts)`
- 2.4 Add `?includeDisabled=true` query parameter support
- 2.5 Implement RBAC gating via boost admin permissions check
- 2.6 Add audit logging for health API requests
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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15340
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

Define Zod connector config schemas (Jira, GitHub, GitLab) with field-level `configScope` annotations (`db-overridable` vs `yaml-only`), and extend `RuntimeConfigResolver` to support connector config scope with two-layer merge (YAML baseline + DB overrides), 30s TTL cache with immediate invalidation, and schema validation during merge. Hot-reload propagation to connectors is in Issue 22; admin UI is in Issue 28.

### Tasks

From `openspec/changes/connector-config-hot-reload/tasks.md` group 1 (RHIDP-15340):

- 1.1 Define Jira connector config Zod schema with fields: `enabled`, `endpoint`, `schedule.*`, `credentials.*`, `namespace`, `batchSize`, `timeout.*`
- 1.2 Annotate each field with `configScope`: `enabled`, `endpoint`, `schedule.*`, `batchSize`, `timeout.*` → `db-overridable`; `credentials.*`, `namespace` → `yaml-only`
- 1.3 Define GitHub connector config Zod schema
- 1.4 Define GitLab connector config Zod schema
- 1.5 Add URL validation for `endpoint` field
- 1.6 Add positive number validation for numeric fields
- 1.7 Add cron expression validation for `schedule.cron`
- 1.8 Define default values in schemas
- 1.9 Add schema versioning field
- 1.10 Add unit tests for schema validation

From `openspec/changes/connector-config-hot-reload/tasks.md` group 2 (RHIDP-15340):

- 2.1 Extend `RuntimeConfigResolver` to support connector config scope
- 2.2 Implement `getConfig(key)` method for connector config keys
- 2.3 Implement two-layer merge: YAML baseline from `ConfigApi` + DB overrides from `AdminConfigService`
- 2.4 Implement cache with 30s TTL for merged connector config
- 2.5 Implement immediate cache invalidation on DB override write
- 2.6 Add Zod schema validation during merge
- 2.7 Implement `configScope` enforcement: reject DB override writes for `yaml-only` fields
- 2.8 Add schema version migration logic for backward compatibility
- 2.9 Add unit tests for two-layer merge
- 2.10 Add integration tests for `RuntimeConfigResolver` with connector schemas

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/config-schemas/spec.md`

---

## MCP Mirror Endpoint + RHOAI Version Normalization (issue 7 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Dependencies:** None
**RHIDP Stories:** RHIDP-15317, RHIDP-15321
**Feature:** RHDHPLAN-1510 — Epics RHIDP-15313, RHIDP-15314

Implement the MCP Registry mirror endpoint configuration with zero-internet validation (no outbound traffic to public endpoint when mirror is configured), startup health check, and non-HTTPS security warnings. Also implement RHOAI version normalization utility for MCP server entity `rhdh.io/ai-asset-version` annotation population. These two stories have no cross-connector dependencies and can start immediately.

### Tasks

From `openspec/changes/mcp-registry-connector/tasks.md` group 1 (RHIDP-15317):

- 1.1 Add `catalog.providers.mcpRegistry.endpoint` config schema in `config.d.ts`
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

# Tier 1 — Depends on Tier 0 (15 issues)

---

## SDK — Delta Sync Framework and Package Publish (issue 8 of 29)

_GitHub issue not yet created_

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

_GitHub issue not yet created_

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
- 3.2 Implement entity factory: convert `skillcard.yaml` to Backstage `Resource` entity
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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 9 (core connector)
**RHIDP Stories:** RHIDP-15297
**Feature:** RHDHPLAN-1507 — Epic RHIDP-15294

Add multi-registry configuration support (distinct credentials, CA bundles, and sync schedules per registry instance), K8s pull secret loader with Docker `config.json` parsing, custom CA bundle integration via shared `@boost/connector-utils`, and air-gapped registry support with no external DNS resolution.

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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra), Issue 7 (mirror endpoint)
**RHIDP Stories:** RHIDP-15318
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15313

Integrate shared CA bundle utility (`loadCaBundle()`) from `@boost/connector-utils`, implement K8s Secret-based authentication (Basic Auth and Bearer token), Secret data caching with 5-minute TTL and invalidation on 401, and per-connector TLS configuration isolation.

### Tasks

From `openspec/changes/mcp-registry-connector/tasks.md` group 2 (RHIDP-15318):

- 2.1 Integrate shared CA bundle utility from RHIDP-15316
- 2.2 Add `catalog.providers.mcpRegistry.tls.ca` config schema
- 2.3 Implement custom CA bundle loading from file path
- 2.4 Add graceful degradation: invalid CA bundle falls back to system CA
- 2.5 Add warning logging for invalid CA bundle files
- 2.6 Implement HTTPS agent configuration with custom CA bundle
- 2.7 Enforce TLS certificate validation (`rejectUnauthorized: true`)
- 2.8 Add `catalog.providers.mcpRegistry.auth.secretRef` config schema
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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 8 (SDK validation layer), Issue 13 (TLS hardening)
**RHIDP Stories:** RHIDP-15319
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15313

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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 1 (shared infra CA/credential utils), Issue 15 (MCP catalog provider)
**RHIDP Stories:** RHIDP-15323
**Feature:** RHDHPLAN-1510 — Epic RHIDP-15314

Implement deployment configuration for RHOAI connector: Zod config schema for `catalog.providers.rhoai.mcpCatalog`, enable/disable toggle, K8s Secret loader for credentials, shared CA bundle integration, Secret refresh per reconciliation cycle (no credential caching), and startup logging with graceful error handling.

### Tasks

From `openspec/changes/rhoai-connector/tasks.md` group 2 (RHIDP-15323):

- 2.1 Define Zod config schema for `catalog.providers.rhoai.mcpCatalog`
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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

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

_GitHub issue not yet created_

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

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/version-policy-cascade/spec.md`
- `openspec/changes/ai-catalog-asset-governance/specs/default-deny-config/spec.md`

---

## RBAC Audit Logging (issue 21 of 29)

_GitHub issue not yet created_

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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 6 (Zod schemas, RuntimeConfigResolver)
**RHIDP Stories:** RHIDP-15341
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

Update Jira, GitHub, and GitLab entity providers to read config via `RuntimeConfigResolver.getConfig()` at each reconciliation cycle start, implementing enable/disable check, endpoint URL propagation, schedule change propagation (reschedule task), credential re-read from mounted Secret per cycle, and config change logging.

### Tasks

From `openspec/changes/connector-config-hot-reload/tasks.md` group 3 (RHIDP-15341):

- 3.1 Update Jira entity provider to read config via `RuntimeConfigResolver.getConfig('connectors.jira')` at reconciliation cycle start
- 3.2 Implement enable/disable check: skip sync if `enabled: false`
- 3.3 Implement endpoint URL propagation
- 3.4 Implement schedule change propagation: reschedule task
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

# Tier 2 — Depends on Tier 1 (7 issues)

---

## SkillBundle RBAC Filtering (issue 23 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15310
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15270

Implement backend skill filtering using batch `authorizeConditional()` for `ai-catalog.asset.read`, add `totalSkills`/`visibleSkills` fields to SkillBundle API response, ensure filtered-out skill references are not exposed, and implement frontend "N of M skills visible" count display with restricted-access placeholder for fully restricted bundles.

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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 3 (permission definitions)
**RHIDP Stories:** RHIDP-15273
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15270
**Cross-feature dependency:** RHIDP-15273 depends on RHIDP-15167 (RHDHPLAN-1509 — Entity page extensions). Graduated visibility wraps RHIDP-15167's entity page components with `RequirePermission` gating. Cannot gate what hasn't been built yet.

Wrap Tier 2 sections in asset detail page with `<RequirePermission permission={aiCatalogAssetReadUsageDocsPermission}>`, create restricted-access placeholder for denied fields, implement filtered counts on asset list page, and add `usePermission` hook check for `ai-catalog.admin` to show/hide admin links.

### Tasks

From `openspec/changes/ai-catalog-asset-governance/tasks.md` group 3 (RHIDP-15273):

- 3.1 Wrap Tier 2 sections in asset detail page with `<RequirePermission>`
- 3.2 Create restricted-access placeholder component for denied Tier 2 sections
- 3.3 Ensure asset list page displays filtered counts matching backend-filtered results
- 3.4 Add `usePermission` hook check for `ai-catalog.admin` to show/hide admin links

### Specifications

- `openspec/changes/ai-catalog-asset-governance/specs/graduated-visibility/spec.md`

---

## RBAC Admin UI — Dashboard, Policy Editor, Default Posture (issue 25 of 29)

_GitHub issue not yet created_

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

## Ingestion Health Admin UI and Disconnected-Cluster View (issue 26 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 5 (health API, error classification)
**RHIDP Stories:** RHIDP-15336, RHIDP-15339
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15331

Implement `IngestionHealthPanel.tsx` with per-connector health cards (PatternFly Card/Label), status badges (healthy/degraded/failing/disabled), timestamps, error summaries with diagnostic guidance, "Force Sync" buttons, disabled connector visual treatment (grey badge, no error indicators), disconnected-cluster differentiation, and health data polling via `useSWR` with 30s refresh. Includes Force Sync backend routes and connector provider integration.

### Tasks

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

## Neo4j Graph Sync Status Panel (issue 27 of 29)

_GitHub issue not yet created_

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

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 6 (Zod schemas), Issue 22 (hot-reload propagation)
**RHIDP Stories:** RHIDP-15342
**Feature:** RHDHPLAN-1513 — Epic RHIDP-15332

Create connector config section in admin panel at `/admin/connectors` with toggle switches for enable/disable, form fields for endpoint URL and sync schedule, read-only K8s Secret reference display, client-side and server-side Zod validation, RBAC gating, and config change history view from audit log.

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

- 6.1 Add connector config endpoints to `AdminConfigService` backend API
- 6.2 Implement Zod schema validation in `setConfig()` before DB write
- 6.3 Implement `configScope` enforcement
- 6.4 Implement cache invalidation call
- 6.5 Add audit logging for connector config changes
- 6.6 Add unit tests for `AdminConfigService` connector config methods

### Specifications

- `openspec/changes/connector-config-hot-reload/specs/config-admin-ui/spec.md`

---

## Ingestion Analytics API and Eval Hub Integration (issue 29 of 29)

_GitHub issue not yet created_

**Labels:** `ready-to-code`
**Depends on:** Issue 5 (health data model), Issue 21 (audit logging)
**RHIDP Stories:** RHIDP-15280 (analytics scope)
**Feature:** RHDHPLAN-1508 — Epic RHIDP-15277 (consolidated from RHDHPLAN-1513 RHIDP-15333)

Implement analytics REST API endpoints (sync history, quality scores, match coverage) with RBAC gating and pagination, quality score storage (DB table + store), match coverage calculator, Neo4j sync status embedding, Eval Hub client for external quality score ingestion, and multi-eval backend support (LightEval, IBM Clear, GuideLLM).

### Tasks

From `openspec/changes/ingestion-audit-metrics/tasks.md` group 5 (RHIDP-15344):

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
  [4] Upstream Schema Alignment
  [5] Ingestion Health API & Error Classification
  [6] Connector Config Zod Schemas
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
  [22] Hot-Reload Propagation            → [6]

Tier 2 (depends on Tier 1):
  [23] SkillBundle RBAC Filtering        → [3]
  [24] Graduated Visibility Frontend     → [3], RHIDP-15167 (RHDHPLAN-1509)
  [25] RBAC Admin UI                     → [3], [20]
  [26] Ingestion Health Admin UI         → [5]
  [27] Neo4j Sync Status Panel           → [5], [17]
  [28] Connector Config Admin UI         → [6], [22]
  [29] Analytics API + Eval Hub          → [5], [21]
```
