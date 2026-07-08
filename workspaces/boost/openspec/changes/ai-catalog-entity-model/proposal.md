# Proposal: AI Catalog Entity Model

## Why

The AI Catalog in Red Hat Developer Hub needs a standardized entity model to classify, track, and manage AI assets — agents, skills, MCP servers, models, and model servers — as first-class catalog entities. Today's Backstage catalog has no normalization scheme for these assets. External registries (Kagenti, LlamaStack, OCI skill repositories) use different categorization and version schemes, creating integration friction.

Enterprise deployments require operational quality from day one: air-gapped environments with custom CAs and K8s Secret-only credentials, delta sync to minimize catalog churn, and performance resilience at 5,000+ entities without degrading catalog latency. The entity model must also be migration-ready for future upstream Backstage entity kinds (RFCs #32062, #33060) so that RHDH can transition from custom annotations to first-class kinds without breaking consumers.

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

## What Boost Builds

### AI Asset Annotation Scheme

> _Consolidated into RHIDP-15258 (Entity-Provider SDK). Single story RHIDP-15255 covers all 3 annotations._

- `rhdh.io/ai-asset-category` annotation with five defined values: `agent`, `skill`, `mcp-server`, `ai-model`, `model-server`
- `rhdh.io/ai-asset-version` annotation with documented normalization rules (semver pass-through, date-based → semver, commit hash → version string)
- `rhdh.io/ai-asset-source` annotation for provenance tracking (`connector-name/registry-instance-id`)
- CatalogProcessor validator rejects entities with missing/invalid annotations at ingestion time
- Migration-readiness mapping for transforming to upstream entity kinds when available

### Entity Provider SDK

> _RHIDP-15258 — expanded scope. Now includes annotation scheme, delta sync framework, and per-entity error isolation._

- TypeScript interface contract defining: entity emission, required annotation population, entity kind/spec.type mapping
- Support for both full-refresh and incremental-sync patterns
- Shared validation utilities rejecting entities with missing/invalid annotations
- Neo4j sync adapter interface for knowledge graph integration
- SkillBundle metadata contract for skillcard.yaml schema
- Published npm package (`@boost/entity-provider-sdk`)

### Delta Sync Framework

> _Consolidated into RHIDP-15258 (Entity-Provider SDK). Story RHIDP-15262._

- Cursor/ETag-based delta sync built on `applyMutation({ type: 'delta' })`
- Connector-reported additions/updates/deletions translated into catalog mutations
- Sync cursors persisted across polling cycles
- Fallback to full refresh when cursor invalid
- Existing full-refresh providers work without modification

### Air-Gapped Deployment Support

> _Moved to RHIDP-15316 (Cross-Connector Shared Infrastructure, RHDHPLAN-1510). Stories: RHIDP-15265, 15266, 15329._

- Custom CA bundle support via mounted Secret/ConfigMap for all TLS connections
- K8s Secret-only credential references — startup validation rejects plaintext credentials
- Configurable endpoint URLs with startup validation (no hardcoded SaaS endpoints)
- Reference Helm chart and Operator CR examples for air-gapped configuration

### Performance and Resilience

> _Distributed: load testing → RHIDP-15294 (OCI Skill Registry, story RHIDP-15268), error isolation → RHIDP-15316 (Cross-Connector, story RHIDP-15330)._

- Load testing with 5,000+ entities validating p95 latency degradation ≤10%
- Per-entity error resilience: single entity failures logged with identifier, source, field, and error; remaining entities still ingested
- Sync cycle completes even with multiple failures
- Error-handling guarantees documented

### Migration Readiness

> _Remains under RHIDP-15258 (Entity-Provider SDK). Story RHIDP-15302._

- Design document mapping custom annotations → upstream entity kinds
- Identified consumer-facing changes during migration
- Reviewed/signed off by upstream maintainer or RHDH architect

## Impact

- `plugins/boost-backend/src/entity-provider-sdk/` — SDK package source
- `plugins/boost-backend/src/catalog/processors/` — Annotation validator processor
- `plugins/boost-backend-module-kagenti/src/provider/` — Kagenti provider implements SDK
- `plugins/boost-backend-module-llamastack/src/provider/` — LlamaStack provider implements SDK
- `plugins/boost-backend-module-oci-skill-registry/src/provider/` — OCI skill registry provider implements SDK
- Reference app-config examples for air-gapped deployment
- Load testing harness for catalog performance validation
