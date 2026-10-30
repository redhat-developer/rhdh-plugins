---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
---

Add optional `spec.spawn` field to the agent AiResource entity definition. Accepts `'none'`, `'local'`, or `'ephemeral'` to declare the agent's execution spawn mode. Omitting the field preserves backward compatibility.
