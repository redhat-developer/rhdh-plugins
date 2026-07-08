# RHDHPLAN-1507 Feasibility Report: Entity Model & Ingestion Criteria vs. Backstage Catalog Framework

**Date:** 2026-07-07
**Purpose:** Assess whether each RHIDP epic under RHDHPLAN-1507 can be implemented within the existing Backstage catalog framework without requiring upstream changes.

---

## Framework Capabilities Summary

RHDHPLAN-1507 focuses on entity model, ingestion infrastructure, and data pipelines. The cross-reference target is the Backstage Software Catalog rather than the permission framework.

| Capability                                                                                          | Status                                                                                                    |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Custom `spec.type` values (free-form string)                                                        | **Available** — any value accepted, low risk                                                              |
| Custom annotations (`metadata.annotations`)                                                         | **Available** — no risk if properly namespaced (e.g., `rhdh.io/`)                                         |
| Custom labels                                                                                       | **Available** — same namespacing rules as annotations                                                     |
| Custom relations emitted by processors                                                              | **Available** — any processor can emit new relation types                                                 |
| Built-in entity kinds: Component, Resource, API, System, Domain, Group, User, Template, Location    | **Available**                                                                                             |
| Custom entity kinds (new `apiVersion`/`kind` combinations)                                          | **Available but high-impact** — requires custom processor, validation, many plugins hard-code kind checks |
| `EntityProvider` interface (`connect`, `applyMutation`)                                             | **Available** — full provider lifecycle                                                                   |
| Full mutation (`type: 'full'`) — replaces entire bucket                                             | **Available** — efficient delta under the hood                                                            |
| Delta mutation (`type: 'delta'`) — explicit upserts/deletions                                       | **Available** — event-driven pattern                                                                      |
| `IncrementalEntityProvider` — paginated ingestion with cursor                                       | **Available** — `next()` + `around()` + `done` flag                                                       |
| `locationKey` conflict resolution                                                                   | **Available** — prevents rogue entity takeovers                                                           |
| Custom processors (`CatalogProcessor`) for validation and relation emission                         | **Available** — via `catalogProcessingExtensionPoint`                                                     |
| `catalogModelExtensionPoint` for field validators                                                   | **Available**                                                                                             |
| Scheduled task runners via `SchedulerService`                                                       | **Available** — cron or interval-based                                                                    |
| App-config-driven provider schedule                                                                 | **Available** — `catalog.providers.<id>.schedule`                                                         |
| Custom spec fields on existing kinds                                                                | **Available** — schema validation doesn't forbid unknown fields                                           |
| Processing pipeline (validation → enrichment → relation emission → stitching)                       | **Available** — entities go through processors after provider emission                                    |
| Per-provider isolated entity buckets                                                                | **Available** — each provider instance owns its bucket                                                    |
| Required annotations: `backstage.io/managed-by-location`, `backstage.io/managed-by-origin-location` | **Required** — entities without these won't appear                                                        |
| Secondary data stores (Neo4j, etc.) as derived indexes                                              | **Not built-in** — must be custom-built; no catalog extension point for secondary sync                    |
| OCI registry integration                                                                            | **Not built-in** — must be custom-built; no catalog-native OCI support                                    |
| Air-gapped CA bundle / credential injection                                                         | **Not built-in at catalog level** — standard Node.js/K8s patterns apply                                   |

---

> **Jira Consolidation (2026-07-08):** Following review, 4 of 7 epics under RHDHPLAN-1507 were closed and their scope absorbed into surviving epics:
>
> - **RHIDP-15254** (Annotation Scheme) → closed, scope absorbed into **RHIDP-15258** (Entity-Provider SDK)
> - **RHIDP-15261** (Delta Sync) → closed, scope absorbed into **RHIDP-15258** (Entity-Provider SDK)
> - **RHIDP-15263** (Air-Gapped) → closed, scope absorbed into **RHIDP-15316** (Cross-Connector Shared Infrastructure, RHDHPLAN-1510)
> - **RHIDP-15267** (Performance & Resilience) → closed, scope distributed across **RHIDP-15258**, **RHIDP-15294**, and **RHIDP-15295**
>
> The 3 surviving epics are **RHIDP-15258**, **RHIDP-15294**, and **RHIDP-15295**. Analysis sections for closed epics are preserved below for reference but marked as consolidated.

