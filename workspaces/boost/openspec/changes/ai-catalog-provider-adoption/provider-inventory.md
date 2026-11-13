# Provider Inventory

> **Baseline revision:** `8af3d2f` (2026-11-13).
> This inventory covers entity providers and source connector services
> across the Boost and ai-integrations workspaces. Evidence is cited
> from source code at the baseline revision unless noted otherwise.

## Terminology

- **Entity provider** — a Backstage `EntityProvider` implementation
  registered via `catalogProcessingExtensionPoint` that emits catalog
  entities through `applyMutation`.
- **Source connector service** — a backend plugin that fetches and
  normalizes upstream data. Connectors do not emit catalog entities
  directly; they expose HTTP endpoints that entity providers consume.
- **Mutation mode** — `full` replaces the entire entity set per
  `locationKey`; `delta` adds/removes individual entities without
  pruning the others.

---

## 1. Boost workspace providers

### 1.1 OGX Model Entity Provider

| Field                   | Value                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**             | `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider` v1.2.2                                                                                                                                 |
| **Source**              | `workspaces/boost/plugins/ogx-entity-provider/src/providers/OgxModelEntityProvider.ts`                                                                                                               |
| **Class**               | `OgxModelEntityProvider`                                                                                                                                                                             |
| **Registration**        | `catalogModuleOgxEntityProvider` (`createBackendModule({ pluginId: 'catalog', moduleId: 'ogx-entity-provider' })`) in `module.ts`                                                                    |
| **Entity kind**         | `AiModelServerAPI`                                                                                                                                                                                   |
| **spec.type**           | `ai-model-server`                                                                                                                                                                                    |
| **Entity identity**     | `(AiModelServerAPI, default, ogx-model-server)` — single entity per provider instance                                                                                                                |
| **Namespace**           | Implicit `default`                                                                                                                                                                                   |
| **locationKey**         | `ogx-model-entity-provider` (constant `PROVIDER_ID`)                                                                                                                                                 |
| **Annotations**         | `backstage.io/managed-by-location`, `backstage.io/managed-by-origin-location`, `rhdh.io/ai-asset-category: model-server`, `rhdh.io/ai-asset-source: ogx`, `rhdh.io/ai-asset-version`                 |
| **SDK use**             | Imports `AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `normalizeAIAssetVersion` from `ai-catalog-entity-provider-sdk`                                 |
| **Source service**      | Polls OGX `/v1/models` endpoint directly (no connector intermediary)                                                                                                                                 |
| **Source pagination**   | None — single GET returns all models in one response (`data` array)                                                                                                                                  |
| **Change feed**         | None — full poll on each refresh cycle                                                                                                                                                               |
| **Mutation mode**       | `full` — replaces entire entity set per `locationKey` on each run                                                                                                                                    |
| **Persistence/restart** | Stateless. Entity cached in memory (`cachedEntity`). On restart, first scheduled tick re-fetches from upstream                                                                                       |
| **Deletion risk**       | A fetch failure retains the last cached entity in memory and emits it on the next mutation. A restart after failure emits an empty full mutation, pruning the entity until the next successful fetch |
| **Refresh interval**    | Configurable via `modelRefreshIntervalSeconds` (default 60s)                                                                                                                                         |
| **Upstream ownership**  | OGX API — Red Hat / internal team                                                                                                                                                                    |

### 1.2 OGX Agent Entity Provider

| Field                   | Value                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**             | `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider` v1.2.2 (same package as model provider)                                                                         |
| **Source**              | `workspaces/boost/plugins/ogx-entity-provider/src/providers/OgxAgentEntityProvider.ts`                                                                                        |
| **Class**               | `OgxAgentEntityProvider`                                                                                                                                                      |
| **Registration**        | Same `catalogModuleOgxEntityProvider` module registers both model and agent providers                                                                                         |
| **Entity kind**         | `AiResource`                                                                                                                                                                  |
| **spec.type**           | `agent`                                                                                                                                                                       |
| **Entity identity**     | `(AiResource, default, ogx-agent-<agent.id>)` — one entity per configured agent                                                                                               |
| **Namespace**           | Implicit `default`                                                                                                                                                            |
| **locationKey**         | `ogx-agent-entity-provider` (constant `PROVIDER_ID`)                                                                                                                          |
| **Annotations**         | `backstage.io/managed-by-location`, `backstage.io/managed-by-origin-location`, `rhdh.io/ai-asset-category: agent`, `rhdh.io/ai-asset-source: ogx`, `rhdh.io/ai-asset-version` |
| **SDK use**             | Same SDK imports as the model provider                                                                                                                                        |
| **Source service**      | Reads from `app-config.yaml` (`ai-catalog.entityProviders.ogx.agents[]`) — no external API call                                                                               |
| **Source pagination**   | N/A — config-driven, not API-driven                                                                                                                                           |
| **Change feed**         | None — reads config once per scheduled tick                                                                                                                                   |
| **Mutation mode**       | `full` — replaces entire entity set per `locationKey` on each run                                                                                                             |
| **Persistence/restart** | Stateless. Re-reads config on every tick. No in-memory state beyond the connection                                                                                            |
| **Deletion risk**       | Removing an agent from config causes the next full mutation to prune its entity. This is the intended config-driven lifecycle                                                 |
| **Refresh interval**    | Configurable via `agentRefreshIntervalSeconds` (default 300s)                                                                                                                 |
| **Upstream ownership**  | Local YAML configuration; no external upstream                                                                                                                                |

### 1.3 AI Catalog Entity Provider SDK

| Field                 | Value                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Package**           | `@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk` v2.0.0                                                                                                                                                                                          |
| **Source**            | `workspaces/boost/plugins/ai-catalog-entity-provider-sdk/src/`                                                                                                                                                                                                           |
| **Role**              | `node-library` — shared SDK, not an entity provider itself                                                                                                                                                                                                               |
| **Exports**           | Annotation constants (`AI_ASSET_CATEGORY_ANNOTATION`, `AI_ASSET_VERSION_ANNOTATION`, `AI_ASSET_SOURCE_ANNOTATION`), `normalizeAIAssetVersion`, `validateAIAssetEntity`, `AIAssetValidator`, `DeltaSyncManager`, `InMemoryCursorStore`, `AIAssetEntityProvider` interface |
| **Annotation values** | `rhdh.io/ai-asset-category` (enum: `agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`), `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`                                                                                                            |
| **Delta sync**        | `DeltaSyncManager` wraps `applyMutation({ type: 'delta' })`. Ships `InMemoryCursorStore`; durable DB-backed store is the consumer's responsibility                                                                                                                       |
| **Consumers**         | OGX entity providers (Boost workspace). Not currently consumed by ai-integrations providers                                                                                                                                                                              |

---

## 2. ai-integrations workspace providers

### 2.1 ModelCatalogResourceEntityProvider

| Field                   | Value                                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**             | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog`                                                                                                                                                                                    |
| **Source**              | `workspaces/ai-integrations/plugins/catalog-backend-module-model-catalog/src/providers/ModelCatalogResourceEntityProvider.ts`                                                                                                                                     |
| **Class**               | `ModelCatalogResourceEntityProvider`                                                                                                                                                                                                                              |
| **Registration**        | `fromConfig()` factory method; `createBackendModule({ pluginId: 'catalog', moduleId: 'model-catalog-provider' })` in `module.ts`                                                                                                                                  |
| **Entity kind**         | `AiModelServerAPI`                                                                                                                                                                                                                                                |
| **spec.type**           | `ai-model-server`                                                                                                                                                                                                                                                 |
| **Entity identity**     | `(AiModelServerAPI, default, <sanitized-modelServer.name>)` — one entity per model server in the bridge catalog                                                                                                                                                   |
| **Namespace**           | Implicit `default`                                                                                                                                                                                                                                                |
| **locationKey**         | `ModelCatalogResourceEntityProvider:<config.id>`                                                                                                                                                                                                                  |
| **Annotations**         | `backstage.io/managed-by-location`, `backstage.io/managed-by-origin-location`, optional `backstage.io/techdocs-ref`, model server annotations projected from bridge                                                                                               |
| **SDK use**             | Does **not** use `ai-catalog-entity-provider-sdk`. Uses `@backstage/plugin-catalog-node`, `@backstage/catalog-model`, `@backstage/backend-plugin-api` directly. Entity generation delegated to `ModelCatalogGenerator` using `@redhat-ai-dev/model-catalog-types` |
| **Source service**      | Consumes the bridge connector via Backstage discovery (`discovery.getBaseUrl(this.name)`). Fetches catalog keys then catalog entries per key                                                                                                                      |
| **Source pagination**   | None explicit — fetches all keys, then all catalogs per key in parallel (`Promise.all`)                                                                                                                                                                           |
| **Change feed**         | None — full re-fetch on each schedule tick                                                                                                                                                                                                                        |
| **Mutation mode**       | `full` — replaces entire entity set per `locationKey` on each run                                                                                                                                                                                                 |
| **Persistence/restart** | Stateless. No caching. A 404 during startup is handled gracefully (connector not ready yet; scheduler retries)                                                                                                                                                    |
| **Deletion risk**       | An upstream model server removal causes the next full mutation to prune its entity. Fetch failures propagate as errors (no last-good retention)                                                                                                                   |
| **Refresh interval**    | Configurable via `schedule` in `catalog.providers.modelCatalog.<id>`                                                                                                                                                                                              |
| **Upstream ownership**  | KServe/Kubeflow model serving infrastructure via `kserve-kubeflow-connector-backend`                                                                                                                                                                              |

