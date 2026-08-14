---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

Add `AiResourceAgentProcessor` to validate agent-specific fields on
`kind: AiResource` entities with `spec.type: agent` at catalog ingestion.
Register the processor alongside the existing agent catalog model source.
