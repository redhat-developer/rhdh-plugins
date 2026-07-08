# RHDHPLAN-1510 Feasibility Report: Connector Acceptance Criteria vs. Backstage Catalog Framework

**Date:** 2026-07-07
**Purpose:** Assess whether each RHIDP epic under RHDHPLAN-1510 can be implemented within the existing Backstage catalog framework without requiring upstream changes.

---

## Framework Capabilities Summary

RHDHPLAN-1510 is about connector implementations — entity providers that ingest AI assets from external registries into the Backstage Software Catalog. The cross-reference targets are the Backstage entity provider interface, catalog extension points, and deployment infrastructure patterns.

| Capability                                                              | Status                                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `EntityProvider` interface (`connect`, `applyMutation`)                 | **Available**                                                                          |
| Full mutation (`type: 'full'`)                                          | **Available**                                                                          |
| Delta mutation (`type: 'delta'`)                                        | **Available**                                                                          |
| `IncrementalEntityProvider` (paginated cursor-based ingestion)          | **Available**                                                                          |
| Scheduled task runners (`SchedulerService`)                             | **Available**                                                                          |
| App-config-driven provider schedule (`catalog.providers.<id>.schedule`) | **Available**                                                                          |
| Per-provider isolated entity buckets                                    | **Available**                                                                          |
| `locationKey` conflict resolution                                       | **Available**                                                                          |
| Custom annotations (`metadata.annotations`)                             | **Available**                                                                          |
| Custom `spec.type` values (free-form)                                   | **Available**                                                                          |
| Mapping to built-in kinds (Resource, Component)                         | **Available**                                                                          |
| Dynamic plugin packaging for RHDH                                       | **Available**                                                                          |
| `catalogProcessingExtensionPoint` for provider registration             | **Available**                                                                          |
| Custom CA bundle handling                                               | **Not built-in at catalog level** — standard Node.js/K8s TLS patterns                  |
| K8s Secret credential injection                                         | **Not built-in at catalog level** — standard `$env:`/`$secret:` app-config patterns    |
| OCI registry client                                                     | **Not built-in** — requires custom implementation or library                           |
| RHOAI/Kubeflow Model Registry client                                    | **Not built-in** — requires custom implementation                                      |
| MCP Registry mirror support                                             | **Not built-in** — requires custom endpoint configuration                              |
| Cross-connector fault isolation                                         | **Not built-in** — each provider runs in its own bucket but shares the Node.js process |

---

> **Jira Consolidation (2026-07-08):** 1 of 4 epics under RHDHPLAN-1510 was closed:
>
> - **RHIDP-15315** (OCI Skill Registry Connector) → closed, scope absorbed into **RHIDP-15294** (OCI Skill Registry Ingestion Framework, RHDHPLAN-1507)
>
> The 3 surviving epics are **RHIDP-15313**, **RHIDP-15314**, and **RHIDP-15316**.

## Epic-by-Epic Analysis

### RHIDP-15313: MCP Registry Connector — Productization & Air-Gapped Support

**Summary:** Productize the upstream MCP Registry entity provider (RHDHPLAN-393) with air-gapped support: customer-mirrored registries, custom CA bundles, K8s Secret auth, RHDH AI Asset annotation enrichment.

#### Acceptance Criteria Assessment

| Criterion                                                                          | Feasible without upstream changes? | Assessment                                                                                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configurable target endpoint overriding `registry.modelcontextprotocol.io`         | **YES**                            | Standard app-config pattern: `catalog.providers.mcpRegistry.endpoint`. The entity provider reads the endpoint from config. No framework changes   |
| Zero outbound requests to public endpoint when mirror configured                   | **YES**                            | Application-level — the connector uses only the configured endpoint URL. Validation test confirms no public endpoint traffic                      |
| Custom CA bundles from K8s Secret/ConfigMap mounts for mirrored registry TLS       | **YES**                            | Standard Node.js TLS configuration. Load CA from mounted file path, pass to HTTP client. Shared utility from RHIDP-15316                          |
| K8s Secret-based credentials for private/authenticated registries                  | **YES**                            | Standard RHDH pattern — `$env:` references in app-config resolve to mounted K8s Secret values                                                     |
| Entities carry `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version` annotations | **YES**                            | Custom annotations set during entity emission. The productization layer enriches entities emitted by the upstream provider before `applyMutation` |
| Integrates with 1507's shared ingestion framework/SDK validation                   | **YES**                            | Application-level — the connector uses the SDK's validation functions before emitting entities                                                    |

