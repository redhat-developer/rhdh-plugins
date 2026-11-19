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
> - **RHDHPLAN-1113 dependency (resolved):** RHDHPLAN-1113 is sufficiently advanced — Boost uses AiResource for skills/rules directly. No interim Resource/Component mapping needed.
> - **MCP → API mapping is tracked by broader RHDH 2.1 work** via RHDHPLAN-1510. The `mcp-server` category maps to `API` kind with `spec.type: mcp-server`. This mapping is not a deliverable of the current Boost frontend/OGX release.
> - **Entity kind strategy (reconciled 2026-11-10):** Agents use `kind: AiResource`, `spec.type: agent`. The mapping table in Decision 1 retains the skills/rules reference mapping. Model/model-server mappings remain under RHDHPLAN-404.

## Goals

- Standardized annotation scheme for all AI asset categories: agents, skills, MCP servers, models, model servers
- Entity provider SDK enabling clean connector implementations
- Delta sync support via Backstage's built-in `applyMutation({ type: 'delta' })` API
- Per-entity fault isolation and contextual logging
- Migration-readiness mapping to upstream entity kinds
- **Stretch:** Air-gapped deployment qualification (custom CA bundles, K8s Secret-only credentials, configurable endpoints) — tracked under RHIDP-15316
- **Stretch:** Performance validation at 5,000+ entities with ≤10% p95 latency degradation — tracked under RHIDP-15294

## Non-Goals

- Creating new upstream Backstage entity kinds (agents use `AiResource` / `agent`; skills/rules follow RHDHPLAN-1113, MCP servers use API, and model mappings remain under RHDHPLAN-404)
- Changing Backstage catalog core behavior or mutation APIs
- Implementing specific connectors — covered in separate changes
- Neo4j knowledge graph ingestion pipeline — archived (see `archive/2026-11-06-neo4j-knowledge-graph/`)
- OCI skill registry connector — archived (see `archive/2026-11-06-oci-skill-registry/`)
- SkillBundle/skillcard.yaml contracts — archived (see `archive/2026-11-06-oci-skill-connector/`)

## Decisions

### Decision 1: Annotation independence from entity kinds

The `rhdh.io/ai-asset-category` annotation provides five minimum feature categories (`agent`, `skill`, `mcp-server`, `ai-model`, `model-server`) independent of the Backstage entity kind. The reconciled vocabulary also retains existing `rule` compatibility; that additional value does not establish a sixth minimum feature category.

**Why:** Backstage entity kinds are structural categories (Component, Resource, API), not domain categories. A model is semantically a Resource, but so is a deployed MCP server instance. The annotation distinguishes them.