### 2.2 McpRegistryEntityProvider

| Field                   | Value                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**             | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider`                                                                                                                                                                                                                                                                              |
| **Source**              | `workspaces/ai-integrations/plugins/catalog-backend-module-mcp-registry-provider/src/McpRegistryEntityProvider.ts`                                                                                                                                                                                                                                                  |
| **Class**               | `McpRegistryEntityProvider`                                                                                                                                                                                                                                                                                                                                         |
| **Registration**        | `createBackendModule({ pluginId: 'catalog', moduleId: 'mcp-registry-provider' })` in `module.ts`                                                                                                                                                                                                                                                                    |
| **Entity kind**         | `API`                                                                                                                                                                                                                                                                                                                                                               |
| **spec.type**           | `mcp-server`                                                                                                                                                                                                                                                                                                                                                        |
| **Entity identity**     | `(API, default, <mapped-name>)` via `mapServerToEntity` from `catalog-mcp-registry-server-mapping` library                                                                                                                                                                                                                                                          |
| **Namespace**           | Implicit `default`                                                                                                                                                                                                                                                                                                                                                  |
| **locationKey**         | `mcp-registry-provider` (constant `PROVIDER_NAME`)                                                                                                                                                                                                                                                                                                                  |
| **Annotations**         | `backstage.io/managed-by-location` (set to `url:<baseUrl>`), `backstage.io/managed-by-origin-location`, `redhat.com/rhdh-mcp-registry-sync-status` (`ok` or `degraded`), `modelcontextprotocol.io/name`, `modelcontextprotocol.io/version`, plus projected annotations from server document                                                                         |
| **SDK use**             | Does **not** use `ai-catalog-entity-provider-sdk`. Uses `catalog-mcp-registry-server-mapping` for entity construction and annotation projection                                                                                                                                                                                                                     |
| **Source service**      | Polls an external MCP Registry REST API directly via `fetchRegistryServers` client                                                                                                                                                                                                                                                                                  |
| **Source pagination**   | Cursor-based pagination. Configurable `pageSize`, `pageLimit` (max pages per tick), and `maxEntries` (soft-stop cap). Multi-sync pagination: incomplete traversals buffer entries and resume from a saved cursor on the next tick                                                                                                                                   |
| **Change feed**         | None — traverses registry from start each full cycle (or from `resumeCursor` on continuation). No server-push change notification                                                                                                                                                                                                                                   |
| **Mutation mode**       | `full` — replaces entire entity set per `locationKey` after complete traversal. Partial traversals (stopped at `pageLimit`) emit no mutation until all pages are buffered                                                                                                                                                                                           |
| **Persistence/restart** | **In-memory only.** `lastGoodIndex`, `resumeCursor`, `pendingEntries`, `seenCursors`, `endCursor` are all in-memory Maps/arrays. Restart loses pagination state and last-good fallback data. The first post-restart sync starts a fresh traversal                                                                                                                   |
| **Deletion risk**       | Last-good retention (D6): mapping failures retain a `degraded` copy from `lastGoodIndex`. `maxEntries` soft-stop appends retained entities outside the window. However, a restart clears `lastGoodIndex`, so the first post-restart sync with mapping failures prunes those entities. A full traversal without `maxEntries` prunes servers absent from the registry |
| **Refresh interval**    | Configurable via `schedule` in provider config                                                                                                                                                                                                                                                                                                                      |
| **Upstream ownership**  | External MCP Registry — ownership varies per deployment                                                                                                                                                                                                                                                                                                             |

### 2.3 SkillsCatalogProvider

| Field                   | Value                                                                                                                                                                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**             | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider`                                                                                                                                                                                                 |
| **Source**              | `workspaces/ai-integrations/plugins/catalog-backend-module-skills-catalog-provider/src/SkillsCatalogProvider.ts`                                                                                                                                                                         |
| **Class**               | `SkillsCatalogProvider`                                                                                                                                                                                                                                                                  |
| **Registration**        | `createBackendModule({ pluginId: 'catalog', moduleId: 'skills-catalog-provider' })` in `module.ts`                                                                                                                                                                                       |
| **Entity kind**         | `AiResource`                                                                                                                                                                                                                                                                             |
| **spec.type**           | `skill`                                                                                                                                                                                                                                                                                  |
| **Entity identity**     | `(AiResource, <config.namespace>, <mapped-catalog-name>)` per source consumer config                                                                                                                                                                                                     |
| **Namespace**           | Configurable via `config.namespace`                                                                                                                                                                                                                                                      |
| **locationKey**         | `skills-catalog-provider:<config.id>:<sourceType>:<sourceId>` — scoped per source                                                                                                                                                                                                        |
| **Annotations**         | `backstage.io/techdocs-ref` (required for visibility verification), source-specific annotations from snapshot consumer                                                                                                                                                                   |
| **SDK use**             | Does **not** use `ai-catalog-entity-provider-sdk`. Uses `@red-hat-developer-hub/backstage-plugin-ai-skills-common` for `SkillSourceType`. Uses durable `ReconciliationStore` for crash-safe state, not SDK's `InMemoryCursorStore`                                                       |
| **Source service**      | Polls OCI and NPX connector services via Backstage discovery. Uses `consumeSnapshot()` to fetch normalized v1 skill snapshots from connector endpoints                                                                                                                                   |
| **Source pagination**   | Snapshot-based: connectors serve a bounded snapshot per source. No cursor-based pagination from the connector side. The provider consumes one complete snapshot per tick                                                                                                                 |
| **Change feed**         | Snapshot diff via `calculateReconciliationPlan()`. Compares incoming snapshot against previously committed state to compute delta upserts/removals. Supports `stale-observation`, `repeated-observation`, `loading`, `failed`, and `no-changes` states                                   |
| **Mutation mode**       | `delta` — source-scoped delta mutations. Upserts and removals are applied individually without replacing the full entity set                                                                                                                                                             |
| **Persistence/restart** | **Durable.** Uses `ReconciliationStore` for crash-safe state persistence. Pending deltas are saved before mutation and replayed on restart. State is committed after successful mutation. Pending acknowledgments survive restart and are retried                                        |
| **Deletion risk**       | Controlled. Removals require explicit `entityRef` in the reconciliation plan. Cross-source collision detection prevents one source from removing another's entities. OCI sources use acknowledgment (D8) with catalog visibility verification before confirming removal to the connector |
| **Refresh interval**    | Configurable per source via `schedule` in provider config                                                                                                                                                                                                                                |
| **Upstream ownership**  | OCI registry (via `skill-image-connector-backend`) and NPX (via `npx-skill-connector-backend`)                                                                                                                                                                                           |

