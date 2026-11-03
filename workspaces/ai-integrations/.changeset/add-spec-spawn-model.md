---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': minor
---

Add optional `spec.executionMode` field to the agent AiResource entity definition. Accepts `'in-process'` (runs inside the LCore process, no isolation), `'subprocess'` (runs in a child process managed by LCore), or `'sandbox'` (runs in an administrator-predefined sandbox profile). Omitting the field preserves backward compatibility.
