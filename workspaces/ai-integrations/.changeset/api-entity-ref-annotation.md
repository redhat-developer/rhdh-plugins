---
'@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog': minor
---

Add support for the `rhdh.io/api-entity-ref` annotation on KServe InferenceServices. The annotation value is normalized to a fully qualified entity reference and set as `spec.apiEntityRef` on the generated `AiModelServerAPI` entity.
