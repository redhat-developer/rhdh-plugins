# Tasks: Migrate K8s Credentials and Plugin Config to app-config.yaml

## 1. Remove baseUrl from Entity Provider

- [ ] 1.1 In `plugins/catalog-backend-module-model-catalog/src/providers/types.ts`, remove `baseUrl` from `ModelCatalogConfig`
- [ ] 1.2 In `plugins/catalog-backend-module-model-catalog/src/providers/config.ts`, remove `baseUrl` reading from `readModelCatalogApiEntityConfig` (remove the `if (config.has('baseUrl'))` block and the `baseUrl` field from the returned object)
- [ ] 1.3 In `plugins/catalog-backend-module-model-catalog/src/providers/ModelCatalogResourceEntityProvider.ts`:
  - Remove `private readonly baseUrl: string` field
  - Remove `this.baseUrl = config.baseUrl` from constructor
  - Simplify `run()` method: replace the `baseUrl`/`svcUrl` fallback logic (lines 169-173) with `const url = await this.discovery.getBaseUrl(this.name)`
- [ ] 1.4 In `plugins/catalog-backend-module-model-catalog/config.d.ts`, remove `baseUrl?: string` from the connector-level fields
- [ ] 1.5 Verify `yarn tsc` passes

## 2. Merge ConnectorConfig into ReconcilerConfig

- [ ] 2.1 In `plugins/kserve-kubeflow-connector-backend/src/services/types.ts`, update `ReconcilerConfig`:
  - Change `defaultLifecycle: string` → `defaultLifecycle?: string`
  - Change `defaultOwner: string` → `defaultOwner?: string`
  - These are now optional because defaults are applied in `setupInformer`, not at the type level
- [ ] 2.2 In `plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts`:
  - Remove the `ConnectorConfig` interface (lines 556-560)
  - Remove the `ConnectorConfig` export
  - Update `setupInformer` signature from `(connectorConfig?: ConnectorConfig)` to `(config: ReconcilerConfig, logger: LoggerService)` — the caller (`plugin.ts`) now builds `ReconcilerConfig` directly
  - Inside `setupInformer`, remove the code that builds `ReconcilerConfig` from `ConnectorConfig` fields (lines 587-599) — the config is now passed in pre-built
  - Keep the `loadFromDefault()` / K8s client creation and informer setup logic but adapt to receive the KubeConfig-ready config
  - Apply defaults for `defaultOwner` and `defaultLifecycle` if not already set:
    ```
    config.defaultOwner = config.defaultOwner || process.env.OWNER || 'default-owner';
    config.defaultLifecycle = config.defaultLifecycle || process.env.LIFECYCLE || 'production';
    ```
- [ ] 2.3 In `plugins/kserve-kubeflow-connector-backend/src/plugin.ts`:
  - Remove the `ConnectorConfig` import
  - Import `ReconcilerConfig` from `./services/types`
  - Update the config-reading code to build a `ReconcilerConfig` directly (without K8s fields for now — those are added in Task 3)
  - Update the `setupInformer` call to pass the `ReconcilerConfig` and `logger` (from `init` deps)
- [ ] 2.4 Update any re-exports of `ConnectorConfig` in `InformerService.ts` (the existing `export type { ReconcilerConfig }` stays)
- [ ] 2.5 Verify `yarn tsc` passes

## 3. Add K8s Connection Fields to ReconcilerConfig