**Existing `rule` compatibility:** The recovered SDK and taxonomy already recognize AI decision rules. Preserve that compatibility without adding rule discovery, frontend behavior, or a new provider requirement to the five-category minimum. The mapping below retains `rule` as a compatibility reference. Further contract decisions belong to [RHIDP-18839](https://redhat.atlassian.net/browse/RHIDP-18839).

**Mapping reference (agent mapping settled):**

| Category       | Backstage Kind   | spec.type         | Notes                                                                             |
| -------------- | ---------------- | ----------------- | --------------------------------------------------------------------------------- |
| `agent`        | AiResource       | `agent`           | Settled RHDH agent mapping; upstream schema alignment remains under RHDHPLAN-1113 |
| `skill`        | AiResource       | `skill`           | AiResource per RHDHPLAN-1113                                                      |
| `rule`         | AiResource       | `rule`            | AiResource per RHDHPLAN-1113                                                      |
| `mcp-server`   | API              | `mcp-server`      | Tracked by broader RHDHPLAN-1510 work; not a current Boost release deliverable    |
| `ai-model`     | Resource         | `ai-model`        | Mapping pending RHDHPLAN-404 (upstream entity schema work)                        |
| `model-server` | AiModelServerAPI | `ai-model-server` | Current dedicated kind; future upstream alignment remains under RHDHPLAN-404      |

Agent providers MUST use `kind: AiResource`, `spec.type: agent`. The other rows are documented for reference; connectors MAY map those categories differently based on their domain. The annotation remains the source of truth for AI asset category, not the kind.

> **RHDHPLAN-1113 / RHDHPLAN-404 dependencies (reconciled 2026-11-10):** The `skill` and `rule` reference mappings remain under RHDHPLAN-1113. The `agent` category uses `kind: AiResource`, `spec.type: agent`; the former `Component` / `ai-agent` mapping is historical and is not an implementation option. Future upstream agent-schema alignment remains under RHDHPLAN-1113. Model servers currently use `AiModelServerAPI` / `ai-model-server`. The `ai-model` mapping and future model-server upstream alignment remain under RHDHPLAN-404. The `mcp-server` category maps to `API` kind with `spec.type: mcp-server` under broader RHDHPLAN-1510 work; it is not part of the current Boost frontend/OGX release contract.

**Migration path:** When upstream kinds stabilize, we document field-level transformations. For example, `AiResource` casing alignment for skills: `kind: AIResource` + `spec.type: skill` + `rhdh.io/ai-asset-category: skill` → `kind: AiResource` (see [#33575](https://github.com/backstage/backstage/issues/33575)). The annotation remains for backward compatibility during the transition.

> **Annotation specification (RHIDP-15346):** A formal specification for all `rhdh.io/ai-asset-*` annotations is published at [`specifications/annotation-specification.md`](../../../specifications/annotation-specification.md). It documents annotation semantics, the mapping table above, upstream mapping scenarios with confidence levels, and field-level transformations. That specification cross-references this decision as its source of truth.

### Decision 2: SDK package scope and structure

Single npm package `@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk` exports:

- Provider interface types (`AIAssetEntityProvider`, entity emission contract)
- Annotation constants (`AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`)
- Validation utilities (`validateAIAssetEntity()`, rejects entities with missing/invalid annotations)
- Entity kind mapping reference (documented mapping table from Decision 1)

**Recovered package boundary:** The restored code uses one shared package. This baseline does not decide the future shared/per-kind SDK structure; that design belongs to [RHIDP-18839](https://redhat.atlassian.net/browse/RHIDP-18839).

**Interface over implementation:** The SDK exports TypeScript interfaces and constants. Providers implement the interfaces; the SDK does NOT provide a base class or abstract provider implementation. This follows Backstage's catalog provider pattern.

### Decision 3: Delta sync via `applyMutation({ type: 'delta' })`

The recovered helper uses Backstage's built-in delta mutation API. `DeltaSyncManager`:

1. Accepts connector-reported additions/updates/deletions relative to a sync cursor
2. Translates deltas into `applyMutation({ type: 'delta', added: [...], removed: [...] })` calls
3. Stores a supplied next cursor through the consumer's `CursorStore` after a successful mutation
4. Exposes `getCursor()` and `clearCursor()` so consuming providers can manage their own refresh path

**Consumer responsibilities:** The provider owns fetching source data, scheduling, detecting missing/rejected cursors, selecting full versus delta refresh, and submitting full mutations. The helper does not call `entities()` or `delta()` and does not automatically switch provider modes.

**Cursor persistence:** The SDK provides the `CursorStore` interface and an `InMemoryCursorStore` for development/testing. Consumers supply storage keyed by the manager's `locationKey`; stored `CursorState` contains `cursor` and `lastSyncTimestamp`. Durable storage is not delivered by this baseline.

**Deferred design:** The earlier rejection of `IncrementalEntityProvider` is withdrawn. Backstage incremental ingestion uses paginated bursts and mark-and-sweep deletion reconciliation; it is not inherently a source change-token feed. [RHIDP-18840](https://redhat.atlassian.net/browse/RHIDP-18840) owns the integration design, cursor semantics, durable storage, and automatic refresh/recovery orchestration. This reconciliation does not implement or choose that architecture. See [Backstage incremental providers](https://backstage.io/docs/features/software-catalog/external-integrations/incremental-entity-providers/).

### Decision 4: Credential and CA reference patterns _(Qualification deferred to RHIDP-15316)_

These patterns preserve generic configuration examples and existing shared
utilities. Full disconnected-deployment qualification is stretch work and does
not require new SDK configuration/CA re-exports or block minimum SDK publication.

**Custom CA reference configuration:** Provider examples read CA certificates from mounted Secret/ConfigMap via `NODE_EXTRA_CA_CERTS` or explicit `https.Agent` configuration. This is standard Node.js TLS.

**Secret-based reference configuration:** Credentials can be supplied via K8s Secrets mounted as environment variables. Helm/Operator examples mount the Secret into the container; app-config references the env vars with standard Backstage `$env` resolvers. This reference pattern does not establish a minimum SDK guarantee that every provider rejects plaintext credentials. Generic endpoint, CA, credential, and schedule examples remain in [app-config.connectors.yaml](../../../examples/app-config.connectors.yaml).

~~Startup validation rejects plaintext credentials with descriptive error: `Plaintext credentials not allowed. Use $env references backed by mounted K8s Secrets.`~~ **DEFERRED — stretch qualification, not minimum SDK acceptance.**

**Configurable endpoint reference configuration:** Generic examples use app-config endpoint overrides. Qualification of endpoint configuration and startup URL validation across all providers remains deferred with task 6.5. Existing provider-specific validation remains owned by the consuming provider.

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
