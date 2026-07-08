# Design: AI Catalog Entity Model

## Context

The AI Catalog entity model establishes RHDH's standardized approach to classifying, versioning, and tracking AI assets from heterogeneous sources. The Backstage catalog has no built-in entity kinds for agents, skills, models, or MCP servers. Upstream RFCs #32062 (AI Agent kind) and #33060 (AI Model kind) propose first-class kinds, but they're not yet merged or stabilized.

Boost cannot wait for upstream — customers need AI Catalog today. The model uses custom annotations as an independent classification layer ON TOP OF existing entity kinds, with a documented migration path to upstream kinds when available.

This design is informed by the RHDHPLAN-1507 feasibility analysis, which confirmed all patterns are standard Backstage catalog extensions with no framework changes required.

## RHDHPLAN-1507 Consolidation (2026-07-08)

> This design originally covered 7 epics. Post-consolidation, 3 surviving epics remain:
>
> - **RHIDP-15258** (Entity-Provider SDK) — absorbs annotation scheme, delta sync, per-entity error isolation
> - **RHIDP-15294** (OCI Skill Registry) — absorbs load testing
> - **RHIDP-15316** (Cross-Connector, RHDHPLAN-1510) — absorbs air-gapped patterns, error resilience
>
> Decisions 1–3, 6–8 remain under RHIDP-15258. Decision 4 (air-gapped) moved to RHIDP-15316.
> Decision 5 (performance) distributed: load testing → RHIDP-15294, error resilience → RHIDP-15316.

## Goals

- Standardized annotation scheme for all AI asset categories: agents, skills, MCP servers, models, model servers
- Entity provider SDK enabling clean connector implementations (Kagenti, LlamaStack, OCI skill registry)
- Delta sync support via Backstage's built-in `applyMutation({ type: 'delta' })` API
- Air-gapped deployment readiness: custom CA bundles, K8s Secret-only credentials, configurable endpoints
- Performance resilience: 5,000+ entities with ≤10% p95 latency degradation
- Migration-readiness mapping to upstream entity kinds

## Non-Goals

- Creating new upstream Backstage entity kinds (we use existing kinds: Resource, Component, API)
- Changing Backstage catalog core behavior or mutation APIs
- Implementing specific connectors (Kagenti/LlamaStack) — covered in separate changes
- Neo4j knowledge graph ingestion pipeline — covered in `neo4j-knowledge-graph` change
- OCI skill registry connector — covered in `oci-skill-registry` change

## Decisions

### Decision 1: Annotation independence from entity kinds

The `rhdh.io/ai-asset-category` annotation provides a flat vocabulary (`agent`, `skill`, `mcp-server`, `ai-model`, `model-server`) independent of the Backstage entity kind.

**Why:** Backstage entity kinds are structural categories (Component, Resource, API), not domain categories. A model is semantically a Resource, but so is a deployed MCP server instance. The annotation distinguishes them.

**Mapping reference (not a constraint):**

| Category       | Backstage Kind | spec.type         | Notes                                      |
| -------------- | -------------- | ----------------- | ------------------------------------------ |
| `agent`        | Component      | `ai-agent`        | Software component with agentic capability |
| `skill`        | Component      | `ai-skill`        | Reusable skill component                   |
| `mcp-server`   | API            | `mcp`             | MCP protocol endpoint                      |
| `ai-model`     | Resource       | `ai-model`        | Model weights/checkpoint                   |
| `model-server` | Resource       | `ai-model-server` | Deployed model serving instance            |

This mapping is documented for reference — connectors MAY map differently based on their domain. The annotation is the source of truth for AI asset category, not the kind.

**Migration path:** When upstream kinds become available (e.g., `kind: AIAgent`), we document a transformation: `kind: Component` + `spec.type: ai-agent` + `rhdh.io/ai-asset-category: agent` → `kind: AIAgent`. The annotation remains for backward compatibility during the transition.

### Decision 2: SDK package scope and structure

Single npm package `@boost/entity-provider-sdk` exports:

- Provider interface types (`AIAssetEntityProvider`, entity emission contract)
- Annotation constants (`AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`)
- Validation utilities (`validateAIAssetAnnotations()`, rejects entities with missing/invalid annotations)
- Entity kind mapping reference (documented mapping table from Decision 1)
- Neo4j sync adapter interface (`Neo4jSyncAdapter`, node/relationship creation contracts)
- SkillBundle metadata schema (TypeScript types for skillcard.yaml structure)

**Why a single package:** All AI asset entity providers share the same contracts. Splitting into multiple packages creates versioning coordination overhead without modularity benefit.

**Interface over implementation:** The SDK exports TypeScript interfaces and constants. Providers implement the interfaces; the SDK does NOT provide a base class or abstract provider implementation. This follows Backstage's catalog provider pattern.

### Decision 3: Delta sync via `applyMutation({ type: 'delta' })`

Delta sync uses Backstage's built-in delta mutation API. The SDK provides a wrapper that:

1. Accepts connector-reported additions/updates/deletions relative to a sync cursor
2. Translates deltas into `applyMutation({ type: 'delta', added: [...], removed: [...] })` calls
3. Persists sync cursors (ETag, last-modified timestamp, or connector-specific token) across polling cycles
4. Falls back to full refresh when cursor invalid or missing

**Alternative considered:** `IncrementalEntityProvider` with paginated iteration. Rejected because it doesn't handle deletions — it's for splitting a large full-refresh into pages, not for delta sync.

