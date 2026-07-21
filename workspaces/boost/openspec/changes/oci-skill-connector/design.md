# Design: OCI Skill Registry Entity-Provider Connector

> **RHDHPLAN-1510 → RHDHPLAN-1507 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). This openspec remains the authoritative specification for the OCI connector implementation.

## Context

This change implements the OCI Skill Registry Entity-Provider Connector for discovering AI skills published as OCI artifacts. It builds on the OCI Skill Registry Ingestion Framework (RHDHPLAN-1507's RHIDP-15294, covered by the separate `oci-skill-registry` OpenSpec change on the `boost-oci-skill-registry-framework` branch), which defines the SDK interfaces, `skillcard.yaml` schema validation, and ingestion abstractions.

The framework provides:

- `SkillEntityProvider` base class with lifecycle hooks
- `skillcard.yaml` schema validation (Zod-based)
- Entity emission utilities
- RHDH AI Asset annotation scheme

This connector implements:

- OCI Distribution Spec HTTP client (registry discovery, manifest fetching, blob download)
- Concrete entity provider using the framework's base class
- Digest-based incremental sync with caching
- K8s pull secret authentication and custom CA bundles
- Scale validation at 2,000 images

## Goals

- Direct OCI Distribution Spec implementation via HTTP — no external OCI libraries
- Incremental sync via manifest digest comparison — only re-process changed skills
- Memory-bounded processing at scale — streaming, not buffering all manifests
- Multi-registry support with per-registry auth configuration
- Air-gapped registry support with custom CA bundles
- 2,000-image performance target: full sync within 5 minutes

## Non-Goals

- Defining the `skillcard.yaml` schema (covered by RHDHPLAN-1507 RHIDP-15258)
- Defining the entity-provider SDK interfaces (covered by RHDHPLAN-1507 RHIDP-15294)
- Image verification via cosign/Notary (future security enhancement)
- Support for non-OCI registries (e.g., raw HTTP file servers)
- OCI artifact pushing (connector is read-only)

## Decisions

### Decision 1: OCI client approach — direct HTTP vs. library

**Context:** The OCI Distribution Spec defines three primary endpoints for registry discovery:

1. `GET /v2/<name>/tags/list` — list tags for a repository
2. `GET /v2/<name>/manifests/<reference>` — fetch image manifest
3. `GET /v2/<name>/blobs/<digest>` — download blob content

We must decide between (a) direct HTTP client implementing these endpoints, or (b) using an existing OCI library (e.g., `oci-client`, `containers/image`).

**Decision:** Direct HTTP client implementation.

**Rationale:**

- The OCI Distribution Spec is simple — only 3 endpoints needed for skill discovery
- Avoids dependency on external libraries (smaller bundle, fewer CVEs, no version conflicts)
- Full control over retry logic, timeouts, and error handling
- Easy to unit test with mock HTTP server
- No dependency churn — OCI Distribution Spec is stable (v1.0 since 2018, v1.1 since 2023)

**Implementation notes:**

- Use `node-fetch` or native `fetch` for HTTP calls
- Content negotiation via `Accept: application/vnd.oci.image.manifest.v1+json`
- Handle both Docker Registry v2 and OCI Distribution Spec registries (protocol compatible)
- Extract annotations from manifest's `annotations` field (OCI manifest v1) or `config.Labels` (Docker v2)

### Decision 2: Skillcard extraction — manifest-first vs. blob-first

**Context:** The `skillcard.yaml` file is embedded as a layer in the OCI image. We must decide when to download the blob:

- Option A: Download all blobs upfront, parse skillcards, then emit entities
- Option B: Fetch manifests first (metadata only), then selectively download skillcard blob only for changed/new skills

**Decision:** Manifest-first with selective blob download.

**Rationale:**

- Manifest fetching is cheap (~2-5 KB per image), blob download is expensive (~1-50 MB per layer)
- Digest-based change detection happens at manifest level — no blob download needed if digest unchanged
- For 2,000 images, manifest-only discovery is ~10-13 MB total; full blob download would be 2-100 GB
- Allows parallel manifest fetching without memory exhaustion

**Implementation notes:**

- Phase 1: Parallel manifest fetch (configurable concurrency, default 20)
- Phase 2: Compare digests against cache
- Phase 3: Selective blob download only for changed/new skills
- Blob download uses `GET /v2/<name>/blobs/<digest>` with streaming to avoid buffering large layers

### Decision 3: Digest-based change detection and cache strategy

**Context:** Incremental sync must detect which skills have changed since last sync. Options:

- Tag-based: re-fetch if tag exists (always re-process)
- Digest-based: re-fetch only if manifest digest changed
- Timestamp-based: re-fetch if manifest lastModified changed (not reliable across all registries)

**Decision:** Digest-based change detection with 5-minute TTL in-memory cache and disk backup.

**Rationale:**

- Manifest digests are content-addressed — same digest guarantees identical skill metadata
- Tag-based sync re-processes unchanged skills (wasteful at scale)
- Timestamp-based sync unreliable (not all registries expose lastModified)

**Cache structure:**

```typescript
interface DigestCache {
  [imageRef: string]: {
    digest: string; // manifest digest (sha256:...)
    lastSeen: number; // Unix timestamp
    skillEntityRef?: string; // emitted entity reference
  };
}
```

**Cache behavior:**

- 5-minute TTL: re-validate digests every 5 minutes (registry might push new tag)
- Disk backup: persist cache to `~/.backstage/cache/oci-skill-connector/digests.json` on shutdown
- Delta mutation: use `applyMutation({ type: 'delta', added: [...], removed: [...] })` for changes only
- Cache warming: on startup, load from disk, then re-validate digests in background

### Decision 4: Entity emission — AiResource with skill type

**Context:** Skills must be emitted as catalog entities. Options:

- Custom entity kind `kind: Skill`
- AiResource entity with `spec.type: skill`
- Component entity with `spec.type: skill`

**Decision:** AiResource entity with `spec.type: skill`.

**Rationale:**

- AiResource is the designated Backstage entity kind for AI-specific catalog assets (skills, prompts, tool definitions)
- Follows the entity type strategy from RHDHPLAN-1507's `ai-catalog-entity-model` change
- Component kind is for software components (skills are not deployable software, they're executable definitions)
- AI Asset annotations from RHDHPLAN-1507 RHIDP-15258: `rhdh.io/ai-asset-category: skill`, `rhdh.io/ai-asset-source: oci://<registry>/<namespace>/<image>`

**Entity structure:**

```yaml
apiVersion: backstage.io/v1alpha1
kind: AiResource
metadata:
  name: my-skill
  annotations:
    rhdh.io/ai-asset-category: skill
    rhdh.io/ai-asset-source: oci://quay.io/skills/my-skill:latest
    rhdh.io/ai-asset-digest: sha256:abc123...
spec:
  type: skill
  owner: team-ai
  # additional fields from skillcard.yaml
```

### Decision 5: Scale strategy — parallel manifest fetching with memory-bounded processing

**Context:** 2,000-image sync must complete within 5 minutes. Constraints:

- Sequential manifest fetch: ~2,000 × 150ms = 5 minutes (network latency only, no processing time)
- Parallel manifest fetch: configurable concurrency
- Memory usage: must not buffer all 2,000 manifests in memory

**Decision:** Parallel manifest fetch with configurable concurrency (default 20) and streaming processing.

**Performance model:**

- Manifest fetch latency: ~50-150ms per image (network + registry processing)
- With 20 parallel fetches: ~2,000 / 20 = 100 batches × 150ms = 15 seconds for manifest discovery
- Blob download (changed skills only): assume 10% churn = 200 images × 500ms = 100 seconds
- Total: ~2 minutes for full sync (well under 5-minute target)

**Memory model:**

- Manifest size: ~2-5 KB per image → 2,000 × 5 KB = 10 MB total (acceptable)
- Process in batches of 100 manifests: 100 × 5 KB = 500 KB per batch (streaming friendly)

**Implementation notes:**

- Use `Promise.all()` with concurrency limiter (e.g., `p-limit` library)
- Emit entities in batches as they're processed — no wait for all 2,000 to finish
- Config option: `catalog.providers.ociSkill.discovery.concurrency` (default 20, max 50)

### Decision 6: Relationship to RHDHPLAN-1507 framework

**Context:** This connector depends on the OCI Skill Registry Ingestion Framework (RHDHPLAN-1507 RHIDP-15294). We must define the interface boundary.

**Decision:** This connector implements the framework's SDK interfaces; the framework provides schema validation and base abstractions.

**Framework provides (RHDHPLAN-1507):**

- `SkillEntityProvider` base class with lifecycle hooks (`connect()`, `refresh()`)
- `skillcard.yaml` Zod schema validator
- Entity emission utilities (`buildSkillEntity()`)
- RHDH AI Asset annotation scheme

**This connector provides:**

- Concrete `OciSkillEntityProvider` extending `SkillEntityProvider`
- OCI Distribution Spec HTTP client
- Digest-based incremental sync engine
- K8s pull secret authentication
- Custom CA bundle support
- Scale validation test harness

**Dependency direction:** `boost-backend-module-oci-skill-connector` → `@boost/oci-skill-registry-sdk` (from RHDHPLAN-1507)

## Risks

- **Registry rate limiting:** Mitigated by configurable concurrency and exponential backoff retry logic.
- **Large blob downloads:** Mitigated by selective download (only changed skills) and streaming (no memory buffering).
- **Cache staleness:** Mitigated by 5-minute TTL and background digest re-validation.
- **Auth token expiration:** Mitigated by token refresh logic (K8s pull secrets are long-lived; custom token providers must implement refresh).
