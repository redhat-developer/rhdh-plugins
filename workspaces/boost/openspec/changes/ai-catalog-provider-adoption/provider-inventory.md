# Provider inventory — RHIDP-18843

**Status: Accepted inventory planning, ported for PR review.** The maintainer accepted the proposed adoption
cohort and selected OGX model smoke followed by an OCI skills validation pilot
on 2026-11-12. OCI remains outside the 2.2 shipping cohort. This inventory records
current code, not a future SDK contract or a claim that the story is done.
On 2026-11-13, grill-me Q3 accepted the explicit external source-evidence limits
below for inventory purposes, with verification gates on later adoption profiles.

Initial inspection: repository revision
`719a89f8061b0ee7f232451e47629d5ef60eea6e`, 2026-11-12. Revalidated against
PR #5565's source baseline `8af3d2f4e0dbbf57b8425c688a02551f82289c4a` on
2026-11-13: all five provider implementations and the KServe/OCI source-service
implementations are unchanged. NPX adds logging, documentation, and integration
tests without changing the consumed snapshot protocol. Package coordinates below
are from that newer baseline. Both workspaces declare Backstage `1.54.6` in
`backstage.json`; this is not verification of RHDH 2.2 runtime or incremental
package compatibility.

## Evidence boundaries

- **Observed:** behavior implemented in active local source, including requests,
  response handling, mutation submission, and persistence.
- **Not verified:** a configured deployment's API behavior or broader upstream
  capabilities not established by this inspection. Absence of a local cursor
  loop does not prove that a source lacks pagination or change feeds.
- **Proposed:** cohort, pilot, or rollout recommendations awaiting maintainer
  review and the later metadata/SDK and ingestion contracts.

The scope is active provider registration and its source clients. Archived
plugins, commented-out builders, processors, dev hosts, and pure mapping
libraries are not additional catalog entity providers.

## Registered catalog entity providers

There are five local provider classes across the two workspaces. Configuration
can create multiple instances of some classes; this table counts classes rather
than deployment instances.

### Boost `OgxModelEntityProvider`

| Field                        | Current implementation                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Package                      | `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider` **1.2.2** ([manifest](../../../plugins/ogx-entity-provider/package.json)) |
| Registration / configuration | Module `ogx-entity-provider`; one `ai-catalog.entityProviders.ogx` configuration                                                        |
| Output                       | One `AiModelServerAPI`, `spec.type: ai-model-server`, aggregating available model IDs                                                   |
| Mutation / state             | Full mutation; one in-memory last-good entity; no durable checkpoint                                                                    |

### Boost `OgxAgentEntityProvider`

| Field                        | Current implementation                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Package                      | `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider` **1.2.2** ([manifest](../../../plugins/ogx-entity-provider/package.json)) |
| Registration / configuration | Same module/configuration; agents supplied by startup configuration                                                                     |
| Output                       | `AiResource`, `spec.type: agent`, per configured agent                                                                                  |
| Mutation / state             | Full mutation; startup config, no durable checkpoint                                                                                    |

### ai-integrations `ModelCatalogResourceEntityProvider`

| Field                        | Current implementation                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package                      | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog` **1.2.0** ([manifest](../../../../ai-integrations/plugins/catalog-backend-module-model-catalog/package.json)) |
| Registration / configuration | Module `catalog-backend-module-model-catalog`; keyed `catalog.providers.modelCatalog` entries                                                                                                |
| Output                       | `AiModelServerAPI`, `spec.type: ai-model-server`                                                                                                                                             |
| Mutation / state             | Full mutation; no durable last-good set or checkpoint                                                                                                                                        |

### ai-integrations `McpRegistryEntityProvider`

| Field                        | Current implementation                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package                      | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider` **0.3.0** ([manifest](../../../../ai-integrations/plugins/catalog-backend-module-mcp-registry-provider/package.json)) |
| Registration / configuration | Module `mcp-registry-provider`; reserved `catalog.providers.mcpRegistry.mcpRegistry` entry                                                                                                                   |
| Output                       | `API`, `spec.type: mcp-server`, with `spec.remotes`                                                                                                                                                          |
| Mutation / state             | Full mutation after enumeration; in-memory cursor, pending records, and last-good index                                                                                                                      |