**Verdict: FULLY FEASIBLE** — This epic is a productization wrapper around the upstream MCP Registry connector (RHDHPLAN-393). It adds configuration, credential handling, and annotation enrichment — all standard patterns. The upstream connector handles the core `/v1/servers` API integration; this epic adds the deployment hardening. No upstream Backstage changes needed.

**Dependency note:** Requires RHDHPLAN-393 (upstream MCP Registry entity provider) to be implemented first. This epic layers on top, not replaces.

---

### RHIDP-15314: RHOAI Entity-Provider Connector (Model Registry + MCP Catalog)

**Summary:** Entity provider with two toggleable sources: (1) RHOAI Model Registry API (`RegisteredModel`/`ModelVersion` → `ai-model`/`model-server`), (2) RHOAI 3.4 MCP catalog → `mcp-server`. Cross-cluster, K8s Secrets, custom CA.

#### Acceptance Criteria Assessment

| Criterion                                                                                                                 | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model Registry source connects to Kubeflow `RegisteredModel`/`ModelVersion` API, emits `ai-model`/`model-server` entities | **YES**                            | Standard entity provider implementation. The connector calls the Kubeflow Model Registry REST API, maps responses to Backstage entities (Resource with `spec.type: ai-model`, Component with `spec.type: model-server`), and emits via `applyMutation`. Prior art: `redhat-ai-dev/model-catalog-bridge` |
| RHOAI version normalization maps `ModelVersion` to `rhdh.io/ai-asset-version`                                             | **YES**                            | Application-level mapping logic — extract version identifier from Kubeflow API response, set as annotation value                                                                                                                                                                                        |
| MCP catalog source connects to RHOAI 3.4 MCP catalog API, emits `mcp-server` entities                                     | **YES**                            | Same pattern — REST API call, entity mapping, `applyMutation`. The RHOAI 3.4 MCP catalog API is a new RHOAI endpoint                                                                                                                                                                                    |
| MCP catalog source gracefully handles absence on earlier RHOAI versions                                                   | **YES**                            | Application-level — attempt API call, catch 404/connection error, log warning, disable MCP source for this cycle. Standard resilience pattern                                                                                                                                                           |
| Model Registry and MCP catalog sources independently toggleable                                                           | **YES**                            | App-config-driven: `catalog.providers.rhoai.modelRegistry.enabled: true/false` and `catalog.providers.rhoai.mcpCatalog.enabled: true/false`. Provider reads config at startup                                                                                                                           |
| Cross-cluster endpoint with K8s Secret credentials and custom CA bundles                                                  | **YES**                            | Standard patterns — configurable endpoint URL, `$env:` Secret references, CA bundle from mounted path. Shared utilities from RHIDP-15316                                                                                                                                                                |

**Verdict: FULLY FEASIBLE** — This is a standard entity provider implementation against the Kubeflow Model Registry and RHOAI MCP catalog APIs. The Backstage `EntityProvider` interface handles everything needed. The `redhat-ai-dev/model-catalog-bridge` provides architectural prior art. No upstream Backstage changes needed.

**Key implementation note:** Two independently toggleable sources can be implemented as either (a) two separate `EntityProvider` instances (simpler, each with its own bucket), or (b) a single provider that conditionally fetches from both sources and emits all entities in one `applyMutation`. Option (a) is cleaner — each source has its own isolated bucket and independent failure domains.

---

### ~~RHIDP-15315: OCI Skill Registry Entity-Provider Connector~~ — CLOSED (consolidated into RHIDP-15294)

> **Status:** Closed 2026-07-08. This connector epic overlapped with RHIDP-15294 (OCI Skill Registry Ingestion Framework, RHDHPLAN-1507). The framework epic (15294) now carries the full scope — SDK interfaces, OCI client, `skillcard.yaml` parsing, entity emission, and 2K-image scale validation.

**Summary:** Discover AI skills published as OCI artifacts, parse `skillcard.yaml`, validate, emit as `ai-skill` entities. Incremental sync via digest, caching, validated at 2,000-image scale.

#### Acceptance Criteria Assessment