**Cursor persistence:** Cursors stored in catalog database as provider-scoped key-value pairs. Backstage's `DatabaseManager` provides storage. The SDK abstracts cursor read/write so providers don't interact with the database directly.

```typescript
interface DeltaSyncCursor {
  providerId: string;
  cursor: string; // ETag, last-modified, or connector-specific token
  lastSyncTimestamp: string; // ISO 8601
}
```

### Decision 4: Air-gapped credential pattern _(Moved to RHIDP-15316)_

**Custom CA bundles:** Providers read CA certificates from mounted Secret/ConfigMap via `NODE_EXTRA_CA_CERTS` environment variable or explicit `https.Agent` configuration. This is standard Node.js TLS.

**K8s Secret-only credentials:** All credentials accept K8s Secret references in app-config:

```yaml
boost:
  providers:
    kagenti:
      clientId:
        $secret:
          name: kagenti-creds
          key: client-id
      clientSecret:
        $secret:
          name: kagenti-creds
          key: client-secret
```

Startup validation rejects plaintext credentials with descriptive error: `Plaintext credentials not allowed. Use K8s Secret references ($secret.name / $secret.key).`

**Configurable endpoints:** All registry endpoint URLs configurable via app-config. No hardcoded SaaS URLs. Startup validation verifies URLs are syntactically valid.

Reference app-config pattern applies to all connectors (Kagenti, LlamaStack, OCI skill registry).

### Decision 5: Performance SLAs and error resilience _(Distributed: load testing → RHIDP-15294, error resilience → RHIDP-15316)_

**Load testing:** Test harness creates 5,000+ entities and measures:

- Baseline p95 latency without AI Catalog
- With-AI-Catalog p95 latency
- Processing-loop duration (entity ingestion → catalog API availability)

**SLA:** p95 latency must not exceed 10% degradation with 5,000+ entities.

**Per-entity error isolation:** Single entity failure logged with:

- Entity identifier (`metadata.name` or source registry ID)
- Source registry (`rhdh.io/ai-asset-source` annotation value)
- Field that failed validation
- Human-readable error message

Remaining valid entities still ingested. Sync cycle completes even with multiple failures. Error-handling guarantees documented in SDK README.

### Decision 6: Version normalization scheme

The `rhdh.io/ai-asset-version` annotation has documented normalization rules:

1. **Semver pass-through:** If the source version is valid semver (e.g., `1.2.3`, `2.0.0-beta.1`), use it as-is
2. **Date-based → semver:** If the source version is a date (e.g., `20260708`, `2026-07-08`), map to `0.0.0-YYYYMMDD` (e.g., `0.0.0-20260708`)
3. **Commit hash → version string:** If the source version is a Git commit SHA (e.g., `a1b2c3d`), use `0.0.0-a1b2c3d`
4. **Fallback for unrecognized:** If the source version doesn't match any pattern, use `0.0.0-unknown` and log a warning with the original value

**Why normalize:** External registries use inconsistent version schemes. Normalization enables sorting, comparison, and dependency resolution in the catalog UI.

**Documented in SDK:** The SDK exports a `normalizeAIAssetVersion(sourceVersion: string): string` utility with test coverage for all normalization rules.

### Decision 7: Neo4j sync adapter interface

The SDK defines a TypeScript interface for Neo4j sync adapters (implementation is in the `neo4j-knowledge-graph` change):

```typescript
interface Neo4jSyncAdapter {
  createNode(
    entityRef: string,
    category: AIAssetCategory,
    metadata: Record<string, unknown>,
  ): Promise<void>;

  createRelationship(
    fromRef: string,
    toRef: string,
    type: RelationshipType,
    metadata?: Record<string, unknown>,
  ): Promise<void>;

  updateNode(
    entityRef: string,
    metadata: Record<string, unknown>,
  ): Promise<void>;

  deleteNode(entityRef: string): Promise<void>;
}

type RelationshipType =
  | 'DEPENDS_ON'
  | 'USES_TOOL'
  | 'BELONGS_TO'
  | 'SIMILAR_TO'
  | 'IMPLEMENTED_BY'
  | 'INCLUDES';
```

**Why in the SDK:** Entity providers emit catalog entities AND trigger Neo4j sync. The interface contract lives in the SDK so both the provider and the Neo4j sync implementation can depend on it without circular imports.

### Decision 8: SkillBundle metadata contract

The SDK exports TypeScript types for the `skillcard.yaml` schema (used by the OCI skill registry connector):

```typescript
interface SkillBundleMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  runtime?: {
    language: string;
    dependencies?: Record<string, string>;
  };
  mcp?: {
    servers: string[]; // MCP server entity refs
  };
}
```

**Why in the SDK:** The OCI skill registry connector parses `skillcard.yaml` from OCI artifacts and emits entities. The schema contract lives in the SDK so the connector and any skill authoring tools share the same types.

## Risks

- **Upstream entity kind divergence:** If upstream AIAgent/AIModel kinds differ significantly from our annotation mapping, migration becomes a breaking change. Mitigation: Participate in upstream RFCs, align mapping early, document migration strategy.
- **Performance at scale:** If 5,000+ entities exceed the 10% latency SLA, we may need catalog indexing or partitioning. Mitigation: Load testing identifies bottlenecks early, documented in performance-resilience spec.
- **Version normalization edge cases:** Unrecognized version formats may produce non-sortable versions. Mitigation: Log warnings for unrecognized formats, allow manual override via annotation.
