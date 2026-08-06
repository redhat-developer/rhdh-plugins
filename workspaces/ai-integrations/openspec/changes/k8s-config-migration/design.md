# Design: Migrate K8s Credentials and Plugin Config to app-config.yaml

## Canonical Touchpoints

- Parent design: `openspec/changes/transition-oai-connector-to-kserve-plugin/design.md` — Decision 2
- Jira: [RHIDP-15201](https://redhat.atlassian.net/browse/RHIDP-15201)

## Context

The connector plugin (`kserve-kubeflow-connector-backend`) creates K8s clients in `setupInformer` (InformerService.ts) using `KubeConfig.loadFromDefault()`, which reads from the `KUBECONFIG` env var or the default kubeconfig file path. The token is then optionally overridden by a `K8S_TOKEN` env var. This is a prototype pattern — Backstage plugins should read cluster credentials from `app-config.yaml`.

The [OCM plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/ocm/plugins/ocm#setting-up-the-ocm-backend-package) provides the reference pattern with two config approaches:

**Approach 1 — Direct config**: K8s fields directly in the provider config:

```yaml
catalog:
  providers:
    ocm:
      env:
        name: hub-cluster
        url: https://api.hub.example.com:6443
        serviceAccountToken: ${HUB_TOKEN}
        skipTLSVerify: false
        caData: ${HUB_CA_DATA:-}
```

**Approach 2 — kubernetesPluginRef**: Reference a cluster from the Backstage K8s plugin config:

```yaml
kubernetes:
  serviceLocatorMethod:
    type: 'multiTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: hub-cluster
          url: https://api.hub.example.com:6443
          serviceAccountToken: ${HUB_TOKEN}

catalog:
  providers:
    ocm:
      env:
        kubernetesPluginRef: hub-cluster # matches cluster name above
```

When `kubernetesPluginRef` is provided, it takes precedence over direct K8s fields. The Backstage kubernetes plugin does NOT need to be installed — only its config section in `app-config.yaml` is required.

**OCM reference implementation**:

- Config reading: [`ocm-backend/src/helpers/config.ts`](https://github.com/backstage/community-plugins/blob/main/workspaces/ocm/plugins/ocm-backend/src/helpers/config.ts) — `deferToKubernetesPlugin()`, `getHubClusterFromKubernetesConfig()`, `getHubClusterFromOcmConfig()`
- K8s client creation: [`ocm-backend/src/helpers/kubernetes.ts`](https://github.com/backstage/community-plugins/blob/main/workspaces/ocm/plugins/ocm-backend/src/helpers/kubernetes.ts) — `hubApiClient()` uses `loadFromOptions()`
- Backstage K8s plugin config schema: [`kubernetes-backend/config.d.ts`](https://github.com/backstage/backstage/blob/master/plugins/kubernetes-backend/config.d.ts)

### Current config structure

```yaml
catalog:
  providers:
    modelCatalog:
      kserve-kubeflow-connector: # entity provider ID / connector plugin ID
        schedule: # read by entity provider (ModelCatalogConfig.schedule)
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
        cluster-1: # cluster sub-key — read by connector plugin
          name: my-k8s-cluster
          kubeflow-model-catalog-url: '${KUBEFLOW_MODEL_CATALOG_URL:-}'
          default-owner: '${OWNER:-default-owner}'
          default-lifecycle: '${LIFECYCLE:-production}'
```

### Target config structure

```yaml
catalog:
  providers:
    modelCatalog:
      kserve-kubeflow-connector:
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
        cluster-1:
          name: my-k8s-cluster
          # K8s connection — direct approach
          url: '${K8S_CLUSTER_URL}'
          serviceAccountToken: '${K8S_SA_TOKEN}'
          skipTLSVerify: false
          caData: '${K8S_CA_DATA:-}'
          # Plugin-specific fields
          kubeflow-model-catalog-url: '${KUBEFLOW_MODEL_CATALOG_URL:-}'
          default-owner: '${OWNER:-default-owner}'
          default-lifecycle: '${LIFECYCLE:-production}'
```

Or using `kubernetesPluginRef`:

```yaml
kubernetes:
  serviceLocatorMethod:
    type: 'multiTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: my-k8s-cluster
          url: '${K8S_CLUSTER_URL}'
          serviceAccountToken: '${K8S_SA_TOKEN}'
          skipTLSVerify: false
          caData: '${K8S_CA_DATA:-}'

catalog:
  providers:
    modelCatalog:
      kserve-kubeflow-connector:
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
        cluster-1:
          kubernetesPluginRef: my-k8s-cluster # matches cluster name above
          kubeflow-model-catalog-url: '${KUBEFLOW_MODEL_CATALOG_URL:-}'
          default-owner: '${OWNER:-default-owner}'
          default-lifecycle: '${LIFECYCLE:-production}'
```

### Current type hierarchy

```
plugin.ts reads app-config
  → creates ConnectorConfig { catalogUrl?, defaultOwner?, defaultLifecycle? }
  → calls setupInformer(connectorConfig)
    → setupInformer builds ReconcilerConfig {
        catalogRoute?, catalogUrl?, defaultLifecycle, defaultOwner,
        k8sToken?, routeClient?, coreClient?, informer?
      }
    → KubeConfig via loadFromDefault() (reads KUBECONFIG env var, ~/.kube/config from oc login, or K8S_TOKEN env var override)
```

### Target type hierarchy

```
plugin.ts reads app-config + optional kubernetes config
  → builds ReconcilerConfig directly (no ConnectorConfig intermediate)
  → calls setupInformer(reconcilerConfig)
    → setupInformer receives KubeConfig-ready fields
    → KubeConfig via loadFromOptions() when config fields present,
      loadFromDefault() as fallback for local dev
```

## Goals / Non-Goals

**Goals:**

- K8s credentials read from `app-config.yaml` (direct or via kubernetesPluginRef)
- Config-based credentials take precedence over local dev options (`K8S_TOKEN` env var, `KUBECONFIG` env var, `~/.kube/config` from `oc login`)
- `baseUrl` removed from entity provider `ModelCatalogConfig`
- `ConnectorConfig` merged into `ReconcilerConfig`
- ServiceAccount auth only
- `config.d.ts` declares K8s connection fields
- Example K8s RBAC YAML for ServiceAccount setup
- `yarn build:all`, `yarn tsc`, unit tests, prettier, and lint pass

**Non-Goals:**

- OIDC, Google SA, or other auth methods beyond serviceAccount
- Frontend-level config (all new fields are `@visibility backend`)
- Multi-cluster support (single cluster per provider instance)
- Changes to url-reader plugin or entity provider's entity generation logic

## Decisions

### D1 — Two config approaches following OCM pattern

**Choice:** Support two approaches for K8s cluster credentials, matching the OCM plugin:

1. **Direct fields** in the cluster sub-config: `url`, `serviceAccountToken`, `skipTLSVerify`, `caData`
2. **kubernetesPluginRef** referencing a cluster name from `kubernetes.clusterLocatorMethods`

When `kubernetesPluginRef` is set and the referenced cluster is found, its K8s fields take precedence over any direct K8s fields in the cluster sub-config. If the referenced cluster is NOT found, direct K8s fields are used as fallback (see D7 for the full precedence chain). Plugin-specific fields (`kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle`) are always read from the cluster sub-config regardless.

**Rationale:** This is the established Backstage pattern used by the OCM plugin. It allows platform engineers to either centralize cluster config (via the kubernetes plugin section) or keep it self-contained in the provider config. The Backstage kubernetes plugin does NOT need to be installed — only its config section in `app-config.yaml` is needed when using `kubernetesPluginRef`.

### D2 — Remove baseUrl from ModelCatalogConfig

**Choice:** Remove `baseUrl` from `ModelCatalogConfig`, `readModelCatalogApiEntityConfig`, and `ModelCatalogResourceEntityProvider`. Also remove `baseUrl` from `config.d.ts`.

**Rationale:** The entity provider uses `DiscoveryService.getBaseUrl()` to resolve the connector's URL at runtime (line 169 of `ModelCatalogResourceEntityProvider.ts`). The `baseUrl` field was a manual override — if `baseUrl` was set, it took priority over discovery. But a hardcoded `baseUrl` cannot help when the connector service is unreachable: the subsequent HTTP call to fetch the model catalog will fail regardless. So `baseUrl` is either redundant (discovery works and the service is reachable) or insufficient (service is down). Removing it simplifies config and eliminates confusion.

**Impact:** The `run()` method in `ModelCatalogResourceEntityProvider.ts` simplifies from:

```typescript
const svcUrl = await this.discovery.getBaseUrl(this.name);
let url = this.baseUrl;
if (svcUrl.length > 0 && url.length === 0) {
  url = svcUrl;
}
```

to:

```typescript
const url = await this.discovery.getBaseUrl(this.name);
```

### D3 — Merge ConnectorConfig into ReconcilerConfig

**Choice:** Eliminate the `ConnectorConfig` interface. Move its fields (`catalogUrl?`, `defaultOwner?`, `defaultLifecycle?`) and the new K8s connection fields into `ReconcilerConfig`. The config-derived fields remain optional strings (matching `ConnectorConfig`'s signature); defaults are applied in `setupInformer`.

**Rationale:** `ConnectorConfig` is a thin intermediate that `setupInformer` immediately unpacks into `ReconcilerConfig`. The two types have overlapping fields with different optionality (`ConnectorConfig.defaultOwner?: string` vs `ReconcilerConfig.defaultOwner: string`). With the K8s config migration adding more fields, maintaining two types adds complexity without value.

**Implementation:**

- `ReconcilerConfig` in `types.ts` gains: `clusterName?`, `url?`, `serviceAccountToken?`, `skipTLSVerify?`, `caData?` (K8s connection); changes `catalogUrl?`, `defaultOwner?`, `defaultLifecycle?` from required to optional (defaults applied in `setupInformer`). `clusterName` comes from the `name` field in the cluster sub-config and is used in `loadFromOptions` for KubeConfig cluster/context naming.
- The existing `k8sToken` field is **removed** from `ReconcilerConfig`. The new `serviceAccountToken` field replaces it as the single token field — `setupInformer` populates it with the resolved token regardless of source (app-config, `K8S_TOKEN` env var, or kubeconfig extraction). All code reading `config.k8sToken` (e.g., `fetchModelCardViaAnnotations`) is updated to read `config.serviceAccountToken`.
  Note: `defaultOwner` and `defaultLifecycle` change from required `string` to optional `string` (`?: string`) on the type — `setupInformer` continues to apply defaults (`process.env.OWNER || 'default-owner'` and `process.env.LIFECYCLE || 'production'`) before any code that depends on them.
- `ConnectorConfig` interface and its export in `InformerService.ts` are removed.
- `plugin.ts` builds a `ReconcilerConfig` directly (minus the runtime K8s objects, which `setupInformer` populates).
- `setupInformer` signature changes from `(connectorConfig?: ConnectorConfig)` to `(config: ReconcilerConfig, logger: LoggerService)`.

### D4 — Build KubeConfig from config fields via loadFromOptions

**Choice:** When K8s connection fields (`url`, `serviceAccountToken`) are available in `ReconcilerConfig`, build the KubeConfig using `kc.loadFromOptions()` instead of `kc.loadFromDefault()`. Fall back to `loadFromDefault()` when no config fields are present (local dev with kubeconfig file).

**Implementation** (matches OCM's `hubApiClient()` pattern in `ocm-backend/src/helpers/kubernetes.ts`):

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
} else {
  if (config.url || config.serviceAccountToken) {
    logger.warn(
      'Partial K8s config: both url and serviceAccountToken are required for config-based auth; falling back to loadFromDefault()',
    );
  }
  kc.loadFromDefault();
}
```

Note: `clusterName` comes from the `name` field in the cluster sub-config (e.g., `name: my-k8s-cluster`). OCM uses the same pattern — its `hubApiClient()` passes the cluster name from config to `loadFromOptions`. If only one of `url` or `serviceAccountToken` is present, a warning is logged before falling back to `loadFromDefault()` — this helps catch partial config mistakes.

**Rationale:** `loadFromDefault()` reads from `KUBECONFIG` env var or `~/.kube/config` — appropriate for local dev but not for deployed Backstage instances where config should come from `app-config.yaml`. `loadFromOptions()` builds the KubeConfig programmatically from the exact fields we control. The `K8S_TOKEN` env var override in the current code becomes unnecessary when credentials come from config.

**Local dev fallback:** After building the KubeConfig (either way), the token extraction logic is simplified. When config fields are present, `config.serviceAccountToken` IS the token — no need to dig through the KubeConfig's user list. When falling back to `loadFromDefault()`, the following local dev options are supported:

- **`~/.kube/config`** — default kubeconfig from `oc login` / `kubectl login`; `loadFromDefault()` reads this automatically
- **`KUBECONFIG` env var** — explicit path to a kubeconfig file; `loadFromDefault()` reads this automatically
- **`K8S_TOKEN` env var** — override token extracted from the kubeconfig; keep the existing token extraction logic (currentUser → users list) and this override for backwards compatibility

### D5 — ServiceAccount auth only

**Choice:** Only support `serviceAccount` authentication. Do not implement OIDC, Google SA, or other auth providers from the Backstage K8s plugin config.

**Rationale:** The connector uses long-lived K8s informers and periodic polling — it needs a stable service account token, not a user-scoped OAuth token. The Backstage K8s plugin's `authProvider` field supports 8 strategies (`serviceAccount`, `aks`, `aws`, `azure`, `google`, `googleServiceAccount`, `oidc`, `localKubectlProxy`), but the non-serviceAccount types are designed for user-initiated K8s API requests. The connector runs as a backend daemon and should use a dedicated ServiceAccount. This matches the OCM plugin's approach — OCM also only supports `serviceAccount` and validates this when using `kubernetesPluginRef` (see `ocm-backend/src/helpers/config.ts:61-63`).

**Validation:** When `kubernetesPluginRef` is used and the referenced cluster has an `authProvider` field, log a warning if it is not `serviceAccount` but proceed anyway — the `serviceAccountToken` field is what matters for the connection.

### D6 — Config.d.ts: K8s fields in entity provider's existing config.d.ts

**Choice:** Add the K8s connection fields (`url`, `serviceAccountToken`, `skipTLSVerify`, `caData`, `kubernetesPluginRef`) to the cluster sub-key type in the entity provider's existing `plugins/catalog-backend-module-model-catalog/config.d.ts`. Do NOT create a separate `config.d.ts` in the connector plugin.

**Rationale:** The entire `catalog.providers.modelCatalog` config tree is already declared in the entity provider's `config.d.ts`. Adding the K8s fields there keeps all schema declarations for this config path in one place. Backstage merges config schemas across plugins, so a separate connector `config.d.ts` would also work, but splitting the schema for the same config path across two files is harder to maintain.

**Schema update:**

```typescript
[clusterKey: string]:
  | {
      /** @visibility backend */
      name?: string;
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
      /** @visibility backend */
      'kubeflow-model-catalog-url'?: string;
      /** @visibility backend */
      'default-owner'?: string;
      /** @visibility backend */
      'default-lifecycle'?: string;
    }
  | string
  | SchedulerServiceTaskScheduleDefinitionConfig
  | undefined;
```

Note: `serviceAccountToken` and `caData` use `@visibility secret` — they must never be exposed to the frontend.

Also remove `baseUrl` from the connector-level fields (per D2).

### D7 — Precedence: kubernetesPluginRef > direct config > loadFromDefault (local dev)

**Choice:** The following precedence order determines how the KubeConfig is built:

1. **kubernetesPluginRef** (found, complete): If set AND the referenced cluster is found in `kubernetes.clusterLocatorMethods` with both `url` and `serviceAccountToken`, use its K8s fields.
   1b. **kubernetesPluginRef** (found, incomplete): If the matched cluster is missing `url` or `serviceAccountToken`, log a warning, clear any stale fields, and fall through to step 3.
2. **kubernetesPluginRef** (not found): If set but the referenced cluster is NOT found, log a warning and fall through to step 3 (do NOT skip to `loadFromDefault`).
3. **Direct config**: If `url` and `serviceAccountToken` are present in the cluster sub-config, use them.
4. **Local dev — loadFromDefault()**: If none of the above, use `loadFromDefault()` which supports three local dev options:
   - `~/.kube/config` from `oc login` / `kubectl login` (read automatically)
   - `KUBECONFIG` env var pointing to a custom kubeconfig file (read automatically)
   - `K8S_TOKEN` env var to override the token extracted from the kubeconfig (backward compatibility)

**Reading kubernetesPluginRef:** In `plugin.ts`, when `kubernetesPluginRef` is present in the cluster sub-config:

```typescript
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
        // Extract url, serviceAccountToken, skipTLSVerify, caData
      }
    }
    if (matched) break;
  }
}
```

**Rationale:** This precedence follows the OCM pattern (kubernetesPluginRef > own config > defaults) while preserving backward compatibility with existing local dev setups (`oc login` kubeconfig, `KUBECONFIG` env var, `K8S_TOKEN` env var). Platform engineers deploying to production will use approach 1 or 2; dev setups will fall through to loadFromDefault.

### D8 — K8s RBAC example YAML

**Choice:** Provide an example YAML file at `examples/k8s-rbac.yaml` with ServiceAccount, ClusterRole, and ClusterRoleBinding resources. The ClusterRole grants the minimum permissions the connector needs.

**Permissions required** (derived from `InformerService.ts` and `Catalog.ts`):

| Resource            | API Group            | Verbs            | Used by                                     |
| ------------------- | -------------------- | ---------------- | ------------------------------------------- |
| `inferenceservices` | `serving.kserve.io`  | get, watch, list | K8s Informer in `setupInformer`             |
| `routes`            | `route.openshift.io` | get, list        | `setupCatalogRoute` in `Catalog.ts`         |
| `serviceaccounts`   | `""` (core)          | get, list        | `getAuthentication` in `InformerService.ts` |

**Rationale:** Platform engineers need to know what RBAC to set up before the connector can function. This is the same pattern OCM follows in its README (showing the ClusterRole rules). The example YAML is more maintainable than inline documentation and can be applied directly with `kubectl apply`.

## Cross-Change Reconciliation

- **`remove-kfmr-client-code` (D3, D7)**: That change simplified `ReconcilerConfig` and added `catalogUrl`. This change further modifies `ReconcilerConfig` by adding K8s connection fields and merging `ConnectorConfig` into it. Both changes are sequential — `remove-kfmr-client-code` landed first (already merged), so this change builds on its result. No conflict.
- **`techdocs-modelcard-finalization` (D5)**: That change added the `[clusterKey: string]` index signature to `config.d.ts`. This change extends the same union type with K8s connection fields. Both modify the same type declaration but add different fields — merge is additive. No conflict.

## Risks / Trade-offs

| Risk                                                                                                                                   | Mitigation                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kubernetesPluginRef` lookup fails silently if the referenced cluster doesn't exist                                                    | Log a warning and fall back to direct config or loadFromDefault; document the expected cluster name format                                                               |
| `loadFromOptions` with wrong `caData` or `url` produces cryptic K8s client errors                                                      | Log the cluster name and url (NOT the token) when building the KubeConfig to help diagnosis                                                                              |
| Removing `baseUrl` breaks deployments that depend on it                                                                                | Extremely unlikely — `baseUrl` was only useful when discovery works for auth but fails for URL resolution, which is contradictory. Document the removal in the changelog |
| Local dev options (`K8S_TOKEN`, `KUBECONFIG` env vars, `~/.kube/config` from `oc login`) still work but are undocumented going forward | Keep backward compat silently; don't encourage env vars in documentation                                                                                                 |
| `serviceAccountToken` in config is a secret value                                                                                      | Use `@visibility secret` in config.d.ts; Backstage config system masks secrets in logs                                                                                   |
| Config validation rejects new fields if `config.d.ts` is not picked up                                                                 | Verify that Backstage loads the schema — the entity provider's `config.d.ts` is already active                                                                           |

## Verification

After all changes:

1. `yarn tsc` passes with no errors
2. `yarn build:all` succeeds
3. Existing unit tests pass (no test changes expected — tests don't exercise K8s connection)
4. Prettier and lint checks pass
5. Plugin starts with direct K8s config in `app-config.yaml` (url + serviceAccountToken)
6. Plugin starts with `kubernetesPluginRef` referencing a cluster in `kubernetes.clusterLocatorMethods`
7. Plugin starts with no K8s config (falls back to `loadFromDefault()` for local dev)
8. Connector discovers and watches InferenceServices using config-based credentials
9. Local dev options still work as backward-compatible fallback: `~/.kube/config` from `oc login`, `KUBECONFIG` env var, and `K8S_TOKEN` env var override
