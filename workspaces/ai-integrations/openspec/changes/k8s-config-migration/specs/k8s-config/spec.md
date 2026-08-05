## K8s Config — Direct Fields

### Requirement: Connector builds KubeConfig from direct config fields

When the cluster sub-config contains `url` and `serviceAccountToken`, the connector SHALL build a KubeConfig using `loadFromOptions()` instead of `loadFromDefault()`.

#### Scenario: Direct config with all fields

- **GIVEN** `app-config.yaml` has `catalog.providers.modelCatalog.kserve-kubeflow-connector.cluster-1` with:
  - `url: https://api.my-cluster.example.com:6443`
  - `serviceAccountToken: eyJhbG...`
  - `skipTLSVerify: true`
  - `caData: LS0tLS1C...`
- **WHEN** the connector plugin initializes
- **THEN** `KubeConfig.loadFromOptions()` is called with one cluster, one user, and one context
- **AND** the cluster's `server` is `https://api.my-cluster.example.com:6443`
- **AND** the user's `token` is the serviceAccountToken value
- **AND** `skipTLSVerify` is `true`
- **AND** `caData` is `LS0tLS1C...`
- **AND** `loadFromDefault()` is NOT called

#### Scenario: Direct config with minimum fields

- **GIVEN** `cluster-1` has only `url` and `serviceAccountToken` (no `skipTLSVerify`, no `caData`)
- **WHEN** the connector plugin initializes
- **THEN** `KubeConfig.loadFromOptions()` is called
- **AND** `skipTLSVerify` defaults to `false`
- **AND** `caData` is `undefined`

#### Scenario: Direct config missing serviceAccountToken

- **GIVEN** `cluster-1` has `url` but no `serviceAccountToken`
- **WHEN** the connector plugin initializes
- **THEN** `loadFromDefault()` is used as fallback
- **AND** the plugin logs that it fell back to default KubeConfig

---

## K8s Config — kubernetesPluginRef

### Requirement: Connector resolves K8s credentials from Backstage kubernetes plugin config

When `kubernetesPluginRef` is set in the cluster sub-config, the connector SHALL look up the matching cluster in `kubernetes.clusterLocatorMethods` and use its K8s connection fields.

#### Scenario: kubernetesPluginRef matches a cluster

- **GIVEN** `cluster-1` has `kubernetesPluginRef: my-k8s-cluster`
- **AND** `kubernetes.clusterLocatorMethods` contains a `type: config` entry with a cluster named `my-k8s-cluster` having `url` and `serviceAccountToken`
- **WHEN** the connector plugin initializes
- **THEN** the K8s connection fields are read from the kubernetes plugin config (NOT from `cluster-1`)
- **AND** `KubeConfig.loadFromOptions()` is called with the kubernetes plugin cluster's fields
- **AND** plugin-specific fields (`kubeflow-model-catalog-url`, `default-owner`, `default-lifecycle`) are still read from `cluster-1`

#### Scenario: kubernetesPluginRef takes precedence over direct fields

- **GIVEN** `cluster-1` has both `kubernetesPluginRef: my-k8s-cluster` AND `url: https://other.example.com`
- **AND** the referenced kubernetes plugin cluster has `url: https://kubernetes-plugin.example.com`
- **WHEN** the connector plugin initializes
- **THEN** `url` from the kubernetes plugin config (`https://kubernetes-plugin.example.com`) is used
- **AND** the direct `url` in `cluster-1` is ignored for K8s connection

#### Scenario: kubernetesPluginRef not found — falls through to direct config

- **GIVEN** `cluster-1` has `kubernetesPluginRef: nonexistent-cluster`
- **AND** no cluster with that name exists in `kubernetes.clusterLocatorMethods`
- **AND** `cluster-1` also has `url` and `serviceAccountToken` fields
- **WHEN** the connector plugin initializes
- **THEN** a warning is logged: `kubernetesPluginRef 'nonexistent-cluster' not found`
- **AND** the direct config fields (`url`, `serviceAccountToken`) are used instead (per D7 precedence)

#### Scenario: kubernetesPluginRef not found and no direct config

