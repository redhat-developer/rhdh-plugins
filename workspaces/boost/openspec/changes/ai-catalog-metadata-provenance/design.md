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
current fact; target contracts are labeled as future adoption requirements. The
maintainer accepted the source contract and review reconciliation on 2026-11-16;
frontend presentation/filtering feedback remains pending.

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
- Additional AI asset annotations beyond the three working-baseline keys.
  Location-side correlation metadata is part of this source contract.
- Creating new entity kinds or modifying the upstream alignment strategy.
- Neo4j knowledge graph or SkillBundle/skillcard.yaml contracts.

## Decisions

### Decision 1: Three required annotations for all AI asset entities

All entities carrying any `rhdh.io/ai-asset-*` annotation MUST carry all three:

| Annotation                  | Required | Validation                                                                                                                             |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `rhdh.io/ai-asset-category` | Yes      | Must be one of the six accepted values (five minimum categories plus `rule` compatibility)                                             |
| `rhdh.io/ai-asset-version`  | Yes      | Must be a non-empty string; normalization rules are specified by RHIDP-18845                                                           |
| `rhdh.io/ai-asset-source`   | Yes      | Under the adoption contract, the canonical full entity reference of its logical source Location; current SDK checks non-emptiness only |

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

**Known provider mappings:** The integrations retrieve specific upstream APIs or
configured records whose catalog representation is already known. This contract
documents those mappings; it does not introduce a generic classifier, a
"closest category" fallback, or a new record-skipping policy. Preserve native
kind/`spec.type` alongside the semantic category. The entity-model design keeps
connector-domain flexibility where permitted; its `AiResource` / `agent`
mapping is settled, not an alternative to `Component` / `ai-agent`.

**Observed validation and consumers:** `AIAssetValidator` checks the category
enum and required annotation presence. It neither cross-validates category
against native kind/type nor warns about a mismatch. Current
`buildAiAssetCatalogFilter()` uses kind/`spec.type` pairs. This story does not
add rejection, warning, or frontend-filtering behavior for inconsistent manually
authored metadata. Consumer recommendations remain pending in Decision 7.

**Excluded scope:** `vector-store` and `ai-tool` are retired from the
`AI_ASSET_SPEC_TYPES` taxonomy. `skill-bundle` was removed by RHIDP-18761.
The UI `categoryMeta.ts` retains fallback display entries for `ai-tool` and
`vector-store` but these are not recognized annotation categories.

### Decision 3: Source annotation format and safe exposure

The future source annotation identifies the catalog Location representing the
asset's configured logical source. It MUST contain the canonical full entity
reference `location:<namespace>/<name>`, including the namespace. For example:
`location:default/ai-source-oci-quay-prod`.

This is one source identity represented on both the asset and its source record:
many assets can reference the same Location. A consumer can resolve the annotation
with a catalog entity-reference lookup; provider-specific string parsing is not
the correlation mechanism. This is a contract for future adoption, not current
SDK validation or current provider behavior.

The Location MUST carry `rhdh.io/ai-source-ref`. Its value MUST equal both the
asset's `rhdh.io/ai-asset-source` value and the Location's canonical full entity
reference:

```text
asset.annotations["rhdh.io/ai-asset-source"]
  = location.annotations["rhdh.io/ai-source-ref"]
  = canonicalEntityRef(location)
```

**Maintainer accepted the Location-side key on 2026-11-16.**
`rhdh.io/ai-source-ref` is source-record metadata, not a fourth required AI asset
annotation. Source Locations MUST NOT receive the AI asset annotation trio as a
way to classify them. Location remains a source record, not a new asset category.

The existing AIAssetValidator processor activates on `rhdh.io/ai-asset-*` keys;
the new source-record key does not match that prefix. The standalone
`validateAIAssetEntity` helper has no such guard. Future SDK/provider integration
must route Location validation separately instead of passing source records to
that AI-asset-only helper. This is an RHIDP-18847/adoption-profile responsibility,
not a TypeScript change in this story.

