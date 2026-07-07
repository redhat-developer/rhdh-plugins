---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog': minor
'@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend': minor
'@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend': patch
---

Integrate Backstage discovery and auth services for connector communication.

The model-catalog entity provider now resolves the connector base URL via the
discovery service and authenticates with backend-to-backend service tokens
instead of unauthenticated direct HTTP calls. The `fromConfig` factory method
accepts `discovery` and `auth` as additional required dependencies.

The techdoc URL reader adds bearer-token authentication when fetching model
cards and replaces hostname-based bridge URL matching with path-based matching
that uses the connector plugin ID.