| Criterion                                                                                                           | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connects to any OCI Distribution spec-compliant registry at configurable URL/namespace                              | **YES**                            | Application-level — OCI client implementation using the OCI Distribution Spec APIs (tag listing, manifest fetch, blob download). No Backstage framework involvement                                                              |
| Discovers skill repositories and fetches OCI manifests and annotations                                              | **YES**                            | OCI Distribution Spec: `GET /v2/<name>/tags/list`, `GET /v2/<name>/manifests/<reference>`. Standard HTTP API calls                                                                                                               |
| Parses and validates `skillcard.yaml` required fields                                                               | **YES**                            | Application-level — extract `skillcard.yaml` from OCI image layer, parse YAML, validate against SDK's schema validator (RHIDP-15258)                                                                                             |
| Invalid skills rejected with descriptive errors without aborting sync                                               | **YES**                            | Application-level try/catch per skill. Log error with registry/namespace/image reference, skip invalid, continue                                                                                                                 |
| Emits `Resource` entities with `spec.type: ai-skill` and RHDH AI Asset annotations including OCI registry reference | **YES**                            | Standard entity emission via `applyMutation`. Resource is built-in, `ai-skill` is free-form `spec.type`, annotations are custom                                                                                                  |
| Incremental sync via manifest-digest change detection with 5-minute TTL in-memory cache and disk backup             | **YES**                            | Application-level caching. Compare current manifest digests against cached digests. Only re-process changed skills. Use `applyMutation({ type: 'delta' })` for changes. In-memory Map + disk-persisted JSON for cache durability |
| K8s pull secret as primary credential, custom CA bundles                                                            | **YES**                            | Standard patterns — pull secret parsed for registry auth (same format as Docker `config.json`), CA from mounted path                                                                                                             |
| Full sync of 2,000 images within 5 minutes using manifest-only fetching                                             | **YES**                            | Performance target — manifest-only fetching (no blob download during discovery) keeps per-image cost low. At 2,000 images ÷ 300 seconds = ~6.7 images/second, achievable with parallel manifest fetches                          |

**Verdict: FULLY FEASIBLE** — This is a new entity provider that implements an OCI registry client. The Backstage framework provides the `EntityProvider` interface and `applyMutation`; everything else is OCI-specific application code. No upstream Backstage changes needed.

**Implementation note:** This epic overlaps significantly with RHDHPLAN-1507's RHIDP-15294 (OCI Skill Registry Ingestion Framework). RHIDP-15294 defines the framework; this epic (RHIDP-15315) appears to be the concrete connector implementation. They may need to be reconciled to avoid duplicate work — the framework epic defines the SDK interfaces and validation; the connector epic implements the actual OCI client and entity provider.

---

### RHIDP-15316: Cross-Connector Shared Infrastructure

**Summary:** Shared utilities for all three connectors: CA bundle resolution, K8s Secret credential injection, connector enable/disable pattern, fault isolation.

#### Acceptance Criteria Assessment

| Criterion                                                                                    | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared utility loads CA bundles from K8s Secret/ConfigMap mounts, configurable per connector | **YES**                            | Utility function: read CA file from configured mount path, create `https.Agent` with custom CA, expose for connectors to use in their HTTP clients. Standard Node.js pattern                                                                                                                                                                              |
| One connector failure does not block other connectors or degrade non-AI catalog entities     | **YES**                            | Each entity provider runs in its own isolated bucket. Provider failures are scoped to their bucket — other providers and catalog entities are unaffected. The Backstage processing pipeline handles provider errors gracefully. Additional hardening: wrap each provider's `run()` in try/catch to prevent unhandled rejections from crashing the process |
| Actionable error details logged per connector on failure                                     | **YES**                            | Application-level structured logging — each connector logs with its provider name, endpoint, error message, and retry status                                                                                                                                                                                                                              |
| Connector enable/disable config pattern consistent across all connectors                     | **YES**                            | Standard app-config pattern: `catalog.providers.<connectorId>.enabled: true/false`. Each provider checks config at registration time and skips registration if disabled                                                                                                                                                                                   |

**Verdict: FULLY FEASIBLE** — This epic is shared utility code. CA bundle loading, Secret injection, error handling, and enable/disable config are all standard Node.js and Backstage patterns. No upstream changes needed.

**Key design decisions:**

1. **CA bundle utility** — A shared function like `loadCaBundle(config: Config, connectorId: string): Buffer | undefined` that reads `catalog.providers.<connectorId>.tls.caFile` or `catalog.providers.<connectorId>.tls.caSecret` and returns the CA certificate for use in `https.Agent`.

2. **Fault isolation** — Backstage's per-provider entity buckets already provide data isolation. The shared infrastructure adds process-level isolation: `try/catch` + structured error logging in the scheduled task runner wrapper, ensuring one connector's unhandled error doesn't crash the Node.js process.

