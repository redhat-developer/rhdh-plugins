---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

Add the optional agent `spec.inferenceProvider` object with required non-empty
`name` (inference provider identifier) and `model` (model identifier) strings.
Keep the existing optional `spec.model` string unchanged.
Update schema and ingestion validation, tests, documentation, and examples accordingly.