Malformed source references, a referenced non-Location kind, and a mismatching
Location correlation value are contract validation errors. A temporarily
unprocessed Location must not cause a consumer to guess another source from a
connector label or URL. Detection/reporting and safe handling of missing or
retiring sources must coordinate with RHIDP-18847/RHIDP-18848; no synchronous
catalog-processing order or new deletion policy is asserted here.

**Paired example (illustrative metadata excerpts, not runnable manifests):**

```yaml
# AI skill entity metadata
metadata:
  annotations:
    rhdh.io/ai-asset-category: skill
    rhdh.io/ai-asset-version: 1.2.3
    rhdh.io/ai-asset-source: location:default/ai-source-oci-quay-prod
---
# Source Location record
apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  namespace: default
  name: ai-source-oci-quay-prod
  annotations:
    rhdh.io/ai-source-ref: location:default/ai-source-oci-quay-prod
    backstage.io/managed-by-location: skills-catalog-provider:skills/oci/quay-prod
    backstage.io/managed-by-origin-location: skills-catalog-provider:skills/oci/quay-prod
spec: {}
```

The source Location has no discovery targets. Its valid Backstage management
references record provider provenance; they do not instruct a reader to fetch
the source. These illustrative management values are not a new prescribed
provider naming algorithm. Decision 4 explains the documented Backstage shape.

**Observed formats (legacy values, not the new target contract):**

| Provider       | Current source value                              | Format                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------- |
| OGX model      | `ogx`                                             | Bare connector name                               |
| OGX agent      | `ogx`                                             | Bare connector name                               |
| Skills catalog | `<sourceType>/<sourceId>` (e.g., `oci/quay-prod`) | Connector type / registry instance                |
| MCP registry   | _(not currently populated)_                       | Adoption must produce a source Location reference |
| Model catalog  | _(not currently populated)_                       | Adoption must produce a source Location reference |

**Safe-exposure rules:**

Asset source and Location correlation annotations contain canonical entity
references, not endpoint URLs. Use safe, stable configured source identifiers in
Location namespace/name construction. No source metadata, names, annotations,
links, or diagnostics may publish credentials, including API keys, passwords,
client secrets, or credential-bearing URLs. Backend authentication stays in
backend configuration. A configured label is not automatically credential-free.

The Location MAY include an optional backend-service link in `metadata.links`.
Such links must be credential-free, including removal of authentication-bearing
userinfo, query parameters, or fragments. Internal URLs are not categorically
prohibited: their exposure must be appropriate for the catalog's intended
users and normal visibility policy. This does not introduce new permission
names, field-level access rules, or a frontend display feature.

**Rationale:** Canonical source identity supports lookup without exposing
connection secrets. Optional links provide useful service context without
turning provenance metadata into another ingestion request.

### Decision 4: Location entity generation contract

> **Status: Maintainer direction accepted; implementation remains future work.**
> Adopting providers must emit source Locations and the three AI asset annotations.
> No current provider is claimed to implement this contract. The matching
> `rhdh.io/ai-source-ref` key was accepted on 2026-11-16.

Backstage distinguishes three related concepts:

1. **Catalog Location entity** — a `kind: Location` entity in the catalog that
   represents a source from which other entities are discovered. Its `spec` is
   required, but `spec.type`, `spec.target`, and `spec.targets` are optional.
2. **Management annotations** — `backstage.io/managed-by-location` and
   `backstage.io/managed-by-origin-location` on each emitted entity, recording
   the processing location and its origin. Their values are Backstage location
   references in `<type>:<target>` form, distinct from catalog entity references.
   A bare Location `metadata.name` is not a valid location-reference value.
3. **Mutation `locationKey`** — an optional conflict-resolution string passed
   to `applyMutation` for definitions sharing an entity reference. Provider
   identity, not this key, scopes the entity set replaced by a full mutation.

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

Providers adopting this contract MUST emit one Location per configured logical
source, including sources that currently yield zero assets. A provider instance
that aggregates multiple registries/sources therefore emits multiple Locations.