---

## 3. Source connector services (not entity providers)

These backend plugins fetch and normalize upstream data. They are not
`EntityProvider` implementations and do not call `applyMutation()`.

### 3.1 KServe/Kubeflow Connector

| Field               | Value                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package**         | `@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend` v0.4.0                                                                |
| **Source**          | `workspaces/ai-integrations/plugins/kserve-kubeflow-connector-backend/`                                                                           |
| **pluginId**        | `kserve-kubeflow-connector`                                                                                                                       |
| **Role**            | `backend-plugin` — source connector for `ModelCatalogResourceEntityProvider`                                                                      |
| **Source boundary** | Connects to KServe/Kubeflow model serving infrastructure. Provides a bridge API that the model catalog provider discovers via Backstage discovery |
| **Pagination**      | Internal to the connector — consumer (`ModelCatalogResourceEntityProvider`) sees flat key/catalog responses                                       |
| **Consumer**        | `ModelCatalogResourceEntityProvider`                                                                                                              |

### 3.2 OCI Skill Image Connector

| Field               | Value                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Package**         | `@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend` v0.10.0                                                                              |
| **Source**          | `workspaces/ai-integrations/plugins/skill-image-connector-backend/`                                                                                          |
| **pluginId**        | `skill-image-connector`                                                                                                                                      |
| **Role**            | `backend-plugin` — source connector for `SkillsCatalogProvider` (OCI sources)                                                                                |
| **Source boundary** | Connects to OCI container registries. Discovers and parses skill images, serving normalized v1 snapshots to the skills catalog provider                      |
| **Discovery**       | Pages internally through OCI registry tags. The provider sees one bounded snapshot per poll                                                                  |
| **Consumer**        | `SkillsCatalogProvider` with `sourceType: 'oci'`                                                                                                             |
| **Acknowledgment**  | Supports D8 reconcile protocol — the skills provider sends `POST /skilldocs/:sourceId/reconcile` with retained digests after catalog visibility verification |