- **GIVEN** `cluster-1` has `kubernetesPluginRef: nonexistent-cluster`
- **AND** no cluster with that name exists in `kubernetes.clusterLocatorMethods`
- **AND** `cluster-1` has no `url` or `serviceAccountToken` fields
- **WHEN** the connector plugin initializes
- **THEN** a warning is logged
- **AND** `loadFromDefault()` is used as final fallback

#### Scenario: kubernetesPluginRef without kubernetes config section

- **GIVEN** `cluster-1` has `kubernetesPluginRef: my-cluster`
- **AND** there is no `kubernetes` section in `app-config.yaml`
- **AND** `cluster-1` has no direct `url` or `serviceAccountToken` fields
- **WHEN** the connector plugin initializes
- **THEN** a warning is logged
- **AND** `loadFromDefault()` is used as final fallback

#### Scenario: kubernetesPluginRef cluster uses non-serviceAccount authProvider

- **GIVEN** `cluster-1` has `kubernetesPluginRef: my-k8s-cluster`
- **AND** the referenced cluster in `kubernetes.clusterLocatorMethods` has `authProvider: oidc`
- **AND** the referenced cluster also has a valid `serviceAccountToken`
- **WHEN** the connector plugin initializes
- **THEN** a warning is logged indicating `authProvider 'oidc'` is not supported and only `serviceAccount` is used
- **AND** the `serviceAccountToken` is still used for the connection (per D5)

---

## Config Precedence

### Requirement: Config fields take precedence over environment variables

K8s credentials from `app-config.yaml` SHALL take precedence over local dev options (`K8S_TOKEN` env var, `KUBECONFIG` env var, `~/.kube/config` from `oc login`).

#### Scenario: Config fields override K8S_TOKEN

- **GIVEN** `cluster-1` has `url` and `serviceAccountToken` configured
- **AND** `K8S_TOKEN` env var is also set to a different token
- **WHEN** the connector plugin initializes
- **THEN** the `serviceAccountToken` from config is used
- **AND** the `K8S_TOKEN` env var is ignored

#### Scenario: Config fields override kubeconfig from oc login

- **GIVEN** `cluster-1` has `url` and `serviceAccountToken` configured
- **AND** `~/.kube/config` exists from a previous `oc login` to a different cluster
- **WHEN** the connector plugin initializes
- **THEN** the config fields are used (via `loadFromOptions`)
- **AND** `~/.kube/config` is NOT read

#### Scenario: No config fields — K8S_TOKEN env var used as fallback

- **GIVEN** `cluster-1` has no `url` or `serviceAccountToken`
- **AND** no `kubernetesPluginRef` is set
- **AND** `K8S_TOKEN` env var is set
- **WHEN** the connector plugin initializes
- **THEN** `loadFromDefault()` is used for the KubeConfig
- **AND** the token is overridden with `K8S_TOKEN` env var value

#### Scenario: No config fields — KUBECONFIG env var used as fallback

- **GIVEN** `cluster-1` has no `url` or `serviceAccountToken`
- **AND** no `kubernetesPluginRef` is set
- **AND** `KUBECONFIG` env var points to a valid kubeconfig file
- **WHEN** the connector plugin initializes
- **THEN** `loadFromDefault()` reads the kubeconfig from the path in `KUBECONFIG`

#### Scenario: No config fields — ~/.kube/config from oc login used as fallback

- **GIVEN** `cluster-1` has no `url` or `serviceAccountToken`
- **AND** no `kubernetesPluginRef` is set
- **AND** `~/.kube/config` exists from `oc login` / `kubectl login`
- **WHEN** the connector plugin initializes
- **THEN** `loadFromDefault()` reads `~/.kube/config` automatically

#### Scenario: No config, no env vars, no kubeconfig — loadFromDefault fails gracefully

- **GIVEN** `cluster-1` has no K8s connection fields
- **AND** no `kubernetesPluginRef` is set
- **AND** no `K8S_TOKEN` or `KUBECONFIG` env vars are set
- **AND** `~/.kube/config` does not exist
- **WHEN** the connector plugin initializes
- **THEN** `loadFromDefault()` is called and fails with a K8s client error

---

## baseUrl Removal

### Requirement: Entity provider uses DiscoveryService exclusively

