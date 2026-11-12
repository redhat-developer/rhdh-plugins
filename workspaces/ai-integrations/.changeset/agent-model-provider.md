---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

**BREAKING**: Change the optional agent `spec.model` from a string to an object
with required non-empty `provider` and `name` strings. Migrate existing
`model: gpt-4o` values to `model: { provider: openai, name: gpt-4o }` using
the appropriate provider and model identifier. Update ingestion validation
to enforce the same shape.
