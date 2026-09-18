---
'@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend': minor
---

Add cluster-internal Service URL fallback for KServe resources without a status URL. When an InferenceService or LLMInferenceService is Ready but has no status.url or status.address.url, the connector now discovers an owned Kubernetes Service in the same namespace and derives a cluster-internal endpoint from it. The original informer cache object is never mutated; a clone carries the enriched URL through reconciliation. Informer startup is now independent — a missing CRD for one resource kind no longer prevents the other from starting.
