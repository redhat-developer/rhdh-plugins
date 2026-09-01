# @red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend

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
