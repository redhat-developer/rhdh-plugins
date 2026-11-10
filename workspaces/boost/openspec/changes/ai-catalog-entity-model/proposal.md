# Proposal: AI Catalog Entity Model

> **Workspace status:** Follow-on entity-model and SDK planning; not part of
> the current RHDH 2.1 Boost release. The archived `ogx-entity-provider` spec
> is the current OGX release source of truth.

## Why

The AI Catalog in Red Hat Developer Hub needs a standardized entity model to classify, track, and manage AI assets — agents, skills, MCP servers, models, and model servers — as first-class catalog entities. Today's Backstage catalog has no normalization scheme for these assets.

Enterprise deployments require operational quality: delta sync to minimize catalog churn and per-entity fault isolation so that individual ingestion failures do not block the sync cycle. Air-gapped deployment patterns (custom CAs, K8s Secret-only credentials) and large-scale performance validation (5,000+ entity load/SLA) are stretch goals tracked separately. The entity model must also be migration-ready for upstream Backstage entity kinds (e.g., `McpServerApiEntity` via [#34016](https://github.com/backstage/backstage/pull/34016), `AiResource` via [#33575](https://github.com/backstage/backstage/issues/33575)) so that RHDH can transition from custom annotations to first-class kinds without breaking consumers.

Boost builds this as a foundational layer: a standardized annotation scheme, a shared entity provider SDK, and operational-quality patterns that every AI registry connector can adopt from the start.

## RHDHPLAN-1507 Consolidation (2026-07-08)

> 4 of 7 original epics were closed and their scope absorbed into 3 surviving epics:
>
> | Closed Epic                          | Absorbed Into                                                          |
> | ------------------------------------ | ---------------------------------------------------------------------- |
> | RHIDP-15254 (Annotation Scheme)      | RHIDP-15258 (Entity-Provider SDK)                                      |
> | RHIDP-15261 (Delta Sync)             | RHIDP-15258 (Entity-Provider SDK)                                      |
> | RHIDP-15263 (Air-Gapped)             | RHIDP-15316 (Cross-Connector, RHDHPLAN-1510)                           |
> | RHIDP-15267 (Performance/Resilience) | Distributed: error isolation → RHIDP-15316, load testing → RHIDP-15294 |
>
> The subsections below are annotated with their owning epic post-consolidation.

## Stakeholder Alignment (2026-07-13)

> Per RHDHPLAN-1505 stakeholder meeting:
>
> - **RHDHPLAN-1113 dependency (reconciled 2026-11-10):** Agents use `kind: AiResource`, `spec.type: agent`. The former conditional Resource/Component fallback is retired; it does not authorize an interim agent mapping. Other category mappings follow Decision 1.
> - **MCP resource mapping is outside this current Boost release** — broader
>   RHDHPLAN-1510 work owns the follow-on decision and upstream due diligence.

## What Boost Builds

### AI Asset Annotation Scheme

> _Consolidated into RHIDP-15258 (Entity-Provider SDK). Single story RHIDP-15255 covers all 3 annotations._

- `rhdh.io/ai-asset-category` annotation with five minimum feature categories: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`. Existing `rule` compatibility is documented separately; it is not a sixth minimum deliverable.
- `rhdh.io/ai-asset-version` annotation with documented normalization rules (semver pass-through, date-based → semver, commit hash → version string)
- `rhdh.io/ai-asset-source` annotation for provenance tracking (`connector-name/registry-instance-id`)
- CatalogProcessor validator rejects entities with missing/invalid annotations at ingestion time
- Migration-readiness mapping for future upstream schema alignment, preserving the settled `AiResource` / `agent` mapping

### Entity Provider SDK

> _RHIDP-15258 — expanded scope. Now includes annotation scheme, delta sync framework, and per-entity error isolation._

- TypeScript interface contract defining entity emission, required annotation population, and the kind/spec.type mappings in Decision 1, including `AiResource` / `agent`
- Support for both full-refresh and incremental-sync patterns
- Shared validation utilities rejecting entities with missing/invalid annotations
- Published npm package (`@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk`)

### Delta Sync Framework

> _Consolidated into RHIDP-15258 (Entity-Provider SDK). Story RHIDP-15262._

- Cursor/ETag-based delta sync built on `applyMutation({ type: 'delta' })`
- Connector-reported additions/updates/deletions translated into catalog mutations
- Sync cursors stored through a consumer-supplied `CursorStore`; the SDK's `InMemoryCursorStore` is for development/testing
- Consuming providers own first/full refresh, cursor rejection handling, and method selection; the helper does not orchestrate those operations
- Existing full-refresh providers retain their own scheduling and mutation submission

Durable-store implementation, automatic refresh orchestration, and Backstage
incremental-provider integration remain follow-on design work under
[RHIDP-18840](https://redhat.atlassian.net/browse/RHIDP-18840).

### Air-Gapped Deployment Support

> _Moved to RHIDP-15316 (Cross-Connector Shared Infrastructure, RHDHPLAN-1510). Stories: RHIDP-15265, 15266, 15329._

- Custom CA bundle support via mounted Secret/ConfigMap for all TLS connections
- K8s Secret-only credential references — startup validation rejects plaintext credentials
- Configurable endpoint URLs with startup validation (no hardcoded SaaS endpoints)
- Reference Helm chart and Operator CR examples for air-gapped configuration

### Performance and Resilience

> _Distributed: load testing → RHIDP-15294 (OCI Skill Registry, story RHIDP-15268), error isolation → RHIDP-15316 (Cross-Connector, story RHIDP-15330)._

- ~~Load testing with 5,000+ entities validating p95 latency degradation ≤10%~~ — **Stretch:** deferred from minimum baseline
- Per-entity error resilience: single entity failures logged with identifier, source, field, and error; remaining entities still ingested
- Sync cycle completes even with multiple failures
- Error-handling guarantees documented

### Migration Readiness

> _Remains under RHIDP-15258 (Entity-Provider SDK). Story RHIDP-15302._

- Design document mapping custom annotations → upstream entity kinds
- Identified consumer-facing changes during migration
- Reviewed/signed off by upstream maintainer or RHDH architect

## Impact

- `plugins/boost-entity-provider-sdk/` — SDK package (types, annotations, validation)
- `plugins/boost-entity-provider-sdk/src/AIAssetValidator.ts` — CatalogProcessor annotation validator
- `plugins/ogx-entity-provider/` — OGX provider implements SDK
- Reference app-config examples for connector configuration (see `connector-shared-infrastructure` change)
