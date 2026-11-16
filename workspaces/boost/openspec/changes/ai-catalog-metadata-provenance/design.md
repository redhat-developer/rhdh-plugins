# Design: AI Catalog Metadata and Provenance

## Context

[RHIDP-18844](https://redhat.atlassian.net/browse/RHIDP-18844) specifies the
metadata and provenance contract for AI Catalog entities under RHDHPLAN-1507.
The [provider inventory](../ai-catalog-provider-adoption/provider-inventory.md)
(RHIDP-18843) documents the current state: five entity providers across two
workspaces, divergent annotation population, and no emitted Location entities.

Three annotations are the working baseline:
`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, and
`rhdh.io/ai-asset-source`. Current providers differ in whether they populate
all three, and in the management/origin annotation values they set on emitted
entities.

This design grounds every contract in inspected code (RHIDP-18843 inventory
revision `719a89f8061b0ee7f232451e47629d5ef60eea6e`, revalidated at
`8af3d2f4e0dbbf57b8425c688a02551f82289c4a`). Observed behavior is stated as
current fact; proposed contracts are clearly labeled and await frontend feedback
and maintainer acceptance.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified.
- ADRs under `specifications/adr/`: **None** modified.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md)
  remains the release behavior reference.

## Goals

- Document annotation semantics, required/optional rules, validation behavior,
  and examples for all three `rhdh.io/ai-asset-*` annotations.
- Map supported kind/`spec.type` pairs to `rhdh.io/ai-asset-category` values
  using the current taxonomy, without reviving graph/bundle obligations.
- Define the metadata precedence and consistency rules for overlapping
  representations (annotation, kind, spec.type).
- Specify generated Location entity granularity, stable identity, type/target
  semantics, asset correlation, ownership, and deletion lifecycle.
- Distinguish a catalog Location entity, `backstage.io/managed-by-location` /
  `backstage.io/managed-by-origin-location` annotations, and the mutation
  `locationKey` parameter.
- Account for API-origin sources (programmatic entity providers) versus catalog
  descriptor file URLs.
- Prevent duplicate ingestion across multi-instance deployments.
- Provide credential-free provenance examples and safe-exposure rules.

## Non-Goals

- Production code, runtime provider migration, or package publication.
- Version scheme normalization rules or original-value preservation — deferred
  to [RHIDP-18845](https://redhat.atlassian.net/browse/RHIDP-18845).
- Shared and per-kind provider SDK contracts — deferred to
  [RHIDP-18847](https://redhat.atlassian.net/browse/RHIDP-18847).
- Backstage incremental ingestion lifecycle — deferred to
  [RHIDP-18846](https://redhat.atlassian.net/browse/RHIDP-18846).
- Approved recovery and safe-removal behavior — deferred to
  [RHIDP-18848](https://redhat.atlassian.net/browse/RHIDP-18848).
- Selecting new annotation schemes beyond the three working-baseline annotations.
- Creating new entity kinds or modifying the upstream alignment strategy.
- Neo4j knowledge graph or SkillBundle/skillcard.yaml contracts.

## Decisions

### Decision 1: Three required annotations for all AI asset entities

All entities carrying any `rhdh.io/ai-asset-*` annotation MUST carry all three:

| Annotation                  | Required | Validation                                                                                       |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `rhdh.io/ai-asset-category` | Yes      | Must be one of the six accepted values (five minimum categories plus `rule` compatibility)       |
| `rhdh.io/ai-asset-version`  | Yes      | Must be a non-empty string; normalization rules are specified by RHIDP-18845                     |
| `rhdh.io/ai-asset-source`   | Yes      | Must be a non-empty string identifying the connector and, when applicable, the registry instance |

**Observed current state:** OGX providers populate all three annotations. The
model-catalog and MCP-registry providers do not populate the three SDK
annotations; their adoption is tracked by
[RHIDP-18849](https://redhat.atlassian.net/browse/RHIDP-18849) /
[RHIDP-18850](https://redhat.atlassian.net/browse/RHIDP-18850). The
skills-catalog provider populates all three annotations with its own source
and version scheme.

**Rationale:** These three annotations form the minimum metadata contract
for catalog consumers to identify, classify, and trace an AI asset.

### Decision 2: Category-to-kind/spec.type mapping uses the current taxonomy

The `rhdh.io/ai-asset-category` annotation provides the semantic classification.
The kind/`spec.type` mapping follows
[ai-catalog-entity-model/design.md Decision 1](../ai-catalog-entity-model/design.md#decision-1-annotation-independence-from-entity-kinds)
and the current shared taxonomy in
`ai-catalog-common/src/aiAssetTaxonomy.ts` (`AI_ASSET_SPEC_TYPES`).

**Current taxonomy mapping:**

| `AI_ASSET_SPEC_TYPES` kind | Allowed `spec.type` values | Category annotation value(s) |
| -------------------------- | -------------------------- | ---------------------------- |
| `airesource`               | `skill`, `rule`, `agent`   | `skill`, `rule`, `agent`     |
| `aimodelserverapi`         | `ai-model-server`          | `model-server`               |
| `api`                      | `mcp-server`               | `mcp-server`                 |

The `ai-model` category maps to `kind: Resource`, `spec.type: ai-model` per
Decision 1 in the entity-model design. It is not yet in the
`AI_ASSET_SPEC_TYPES` taxonomy because no active provider emits it; its
category annotation value is documented for future providers.

**Precedence rule:** The `rhdh.io/ai-asset-category` annotation is the source
of truth for semantic classification. The kind/`spec.type` pair is the
structural Backstage type. When they disagree (e.g., a legacy entity with
`kind: Resource` but `rhdh.io/ai-asset-category: model-server`), the
annotation takes precedence for AI Catalog browsing and filtering. The
CatalogProcessor validator rejects entities where the category does not match
any recognized kind/`spec.type` pairing; this validation is specified separately
in the [annotation-scheme spec](../ai-catalog-entity-model/specs/annotation-scheme/spec.md).

**Excluded scope:** `vector-store` and `ai-tool` are retired from the
`AI_ASSET_SPEC_TYPES` taxonomy. `skill-bundle` was removed by RHIDP-18761.
The UI `categoryMeta.ts` retains fallback display entries for `ai-tool` and
`vector-store` but these are not recognized annotation categories.

### Decision 3: Source annotation format and safe exposure

The `rhdh.io/ai-asset-source` annotation identifies which connector ingested the
entity. Its format is provider-defined.

**Observed formats:**

| Provider       | Current source value                              | Format                                |
| -------------- | ------------------------------------------------- | ------------------------------------- |
| OGX model      | `ogx`                                             | Bare connector name                   |
| OGX agent      | `ogx`                                             | Bare connector name                   |
| Skills catalog | `<sourceType>/<sourceId>` (e.g., `oci/quay-prod`) | Connector type / registry instance    |
| MCP registry   | _(not currently populated)_                       | Proposed: `mcp-registry/<instanceId>` |
| Model catalog  | _(not currently populated)_                       | Proposed: `model-catalog/<configId>`  |

**Safe-exposure rules:**

The source annotation MUST NOT contain:

- Credentials (API keys, tokens, passwords, client secrets)
- Internal network addresses that expose infrastructure topology (use instance
  IDs from app-config, not raw URLs)
- Personally identifiable information

The annotation MAY contain:

- Connector names (e.g., `ogx`, `mcp-registry`, `rhoai`)
- App-config instance identifiers (e.g., `default`, `prod-west`)
- Source type identifiers (e.g., `oci`, `npx`)

**Rationale:** The source annotation appears on catalog entities visible to all
authorized users. Including credentials or raw internal URLs would expose
sensitive infrastructure details. Instance IDs from app-config are safe because
they are administrative labels without network significance.

### Decision 4: Location entity generation contract

> **Status: Proposed.** No provider currently emits Location entities. This
> contract defines the future behavior for providers that choose to emit them.

Backstage distinguishes three related concepts:

1. **Catalog Location entity** — a `kind: Location` entity in the catalog that
   represents a source from which other entities are discovered. It has
   `spec.type` and `spec.target` fields.
2. **Management annotations** — `backstage.io/managed-by-location` and
   `backstage.io/managed-by-origin-location` on each emitted entity, recording
   which location or provider ingested it. Required by the catalog processing
   pipeline; entities without them do not appear.
3. **Mutation `locationKey`** — a string passed to `applyMutation` that
   determines which provider owns the entity for update and deletion scoping.

**Current behavior (from RHIDP-18843 inventory):**

None of the five active providers emits a catalog Location entity.

Management annotations are set by all providers but with different value
patterns:

| Provider       | `backstage.io/managed-by-location` value     | Mutation `locationKey`                                       |
| -------------- | -------------------------------------------- | ------------------------------------------------------------ |
| OGX model      | `ogx-model-entity-provider:ogx-model-server` | `ogx-model-entity-provider`                                  |
| OGX agent      | `ogx-agent-entity-provider:ogx-agent-<id>`   | `ogx-agent-entity-provider`                                  |
| Model catalog  | Provider name string                         | `ModelCatalogResourceEntityProvider:<config.id>`             |
| MCP registry   | `url:<registryBaseUrl>`                      | `mcp-registry-provider`                                      |
| Skills catalog | `url:<record.sourceUri>`                     | `skills-catalog-provider:<configId>:<sourceType>:<sourceId>` |

All providers set `backstage.io/managed-by-origin-location` to the same
value as `backstage.io/managed-by-location`.

**Proposed Location entity contract:**

When a provider emits Location entities, the following rules apply:

- **Granularity:** One Location entity per provider instance (per configured
  `configId` or equivalent). A provider instance that connects to one registry
  endpoint produces one Location entity representing that endpoint.
- **Stable identity:** The Location entity name MUST be deterministic from
  the provider identity (e.g., `ai-catalog-<connector>-<instanceId>`). It
  MUST NOT change across restart cycles.
- **Type:** `spec.type` SHOULD be `ai-catalog-provider` to distinguish
  AI Catalog provider locations from file-based or URL-based catalog locations.
- **Target:** `spec.target` SHOULD identify the source endpoint without
  exposing credentials. For API-origin sources, use the configured base URL.
  For configuration-backed sources (like OGX agents), use the app-config path.
- **Correlation:** Emitted entities SHOULD reference their Location via
  `backstage.io/managed-by-location` using the Location entity's
  `metadata.name`. The `backstage.io/managed-by-origin-location` annotation
  SHOULD carry the same value for programmatic providers.
- **Ownership:** The Location entity's `spec.owner` SHOULD match the
  `spec.owner` of the entities it produces, or reference the team responsible
  for the connector deployment.
- **Deletion lifecycle:** When a provider instance is removed from
  configuration and the provider performs a full mutation with an empty entity
  list, the associated Location entity MUST also be removed. Orphaned Location
  entities (no associated asset entities) SHOULD be cleaned up.

**API origins versus catalog descriptor URLs:**

Programmatic entity providers (OGX, MCP registry, model catalog) discover
entities through API calls, not catalog descriptor YAML files. Their Location
entities represent API endpoints, not file URLs. The `spec.target` value for
these providers is the API base URL or a synthetic identifier — not a
`catalog-info.yaml` path. The `spec.type` value (`ai-catalog-provider`)
distinguishes them from standard `url` or `file` locations.

**Rationale:** Location entities enable the catalog to display provenance and
support administrative operations (refresh, delete source). Without them,
administrators cannot discover which sources feed the AI Catalog or remove a
source's entities in bulk. The one-per-instance granularity balances
administrative visibility with entity count — one Location per entity would
produce unnecessary catalog noise.

### Decision 5: Duplicate ingestion prevention

Multi-instance deployments (e.g., two RHDH instances pointing at the same OGX
server) can produce duplicate catalog entities. Prevention relies on two
mechanisms:

1. **Entity identity uniqueness:** The combination of `kind`, `namespace`, and
   `metadata.name` determines entity identity in the Backstage catalog. If two
   providers emit entities with the same identity triple, the catalog merges
   them. Providers MUST construct deterministic entity names from source data
   (not random UUIDs) so that the same source asset always maps to the same
   entity identity.
2. **Mutation `locationKey` scoping:** Each provider instance's `locationKey`
   scopes its mutations. When two provider instances share a `locationKey`,
   their full mutations overwrite each other's entities — the last writer wins.
   When they use different `locationKey` values, both sets coexist. The
   appropriate behavior depends on the deployment model:
   - **Shared source, single owner:** Use the same `locationKey` across
     instances. Only one instance's entities survive, avoiding duplicates.
   - **Distinct sources:** Use different `locationKey` values. Entities from
     each source coexist.

**Multi-instance source scenarios:**

- Two RHDH instances both pointing to `ogx.corp.example.com`: Because OGX
  model uses a fixed entity name (`ogx-model-server`), both instances emit
  the same entity identity. The `locationKey` (`ogx-model-entity-provider`)
  is also fixed, so the last full mutation wins. No duplicates.
- Two configured model-catalog instances (`catalog.providers.modelCatalog.us`
  and `catalog.providers.modelCatalog.eu`) pointing to different KServe
  clusters: Different `locationKey` values
  (`ModelCatalogResourceEntityProvider:us` and `:eu`) ensure both sets
  coexist. Entity name collisions are possible if both clusters serve a
  model with the same name; the model-catalog provider does not currently
  include an instance prefix in entity names.

**Rationale:** Deterministic naming is the primary deduplication mechanism.
`locationKey` provides a secondary ownership boundary. This approach works
within existing Backstage catalog semantics without custom deduplication logic.

### Decision 6: Precedence for overlapping metadata representations

When metadata appears in multiple places (annotation, `spec` field, kind
name), precedence rules resolve conflicts:

1. **Category:** `rhdh.io/ai-asset-category` annotation is authoritative.
   `spec.type` and `kind` are the structural mapping that SHOULD agree with the
   category but are not the classification source of truth.
2. **Version:** `rhdh.io/ai-asset-version` annotation is authoritative for
   display and sorting. Source-native version fields (e.g., model server
   `serverVersion`, MCP server raw version) are the original values; the
   annotation holds the normalized form. Original-value preservation semantics
   are specified by RHIDP-18845.
3. **Source:** `rhdh.io/ai-asset-source` annotation is authoritative for
   provenance. The `backstage.io/managed-by-location` annotation identifies
   the Location/provider, not the upstream registry. They serve different
   purposes and are not interchangeable.

**Conflicting metadata scenario:** If a catalog processor or manual YAML edit
sets `rhdh.io/ai-asset-category` to a value that conflicts with the entity's
kind/`spec.type` (e.g., `rhdh.io/ai-asset-category: agent` on a
`kind: Resource` entity), the AI Catalog browse view uses the annotation value
for filtering. The CatalogProcessor validator logs a warning but does not reject
the entity — the annotation is the classification truth.

### Decision 7: Frontend feedback status

> **Status: Pending.** Frontend stakeholder review of the annotation baseline
> has not been completed.

The three annotations and the kind/`spec.type` taxonomy are the **working
baseline** inherited from RHIDP-18761 and the current implementation. They are
not described as stakeholder-approved. Outstanding review questions:

- Should the AI Catalog browse view filter by `rhdh.io/ai-asset-category`
  annotation or by `spec.type`? The current implementation uses `spec.type`
  via `buildAiAssetCatalogFilter()`.
- Should Location entities appear in the AI Catalog browse view? If so, with
  what category badge?
- Should the source annotation be visible in entity detail cards, and if so,
  in what format (raw value, parsed connector/instance, linked to admin)?

Recommendations are recorded in the specification. None has stakeholder
approval. Changes to the working baseline require explicit frontend review
before implementation.

## Risks

### Risk 1: Location entity adoption complexity

**Likelihood:** Medium
**Impact:** Medium

No current provider emits Location entities. Adopting Decision 4 requires
changes to every provider's entity emission logic. The migration must be
coordinated across the Boost and ai-integrations workspaces.

**Mitigation:** Location entity emission is optional in the initial contract.
Providers can adopt it incrementally. The `backstage.io/managed-by-location`
annotation already works without a corresponding Location entity.

### Risk 2: Source annotation format divergence

**Likelihood:** Medium
**Impact:** Low

Current providers use different source annotation formats (bare name vs.
type/instance). Standardizing requires provider changes and may break
existing conditional policies that match on current values.

**Mitigation:** The contract documents both current and proposed formats.
Migration guidance will be part of the provider adoption profiles
(RHIDP-18849/RHIDP-18850).

### Risk 3: Frontend filtering dependency on spec.type

**Likelihood:** Low
**Impact:** Medium

The current browse view filters by `spec.type` via `buildAiAssetCatalogFilter()`,
not by the `rhdh.io/ai-asset-category` annotation. If the annotation and
`spec.type` disagree, users see inconsistent results.

**Mitigation:** Decision 6 establishes the annotation as authoritative. The
frontend review (Decision 7) will determine whether to add annotation-based
filtering alongside or replacing `spec.type` filtering.