The entity provider SHALL use `DiscoveryService.getBaseUrl()` to resolve the connector's URL. The `baseUrl` config field SHALL be removed.

#### Scenario: Entity provider run() uses discovery

- **WHEN** `ModelCatalogResourceEntityProvider.run()` executes
- **THEN** it calls `this.discovery.getBaseUrl(this.name)` to get the connector URL
- **AND** no `baseUrl` field exists on the entity provider instance
- **AND** no fallback logic for `baseUrl` vs `svcUrl` exists

#### Scenario: baseUrl in app-config is ignored

- **GIVEN** `app-config.yaml` has `baseUrl: http://localhost:7007` at the connector level
- **WHEN** the entity provider reads config
- **THEN** `baseUrl` is not read from config
- **AND** the config.d.ts schema does not include `baseUrl`

---

## ConnectorConfig / ReconcilerConfig Merge

### Requirement: Single config type for connector plugin

The connector plugin SHALL use a single `ReconcilerConfig` type. The `ConnectorConfig` interface SHALL be removed.

#### Scenario: plugin.ts builds ReconcilerConfig directly

- **WHEN** `plugin.ts` reads cluster config from `app-config.yaml`
- **THEN** it constructs a `ReconcilerConfig` object directly
- **AND** no `ConnectorConfig` type is referenced anywhere in the codebase

#### Scenario: Optional fields have defaults

- **GIVEN** `ReconcilerConfig.defaultOwner` is `undefined`
- **WHEN** `setupInformer` processes the config
- **THEN** `defaultOwner` is set to `process.env.OWNER || 'default-owner'`
- **AND** the same pattern applies to `defaultLifecycle` (`process.env.LIFECYCLE || 'production'`)

---

## Config Schema

### Requirement: config.d.ts declares K8s connection fields

The config schema SHALL declare K8s connection fields in the cluster sub-key type so Backstage config validation does not strip them.

#### Scenario: K8s fields pass config validation

- **WHEN** `app-config.yaml` contains `url`, `serviceAccountToken`, `skipTLSVerify`, `caData` under a cluster sub-key
- **THEN** Backstage config validation preserves these fields
- **AND** the connector plugin can read them via `config.getOptionalString('url')`, etc.

#### Scenario: Secret visibility

- **WHEN** `serviceAccountToken` or `caData` values are present in config
- **THEN** they are annotated with `@visibility secret` in `config.d.ts`
- **AND** Backstage's config system masks them in logs and frontend exposure

#### Scenario: kubernetesPluginRef field passes validation

- **WHEN** `app-config.yaml` contains `kubernetesPluginRef` under a cluster sub-key
- **THEN** the field passes config validation
- **AND** its value is readable via `config.getOptionalString('kubernetesPluginRef')`

---

## K8s RBAC

### Requirement: Example RBAC YAML grants minimum required permissions

The example K8s RBAC YAML SHALL grant exactly the permissions the connector needs — no more, no less.

#### Scenario: InferenceService access

- **GIVEN** the ClusterRole from the example RBAC YAML is applied
- **WHEN** the connector's informer watches InferenceServices
- **THEN** the watch, list, and get operations succeed

#### Scenario: Route access (OpenShift only)

- **GIVEN** the ClusterRole is applied on an OpenShift cluster
- **WHEN** `setupCatalogRoute` lists routes by label
- **THEN** the list operation succeeds

#### Scenario: ServiceAccount listing

- **GIVEN** the ClusterRole is applied
- **WHEN** `getAuthentication` lists ServiceAccounts in a namespace
- **THEN** the list and get operations succeed

---

## Build and Quality

### Requirement: All quality gates pass

#### Scenario: TypeScript compilation

- **WHEN** `yarn tsc` is run from the workspace root
- **THEN** it completes with zero errors

#### Scenario: Full build

- **WHEN** `yarn build:all` is run
- **THEN** it completes with zero errors

#### Scenario: Unit tests

- **WHEN** `yarn test:all` is run
- **THEN** all existing tests pass (no new test failures introduced)

#### Scenario: Code formatting

- **WHEN** `yarn prettier` is run
- **THEN** no formatting changes are needed

#### Scenario: Lint

- **WHEN** `yarn lint:all` is run
- **THEN** no lint errors are reported
