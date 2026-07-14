# Proposal: OCI Skill Registry Entity-Provider Connector

> **RHDHPLAN-1510 → RHDHPLAN-1507 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This openspec remains the authoritative specification for the OCI connector implementation.

## Why

AI skills published as OCI artifacts need automated catalog discovery. Teams publish skills to container registries using the OCI Distribution Spec (the standard registry protocol), annotate images with metadata, and embed `skillcard.yaml` descriptors. Boost must discover these skills, parse their metadata, validate against the common schema, and emit them as catalog entities — without manual YAML authoring for each skill.

The OCI Distribution Spec is the universal container registry API. Every registry — Quay, Harbor, JFrog Artifactory, AWS ECR, GCR, Azure ACR, air-gapped enterprise registries — implements the same protocol. The connector uses direct HTTP calls to three OCI Distribution endpoints (tag listing, manifest fetching, blob download) to discover and ingest skills. No vendor-specific SDKs, no dependency bloat.

This change implements the connector for OCI-based skill discovery. It builds on the OCI Skill Registry Ingestion Framework (RHDHPLAN-1507's RHIDP-15294, implemented in the separate `oci-skill-registry` OpenSpec change), which defines the SDK interfaces, `skillcard.yaml` schema validation, and ingestion abstractions. This connector provides the concrete OCI client, entity provider, incremental sync engine, and scale validation.

## What Boost Builds

### OCI Registry Discovery and Manifest Fetching

- OCI Distribution Spec client via direct HTTP (tag listing, manifest fetching, blob download)
- Connects to any OCI-compliant registry at configurable URL/namespace
- Discovers skill repositories via tag listing API (`GET /v2/<name>/tags/list`)
- Fetches OCI image manifests (`GET /v2/<name>/manifests/<reference>`)
- Extracts OCI annotations from manifest metadata (skill metadata without full blob download)

### Skillcard Parsing, Validation, and Entity Emission

- Parses `skillcard.yaml` from OCI image layers (selective blob download)
- Validates required fields using SDK's schema validator (from RHDHPLAN-1507's RHIDP-15258)
- Invalid skills rejected with descriptive errors — no abort on single failure
- Emits AIResource entities with `spec.type: skill` and RHDH AI Asset annotations
- OCI registry reference in `rhdh.io/ai-asset-source: oci://<registry>/<namespace>/<image>`

### Incremental Sync and Caching

- Digest-based change detection: compare current manifest digests against cached digests
- Only re-process changed skills — no redundant blob downloads
- Use `applyMutation({ type: 'delta' })` for incremental updates
- 5-minute TTL in-memory cache with disk backup for durability across restarts
- Resilient to registry downtime — cache serves last-known state until connection restored

### Authentication and Air-Gapped Support

- K8s pull secret as primary credential (Docker `config.json` format)
- Custom CA bundles from mounted paths (uses shared CA utility from RHIDP-15316)
- Per-registry auth configuration — multi-registry support with distinct credentials
- Air-gapped registry support with no external network access

### Scale Validation — 2,000 Skill Images

- Full sync of 2,000 images within 5 minutes using manifest-only fetching
- Performance target: ~6.7 images/second with parallel manifest fetches (configurable concurrency)
- Memory-bounded processing (streaming, not buffering all manifests)
- Integration test with mock registry at scale

## Impact

- `plugins/boost-backend-module-oci-skill-connector/` — OCI skill registry entity provider module
- `plugins/boost-backend-module-oci-skill-connector/src/oci/` — OCI Distribution Spec HTTP client
- `plugins/boost-backend-module-oci-skill-connector/src/provider/` — entity provider, incremental sync engine
- `plugins/boost-backend-module-oci-skill-connector/src/cache/` — digest-based cache with TTL and disk backup
- `plugins/boost-backend-module-oci-skill-connector/src/auth/` — K8s pull secret parser, CA bundle loader
- `plugins/boost-backend-module-oci-skill-connector/src/__tests__/` — mock registry harness, scale test suite
- Cross-connector shared CA utility (RHIDP-15316) — used for custom CA bundles
