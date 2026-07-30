# Proposal: OCI Skill Registry Connector

## Why

Skills are the fundamental unit of AI agent capability in the Boost platform. Teams are packaging skills as OCI container images and publishing them to internal registries (Quay, Harbor, OpenShift Internal Image Registry, Artifactory) and external SaaS registries (GHCR, Docker Hub). These skills contain a `skillcard.yaml` manifest that describes the skill's metadata, allowed tools, version, and ownership.

Currently, there's no automated way to ingest these OCI-packaged skills into the Backstage Software Catalog. Teams must manually create catalog entities for each skill or use custom scripts. This creates:

- **Discovery gap**: Skills in registries are invisible to the catalog, so users can't find or browse available skills
- **Version drift**: The catalog doesn't track when skill images are updated in the registry
- **Air-gapped friction**: Disconnected environments have no standard connector pattern for registry ingestion
- **Multi-registry sprawl**: Teams use 5+ registry products, each requiring different auth and API patterns

The OCI Skill Registry connector solves this by providing a standard Backstage entity provider that ingests skills from any OCI-compliant registry, validates their `skillcard.yaml` manifests, and maintains synchronized catalog entities.

## What Boost Builds

### OCI Artifact Fetching and Validation

- OCI client fetches image manifests and downloads `skillcard.yaml` blobs from OCI-compliant registries
- Validates `skillcard.yaml` against SDK schema (name, description, tags, version, authors, allowed-tools)
- Emits `AIResource` entities with `spec.type: skill` and annotation set: `rhdh.io/ai-asset-category: skill`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`
- Each entity includes OCI registry reference: registry URL, namespace, image name, digest
- Rejects artifacts with invalid/missing `skillcard.yaml` with descriptive log, excludes without aborting other skills
- Supports tag enumeration to discover all skill artifacts in a configured OCI namespace

### Multi-Registry Support and Air-Gapped Config

- Supports auth with: Quay, GHCR, Docker Hub, Harbor, Artifactory, OpenShift Internal Image Registry
- Registry endpoint URLs fully configurable via app-config (no hardcoded SaaS endpoints)
- Custom CA bundles via mounted Secret/ConfigMap honored for all TLS
- All credentials via K8s Secret references only — plaintext rejected with startup validation error
- Multiple registry instances configurable simultaneously (e.g., internal Quay + external GHCR)
- Sync interval independently configurable per registry instance

### Digest-Based Incremental Sync

- After first full ingest, subsequent cycles only process skills whose OCI digest changed
- New tags trigger entity additions
- Changed digests trigger entity updates (re-fetch and re-validate `skillcard.yaml`)
- Tags removed from registry trigger entity deletions/tombstones
- Sync cursors (tag-to-digest mapping) persisted across polling cycles
- Fallback to full refresh when cursor invalid/expired
- Performance: incremental sync of ~1,945-image namespace with <10 changes completes in fraction of full refresh time

## Impact

> **Post-consolidation note (2026-07-08):** Dependencies below reference specs whose epics have been consolidated. SDK interface, annotations, and delta sync are all under RHIDP-15258. Air-gapped patterns are under RHIDP-15316.

- `packages/backend/src/plugins/ai-catalog-entity-model/` — New connector implements the entity provider SDK contract (RHIDP-15258)
- `packages/backend/src/plugins/ai-catalog-entity-model/entity-provider-sdk/` — Connector uses TypeScript interface, annotation population, validation from SDK (RHIDP-15258)
- `packages/backend/src/plugins/ai-catalog-entity-model/delta-sync-framework/` — Connector uses SDK's `applyMutation({ type: 'delta' })` for digest-based change detection (RHIDP-15258, story RHIDP-15262)
- `packages/backend/src/plugins/ai-catalog-entity-model/annotation-scheme/` — Connector populates `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source` (RHIDP-15258, story RHIDP-15255)
- `packages/backend/src/plugins/ai-catalog-entity-model/air-gapped-deployment/` — Connector follows cross-connector air-gapped patterns: CA bundles (RHIDP-15329), Secret credentials (RHIDP-15265), configurable endpoints (RHIDP-15265) — all under RHIDP-15316
- **New**: `packages/backend/src/plugins/ai-catalog-oci-skill-registry/` — The connector plugin implementation