### ai-integrations `SkillsCatalogProvider`

| Field                        | Current implementation                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package                      | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider` **1.1.0** ([manifest](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/package.json)) |
| Registration / configuration | Module `catalog-backend-module-skills-catalog-provider`; keyed `catalog.providers.skillsCatalogProvider` entries                                                                                                 |
| Output                       | `AiResource`, `spec.type: skill`                                                                                                                                                                                 |
| Mutation / state             | Source-scoped delta mutations; durable ownership, pending mutations, and OCI acknowledgments                                                                                                                     |

Registration evidence:
[OGX module](../../../plugins/ogx-entity-provider/src/module.ts),
[model-catalog module](../../../../ai-integrations/plugins/catalog-backend-module-model-catalog/src/module.ts),
[MCP module](../../../../ai-integrations/plugins/catalog-backend-module-mcp-registry-provider/src/module.ts),
[skills module](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/module.ts).

No inspected provider currently registers through Backstage's incremental
ingestion module. Existing full mutations and the skills provider's delta
reconciliation must not be relabeled as that lifecycle.

## Source services and support packages

| Component                                                            | Actual role                                                                                                                         | Boundary to preserve                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `kserve-kubeflow-connector-backend`                                  | Backend plugin `kserve-kubeflow-connector`; Kubernetes informers and enrichment produce intermediate ModelCatalog data              | Model-catalog provider consumes its HTTP bridge. The backend does not submit catalog mutations. |
| `skill-image-connector-backend`                                      | Backend plugin `skill-image-connector`; acquires OCI artifacts, verifies content, serves normalized snapshots and retained Markdown | SkillsCatalogProvider owns catalog mutation and acknowledges eligible OCI content retention.    |
| `npx-skill-connector-backend`                                        | Backend plugin `npx-skill-connector`; discovers/verifies skill artifacts and serves snapshots                                       | Another source for the same skills provider, not another EntityProvider class.                  |
| `catalog-mcp-registry-server-mapping`                                | Pure MCP-to-entity mapping library                                                                                                  | No provider registration or scheduling ownership.                                               |
| `ai-skills-common`                                                   | Shared normalized record/snapshot and identity helpers                                                                              | No source acquisition or provider registration.                                                 |
| `catalog-model-ai-model-server` and catalog entity processor modules | Entity models and validation/processor integration                                                                                  | A schema/processor module is not an ingestion provider.                                         |

Evidence:
[KServe plugin](../../../../ai-integrations/plugins/kserve-kubeflow-connector-backend/src/plugin.ts),
[OCI plugin](../../../../ai-integrations/plugins/skill-image-connector-backend/src/plugin.ts),
[NPX plugin](../../../../ai-integrations/plugins/npx-skill-connector-backend/src/plugin.ts),
[MCP mapper](../../../../ai-integrations/plugins/catalog-mcp-registry-server-mapping/src/mapServerToEntity.ts),
[skills helpers](../../../../ai-integrations/plugins/ai-skills-common/src/catalog-helpers.ts).

### Source-service and SDK package coordinates

These are observed versions, not selected versions for future adoption.

| Component                                                                                                   | npm package                                                                 | Observed version |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| [KServe source service](../../../../ai-integrations/plugins/kserve-kubeflow-connector-backend/package.json) | `@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend` | 0.4.0            |
| [OCI source service](../../../../ai-integrations/plugins/skill-image-connector-backend/package.json)        | `@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend`     | 0.10.0           |
| [NPX source service](../../../../ai-integrations/plugins/npx-skill-connector-backend/package.json)          | `@red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend`       | 0.4.1            |
| [Shared SDK library](../../../plugins/ai-catalog-entity-provider-sdk/package.json)                          | `@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk`    | 2.0.0            |

## Identity, ownership, and metadata

`spec.owner`, mutation `locationKey`, management/source annotations, and a catalog
`Location` entity are distinct. None of the five active mappers below emits a
catalog Location entity. Commented-out model-catalog Location builders do not
establish runtime behavior.

| Provider       | Entity identity inputs                                                                                                                    | Mutation ownership                                                                                                             | Current metadata/version behavior                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OGX model      | Fixed name `ogx-model-server`; namespace omitted; URL/model IDs/version do not distinguish identity                                       | Provider name and `locationKey`: `ogx-model-entity-provider`                                                                   | Category `model-server`, source literal `ogx`; SDK version normalizer. Internal `serverVersion` is not read by the module config reader, so normal registration falls back to unknown.                                       |
| OGX agent      | Sanitized/truncated `ogx-agent-<agent.id>`; namespace omitted; no source-instance/version component                                       | Provider name and `locationKey`: `ogx-agent-entity-provider`                                                                   | Category `agent`, source literal `ogx`; configured `agent.version` normalized by SDK; model/tools/handoffs and optional RAG data in spec.                                                                                    |
| Model-catalog  | `modelServer.name` with whitespace removed; namespace omitted; no instance/cluster/version prefix                                         | Provider name and `locationKey`: `ModelCatalogResourceEntityProvider:<config.id>`                                              | Copies source API/server annotations, removes mapper-control annotations; maps owner/lifecycle/server/model fields and TechDocs links. No guaranteed generation of all three 1507 annotations or a normalized asset version. |
| MCP registry   | Prefix + raw server name + raw version, sanitized and shortened with a hash when needed; namespace omitted                                | Provider name and `locationKey`: `mcp-registry-provider`                                                                       | Preserves raw name/version and eligible fields as `modelcontextprotocol.io/*`; native/source links and provenance annotations; does not generate the three SDK annotations. Version participates in identity.                |
| Skills catalog | Namespace from config; `skill-` + first 56 SHA-256 hex characters of JSON `[source.type, source.id, record.key]`; digest/version excluded | Provider name `SkillsCatalogProvider:<configId>`; `locationKey` = `skills-catalog-provider:<configId>:<sourceType>:<sourceId>` | All three AI annotations; source `<sourceType>/<sourceId>`; valid declared SemVer with one leading `v` removed, otherwise `0.0.0+<12 digest hex>`. OCI/NPX references preserve source/digest evidence.                       |

Identity and mapping evidence:
[OGX helpers](../../../plugins/ogx-entity-provider/src/providers/entityHelpers.ts),
[OGX model](../../../plugins/ogx-entity-provider/src/providers/OgxModelEntityProvider.ts),
[OGX agent](../../../plugins/ogx-entity-provider/src/providers/OgxAgentEntityProvider.ts),
[model generator](../../../../ai-integrations/plugins/catalog-backend-module-model-catalog/src/clients/ModelCatalogGenerator.ts),
[model provider](../../../../ai-integrations/plugins/catalog-backend-module-model-catalog/src/providers/ModelCatalogResourceEntityProvider.ts),
[MCP identity](../../../../ai-integrations/plugins/catalog-mcp-registry-server-mapping/src/identity.ts),
[skills identity/version](../../../../ai-integrations/plugins/ai-skills-common/src/catalog-helpers.ts),
[skills mapper](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/snapshot-consumer.ts).

Important ownership differences:

- OGX management annotations use synthetic `<providerId>:<entityName>` values,
  whereas its mutation locationKey is just the fixed provider ID. Agent name
  sanitization/truncation can collapse distinct IDs; no collision detector is
  present in the mapper.
- MCP's management annotations use `url:<registryBaseUrl>`; this is not its
  mutation ownership key. Its identity helper hashes the unsanitized
  prefix/name/version tuple when sanitization or truncation requires it.
- Model-catalog identity can collide across configured instances that emit the
  same whitespace-stripped name. Its provider/config ID is also used as the
  discovery and service-auth target.
- Skills provider configuration ID scopes ownership and durable state, while
  source identity/native key determine entity names. Renaming either is a
  migration decision. Namespace changes use persisted full entity references;
  partial snapshots retain old references until safe reconciliation.

## Source enumeration and change evidence

| Source path              | What current code actually consumes                                                                                          | Completeness / capability limit                                                                                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OGX models               | One GET `<baseUrl>/v1/models`; accepts a direct array or `data` array                                                        | No local paging, conditional fetch, source cursor, or deletion feed. Broader OGX API capabilities remain unverified.                                                                                                       |
| OGX agents               | Startup configuration's `agents` array                                                                                       | No remote enumeration/change feed. Scheduled runs do not establish live admin-config reload.                                                                                                                               |
| ModelCatalog bridge      | Service discovery for config ID; GET `/list`, then `/models/<key>` for each returned key                                     | No pagination/change token in the consumed bridge protocol. The route's second key segment is not necessarily a model version.                                                                                             |
| KServe backend           | Kubernetes informer list/watch for InferenceService and LLMInferenceService; `resourceVersion` used in source reconciliation | Watch state is upstream source-service behavior, not an entity-provider cursor or asset version. Source maps are in-memory. Kubeflow catalog requests enrich model README data rather than bulk-enumerating that registry. |
| MCP Registry             | GET `/<apiVersion>/servers` with optional `cursor`, `limit`, `version=latest`; consumes `metadata.nextCursor`                | Native pagination is implemented locally. Page/entry limits and restart semantics matter. No `updated_since`/deletion feed consumed; available guarantees for each target registry still need verification.                |
| Skills provider snapshot | One authenticated GET `/skills/<sourceId>` per source; normalized v1 snapshot with status and stable keys                    | Consumer does not page this response. Snapshots are bounded to 1,000 records / 5 MiB and become partial when truncated. No source watermark or ETag consumed.                                                              |
| OCI connector discovery  | Quay repository/tag pagination; artifact acquisition pinned to verified manifest digest                                      | Discovery completeness produces ready/partial status, not proof of a registry-wide immutable snapshot. OCI observation revision, artifact digest, and source-page cursor are different concepts.                           |
| NPX connector discovery  | Agent Skills discovery v0.2 index with optional `next`; bounded page/candidate traversal and artifact digest verification    | Connector-side paging feeds a single bounded snapshot. No provider-consumed source delta feed or durable NPX snapshot state.                                                                                               |

Source-client evidence:
[OGX model fetch](../../../plugins/ogx-entity-provider/src/providers/OgxModelEntityProvider.ts),
[bridge client](../../../../ai-integrations/plugins/catalog-backend-module-model-catalog/src/clients/BridgeResourceConnector.ts),
[KServe informer](../../../../ai-integrations/plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts),
[MCP client](../../../../ai-integrations/plugins/catalog-backend-module-mcp-registry-provider/src/client.ts),
[MCP protocol notes](../../../../ai-integrations/docs/using-official-mcp-registries.md),
[snapshot bounds](../../../../ai-integrations/plugins/ai-skills-common/src/snapshot.ts),
[Quay discovery](../../../../ai-integrations/plugins/skill-image-connector-backend/src/services/QuayDiscovery.ts),
[NPX discovery](../../../../ai-integrations/plugins/npx-skill-connector-backend/src/services/discoverIndex.ts).

## Failure, restart, and deletion behavior

These are observed constraints to carry into RHIDP-18846/18848 and provider
profiles, not fixes implemented by this story.

| Provider       | Current behavior / migration constraint                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OGX model      | Same-process fetch failure can reuse the cached entity. A failure before any successful fetch after restart submits a full empty set. Unexpected response shape also becomes empty input. Durable last-good preservation is not established.                                                                                                                             |
| OGX agent      | An absent/empty configured agent set submits a full empty mutation. No source cursor or durable scan state exists. Preserve the distinction between deliberate configuration removal and failed source enumeration.                                                                                                                                                      |
| Model-catalog  | Per-key fetch failure aborts before mutation. A null/undefined list becomes an empty full set; list 404 returns without mutation. Unmappable entries omitted from an otherwise completed full mutation can be pruned. No durable last-good set exists.                                                                                                                   |
| MCP registry   | Reaches page limit: buffers cursor/entries across scheduler ticks without mutation. Exhausted traversal: full mutation. Entry-cap soft-stop publishes a bounded set and retains previously known out-of-window entries as degraded. Mapping failures can preserve matching last-good records. Those safeguards and paging buffers are in-memory and are lost on restart. |
| Skills catalog | Ready snapshots permit source-owned removal, including ready-empty. Partial upserts successes and preserves absences; loading/failed preserve existing ownership. Pending deltas are persisted before mutation and replayed before newer observations. OCI acknowledgments also survive restart and wait for processed catalog visibility before content release.        |

Evidence:
[MCP provider](../../../../ai-integrations/plugins/catalog-backend-module-mcp-registry-provider/src/McpRegistryEntityProvider.ts),
[skills provider](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/SkillsCatalogProvider.ts),
[skills planner](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/reconciliation-planner.ts),
[skills durable store](../../../../ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/reconciliation-store.ts),
[OCI content store](../../../../ai-integrations/plugins/skill-image-connector-backend/src/services/ContentStore.ts).

The skills reference has an additional retention protocol: OCI supplies durable
observation revisions; the catalog consumer records pending acknowledgments,
verifies expected TechDocs visibility/removals, and POSTs
`/skilldocs/<sourceId>/reconcile`. Cleanup protects acknowledged and currently
published digests. This must be accounted for before replacing its reconciliation
with shared ingestion machinery. It is not a generic SDK requirement yet.

Other source-service constraints worth retaining:

- KServe's bridge key is sanitized namespace/name with no resource-kind or
  cluster component. Its fallback listing failures can appear as empty input
  during cleanup. Both affect interpretation of consumer-visible absence.
- Skills upsert detection compares artifact digest and TechDocs URL; unchanged
  digest alone does not guarantee owner/lifecycle/title changes are propagated.
- Removing a skills source from configuration is not a ready-empty observation;
  automatic catalog/content cleanup on config removal is not established.

## Current SDK use and ownership constraints

- OGX imports the active SDK's annotation constants and version normalizer. It
  does not adopt the restored SDK provider interface, validator, DeltaSyncManager,
  or durable cursor storage. The other three provider classes use ordinary
  Backstage EntityProvider APIs and their own mapping/reconciliation contracts.
- SDK `clearCursor()` deletes state only. The shipped concrete cursor store is
  in-memory. Neither establishes restart recovery or a Backstage incremental
  ingestion lifecycle for these providers.
- Follow [ai-integrations conventions](../../../../ai-integrations/AGENTS.md)
  and [CODEOWNERS](../../../../../.github/CODEOWNERS). Entity models/processors
  tracking upstream changes must preserve the cited upstream naming/API
  conventions unless coordinated with their owners.
- The local model-server package records parity with upstream PR #34476 in its
  [changelog](../../../../ai-integrations/plugins/catalog-model-ai-model-server/CHANGELOG.md).
  This inventory does not verify that PR's current status or authorize a local
  schema fork. Use `AiModelServerAPI` as the current model-server kind; upstream
  adoption and migration remain explicit later work.

### Current SDK export reference

The [SDK entry point](../../../plugins/ai-catalog-entity-provider-sdk/src/index.ts)
exports the following groups. This is an inventory of the existing surface, not
selection of the future shared contracts or an adoption requirement.

| Group                     | Exports / boundary                                                                                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metadata                  | `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_CATEGORIES`, and `AIAssetCategory`. Existing `rule` compatibility does not add a minimum feature category.           |
| Normalization             | `normalizeAIAssetVersion`; OGX uses it today.                                                                                                                                                                               |
| Validation                | `validateAIAssetEntity` and `AIAssetValidator`; current OGX imports do not establish adoption of these validators.                                                                                                          |
| Provider contracts        | `AIAssetEntityProvider` and `DeltaResult` types; not implemented by the inventoried providers as a shared contract today.                                                                                                   |
| Delta / cursor primitives | `DeltaSyncManager`, `InMemoryCursorStore`, `CursorStore`, `CursorState`, `ApplyDeltaOptions`, `DeltaSyncManagerOptions`. These do not supply a Backstage incremental ingestion lifecycle or a durable store implementation. |

## Initial shipping cohort and pilot reference inputs

This table distinguishes current release commitments and pilot/reference use.
It does not limit the eventual adoption/conformance goal: all catalog entity
providers in both workspaces must be covered.

| Cohort                        | Components                                                                   | Agreed treatment                                                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RHDH 2.2 adoption cohort      | OGX model, OGX agent, model-catalog, MCP-registry                            | Adopt the accepted shared contracts for these current catalog providers. Final scope and acceptance depend on the accepted metadata/SDK and ingestion contracts and feature-owner coordination.                              |
| Source-service coordination   | KServe/Kubeflow connector                                                    | Only source-protocol changes required by its catalog consumer; do not convert the service into an EntityProvider.                                                                                                            |
| Reference-only / experimental | SkillsCatalogProvider, OCI connector, NPX connector, skills helper contracts | OCI skills is the selected nonshipping validation pilot; NPX remains reference-only. Preserve identity/recovery/retention evidence without creating a 2.2 OCI delivery commitment or selecting a supported registry product. |
| Excluded                      | Archived provider/chat packages and abandoned graph/bundle contracts         | No resurrection through this inventory.                                                                                                                                                                                      |

The maintainer accepted this cohort in grill-me Q1 on 2026-11-12. This is adoption
planning scope, not evidence of completed migration, downstream runtime
qualification, or approval of the still-pending shared contracts.

## Pilot evidence and maintainer selection

| Candidate                     | What it can demonstrate                                                                                                                   | What it cannot establish alone                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| OGX model                     | Small full-response source, existing SDK metadata, aggregate model-server identity; low source complexity for a first adoption smoke path | Native multi-page burst/resume behavior, per-record mapping isolation across many entities, or durable source-feed recovery           |
| OGX agent                     | Configuration-backed multi-entity mapping, identity collisions, deliberate configuration deletion                                         | Remote registry pagination or remote outage behavior                                                                                  |
| MCP registry                  | Actual cursor paging, multiple version identities, bounded scans, malformed entries and restart/deletion risks                            | Every upstream registry's change-feed/atomicity guarantees, or correctness of final Backstage adapter design before RHIDP-18846/18848 |
| Model-catalog + KServe source | Catalog/source-service separation, watch-fed bridge, multiple backend identities                                                          | A generic source-page cursor: resourceVersion and bridge keys serve different roles                                                   |
| Skills references             | Durable delta replay, partial/ready deletion rules and OCI visibility/retention acknowledgments                                           | Inclusion in 2.2 or proof that replacing that machinery is safe                                                                       |

The maintainer selected **OGX model smoke → OCI skills pilot → MCP-registry
validation later**, followed by **eventual adoption/conformance coverage of all
entity providers across Boost and ai-integrations**. Familiarity with the OCI
implementation and its native discovery paging informed the pilot choice.
MCP is the later validation exercise, not the pilot immediately after OGX.

Eventual coverage includes all five currently inventoried provider classes,
including SkillsCatalogProvider, and must be refreshed for additional providers
discovered in either workspace. No provider is permanently excluded because it
was not selected as the pilot. OCI pilot participation does not make its sources
a 2.2 shipping commitment; NPX remains a reference input for this stage.

OCI discovery paging currently occurs inside the connector; the catalog provider
consumes one bounded snapshot. The pilot must make its shared-ingestion paging
verification boundary explicit in RHIDP-18846/18850 while preserving durable
recovery and content-retention safeguards. Selecting this pilot does not qualify
the current snapshot consumer as already incremental or add OCI to 2.2 delivery.
See [design D4](design.md#d4-validate-ogx-first-oci-skills-second-and-mcp-later).

## Source-evidence dispositions

**Accepted by the maintainer in grill-me Q3, 2026-11-13.** These dispositions
close the inventory's evidence-acceptance decision, not the external verification
itself. Local observations use the inspected revision above and the linked
[source-client evidence](#source-enumeration-and-change-evidence). No deployed
source version or independently verified upstream contract is asserted here.

| Source / exact claim not established                                                                         | Evidence and current limit                                                                                                              | Inventory disposition and owning follow-up                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OGX models: complete `/v1/models` enumeration and broader paging/change capabilities                         | Observed single-request client; external guarantees unverified                                                                          | Accepted inventory limitation. RHIDP-18849 must verify guarantees relied on by the OGX profile or define an accepted safe limitation.                                                                                    |
| OGX agents: remote enumeration or a live configuration-change feed                                           | Observed startup-config array; no such external capability relied on                                                                    | Configuration-backed inventory entry, not a claim of remote support. RHIDP-18849 owns any later change to that source boundary.                                                                                          |
| Model-catalog/KServe: completeness and recovery across informer state and HTTP bridge                        | Observed list/watch use, in-memory source maps, and `/list` plus per-key fetches; end-to-end source guarantees unverified               | Accepted inventory limitation. RHIDP-18850 must verify relied-on guarantees or define an accepted safe limitation, coordinating lifecycle/safety with RHIDP-18846/RHIDP-18848.                                           |
| MCP registry: target registry paging consistency, concurrent-change behavior, and deletion guarantees        | Observed cursor consumption and local scan limits; selected deployment/version guarantees unverified                                    | Accepted inventory limitation. RHIDP-18850 must verify relied-on guarantees or define an accepted safe limitation with RHIDP-18846/RHIDP-18848 before profile acceptance.                                                |
| OCI skills: consistent complete enumeration across discovery pages and shared-ingestion paging qualification | Observed native Quay paging and one bounded catalog snapshot; cross-page source consistency and future adapter qualification unverified | Accepted inventory limitation. RHIDP-18846/RHIDP-18850 define the paging boundary; RHIDP-18850 verifies relied-on source guarantees or defines an accepted safe limitation. RHIDP-18848 owns recovery/deletion outcomes. |
| NPX skills: broader source guarantees beyond the consumed index/snapshot protocol                            | Observed connector `next` traversal and bounded snapshot; no broader guarantee claimed                                                  | Reference-only input for this stage. RHIDP-18850 must resolve any additional guarantee before a later NPX adoption profile relies on it.                                                                                 |

No later adoption profile may be accepted while relying on an unverified
guarantee: obtain supporting contract/deployment evidence or define an accepted
safe limitation first. None of these dispositions approves observed unsafe
failure/deletion behavior or establishes runtime migration readiness.

## Provider coverage and profile handoff

All five providers below remain in eventual adoption/conformance coverage.
The shared metadata/version, lifecycle, SDK, and safety contracts from
RHIDP-18844 through RHIDP-18848 are prerequisites for final profile acceptance,
not prerequisites for completing this inventory. Source verification gates above
also apply. This is assignment to existing stories, not creation of coding work.

| Provider                           | Initial scope / validation role                                                                            | Identity and state constraints to carry forward                                                                 | Source-evidence limit                                                                       | Profile owner                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| OgxModelEntityProvider             | Initial 2.2 cohort; first smoke path                                                                       | Fixed aggregate identity/ownership; in-memory last-good entity; restart-empty risk                              | OGX models disposition above; smoke does not qualify multi-page recovery                    | RHIDP-18849                                                                       |
| OgxAgentEntityProvider             | Initial 2.2 cohort; remaining-provider coverage after smoke/pilot/MCP                                      | Sanitized config IDs can collide; startup-config enumeration; deliberate-removal distinction                    | Config-backed source; remote/change-feed support not inferred                               | RHIDP-18849                                                                       |
| ModelCatalogResourceEntityProvider | Initial 2.2 cohort; remaining-provider coverage, with KServe source-service coordination                   | Cross-instance name collisions; no durable last-good set; bridge/source state and absence semantics             | KServe/bridge disposition above                                                             | RHIDP-18850                                                                       |
| McpRegistryEntityProvider          | Initial 2.2 cohort; validation after OCI pilot                                                             | Versioned identity; fixed provider ownership; in-memory scan/recovery buffers and entry limits                  | MCP disposition above; target-source guarantees need follow-up                              | RHIDP-18850                                                                       |
| SkillsCatalogProvider              | Eventual adoption/conformance; selected OCI pilot outside initial 2.2 shipping cohort; NPX reference input | Source/key identity; namespace migration; durable replay/ownership; OCI visibility and retention acknowledgment | OCI/NPX dispositions above; native discovery paging is not catalog/SDK paging qualification | RHIDP-18850, coordinating OCI paging with RHIDP-18846 and safety with RHIDP-18848 |

**Model-catalog bridge follow-up (RHIDP-18850):** verify the bridge response
shape and field semantics against the consumed `@redhat-ai-dev/model-catalog-types`
contract before specifying provider adaptation. Review the linked bridge client
and ModelCatalogGenerator, including annotation projection, identity, ownership,
and model-server fields. Coordinate metadata/version decisions with
RHIDP-18844/RHIDP-18845; this is a profile prerequisite, not a decision to replace
the bridge format or to adopt particular SDK APIs now.

Profiles must reconcile any newly discovered provider and any source changes
since the inspected revision. Neither initial shipping exclusion nor lack of a
pilot role permanently excludes a provider. Detailed API, upgrade, rollback,
runtime compatibility, and implementation-task decisions remain with later
stories.

## Evidence gaps and downstream handoff

| Item                                                                     | Closure evidence / owning work                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Adoption cohort and pilot                                                | Q1 cohort and Q2 OGX smoke/OCI pilot accepted; source-evidence limitations remain explicit                                                                         |
| Upstream/deployed source guarantees beyond the inspected clients         | Q3 accepted inventory limitations above; RHIDP-18849/RHIDP-18850 must obtain evidence or define accepted safe limitations before profiles rely on those guarantees |
| Annotation/Location correlation and identity rules                       | RHIDP-18844, then provider profiles; no new annotation or Location contract selected here                                                                          |
| Version schemes and comparisons                                          | RHIDP-18845; preserve differences between source versions, asset identities, digests, and observation revisions                                                    |
| Backstage incremental API/runtime compatibility and responsibility split | RHIDP-18846 against the target release; this inventory does not select package versions                                                                            |
| Shared/per-kind SDK and conformance                                      | RHIDP-18847, consuming metadata and lifecycle decisions                                                                                                            |
| Failed scans, safe removal, restart/ownership transfer                   | RHIDP-18848; provider observations above are concrete cases to cover                                                                                               |
| Concrete migration and rollout profiles                                  | RHIDP-18849 for OGX, RHIDP-18850 for ai-integrations; preserve upstream ownership and reference-only scope                                                         |

No coding stories, final implementation task mapping, source modifications,
runtime qualification, or architect/stakeholder approvals are delivered by this
initial inventory draft.