### 3.3 NPX Skill Connector

| Field               | Value                                                                         |
| ------------------- | ----------------------------------------------------------------------------- |
| **Package**         | `@red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend` v0.4.1  |
| **Source**          | `workspaces/ai-integrations/plugins/npx-skill-connector-backend/`             |
| **pluginId**        | `npx-skill-connector`                                                         |
| **Role**            | `backend-plugin` — source connector for `SkillsCatalogProvider` (NPX sources) |
| **Source boundary** | Connects to NPX skill registries. Serves normalized v1 snapshots              |
| **Consumer**        | `SkillsCatalogProvider` with `sourceType: 'npx'`                              |

---

## 4. Catalog processors/extensions (ai-integrations)

These modules extend the Backstage catalog processing pipeline. They
are not entity providers — they process entities emitted by other
providers or location-based ingestion.

### 4.1 AI Resource Extensions Processor

| Field       | Value                                                                                   |
| ----------- | --------------------------------------------------------------------------------------- |
| **Package** | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-extensions` |
| **Source**  | `workspaces/ai-integrations/plugins/catalog-backend-module-ai-resource-extensions/`     |
| **Role**    | Catalog processor/extension for `AiResource` entities                                   |

### 4.2 AI Resource Agent Module

| Field       | Value                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| **Package** | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent` |
| **Source**  | `workspaces/ai-integrations/plugins/catalog-backend-module-ai-resource-agent/`     |
| **Role**    | Catalog module for `AiResource` entities with `spec.type: agent`                   |

