# Proposal: Migrate K8s Credentials and Plugin Config to app-config.yaml

## Why

The `kserve-kubeflow-connector-backend` plugin creates its K8s clients via `KubeConfig.loadFromDefault()`, which reads from `~/.kube/config` (e.g., after `oc login`) or the `KUBECONFIG` env var, and optionally overrides the token with a `K8S_TOKEN` environment variable. This works for local development but does not follow Backstage conventions — platform engineers expect to configure K8s cluster access through `app-config.yaml`, not environment variables. The [OCM plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/ocm/plugins/ocm) provides the reference pattern: cluster credentials either directly in the provider config or via a `kubernetesPluginRef` that references a cluster defined in the Backstage kubernetes plugin's `kubernetes.clusterLocatorMethods` config.

Additionally, two type-level issues have accumulated:

1. `ModelCatalogConfig.baseUrl` in the entity provider is unused in practice — if the Backstage `DiscoveryService` cannot resolve the connector, nothing else works either (auth tokens, endpoint calls), so the fallback adds complexity without value.
2. `ConnectorConfig` and `ReconcilerConfig` in the connector plugin are redundant — `ConnectorConfig` exists solely to be unpacked into `ReconcilerConfig` five lines later in `setupInformer`.

## Starting Point

- Connector plugin (`kserve-kubeflow-connector-backend`) uses `kc.loadFromDefault()` in `InformerService.ts` (reads `~/.kube/config` or `KUBECONFIG` env var) with optional `K8S_TOKEN` env var token override
- `ModelCatalogConfig` in `plugins/catalog-backend-module-model-catalog/src/providers/types.ts` contains `baseUrl`, `id`, `schedule`
- `ConnectorConfig` (InformerService.ts:556) is a thin wrapper with `catalogUrl?`, `defaultOwner?`, `defaultLifecycle?`
- `ReconcilerConfig` (types.ts:113) merges those fields with runtime K8s objects (`routeClient`, `coreClient`, `informer`, `k8sToken`)
- Entity provider's `config.d.ts` declares cluster sub-key fields but not K8s connection fields
- Connector plugin has no `config.d.ts` of its own

## What Changes

- **K8s connection via config**: Add `url`, `serviceAccountToken`, `skipTLSVerify`, `caData` fields to the cluster sub-config under `catalog.providers.modelCatalog.<connector>.<cluster>`
- **kubernetesPluginRef**: Add optional `kubernetesPluginRef` field to the cluster sub-config, referencing a cluster by name in `kubernetes.clusterLocatorMethods` — follows the OCM plugin pattern
- **KubeConfig from config**: Replace `kc.loadFromDefault()` with `kc.loadFromOptions()` when config fields are present; fall back to `loadFromDefault()` for local dev when no config is set
- **Remove baseUrl**: Drop `baseUrl` from `ModelCatalogConfig`, `readModelCatalogApiEntityConfig`, and `ModelCatalogResourceEntityProvider`
- **Merge ConnectorConfig → ReconcilerConfig**: Eliminate the intermediate `ConnectorConfig` type; pass K8s connection fields and plugin-specific config directly through `ReconcilerConfig`
- **Config schema**: Extend the entity provider's `config.d.ts` with K8s connection fields under the cluster sub-key
- **K8s RBAC example**: Provide example YAML for ServiceAccount, ClusterRole, and ClusterRoleBinding so the connector's K8s clients can access InferenceServices, Routes, and ServiceAccounts
- **App-config example**: Update `app-config.yaml` with both config approaches (direct and kubernetesPluginRef)

## Capabilities

### New Capabilities

- `config-based-k8s-auth`: K8s cluster credentials configured via `app-config.yaml` instead of environment variables, supporting direct fields or cross-reference to the Backstage kubernetes plugin
- `k8s-rbac-example`: Example YAML for ServiceAccount setup with appropriate ClusterRole permissions

### Modified Capabilities

- `reconciler-config`: `ConnectorConfig` merged into `ReconcilerConfig`; K8s connection fields (`url`, `serviceAccountToken`, `skipTLSVerify`, `caData`) added
- `kubeconfig-init`: `setupInformer` builds KubeConfig from config fields via `loadFromOptions()` when available; `loadFromDefault()` is the fallback for local dev
- `entity-provider-config`: `baseUrl` removed from `ModelCatalogConfig` — entity provider relies on `DiscoveryService` exclusively

## Non-goals

- Frontend-level config — all new config is backend-only (`@visibility backend`)
- Auth providers other than `serviceAccount` — no OIDC, Google SA, or other auth methods in this iteration
- Multi-cluster support — single cluster per provider instance, same as today (TODO comment for future)
- Merging the connector plugin with the entity provider plugin
- Changes to the `catalog-techdoc-url-reader-backend` plugin

## Canonical Touchpoints

- **Parent openspec**: `openspec/changes/transition-oai-connector-to-kserve-plugin/` — Decision 2
- **Jira**: [RHIDP-15201](https://redhat.atlassian.net/browse/RHIDP-15201)
- **Reference**: [OCM plugin setup](https://github.com/backstage/community-plugins/tree/main/workspaces/ocm/plugins/ocm#setting-up-the-ocm-backend-package), [Backstage K8s plugin config](https://backstage.io/docs/features/kubernetes/configuration), [Backstage K8s plugin auth](https://backstage.io/docs/features/kubernetes/authentication), [Backstage K8s plugin config.d.ts](https://github.com/backstage/backstage/blob/master/plugins/kubernetes-backend/config.d.ts), [OCM config helper](https://github.com/backstage/community-plugins/blob/main/workspaces/ocm/plugins/ocm-backend/src/helpers/config.ts)

**Change type**: feature

## Impact

- `plugins/kserve-kubeflow-connector-backend/src/services/types.ts` — `ReconcilerConfig` gains K8s connection fields; `ConnectorConfig` removed
- `plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts` — `setupInformer` signature and KubeConfig creation rewritten; `ConnectorConfig` type removed
- `plugins/kserve-kubeflow-connector-backend/src/plugin.ts` — reads K8s fields from cluster config and `kubernetes.clusterLocatorMethods`; passes directly to `ReconcilerConfig`
- `plugins/catalog-backend-module-model-catalog/src/providers/types.ts` — `baseUrl` removed from `ModelCatalogConfig`
- `plugins/catalog-backend-module-model-catalog/src/providers/config.ts` — `baseUrl` reading removed
- `plugins/catalog-backend-module-model-catalog/src/providers/ModelCatalogResourceEntityProvider.ts` — `baseUrl` field and fallback logic in `run()` removed
- `plugins/catalog-backend-module-model-catalog/config.d.ts` — K8s connection fields added to cluster sub-key schema
- `app-config.yaml` — updated with K8s connection example
- New: `examples/k8s-rbac.yaml` — ServiceAccount, ClusterRole, ClusterRoleBinding example
- Net change: ~+180 lines, -90 lines across 9 files
