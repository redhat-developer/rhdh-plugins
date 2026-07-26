## Why

The current OpenShift AI Connector for RHDH requires three sidecar containers (`location`, `storage-rest`, `rhoai-normalizer`) patched into the RHDH Deployment YAML, making it heavy and difficult to install via Helm Chart or Operator. This friction has limited adoption — no RHDH customers have approached us for POCs or deployment of the current Developer Preview. The connector also only works with RHOAI, excluding users of generic KServe or Kubeflow installations.

Refactoring to a standalone dynamic plugin that talks directly to KServe/KubeFlow APIs eliminates the sidecar requirement, broadens compatibility to any KServe-compatible platform, and positions the plugin for upstream Backstage community donation. The 1.10 development spike (RHDHPLAN-944) is complete, and PM alignment exists on the entity modeling approach — now is the time to execute.

## Starting Point

The spike (RHIDP-11757) produced a working prototype on branch [`gabemontero/rhdh-plugins:kserve-kubeflow-connector`](https://github.com/gabemontero/rhdh-plugins/tree/kserve-kubeflow-connector) that serves as the starting point for this work. The prototype includes:

- A new `kserve-kubeflow-connector-backend` plugin with:
  - K8s TypeScript Informer on KServe `InferenceService` resources (`InformerService.ts`)
  - KServe inference service → ModelCatalog conversion (`KServe.ts`)
  - KubeFlow Model Registry client with REST calls (`Kfmr.ts`)
  - Full type definitions ported from the golang connector (`types.ts`)
- Modifications to the existing `catalog-backend-module-model-catalog` entity provider and config
- Modifications to `catalog-techdoc-url-reader-backend` for plugin-to-plugin TechDocs/model card integration

Known TODOs from the prototype (per RHIDP-11757 comments):

- Additional unit tests for the converted golang→typescript code
- TechDocs/model card integration workarounds (plugin-to-plugin REST calls should be merged into the connector plugin)
- K8s credential config currently uses env vars (`KUBECONFIG`, `K8S_TOKEN`); needs to migrate to Backstage K8s plugin config pattern (like OCM plugin)
- Model registry interaction to be removed per feature scope

## What Changes

- **Remove sidecar dependency**: Replace the golang-based controller + bridge architecture with a TypeScript backend plugin using K8s TypeScript Informers for KServe and REST clients for KubeFlow
- **New entity type modeling**: Attempt to add `ai-model-server` to the upstream Backstage API entity discriminated union; fallback to using the catalog model layer to create a new entity type whose schema aligns with the recently merged MCP server API entity extension
- **Remove model registry interaction**: Drop KubeFlow Model Registry integration (out of scope per feature definition)
- **Reduce entity surface**: Move from Component/Resource/traditional API entities to the new API/remotes type from upstream Backstage
- **Finalize credential configuration**: Use the existing Backstage K8s plugin config and/or new plugin config for core K8s credentials and KubeFlow Model Catalog connection/credentials
- **Update documentation**: Rewrite installation guide to remove sidecar instructions, add KServe/KubeFlow configuration section
- **Update Extensions Catalog**: Replace old OpenShift AI Connector entry with new KServe/KubeFlow Connector listing
- **Transition support status**: Move from "Developer Preview" to "Community Supported"
- **New blog post**: Communicate the simplified plugin-only approach vs. the previous sidecar-based setup

## Capabilities

### New Capabilities

- `kserve-inference-service-informer`: TypeScript K8s Informer-based discovery of KServe InferenceService resources, replacing the golang controller sidecar
- `kubeflow-model-catalog-client`: REST client integration with KubeFlow Model Catalog APIs (CatalogSource, CatalogModel/ModelCard)
- `ai-model-server-entity-type`: New Backstage catalog entity type for AI Model Servers, schema-aligned with the upstream API entity discriminated union (or fallback custom entity type)

### Modified Capabilities

- `model-catalog-entity-provider`: Existing `ModelCatalogResourceEntityProvider` refactored to use direct K8s/KServe APIs instead of bridge sidecar; entity output changes from Component/Resource/API to new API/remotes type
- `plugin-configuration`: Configuration schema changes — sidecar-related config removed, KServe endpoint and K8s credential config added

## Out of Scope

- `workspaces/ai-integrations/plugins/ai-experience/`, `ai-experience-backend/`, `ai-experience-common/`: The ai-experience component is a separate concern that is being moved and/or removed — not part of this refactor

## Impact

- `workspaces/ai-integrations/plugins/catalog-backend-module-model-catalog/`: Major refactor — `BridgeResourceConnector` replaced with direct KServe/KubeFlow clients, `ModelCatalogGenerator` updated for new entity types, `ModelCatalogResourceEntityProvider` rewritten
- Upstream Backstage: RFC/BEP for AI Model Server entity mapping (external dependency)
- RHDH Extensions Catalog: Entry replacement (old connector removed, new KServe/KubeFlow connector added)
- Documentation: Full rewrite of installation/configuration chapter
- Sizing: 17 PD code, 8 PD docs/blog