3. **Enable/disable** — The backend module's `init()` function checks `catalog.providers.<connectorId>.enabled` before calling `catalog.addEntityProvider()`. Disabled connectors are never registered.

---

## Summary Matrix

| Epic                                  | Key         | Status                            | Feasible without upstream changes? | Implementation complexity | Notes                                                                  |
| ------------------------------------- | ----------- | --------------------------------- | ---------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| MCP Registry — Productization         | RHIDP-15313 | **Active**                        | **YES**                            | Low-Medium                | Productization wrapper on upstream connector; depends on RHDHPLAN-393  |
| RHOAI Connector                       | RHIDP-15314 | **Active**                        | **YES**                            | Medium                    | Two-source provider against Kubeflow + RHOAI APIs; prior art exists    |
| ~~OCI Skill Registry Connector~~      | RHIDP-15315 | **CLOSED** → absorbed by 15294    | YES                                | High                      | Overlap resolved — scope consolidated into RHIDP-15294 (RHDHPLAN-1507) |
| Cross-Connector Shared Infrastructure | RHIDP-15316 | **Active** (absorbed 15263 scope) | **YES**                            | Low-Medium                | Now includes air-gapped patterns from RHIDP-15263 (RHDHPLAN-1507)      |

## Key Findings

1. **All epics are fully feasible without upstream Backstage changes.** After consolidation, 3 surviving epics (RHIDP-15313, 15314, 15316) remain active. Every acceptance criterion maps to standard entity provider patterns or application-level code. No spec deviations needed.

2. **RHDHPLAN-1510 is the most straightforward of the four features analyzed.** These are concrete connector implementations using the `EntityProvider` interface that RHDHPLAN-1507 establishes the SDK for. The Backstage catalog framework is designed for exactly this pattern.

3. **OCI connector overlap resolved via consolidation.** RHIDP-15315 (this feature) and RHIDP-15294 (RHDHPLAN-1507) both described OCI Skill Registry ingestion. RHIDP-15315 was closed (2026-07-08) and its scope absorbed into RHIDP-15294, which now carries the full OCI connector scope — framework interfaces, OCI client, caching, and 2K-scale validation.

4. **The cross-connector shared infrastructure (RHIDP-15316) now also carries air-gapped scope.** RHIDP-15263 (Air-Gapped Deployment, RHDHPLAN-1507) was closed and its scope absorbed into RHIDP-15316. This is a natural fit — CA bundle loading, K8s Secret credential injection, and configurable endpoints are shared utilities used by all connectors.

5. **No PM discussion needed.** All acceptance criteria can be implemented exactly as specified. This contrasts with RHDHPLAN-1508 (1 area needing PM discussion) and aligns with RHDHPLAN-1507 (also no PM discussion needed).

6. **Dependency chain is clear and manageable:**
   - RHIDP-15316 (shared infra) has no dependencies — build first
   - RHIDP-15313 (MCP Registry) depends on RHDHPLAN-393 (upstream connector) + RHIDP-15316
   - RHIDP-15314 (RHOAI) depends on RHIDP-15316
   - OCI connector scope now in RHIDP-15294 (RHDHPLAN-1507), depends on RHIDP-15316

## Comparison Across Features

| Aspect                               | RHDHPLAN-1507 (Entity Model)            | RHDHPLAN-1508 (RBAC)                                          | RHDHPLAN-1510 (Connectors)                 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| Epics (active / original)            | 3 of 7 (4 closed via consolidation)     | 7 of 7                                                        | 3 of 4 (1 closed via consolidation)        |
| Epics requiring deviations from spec | 0                                       | 1 of 7 (default-deny "only affects new assets")               | 0                                          |
| Upstream changes needed              | None                                    | None — RBAC plugin provides more infrastructure than assessed | None                                       |
| Framework alignment                  | High                                    | Medium-High                                                   | High                                       |
| PM discussion needed                 | No                                      | Minimal (1 area)                                              | No                                         |
| Highest-risk epic                    | RHIDP-15295 (Neo4j sync)                | RHIDP-15274 (Policy cascade)                                  | RHIDP-15314 (RHOAI — two-source connector) |
| Implementation complexity            | Medium 1/3 (SDK), high 2/3 (OCI, Neo4j) | Low 3/7, medium 4/7                                           | Low-Medium 2/3, medium 1/3                 |
