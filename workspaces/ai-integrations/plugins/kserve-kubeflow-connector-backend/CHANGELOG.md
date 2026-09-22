# @red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend

## 0.3.0

### Minor Changes

- b194796: Add cluster-internal Service URL fallback for KServe resources without a status URL. When an InferenceService or LLMInferenceService is Ready but has no status.url or status.address.url, the connector now discovers an owned Kubernetes Service in the same namespace and derives a cluster-internal endpoint from it. The original informer cache object is never mutated; a clone carries the enriched URL through reconciliation. Informer startup is now independent — a missing CRD for one resource kind no longer prevents the other from starting.

## 0.2.0

### Minor Changes

- e15e722: Add support for the `rhdh.io/api-entity-ref` annotation on KServe InferenceServices. The annotation value is normalized to a fully qualified entity reference and set as `spec.apiEntityRef` on the generated `AiModelServerAPI` entity.
- 5d966c4: Add LLMInferenceService (serving.kserve.io/v1alpha2) discovery support alongside existing InferenceService watching.

## 0.1.6

### Patch Changes

- 6088511: Backstage version bump to v1.54.6

## 0.1.5

### Patch Changes

- f9ddee8: Filter the reconciliation tracking set through readiness checks so that stopped InferenceServices are excluded, allowing the cleanup logic to properly delete their stale catalog entries.

## 0.1.4

### Patch Changes

- bc92626: Use metadata.resourceVersion instead of status condition timestamps to detect InferenceService changes, fixing missed annotation-only updates.

## 0.1.3

### Patch Changes

- dbce029: Bump ai-integrations workspace to Backstage v1.54.0

## 0.1.2

### Patch Changes

- f7984e7: add remaining unit tests needed for feature readiness
- f27d2cd: address various typescript idioms left over from the conversion from golang

## 0.1.1

### Patch Changes

- 56c40be: Integrate Backstage discovery and auth services for connector communication.

  The model-catalog entity provider now resolves the connector base URL via the
  discovery service and authenticates with backend-to-backend service tokens
  instead of unauthenticated direct HTTP calls. The `fromConfig` factory method
  accepts `discovery` and `auth` as additional required dependencies.

  The techdoc URL reader adds bearer-token authentication when fetching model
  cards and replaces hostname-based bridge URL matching with path-based matching
  that uses the connector plugin ID.
