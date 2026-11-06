# Design: AI Catalog Entity Model

> **Workspace scope:** This is broader follow-on entity-model planning. It is
> not the RHDH 2.1 Boost release behavior source of truth; the current release
> contains the frontend plugin and OGX entity provider only.

## Context

The AI Catalog entity model establishes RHDH's standardized approach to classifying, versioning, and tracking AI assets from heterogeneous sources. The Backstage catalog has no built-in entity kinds for agents, skills, models, or MCP servers. Upstream developments include: RFC [#32062](https://github.com/backstage/backstage/issues/32062) Option 3 shipped as `McpServerApiEntity` ([backstage#34016](https://github.com/backstage/backstage/pull/34016)) for MCP servers, `AiResource` shipped upstream ([#33575](https://github.com/backstage/backstage/issues/33575)) for skills/rules, and a candidate `API` / `ai-model-server` in [backstage#34476](https://github.com/backstage/backstage/pull/34476) for model servers. Agent and AI model kinds are not yet proposed upstream.

Boost cannot wait for upstream — customers need AI Catalog today. The model uses custom annotations as an independent classification layer ON TOP OF existing entity kinds, with a documented migration path to upstream kinds when available.

This design is informed by the RHDHPLAN-1507 feasibility analysis, which confirmed all patterns are standard Backstage catalog extensions with no framework changes required.

## RHDHPLAN-1507 Consolidation (2026-07-08)

> This design originally covered 7 epics. Post-consolidation, 3 surviving epics remain:
>
> - **RHIDP-15258** (Entity-Provider SDK) — absorbs annotation scheme, delta sync
> - **RHIDP-15294** (OCI Skill Registry) — absorbs load testing
> - **RHIDP-15316** (Cross-Connector, RHDHPLAN-1510) — absorbs air-gapped patterns, error resilience
>
> Decisions 1–3 and 6 remain under RHIDP-15258. Decision 4 (air-gapped) moved to RHIDP-15316.
> Decision 5 (performance) distributed: load testing → RHIDP-15294, error resilience → RHIDP-15316.
> Decisions 7 (Neo4j) and 8 (SkillBundle) removed from minimum scope (RHIDP-18761).

## Stakeholder Alignment (2026-07-13)

> Per RHDHPLAN-1505 stakeholder meeting (updated 2026-07-20):
>
> - **RHDHPLAN-1113 dependency (resolved):** RHDHPLAN-1113 is sufficiently advanced — Boost uses AIResource for skills/rules directly. No interim Resource/Component mapping needed.
> - **MCP → API mapping is tracked by broader RHDH 2.1 work** via RHDHPLAN-1510. The `mcp-server` category maps to `API` kind with `spec.type: mcp-server`. This mapping is not a deliverable of the current Boost frontend/OGX release.
> - **Entity kind strategy:** The mapping table in Decision 1 uses AIResource for skills/rules. Agent kind mapping is pending RHDHPLAN-1113. Model/model-server mappings are pending RHDHPLAN-404.

## Goals

- Standardized annotation scheme for all AI asset categories: agents, skills, MCP servers, models, model servers
- Entity provider SDK enabling clean connector implementations (Kagenti, OGX)
- Delta sync support via Backstage's built-in `applyMutation({ type: 'delta' })` API
- Per-entity fault isolation and contextual logging
- Migration-readiness mapping to upstream entity kinds
- **Stretch:** Air-gapped deployment qualification (custom CA bundles, K8s Secret-only credentials, configurable endpoints) — tracked under RHIDP-15316
- **Stretch:** Performance validation at 5,000+ entities with ≤10% p95 latency degradation — tracked under RHIDP-15294

## Non-Goals

- Creating new upstream Backstage entity kinds (we use AIResource for skills/rules per RHDHPLAN-1113, API for MCP servers, and existing kinds for agents/models pending RHDHPLAN-1113/RHDHPLAN-404)
- Changing Backstage catalog core behavior or mutation APIs
- Implementing specific connectors (Kagenti/OGX) — covered in separate changes
- Neo4j knowledge graph ingestion pipeline — archived (see `archive/2026-11-06-neo4j-knowledge-graph/`)
- OCI skill registry connector — archived (see `archive/2026-11-06-oci-skill-registry/`)
- SkillBundle/skillcard.yaml contracts — archived (see `archive/2026-11-06-oci-skill-connector/`)

## Decisions

### Decision 1: Annotation independence from entity kinds

The `rhdh.io/ai-asset-category` annotation provides a flat vocabulary (`agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`) independent of the Backstage entity kind.

**Why:** Backstage entity kinds are structural categories (Component, Resource, API), not domain categories. A model is semantically a Resource, but so is a deployed MCP server instance. The annotation distinguishes them.

**Why `rule`:** The original five values (`agent`, `skill`, `mcp-server`, `ai-model`, `model-server`) did not cover AI decision rules, which are AIResource entities (same kind as skills per RHDHPLAN-1113) that need a distinct category so the validator can validate them and the browse UI can list them separately from skills. The `rule` value closes the gap between the annotation enum and the full set of AI entity types the system needs to validate and display.

**Mapping reference (not a constraint):**