## Epic-by-Epic Analysis

### ~~RHIDP-15254: AI Asset Annotation Scheme (`rhdh.io/ai-asset-*`)~~ — CLOSED (consolidated into RHIDP-15258)

> **Status:** Closed 2026-07-08. Annotation scheme is fully supported by the catalog framework — no dedicated epic needed. Scope (annotation constants, validation, kind/type mapping) absorbed into the Entity-Provider SDK epic (RHIDP-15258).

**Summary:** Define and implement `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, and `rhdh.io/ai-asset-source` annotations on all AI asset catalog entities. Cover all five `spec.type` values mapped to Backstage entity kinds.

#### Acceptance Criteria Assessment

| Criterion                                                                                                                                                            | Feasible without upstream changes? | Assessment                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All entities include `rhdh.io/ai-asset-category` annotation with one of: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`                                  | **YES**                            | Custom annotations are fully supported. The `rhdh.io/` prefix is a valid custom namespace. Entity providers set annotations at emission time                                             |
| All entities include `rhdh.io/ai-asset-version` with normalization scheme                                                                                            | **YES**                            | Same — custom annotation, set by entity provider during ingestion                                                                                                                        |
| All entities include `rhdh.io/ai-asset-source` identifying connector/registry                                                                                        | **YES**                            | Same — custom annotation                                                                                                                                                                 |
| Missing annotations rejected by validation layer with descriptive error                                                                                              | **YES**                            | A custom `CatalogProcessor` with `validateEntityKind()` can reject entities missing required annotations. Alternatively, validation in the entity provider itself before `applyMutation` |
| Category-to-entity-kind mapping documented: `ai-agent` (Resource), `ai-skill` (Resource), `mcp-server` (Resource), `ai-model` (Resource), `model-server` (Component) | **YES**                            | All mapped to built-in kinds (Resource, Component). `spec.type` is free-form — any value is accepted by the catalog. No new kinds needed                                                 |
| `rhdh.io/ai-asset-version` annotation designed for migration-readiness toward upstream entity kinds (RFCs #32062, #33060)                                            | **YES**                            | Migration-readiness is a design exercise — the annotation scheme documents how to transform entities to future upstream kinds. No framework changes needed for the scheme itself         |
| Migration-readiness design reviewed/signed off                                                                                                                       | **YES**                            | Process requirement — not a framework concern                                                                                                                                            |
| Annotation scheme documented in reference page                                                                                                                       | **YES**                            | Documentation exercise                                                                                                                                                                   |

**Verdict: FULLY FEASIBLE** — Custom annotations, custom `spec.type` values, and mapping to existing entity kinds (Resource, Component) are all standard Backstage catalog extension patterns. The framework explicitly supports and encourages this. No upstream changes needed.

**Key strength:** By mapping to existing kinds (Resource, Component) rather than introducing custom kinds, this avoids the "high-impact" risk of custom kinds where many plugins hard-code kind checks.

---

### RHIDP-15258: Entity-Provider SDK Package with Typed Contract

**Summary:** Publish a versioned SDK package with TypeScript interfaces, shared validation, `skillcard.yaml` validation, Neo4j sync adapter interface, and documented breaking-change policy.

#### Acceptance Criteria Assessment

| Criterion                                                                                     | Feasible without upstream changes? | Assessment                                                                                                                                               |
| --------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published npm package with TypeScript interface(s) defining entity-provider contract          | **YES**                            | Standard npm package publishing. The interfaces wrap the Backstage `EntityProvider` contract with AI Catalog-specific types. No framework changes needed |
| Shared validation for `rhdh.io/ai-asset-*` annotations and kind/type mapping                  | **YES**                            | Validation logic is application code. Can be used by providers pre-emission or by a custom processor post-emission                                       |
| `skillcard.yaml` schema validation (name, description, tags, version, authors, allowed-tools) | **YES**                            | Application-level schema validation — no framework involvement. A Zod or JSON Schema validator in the SDK package                                        |
| Neo4j sync adapter interface (DEPENDS_ON, USES_TOOL, BELONGS_TO, SIMILAR_TO, IMPLEMENTED_BY)  | **YES**                            | TypeScript interface definition — no framework involvement. The interface defines what implementors must provide; the actual Neo4j sync is RHIDP-15295   |
| SkillBundle metadata for Neo4j nodes and INCLUDES relationships                               | **YES**                            | Interface/type definition — application-level                                                                                                            |
| Package follows semver with breaking-change policy                                            | **YES**                            | Package management policy — no framework involvement                                                                                                     |
| Existing boost providers refactored to implement the contract                                 | **YES**                            | Application-level refactoring of existing code                                                                                                           |
| README + API reference documentation                                                          | **YES**                            | Documentation exercise                                                                                                                                   |

**Verdict: FULLY FEASIBLE** — The SDK package is a standard npm package that wraps Backstage interfaces with AI Catalog-specific types and validation. It adds no new Backstage capabilities — it's an abstraction layer for connector developers. No upstream changes needed.

---

### ~~RHIDP-15261: Incremental (Delta) Sync Framework for Entity Providers~~ — CLOSED (consolidated into RHIDP-15258)

> **Status:** Closed 2026-07-08. Delta sync is a first-class Backstage feature (`applyMutation({ type: 'delta' })`) — no dedicated epic needed. SDK wrapper scope absorbed into the Entity-Provider SDK epic (RHIDP-15258).

**Summary:** After first full ingest, subsequent cycles only add/update/remove changed entities — delta sync with cursor/ETag persistence.

#### Acceptance Criteria Assessment

| Criterion                                                                                     | Feasible without upstream changes? | Assessment                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK provides reusable incremental-sync framework translating changes to `applyMutation` calls | **YES**                            | Backstage directly supports delta mutations: `connection.applyMutation({ type: 'delta', added: [...], removed: [...] })`. The SDK wraps this with connector-friendly abstractions |
| Connectors report changes relative to a sync cursor (timestamp, ETag, change token)           | **YES**                            | Application-level cursor management. The connector stores the cursor; the SDK framework manages cursor persistence                                                                |
| Framework persists sync cursors across polling cycles                                         | **YES**                            | Cursor can be persisted in the Backstage database (via a dedicated table or the `KeyValueStore` service), or in a config-driven external store. No framework changes needed       |
| Full re-ingest not required every cycle                                                       | **YES**                            | Delta mutation (`type: 'delta'`) is a first-class Backstage feature. Additionally, `IncrementalEntityProvider` supports paginated ingestion with cursor-based iteration           |
| Fallback to full refresh when cursor invalid/expired                                          | **YES**                            | Application logic — fall back to `type: 'full'` mutation when cursor is stale                                                                                                     |
| Existing full-refresh providers work without modification                                     | **YES**                            | Full mutation (`type: 'full'`) continues to work — the two mutation types coexist                                                                                                 |

**Verdict: FULLY FEASIBLE** — Delta sync is a first-class Backstage catalog feature. `applyMutation({ type: 'delta' })` handles explicit upserts/deletions. The `IncrementalEntityProvider` interface provides paginated cursor-based ingestion out of the box. The SDK wraps these with AI Catalog-specific conveniences. No upstream changes needed.

**Key strength:** The Backstage `applyMutation` with `type: 'delta'` already handles the hard part — the SDK just needs to translate connector-level change events into the right mutation calls.

---

### ~~RHIDP-15263: Air-Gapped Deployment Support for AI Catalog Entity Providers~~ — CLOSED (consolidated into RHIDP-15316)

> **Status:** Closed 2026-07-08. Air-gapped patterns (CA bundles, K8s Secrets, configurable endpoints) are standard Node.js/K8s patterns — no dedicated epic needed. Scope absorbed into Cross-Connector Shared Infrastructure (RHIDP-15316, RHDHPLAN-1510).

**Summary:** Support custom CA bundles, K8s Secret-only credential references, configurable endpoint URLs, and startup validation rejecting plaintext credentials.

#### Acceptance Criteria Assessment

| Criterion                                                                      | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configurable registry endpoint URLs (no hardcoded SaaS endpoints)              | **YES**                            | Standard app-config pattern: `catalog.providers.<id>.endpoint`. Entity providers read from config. No framework changes                                                                                                             |
| Custom CA bundles via mounted Secret/ConfigMap honored for all TLS connections | **YES**                            | Standard Node.js TLS configuration. CA bundles are loaded from mounted paths and applied to HTTP clients (e.g., `node-fetch`, `undici`). The Backstage `UrlReader` service already supports TLS configuration. No framework changes |
| Credentials via Kubernetes Secret references only                              | **YES**                            | Standard RHDH pattern — `app-config.yaml` uses `$env:SECRET_NAME` references that resolve to mounted K8s Secret values. No framework changes                                                                                        |
| Plaintext credentials rejected with startup validation error                   | **YES**                            | Application-level startup check in the entity provider module. Inspect config values and reject if they look like plaintext (not `$env:` or `$secret:` references). No framework changes                                            |
| Reference/example configuration for air-gapped pattern                         | **YES**                            | Documentation exercise                                                                                                                                                                                                              |
| Validated against air-gapped OpenShift cluster                                 | **YES**                            | Testing/validation exercise — no framework changes                                                                                                                                                                                  |

**Verdict: FULLY FEASIBLE** — Air-gapped support is entirely about how entity providers configure their HTTP clients and credential loading. All patterns (CA bundles, Secret references, configurable endpoints) are standard Backstage/RHDH/K8s patterns. No upstream changes needed.

**Note:** The Backstage `UrlReader` already supports `backend.reading.allow` for allowlisting hosts, and TLS configuration for custom CAs. Entity providers that use the UrlReader for registry communication get this for free.

---

### ~~RHIDP-15267: AI Catalog Performance Testing and Entity Resilience~~ — CLOSED (scope distributed)

> **Status:** Closed 2026-07-08. Performance testing and resilience are cross-cutting concerns, not a standalone epic. Scope distributed: load testing → RHIDP-15294 (OCI connector validates at 2K-image scale), error isolation → RHIDP-15258 (SDK defines resilience contracts), Neo4j perf → RHIDP-15295.

**Summary:** Validate that 5,000+ entity ingestion doesn't degrade catalog performance. Single-entity failures must not abort sync cycles.

#### Acceptance Criteria Assessment

| Criterion                                                                    | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Load test with 5,000+ entities from a single connector                       | **YES**                            | Testing exercise. Entity providers can emit any number of entities via `applyMutation`. The catalog processes them through its pipeline                                                                                                                     |
| Catalog list/search API p95 latency ≤10% degradation vs. baseline            | **YES**                            | Measurement exercise. The catalog uses PostgreSQL — query performance depends on indexing and query patterns, not framework limitations                                                                                                                     |
| Catalog processing-loop duration within RHDH SLA                             | **YES**                            | Measurement exercise. Processing-loop performance is well-understood for RHDH                                                                                                                                                                               |
| Single-entity errors logged with context to identify offending source record | **YES**                            | Application-level error handling in entity providers. Wrap individual entity processing in try/catch, log with source identifiers, continue                                                                                                                 |
| Single-entity failures do not abort entire sync cycle                        | **YES**                            | Application-level resilience. The `IncrementalEntityProvider` interface already supports per-page error handling. For `applyMutation({ type: 'full' })`, filter out failed entities before mutation. For `type: 'delta'`, skip failed entities and continue |
| Load test scenarios sized against 1,945 skill images reference               | **YES**                            | Test design exercise                                                                                                                                                                                                                                        |
| Results documented and reproducible                                          | **YES**                            | Documentation exercise                                                                                                                                                                                                                                      |

**Verdict: FULLY FEASIBLE** — Performance testing and resilience are application-level concerns. The Backstage catalog backend (PostgreSQL-based) can handle 5,000+ entities — the concern is about ensuring AI Catalog entity providers don't introduce inefficiencies. Entity-level error isolation is standard try/catch + continue in the provider code. No upstream changes needed.

**Key consideration:** The `IncrementalEntityProvider` interface with its `rejectRemovalsAbovePercentage` safeguard is directly relevant — it protects against flaky sources that would otherwise wipe entity buckets.

---

### RHIDP-15294: OCI Skill Registry Ingestion Framework

**Summary:** Ingest skills from OCI container registries (Quay, GHCR, Docker Hub, Harbor, Artifactory, OpenShift Internal Image Registry) as `Resource` entities with `spec.type: ai-skill`.

#### Acceptance Criteria Assessment

| Criterion                                                                                                | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skills ingested as `Resource` entities with `spec.type: ai-skill` and `rhdh.io/ai-asset-category: skill` | **YES**                            | Standard entity emission via `applyMutation`. Resource kind is built-in, `ai-skill` is a free-form `spec.type` value, annotation is custom                                                                                    |
| Each entity includes OCI registry reference annotation (URL, namespace, image, digest)                   | **YES**                            | Custom annotations — fully supported                                                                                                                                                                                          |
| `skillcard.yaml` validated during ingestion, malformed artifacts rejected with logging                   | **YES**                            | Application-level validation using SDK's `skillcard.yaml` schema validator. Rejected entities are logged and excluded from `applyMutation`                                                                                    |
| Supports multiple OCI registries (Quay, GHCR, Docker Hub, Harbor, Artifactory, OpenShift)                | **YES**                            | Application-level connector code. OCI Distribution Spec is the common API — the connector uses standard OCI APIs (manifest listing, blob download). Registry-specific auth may vary but is handled in connector configuration |
| Air-gapped support (configurable endpoints, CA bundles, K8s Secret credentials)                          | **YES**                            | Same patterns as RHIDP-15263. The OCI connector reads config for endpoint, CA path, and credential Secret reference                                                                                                           |
| Incremental sync via OCI registry change detection (digest comparison, tag listing delta)                | **YES**                            | Application-level delta detection. Compare current tag/digest listings against cached state. Use `applyMutation({ type: 'delta' })` for changes. No framework changes needed                                                  |
| Sync interval independently configurable via app-config                                                  | **YES**                            | Standard `catalog.providers.<id>.schedule` pattern                                                                                                                                                                            |
| Packaged as RHDH dynamic plugin                                                                          | **YES**                            | Standard RHDH dynamic plugin packaging — `@backstage/backend-plugin-api` module pattern. No upstream changes needed                                                                                                           |

**Verdict: FULLY FEASIBLE** — OCI registry ingestion is a new entity provider implementation. The Backstage framework provides all the extension points: `EntityProvider` interface, `applyMutation`, scheduled task runners, catalog module registration. The OCI-specific logic (registry API calls, manifest parsing, `skillcard.yaml` extraction) is application code. No upstream changes needed.

**Key implementation detail:** The OCI Distribution Spec provides a common API across all target registries. The connector implements the OCI client, parses manifests, extracts `skillcard.yaml` from image layers, validates, and emits entities. This is connector engineering, not framework extension.

---

### RHIDP-15295: Neo4j Knowledge Graph Sync Adapter for AI Catalog

**Summary:** Secondary sync mechanism pushing skill/tool/domain/agent relationship data from the Backstage catalog to a Neo4j graph database.

#### Acceptance Criteria Assessment

| Criterion                                                                                  | Feasible without upstream changes?                | Assessment                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync reads AI asset entities from catalog and pushes to Neo4j                              | **YES — but no catalog extension point for this** | The Backstage catalog has no built-in "secondary sync" or "change notification" extension point. The adapter must either: (a) poll the catalog API periodically, or (b) hook into the entity processing pipeline via a custom processor that triggers Neo4j writes as a side effect                                                     |
| Supports relationship types: DEPENDS_ON, USES_TOOL, BELONGS_TO, SIMILAR_TO, IMPLEMENTED_BY | **YES**                                           | Application-level — the adapter reads entity annotations and relations, then creates corresponding Neo4j relationships                                                                                                                                                                                                                  |
| Creates SkillBundle nodes and INCLUDES relationships                                       | **YES**                                           | Application-level — bundle definitions are read from entity metadata/annotations and translated to Neo4j nodes/edges                                                                                                                                                                                                                    |
| Sync is incremental (only changed entities trigger graph updates)                          | **YES with caveats**                              | If using catalog API polling, the adapter must track what it has already synced (via timestamps or entity revision). If using a processor-based approach, incrementality comes from the processing pipeline (processors run on entity changes). No framework change needed, but the polling approach requires careful cursor management |
| Sync failures for individual entities don't abort remaining sync                           | **YES**                                           | Application-level try/catch + continue in the sync loop                                                                                                                                                                                                                                                                                 |
| Backstage catalog remains authoritative; Neo4j is derived                                  | **YES**                                           | Architectural constraint enforced by the adapter's read-only relationship with the catalog — it reads from the catalog API, never writes back                                                                                                                                                                                           |
| Implements SDK interface (RHIDP-15258)                                                     | **YES**                                           | Application-level interface implementation                                                                                                                                                                                                                                                                                              |
| Documented with setup, graph schema, example Cypher queries                                | **YES**                                           | Documentation exercise                                                                                                                                                                                                                                                                                                                  |

**Verdict: FULLY FEASIBLE — but the catalog-to-Neo4j sync mechanism requires a design choice**

The Backstage catalog does not have a built-in "secondary data store sync" extension point. Two implementation approaches:

**Option A — Catalog API Polling (recommended):**
A scheduled task reads AI asset entities from the catalog search API, diffs against Neo4j state, and applies changes. This is the simplest approach and fully decoupled from catalog internals.

- Pro: Clean separation, no coupling to catalog processing pipeline
- Pro: Uses stable public catalog APIs
- Con: Polling latency — changes are not reflected in Neo4j until the next poll cycle
- Con: Must manage its own change detection (entity revision tracking)

**Option B — Custom Processor Side Effect:**
A custom `CatalogProcessor` runs in the processing pipeline and triggers Neo4j writes as entities are processed. Changes are reflected in Neo4j as soon as the entity is processed.

- Pro: Near-real-time sync
- Pro: Incrementality is free — processors run on entity changes
- Con: Side effects in the processing pipeline are an anti-pattern — processors should emit relations and transform entities, not write to external systems
- Con: Couples the catalog processing loop to Neo4j availability — Neo4j downtime could impact catalog processing

**Option C — Event-Driven (infrastructure exists, events not yet published):**
The Backstage catalog backend already uses `EventsService` from `@backstage/plugin-events-node` (with `publish()`/`subscribe()` pattern), but currently only emits `experimental.catalog.conflict` and `experimental.catalog.errors` topics — NOT entity lifecycle events (create/update/delete). The `CatalogScmEventsService` handles SCM webhook events for refresh triggers, not entity change notifications. If entity lifecycle events are added upstream (or via a custom catalog module), the adapter subscribes and syncs on event receipt.

**Recommendation:** Option A for initial implementation. Polling interval can be short (30s–60s) and the adapter is fully decoupled from catalog internals. If latency becomes an issue, evolve to Option C when RHDH event infrastructure is available. No upstream changes needed for any option.

---

## Summary Matrix

| Epic                                 | Key         | Status                            | Feasible without upstream changes? | Implementation complexity | Notes                                                                  |
| ------------------------------------ | ----------- | --------------------------------- | ---------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| ~~AI Asset Annotation Scheme~~       | RHIDP-15254 | **CLOSED** → absorbed by 15258    | YES                                | Low                       | Standard custom annotations — scope folded into SDK package            |
| Entity-Provider SDK Package          | RHIDP-15258 | **Active** (expanded scope)       | **YES**                            | Medium                    | Now includes annotation scheme, delta sync framework, and SDK contract |
| ~~Incremental (Delta) Sync~~         | RHIDP-15261 | **CLOSED** → absorbed by 15258    | YES                                | Medium                    | First-class Backstage feature — scope folded into SDK package          |
| ~~Air-Gapped Deployment~~            | RHIDP-15263 | **CLOSED** → absorbed by 15316    | YES                                | Medium                    | Standard patterns — scope moved to shared infra (RHDHPLAN-1510)        |
| ~~Performance Testing & Resilience~~ | RHIDP-15267 | **CLOSED** → distributed          | YES                                | Medium                    | Cross-cutting — distributed across 15258, 15294, 15295                 |
| OCI Skill Registry Ingestion         | RHIDP-15294 | **Active** (absorbed 15315 scope) | **YES**                            | High                      | Now includes concrete connector (from RHIDP-15315, RHDHPLAN-1510)      |
| Neo4j Knowledge Graph Sync           | RHIDP-15295 | **Active**                        | **YES**                            | High                      | No catalog secondary-sync extension point; recommend polling approach  |

## Key Findings

1. **All epics are fully feasible without upstream Backstage changes.** After consolidation, 3 surviving epics (RHIDP-15258, 15294, 15295) carry the full scope. The 4 closed epics were thin — their scope was either already supported by the framework or cross-cutting across other epics. RHDHPLAN-1507's requirements align cleanly with Backstage catalog extension points.

2. **The Backstage catalog is designed for exactly this kind of extension.** Custom annotations (low risk), custom `spec.type` values (low risk), custom entity providers (`EntityProvider` interface), delta mutations, incremental providers, custom processors — all are first-class extension mechanisms.

3. **The critical design decision — using existing kinds (Resource, Component) instead of custom kinds — is already correct.** Custom entity kinds have "very large impact" because many plugins hard-code kind checks. Mapping AI assets to Resource and Component avoids this entirely.

4. **Delta sync is not novel engineering — it's using the existing `applyMutation` API correctly.** The `type: 'delta'` mutation and the `IncrementalEntityProvider` interface handle the hard parts. The SDK wraps these with AI Catalog-specific abstractions. (Scope now in RHIDP-15258.)

5. **The only area without a dedicated Backstage extension point is Neo4j sync (RHIDP-15295).** The catalog has no "secondary data store" hook. However, catalog API polling is a well-understood pattern and is fully decoupled from catalog internals. This is not a blocker — it's a design choice.

6. **No PM discussion needed for RHDHPLAN-1507** (unlike RHDHPLAN-1508 where 1 area required clarification on default-deny policy). All acceptance criteria can be implemented as specified.

7. **Epic consolidation reduced 7 epics to 3 without losing scope.** The closed epics (annotation scheme, delta sync, air-gapped, perf/resilience) described capabilities that are either standard framework features or cross-cutting acceptance criteria better housed in the epics that implement them.

## Comparison with RHDHPLAN-1508

| Aspect                               | RHDHPLAN-1507 (Entity Model)                        | RHDHPLAN-1508 (RBAC)                                                                                                                                  |
| ------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Epics (active / total)               | 3 active of 7 original (4 closed via consolidation) | 7 of 7 active                                                                                                                                         |
| Epics requiring deviations from spec | 0                                                   | 1 of 7 (default-deny "only affects new assets" criterion)                                                                                             |
| Upstream changes needed              | None                                                | None — RBAC plugin provides more infrastructure than initially assessed                                                                               |
| Framework alignment                  | High — uses catalog extension points as designed    | Medium-High — `RBACProvider`, `defaultPermissions`, REST API, and `AuditorService` cover most needs; entity-to-entity cascade is the main custom work |
| PM discussion needed                 | No                                                  | Minimal — confirm retroactive vs. new-only policy application for default-deny                                                                        |
| Highest-risk epic                    | RHIDP-15295 (Neo4j sync — no extension point)       | RHIDP-15274 (Policy cascade — entity-to-entity, not group-based)                                                                                      |
| Implementation complexity            | Medium for 1/3 (SDK), high for 2/3 (OCI, Neo4j)     | Low for 3/7, medium for 4/7 — revised downward based on RBAC plugin capabilities                                                                      |