- **Granularity and ownership:** A logical source is the configured ingestion
  source/path, not merely a hostname, provider class, individual asset, or asset
  version. Each provider owns the Locations for its configured logical sources.
  Equal endpoints do not collapse distinct ingestion paths or give another
  provider shared ownership of the same Location.
- **Proxy sources:** OGX can proxy multiple remotes through different modes.
  Current model discovery queries OGX `/v1/models`; agent discovery does not use
  an OGX agent REST endpoint and may use configuration or descriptor imports.
  Record these actual discovery paths separately. Distinguish upstream remotes
  when the integration knows and models them; do not invent provenance for
  remotes hidden behind a proxy. Using OGX to interact with an agent does not
  make OGX its discovery source. Descriptor imports retain their actual
  Backstage processing/origin provenance.
- **Stable identity:** The Location namespace/name derives deterministically
  from a collision-safe identity scoped by the provider configuration and
  logical source/path. It MUST remain stable across restarts and credential,
  endpoint, or asset-version changes that preserve that logical identity.
  Renaming/removing the configured identity is a migration/retirement operation
  for RHIDP-18849/RHIDP-18850. Detailed encoding/hashing remains with those
  profiles; source and asset namespaces need not be identical.
- **Spec and links:** The provider emits `spec: {}`. It MUST NOT populate
  `spec.type`, `spec.target`, or `spec.targets` on these provenance-only source
  records. No custom target reader is required for this shape. An optional
  `metadata.links` entry can identify the backend service under Decision 3's
  exposure policy; a link is not a discovery target.

- **Correlation:** Each AI asset's `rhdh.io/ai-asset-source` MUST resolve to its
  logical source Location. That Location MUST carry the matching correlation
  `rhdh.io/ai-source-ref` annotation described in Decision 3. One provider may emit assets referring to
  different Locations; each asset must identify its actual configured source.
- **Management annotations:** Preserve valid Backstage `<type>:<target>` location
  references and their processing/origin meanings. Do not populate them with a
  bare Location name or assume an entity-reference string automatically creates
  a Backstage management link. The AI source lookup uses the explicit contract
  above; exact processing integration is coordinated with RHIDP-18847 and the
  provider adoption profiles.
- **Ownership:** A designated ingestion owner manages each source Location and
  its correlated assets. Catalog mutation ownership is separate from asset
  `spec.owner`. Location has no standard `spec.owner` semantics to rely on here;
  record any display ownership through an explicitly supported metadata contract.
- **Lifecycle:** Keep the Location while the logical source remains configured,
  including ready-empty results and temporary source failures. Zero current assets
  alone is not a reason to delete a configured source record. Explicit retirement
  must account for referenced assets and retained-content obligations before the
  source Location is removed; approved deletion/recovery mechanics remain with
  RHIDP-18848 and the adoption profiles. Removing configuration does not imply that
  a removed provider will run another full-empty mutation.

