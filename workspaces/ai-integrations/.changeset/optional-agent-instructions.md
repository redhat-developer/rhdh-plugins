---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': minor
---

Make `spec.instructions` optional on agent AiResource entities so agents
with a baked-in default prompt can be registered without a catalog-side
system prompt.
