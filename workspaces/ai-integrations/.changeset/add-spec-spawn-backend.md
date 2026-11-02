---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

Validate the new optional `spec.executionMode` field on agent AiResource entities. The processor and `collectAgentErrors` now accept `'in-process'`, `'subprocess'`, or `'sandbox'` and reject invalid values.