**Cross-change reconciliation:** The older
[RHOAI connector failure-path plan](../rhoai-connector/design.md#decision-2-graceful-degradation-for-mcp-catalog-api)
proposes a full-empty mutation on API absence or connection failure. If that
provider adopts this source contract, its adoption/safety profile must reconcile
that path so configured source Locations remain in the provider-owned set.
RHIDP-18848 and the adoption profiles retain ownership of asset-removal policy;
this handoff neither approves the older asset-pruning behavior nor adds a
provider to the current adoption cohort.

**Backstage alignment and research:**

The `DeferredEntity` API accepts a generic `Entity`; providers can emit
Locations alongside assets in full or delta mutations. Built-in
`GithubEntityProvider`, `AzureBlobStorageEntityProvider`, and
`ConfigLocationEntityProvider` illustrate provider-owned Location emission,
often using `locationSpecToLocationEntity`. Those examples normally populate
discovery targets for catalog descriptors. That helper is not mandatory: it
populates type/target, so it is not the prescribed construction mechanism for
our targetless source records.

The [Location descriptor documentation](https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-location)
explicitly permits a minimal `spec: {}`. The catalog processing orchestrator
collects only declared targets and invokes `readLocation` for each; our records
have none. Thus the provider remains responsible for fetching remote APIs or
reading configured data, without an additional reader or duplicate asset path.
Custom `spec.type` plus target would instead require a supporting reader and is
not this contract.

The [entity-provider documentation](https://backstage.io/docs/features/software-catalog/external-integrations/entity-providers/)
requires valid management/origin references and demonstrates service provenance
with `hr-user:<service-url>`. The
[management-annotation documentation](https://backstage.io/docs/features/software-catalog/well-known-annotations/#backstageiomanaged-by-location)
allows generic location references, not just URLs or single files. These
annotation references are distinct from Location `spec` targets and from our
canonical entity-reference keys.

Discovery providers own emitted Locations through their mutation sets; those
Locations do not require manual registration rows in the `locations` table.
`DefaultLocationStore` implements `EntityProvider` for the separate manually
registered Location API path. The relevant upstream source is pinned at
[Backstage revision 0c8eb334](https://github.com/backstage/backstage/tree/0c8eb3342cfdc5ef47c10b92604fc1fd29545deb):
`plugins/catalog-node/src/processing/types.ts`, the three providers above,
`plugins/catalog-backend/src/providers/DefaultLocationStore.ts`, and
`plugins/catalog-backend/src/processing/DefaultCatalogProcessingOrchestrator.ts`.
Targetless processing was also checked against Boost's installed
`@backstage/plugin-catalog-backend` 3.9.1.

This combines documented Backstage capabilities into our source-record design;
it is not a claim that upstream documents this exact AI correlation convention.
No automatic parent/child relations arise from matching annotations. Assets and
source Locations emitted directly by the provider are independently owned roots;
this contract does not claim generic refresh/delete operations control provider
retrieval or cascade from the source Location to its sibling assets.

**Example:** one SkillsCatalogProvider with OCI sources `quay-prod` and
`quay-staging` emits two Locations. Assets from `quay-prod` carry
`location:default/ai-source-oci-quay-prod`; assets from `quay-staging` carry
`location:default/ai-source-oci-quay-staging`. Multiple asset versions from one
logical source share its Location. Detailed identity construction and legacy
source-value migration belong to RHIDP-18849/RHIDP-18850.

**Rationale:** Source annotation and source Location describe the same logical
origin, with a deterministic catalog lookup between them. This source identity
is distinct from provider implementation, processing provenance, and mutation
ownership. Sources remain discoverable even when they have no current assets.

### Decision 5: Duplicate ingestion prevention

Within one catalog, deterministic entity references and explicit ingestion
ownership prevent ambiguous source assignment. The new provenance link is not
a deduplication or ownership override mechanism.

1. **Entity identity:** `(kind, namespace, name)` identifies one catalog entity.
   Matching identity does not mean metadata from independent owners is merged.
   Different configured sources that must coexist need non-colliding identities;
   exact mapping/migration decisions remain with the adoption profiles.
2. **Provider mutation scope:** A full mutation replaces the entity set owned by
   that provider identity, potentially spanning several logical sources. A
   `locationKey` is not a source-specific full-mutation bucket. A multi-source
   provider must not submit one source's subset as the provider's complete set.
3. **Conflict protection:** `locationKey` is Backstage's conflict-resolution key
   for the same entity reference. If an existing entity has a key, an incoming
   definition must have the same key to replace it. Different keys do not permit
   two definitions of the same entity reference to coexist or merge. Sharing a
   key alone does not define safe multi-writer coordination.
4. **Source-record ownership:** Each logical source Location has a designated
   ingestion owner. Equal URLs or equal correlation strings do not grant a
   second provider ownership. Transfers and safe reconciliation remain with
   RHIDP-18848 and the adoption profiles.

These constraints are grounded in Backstage's
[provider mutation and location-key contracts](https://backstage.io/docs/features/software-catalog/external-integrations/entity-providers/).
Source correlation must preserve them, not infer ownership from a provenance
annotation. Separate backend installations with independent catalogs do not
share this catalog identity/ownership state.

### Decision 6: Precedence for overlapping metadata representations

When metadata appears in multiple places (annotation, `spec` field, kind
name), precedence rules resolve conflicts:

1. **Category:** `rhdh.io/ai-asset-category` expresses semantic classification;
   native kind/`spec.type` retains its structural meaning. Known provider mappings
   supply both. This does not decide frontend query/filter precedence or add
   cross-field validation for manually authored conflicts.
2. **Version:** `rhdh.io/ai-asset-version` carries the common version metadata.
   Native versions keep their source-specific meanings. Scheme, normalization,
   original-value preservation, and comparison are RHIDP-18845's responsibility;
   this story does not prescribe display/sorting behavior.
3. **Source:** `rhdh.io/ai-asset-source` resolves to the configured logical
   source's Location, whose `rhdh.io/ai-source-ref` matches that canonical
   reference. Management annotations retain Backstage processing/origin meanings
   and cannot substitute for or override this source correlation.

For illustration, manually authored `AiResource` / `skill` with category `agent`
is inconsistent with the documented skill mapping. Current SDK validation
accepts the recognized category and does not diagnose that disagreement; the
current kind/type browse filter sees the skill representation. This is evidence
of distinct representations, not a proposed conflict-resolution feature.
Do not claim that current consumers switch to the annotation in this case.

### Decision 7: Frontend feedback status

> **Status: Pending.** Frontend stakeholder review of the annotation baseline
> has not been completed.

The annotation baseline and known kind/`spec.type` mappings are the working
baseline. The maintainer has accepted this source contract; frontend filtering
and presentation are not stakeholder-approved by that acceptance.

| Frontend review question                                                                       | Provisional recommendation                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should browse classification/filtering use the semantic annotation, native kind/type, or both? | Preserve current kind/type behavior until frontend agreement. Review the annotation as an additional semantic input; do not change filtering in this story.                     |
| Should source Locations appear as AI assets?                                                   | Keep source Locations outside AI asset classification; use them as provenance records reachable through the source reference.                                                   |
| How should source provenance appear on an asset?                                               | Consider a link to the referenced source Location and a readable source title, with an optional safe service link; avoid provider-specific parsing of source-reference strings. |

These are review recommendations, not implemented UI requirements. Presentation
and filtering changes require frontend agreement and their own implementation
scope. No badge category is invented for Locations.

## Risks

### Risk 1: Location entity adoption complexity

**Likelihood:** Medium
**Impact:** Medium

No current provider emits Location entities. Adopting Decision 4 requires
changes to every provider's entity emission logic. The migration must be
coordinated across the Boost and ai-integrations workspaces.

**Mitigation:** Implementation can be staged through later adoption profiles;
Location emission is mandatory for providers claiming conformance to this target
contract. Existing management annotations alone do not establish conformance.
Verify targetless Location processing and required management annotations during
adoption; no custom target-reader implementation is prescribed.

### Risk 2: Source annotation format divergence

**Likelihood:** Medium
**Impact:** Low

Current providers use different source annotation formats (bare name vs.
type/instance). Moving to canonical Location entity references requires provider changes and
may break existing conditional policies that match current values.

**Mitigation:** The contract separates observed legacy values from the new
source-reference format. Migration guidance will be part of the provider adoption profiles
(RHIDP-18849/RHIDP-18850).

### Risk 3: Frontend filtering dependency on spec.type

**Likelihood:** Low
**Impact:** Medium

The current browse view filters by `spec.type` via `buildAiAssetCatalogFilter()`,
not by the `rhdh.io/ai-asset-category` annotation. If the annotation and
`spec.type` disagree, users see inconsistent results.

**Mitigation:** State current kind/type filtering accurately and preserve the
known provider mappings. Frontend review (Decision 7) will determine whether
annotation-based filtering is appropriate; this story does not settle or
implement that behavior.