### 4.3 AI Model Server Module

| Field       | Value                                                                            |
| ----------- | -------------------------------------------------------------------------------- |
| **Package** | `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-model-server` |
| **Source**  | `workspaces/ai-integrations/plugins/catalog-backend-module-ai-model-server/`     |
| **Role**    | Catalog module for `AiModelServerAPI` entities                                   |

---

## 5. Cross-workspace summary

### Entity providers (emit catalog entities)

| Provider                           | Workspace       | Kind             | spec.type       | Mutation | SDK                                 | Source                  |
| ---------------------------------- | --------------- | ---------------- | --------------- | -------- | ----------------------------------- | ----------------------- |
| OgxModelEntityProvider             | boost           | AiModelServerAPI | ai-model-server | full     | entity-provider-sdk                 | OGX /v1/models API      |
| OgxAgentEntityProvider             | boost           | AiResource       | agent           | full     | entity-provider-sdk                 | app-config.yaml         |
| ModelCatalogResourceEntityProvider | ai-integrations | AiModelServerAPI | ai-model-server | full     | none (direct)                       | KServe connector bridge |
| McpRegistryEntityProvider          | ai-integrations | API              | mcp-server      | full     | mcp-server-mapping lib              | MCP Registry REST API   |
| SkillsCatalogProvider              | ai-integrations | AiResource       | skill           | delta    | skills-common + ReconciliationStore | OCI/NPX connectors      |

### Source connectors (do not emit entities)

| Connector                         | Workspace       | pluginId                  | Consumers                          |
| --------------------------------- | --------------- | ------------------------- | ---------------------------------- |
| kserve-kubeflow-connector-backend | ai-integrations | kserve-kubeflow-connector | ModelCatalogResourceEntityProvider |
| skill-image-connector-backend     | ai-integrations | skill-image-connector     | SkillsCatalogProvider (OCI)        |
| npx-skill-connector-backend       | ai-integrations | npx-skill-connector       | SkillsCatalogProvider (NPX)        |

### SDK adoption status

The `ai-catalog-entity-provider-sdk` (Boost workspace) is currently consumed
only by the OGX providers. The ai-integrations workspace providers use
workspace-local libraries and Backstage primitives directly. SDK adoption for
ai-integrations providers is tracked by RHIDP-18850.

### Identified gaps

1. **No ai-catalog-entity-provider-sdk adoption in ai-integrations.** The
   model-catalog, MCP-registry, and skills-catalog providers do not use the
   shared annotation constants or version normalization from the SDK.
2. **In-memory-only state in MCP Registry provider.** Restart loses
   `lastGoodIndex` and pagination state. This is an accepted limitation for
   the inventory; durable state is a follow-up concern.
3. **No change-feed support in any provider.** All providers use polling.
   Server-push change notifications are not available from current upstream
   sources.
4. **boost-backend and boost-backend-module-ogx packages** are listed in
   workspace AGENTS.md but do not exist as separate packages. The OGX
   provider is currently a standalone catalog backend module. ProviderManager
   integration is deferred work.
