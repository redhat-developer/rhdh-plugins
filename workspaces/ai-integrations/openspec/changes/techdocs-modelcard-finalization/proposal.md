# Proposal: TechDocs / Model Card Integration Finalization

## Why

The `kserve-kubeflow-connector-backend` plugin can fetch model card markdown from the KubeFlow Model Catalog API and serve it at a REST endpoint. The `catalog-techdoc-url-reader-backend` plugin can consume that endpoint to render model cards as TechDocs in the RHDH UI. However, three gaps prevent this integration from working end-to-end after the rebase:

1. **No automatic TechDocsKey annotation**: When an InferenceService has catalog annotations (`rhdh.io/catalog-source`, `rhdh.io/catalog-model`) indicating a model card is available, no code sets the `TechDocsKey` property automatically. Platform engineers must manually annotate every InferenceService, which doesn't scale.

2. **Config misalignment**: The url-reader plugin's `BridgeConfig` still uses the old `baseUrl` field and flat config structure, while the connector and entity provider now use cluster-nested config with fields like `kubeflow-model-catalog-url`, `default-owner`, and `default-lifecycle`.

Additionally, the Express route `/modelcard/:sourceId/:modelName` only matches model names without slashes, but KubeFlow Model Catalog model names frequently contain slashes (e.g., `RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`). And the url-reader's `dir()` method doesn't generate the `mkdocs.yml` file that Backstage's TechDocs builder (mkdocs) requires.

## Starting Point

The connector was merged in PR #3705 and rebased in RHIDP-15199. The url-reader plugin exists but its config reading is stale. The entity provider (`catalog-backend-module-model-catalog`) already handles the `backstage.io/techdocs-ref` annotation in `ModelCatalogGenerator.ts` — for relative paths it prepends `svcUrl`, for full URLs (explicit `rhdh.io/techdocs`) it uses the value as-is, and wraps in the `url:` prefix that triggers Backstage URL reader dispatch.

## What Changes

- **Auto TechDocsKey annotation**: In `KServe.ts`, when catalog annotations are present but no explicit TechDocsKey annotation exists, auto-set TechDocsKey as a path (`/modelcard/<sourceId>/<modelName>`) — the entity provider's `ModelCatalogGenerator.ts` discovers the connector's base URL via `discovery.getBaseUrl()`, prepends it, and adds the `url:` prefix
- **Wildcard model card route**: Change Express route from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*` to handle model names containing slashes
- **mkdocs.yml generation**: Add `mkdocs.yml` creation to the url-reader's `dir()` method so the TechDocs builder can process model card markdown
- **Config alignment**: Update url-reader's `BridgeConfig` type and `readBridgeConfigs` to match the cluster-nested config structure (`catalog.providers.modelCatalog.<connector>.<cluster>.{fields}`)
- **Config schema declaration**: Add new config fields to `catalog-backend-module-model-catalog/config.d.ts` so Backstage's config validation doesn't silently strip them
- **Service-to-service auth**: URL reader authenticates to the connector using Backstage's `getPluginRequestToken` with `targetPluginId: 'kserve-kubeflow-connector'` — no static admin token fallback needed
- **Config robustness**: `safeGetOptionalString` wrapper handles Backstage ConfigReader TypeError on empty env var substitution; `readBridgeConfigs` does not gate on `has('kubeflow-model-catalog-url')` since `ConfigReader.has()` is unreliable for env var substitution defaults

## Capabilities

### New Capabilities

- `auto-techdocs-annotation`: TechDocsKey path automatically set on entities when catalog annotations indicate model card availability; entity provider resolves connector base URL via `DiscoveryService`
- `mkdocs-generation`: URL reader generates `mkdocs.yml` alongside fetched markdown for TechDocs builder compatibility

### Modified Capabilities

- `modelcard-endpoint`: Route changed from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*` to handle multi-segment model names
- `url-reader-config`: `BridgeConfig` updated from `{id, baseUrl}` to `{id, name, kubeflowModelCatalogUrl, defaultOwner, defaultLifecycle}` with two-level config iteration (connector → cluster)
- `config-schema`: `config.d.ts` extended with cluster sub-key fields (`name`, `kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle`)

## Non-goals

- Merging `catalog-techdoc-url-reader-backend` into the connector plugin (deferred per Design Decision 6 in parent openspec)
- Adding TechDocs search indexing support
- Multi-cluster connector instances (TODO added, deferred)

## Canonical Touchpoints

- **Parent openspec**: `openspec/changes/transition-oai-connector-to-kserve-plugin/` — Design Decision 6
- **Jira**: [RHIDP-15205](https://redhat.atlassian.net/browse/RHIDP-15205)
- **Plan**: RHDHPLAN-404

**Change type**: feature

## Impact

- `plugins/kserve-kubeflow-connector-backend/src/plugin.ts` — cluster-key config navigation
- `plugins/kserve-kubeflow-connector-backend/src/services/KServe.ts` — auto TechDocsKey path construction (~10 lines added)
- `plugins/kserve-kubeflow-connector-backend/src/router.ts` — wildcard route change (1 line)
- `plugins/catalog-techdoc-url-reader-backend/src/plugin.ts` — `BridgeConfig` type update, `readBridgeConfigs` two-level iteration, `mkdocs.yml` generation in `dir()`
- `plugins/catalog-techdoc-url-reader-backend/src/plugin.test.ts` — test fixtures updated for new config shape
- `plugins/catalog-backend-module-model-catalog/config.d.ts` — schema extended with cluster sub-key fields
- `app-config.yaml` — `cluster-1:` nesting level added with new fields
- Net change: +120 lines, -38 lines across 9 files