| Category       | Backstage Kind | spec.type         | Notes                                                                          |
| -------------- | -------------- | ----------------- | ------------------------------------------------------------------------------ |
| `agent`        | Component      | `ai-agent`        | Mapping pending RHDHPLAN-1113 (owns agent entity kind definition)              |
| `skill`        | AIResource     | `skill`           | AIResource per RHDHPLAN-1113                                                   |
| `rule`         | AIResource     | `rule`            | AIResource per RHDHPLAN-1113                                                   |
| `mcp-server`   | API            | `mcp-server`      | Tracked by broader RHDHPLAN-1510 work; not a current Boost release deliverable |
| `ai-model`     | Resource       | `ai-model`        | Mapping pending RHDHPLAN-404 (upstream entity schema work)                     |
| `model-server` | Resource       | `ai-model-server` | Mapping pending RHDHPLAN-404 (upstream entity schema work)                     |

This mapping is documented for reference — connectors MAY map differently based on their domain. The annotation is the source of truth for AI asset category, not the kind.

> **RHDHPLAN-1113 / RHDHPLAN-404 dependencies (updated 2026-07-20):** The `skill` and `rule` categories use `AIResource` kind per RHDHPLAN-1113 (resolved). The `agent` category mapping is pending RHDHPLAN-1113 — Boost will refrain from defining agent entity kind mappings independently. The `ai-model` and `model-server` mappings are pending RHDHPLAN-404 upstream entity schema work. The `mcp-server` category maps to `API` kind with `spec.type: mcp-server` under broader RHDHPLAN-1510 work; it is not part of the current Boost frontend/OGX release contract.

**Migration path:** When upstream kinds stabilize, we document field-level transformations. For example, `AiResource` casing alignment for skills: `kind: AIResource` + `spec.type: skill` + `rhdh.io/ai-asset-category: skill` → `kind: AiResource` (see [#33575](https://github.com/backstage/backstage/issues/33575)). The annotation remains for backward compatibility during the transition.

> **Annotation specification (RHIDP-15346):** A formal specification for all `rhdh.io/ai-asset-*` annotations is published at [`specifications/annotation-specification.md`](../../../specifications/annotation-specification.md). It documents annotation semantics, the mapping table above, upstream mapping scenarios with confidence levels, and field-level transformations. That specification cross-references this decision as its source of truth.

### Decision 2: SDK package scope and structure

Single npm package `@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk` exports:

- Provider interface types (`AIAssetEntityProvider`, entity emission contract)
- Annotation constants (`AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`)
- Validation utilities (`validateAIAssetEntity()`, rejects entities with missing/invalid annotations)
- Entity kind mapping reference (documented mapping table from Decision 1)

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

**K8s Secret-only credentials:** All credentials are supplied via K8s Secrets mounted as environment variables. Helm/Operator config mounts the Secret into the container; app-config references the env vars with standard Backstage `$env` resolvers:

```yaml
boost:
  providers:
    kagenti:
      clientId:
        $env: KAGENTI_CLIENT_ID
      clientSecret:
        $env: KAGENTI_CLIENT_SECRET
```

Startup validation rejects plaintext credentials with descriptive error: `Plaintext credentials not allowed. Use $env references backed by mounted K8s Secrets.`

**Configurable endpoints:** All registry endpoint URLs configurable via app-config. No hardcoded SaaS URLs. Startup validation verifies URLs are syntactically valid.

Reference app-config pattern applies to all connectors (Kagenti, OGX).

### Decision 5: Performance SLAs and error resilience _(Distributed: load testing → RHIDP-15294, error resilience → RHIDP-15316)_

**Load testing (stretch):** Test harness creates 5,000+ entities and measures baseline and with-AI-Catalog p95 latency plus processing-loop duration. The 5,000-entity load/SLA acceptance requirement is deferred from the minimum baseline; error isolation below is the minimum requirement.

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

**Documented in SDK:** The SDK exports a `normalizeAIAssetVersion(sourceVersion: string, options?: { entityRef?: string; warn?: (message: string) => void }): string` utility with test coverage for all normalization rules. The optional `options` parameter provides entity context for warning messages and a custom warning callback.

### ~~Decision 7: Neo4j sync adapter interface~~ REMOVED

> Removed from minimum scope (RHIDP-18761). Neo4j knowledge graph
> integration is archived — see
> `openspec/changes/archive/2026-11-06-neo4j-knowledge-graph/`.

### ~~Decision 8: SkillBundle metadata contract~~ REMOVED

> Removed from minimum scope (RHIDP-18761). SkillBundle/skillcard.yaml
> contracts and the OCI skill registry are archived — see
> `openspec/changes/archive/2026-11-06-oci-skill-registry/` and
> `openspec/changes/archive/2026-11-06-oci-skill-connector/`.

## Risks

- **Upstream entity kind divergence:** If upstream AIAgent/AIModel kinds differ significantly from our annotation mapping, migration becomes a breaking change. Mitigation: Participate in upstream RFCs, align mapping early, document migration strategy.
- **Performance at scale:** If 5,000+ entities exceed the 10% latency SLA, we may need catalog indexing or partitioning. Mitigation: Load testing identifies bottlenecks early, documented in performance-resilience spec.
- **Version normalization edge cases:** Unrecognized version formats may produce non-sortable versions. Mitigation: Log warnings for unrecognized formats, allow manual override via annotation.