- [ ] 3.1 In `plugins/kserve-kubeflow-connector-backend/src/services/types.ts`, add to `ReconcilerConfig`:
  ```typescript
  clusterName?: string;
  url?: string;
  serviceAccountToken?: string;
  skipTLSVerify?: boolean;
  caData?: string;
  ```
  `clusterName` comes from the `name` field in the cluster sub-config and is used in `loadFromOptions` for KubeConfig cluster/context naming (matches OCM's pattern in `hubApiClient()`).
- [ ] 3.2 Verify `yarn tsc` passes

## 4. Implement KubeConfig from Config Fields

- [ ] 4.1 In `plugins/kserve-kubeflow-connector-backend/src/services/InformerService.ts`, update `setupInformer` to build KubeConfig from config fields when available (matches OCM's `hubApiClient()` pattern):
  ```typescript
  const kc = new k8s.KubeConfig();
  const clusterName = config.clusterName || 'target-cluster';
  if (config.url && config.serviceAccountToken) {
    kc.loadFromOptions({
      clusters: [
        {
          name: clusterName,
          server: config.url,
          skipTLSVerify: config.skipTLSVerify ?? false,
          caData: config.caData,
        },
      ],
      users: [
        {
          name: 'backstage-sa',
          token: config.serviceAccountToken,
        },
      ],
      contexts: [
        {
          name: clusterName,
          cluster: clusterName,
          user: 'backstage-sa',
        },
      ],
      currentContext: clusterName,
    });
    logger.info(
      `KubeConfig built from app-config fields for cluster '${clusterName}'`,
    );
  } else {
    if (config.url || config.serviceAccountToken) {
      logger.warn(
        'Partial K8s config: both url and serviceAccountToken are required for config-based auth; falling back to loadFromDefault()',
      );
    }
    kc.loadFromDefault();
    logger.info('KubeConfig loaded from default (kubeconfig file / env)');
  }
  ```
- [ ] 4.2 Simplify the token extraction: when config fields are present, `config.serviceAccountToken` is the token — skip the currentUser/users list scanning. When falling back to `loadFromDefault()`, keep the existing extraction logic (currentUser → users list) and `K8S_TOKEN` env var override. Note: `loadFromDefault()` also supports `KUBECONFIG` env var and `~/.kube/config` from `oc login` / `kubectl login` — these are valid local dev options that work automatically.
- [ ] 4.3 Store the resolved token on `config.serviceAccountToken` (NOT `config.k8sToken`). Remove the `k8sToken` field from `ReconcilerConfig` entirely — `serviceAccountToken` is the single token field regardless of source. Update all code that reads `config.k8sToken` (e.g., `fetchModelCardViaAnnotations` in InformerService.ts) to read `config.serviceAccountToken` instead.
- [ ] 4.4 Add logging: log the cluster URL (NOT the token) and whether config or loadFromDefault was used.
- [ ] 4.5 Verify `yarn tsc` passes

## 5. Implement kubernetesPluginRef Lookup in plugin.ts

Note: Use `safeGetOptionalString` (see AGENTS.md `ConfigReader getOptionalString() edge case`) for all optional string config reads from cluster sub-config and kubernetes plugin config. Backstage's `getOptionalString` throws TypeError on empty env var substitution (e.g., `${K8S_CLUSTER_URL:-}`). Duplicate the helper locally in the connector's `plugin.ts` using the AGENTS.md pattern (returns `undefined` on error, NOT empty string). The existing helper in `plugins/catalog-techdoc-url-reader-backend/src/plugin.ts` returns `''` on error — do NOT import that variant, as empty string passes truthiness checks (e.g., `if (config.url)`) and would cause `loadFromOptions` to receive an empty URL.

- [ ] 5.1 In `plugins/kserve-kubeflow-connector-backend/src/plugin.ts`, when reading cluster sub-config, check for `kubernetesPluginRef`:
  ```typescript
  const kubernetesPluginRef = safeGetOptionalString(
    clusterConfig,
    'kubernetesPluginRef',
  );
  ```
- [ ] 5.2 If `kubernetesPluginRef` is set, look up the cluster in `kubernetes.clusterLocatorMethods`:
  ```typescript
  if (kubernetesPluginRef) {
    let matched = false;
    const k8sConfig = config.getOptionalConfig('kubernetes');
    if (k8sConfig) {
      const locators =
        k8sConfig.getOptionalConfigArray('clusterLocatorMethods') ?? [];
      for (const locator of locators) {
        if (locator.getOptionalString('type') !== 'config') continue;
        const clusters = locator.getOptionalConfigArray('clusters') ?? [];
        for (const cluster of clusters) {
          if (safeGetOptionalString(cluster, 'name') === kubernetesPluginRef) {
            matched = true;
            reconcilerConfig.url = safeGetOptionalString(cluster, 'url');
            reconcilerConfig.serviceAccountToken = safeGetOptionalString(
              cluster,
              'serviceAccountToken',
            );
            reconcilerConfig.skipTLSVerify =
              cluster.getOptionalBoolean('skipTLSVerify');
            reconcilerConfig.caData = safeGetOptionalString(cluster, 'caData');
            break;
          }
        }
        if (matched) break;
      }
    }
    if (!matched) {
      logger.warn(
        `kubernetesPluginRef '${kubernetesPluginRef}' not found in kubernetes.clusterLocatorMethods, falling through to direct config`,
      );
    } else if (!reconcilerConfig.url || !reconcilerConfig.serviceAccountToken) {
      logger.warn(
        `kubernetesPluginRef '${kubernetesPluginRef}' matched but cluster has incomplete K8s fields (url: ${!!reconcilerConfig.url}, serviceAccountToken: ${!!reconcilerConfig.serviceAccountToken}), falling through to direct config`,
      );
      reconcilerConfig.url = undefined;
      reconcilerConfig.serviceAccountToken = undefined;
      reconcilerConfig.skipTLSVerify = undefined;
      reconcilerConfig.caData = undefined;
    }
  }
  ```
- [ ] 5.3 When `kubernetesPluginRef` lookup succeeds, check the matched cluster's `authProvider` field. If it is set and is not `serviceAccount`, log a warning (per D5) but proceed — the `serviceAccountToken` field is what matters:
  ```typescript
  const authProvider = safeGetOptionalString(cluster, 'authProvider');
  if (authProvider && authProvider !== 'serviceAccount') {
    logger.warn(
      `kubernetesPluginRef '${kubernetesPluginRef}' uses authProvider '${authProvider}' — only serviceAccount is supported; proceeding with serviceAccountToken`,
    );
  }
  ```
- [ ] 5.4 If `kubernetesPluginRef` is NOT set OR if `kubernetesPluginRef` lookup failed (incomplete K8s fields), read K8s fields directly from the cluster sub-config (per D7 fall-through precedence):
  ```typescript
  if (!reconcilerConfig.url || !reconcilerConfig.serviceAccountToken) {
    reconcilerConfig.url = safeGetOptionalString(clusterConfig, 'url');
    reconcilerConfig.serviceAccountToken = safeGetOptionalString(
      clusterConfig,
      'serviceAccountToken',
    );
    reconcilerConfig.skipTLSVerify =
      clusterConfig.getOptionalBoolean('skipTLSVerify');
    reconcilerConfig.caData = safeGetOptionalString(clusterConfig, 'caData');
  }
  ```
- [ ] 5.5 Verify `yarn tsc` passes

## 6. Update config.d.ts Schema

- [ ] 6.1 In `plugins/catalog-backend-module-model-catalog/config.d.ts`, add K8s connection fields to the cluster sub-key type within the `[clusterKey: string]` union:
  ```typescript
  /** @visibility backend */
  url?: string;
  /** @visibility secret */
  serviceAccountToken?: string;
  /** @visibility backend */
  skipTLSVerify?: boolean;
  /** @visibility secret */
  caData?: string;
  /** @visibility backend */
  kubernetesPluginRef?: string;
  ```
- [ ] 6.2 Remove `baseUrl?: string` from the connector-level fields (done in Task 1.4, verify it persisted)
- [ ] 6.3 Verify `yarn tsc` passes

## 7. Update app-config.yaml

- [ ] 7.1 Update the `catalog.providers.modelCatalog.kserve-kubeflow-connector.cluster-1` section in `app-config.yaml` with K8s connection fields:
  ```yaml
  cluster-1:
    name: my-k8s-cluster
    url: '${K8S_CLUSTER_URL:-}'
    serviceAccountToken: '${K8S_SA_TOKEN:-}'
    skipTLSVerify: false
    caData: '${K8S_CA_DATA:-}'
    kubeflow-model-catalog-url: '${KUBEFLOW_MODEL_CATALOG_URL:-}'
    default-owner: '${OWNER:-default-owner}'
    default-lifecycle: '${LIFECYCLE:-production}'
  ```
- [ ] 7.2 Add a commented-out `kubernetesPluginRef` alternative showing the reference approach:
  ```yaml
  # Alternative: reference a cluster from the Backstage kubernetes plugin config:
  # cluster-1:
  #   kubernetesPluginRef: my-k8s-cluster  # must match a name in kubernetes.clusterLocatorMethods
  #   kubeflow-model-catalog-url: '${KUBEFLOW_MODEL_CATALOG_URL:-}'
  #   default-owner: '${OWNER:-default-owner}'
  #   default-lifecycle: '${LIFECYCLE:-production}'
  ```
- [ ] 7.3 Add a commented-out `kubernetes` section showing the Backstage K8s plugin config (for use with `kubernetesPluginRef`):
  ```yaml
  # Required when using kubernetesPluginRef above:
  # kubernetes:
  #   serviceLocatorMethod:
  #     type: 'multiTenant'
  #   clusterLocatorMethods:
  #     - type: 'config'
  #       clusters:
  #         - name: my-k8s-cluster
  #           url: '${K8S_CLUSTER_URL}'
  #           serviceAccountToken: '${K8S_SA_TOKEN}'
  #           skipTLSVerify: false
  #           caData: '${K8S_CA_DATA:-}'
  ```

## 8. Add K8s RBAC Example YAML

- [ ] 8.1 Create `examples/k8s-rbac.yaml` with ServiceAccount, ClusterRole, and ClusterRoleBinding:
  ```yaml
  apiVersion: v1
  kind: ServiceAccount
  metadata:
    name: backstage-kserve-connector
    namespace: backstage
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: backstage-kserve-connector
  rules:
    - apiGroups:
        - serving.kserve.io
      resources:
        - inferenceservices
      verbs:
        - get
        - watch
        - list
    - apiGroups:
        - route.openshift.io
      resources:
        - routes
      verbs:
        - get
        - list
    - apiGroups:
        - ''
      resources:
        - serviceaccounts
      verbs:
        - get
        - list
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: backstage-kserve-connector
  subjects:
    - kind: ServiceAccount
      name: backstage-kserve-connector
      namespace: backstage
  roleRef:
    kind: ClusterRole
    name: backstage-kserve-connector
    apiGroup: rbac.authorization.k8s.io
  ```
- [ ] 8.2 Verify the RBAC rules match the actual K8s API calls in `InformerService.ts` (Informer on InferenceServices), `Catalog.ts` (Routes listing), and `InformerService.ts` (ServiceAccount listing in `getAuthentication`)

## 9. Replace console.log with logger in setupInformer

- [ ] 9.1 Since `setupInformer` now receives `logger: LoggerService`, replace `console.log` / `console.error` calls inside `setupInformer` and its helper functions with `logger.info` / `logger.error` / `logger.debug` as appropriate. This is a natural follow-on since we're already changing the function signature.
      Note: do NOT change logging in functions called by the informer event handlers (`reconcileInferenceService`, `innerStart`, etc.) unless they also receive the logger — those can remain as `console.log` for now.
- [ ] 9.2 Verify `yarn tsc` passes

## 10. Verification

- [ ] 10.1 `yarn tsc` passes with no errors
- [ ] 10.2 `yarn build:all` succeeds
- [ ] 10.3 Existing unit tests pass (`yarn test:all` or `yarn test -- --watchAll=false` in affected plugins)
- [ ] 10.4 Prettier checks pass (`yarn prettier`)
- [ ] 10.5 Lint checks pass (`yarn lint:all`)
- [ ] 10.6 Plugin starts with direct K8s config in `app-config.yaml` and connects to cluster
- [ ] 10.7 Plugin starts with `kubernetesPluginRef` and connects to cluster
- [ ] 10.8 Plugin starts with no K8s config (falls back to `loadFromDefault()`) — verify with `~/.kube/config` from `oc login`
- [ ] 10.9 Plugin starts with `KUBECONFIG` env var pointing to a custom kubeconfig file
- [ ] 10.10 `K8S_TOKEN` env var still works as token override when using `loadFromDefault()`
- [ ] 10.11 Connector discovers and watches InferenceServices using config-based credentials
