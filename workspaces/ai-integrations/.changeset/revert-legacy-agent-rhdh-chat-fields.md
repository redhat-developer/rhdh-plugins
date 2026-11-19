---
'@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent': major
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent': major
---

Revert the RHDH chat-specific `spec.inferenceProvider` and `spec.executionMode` additions to the legacy `AiResource` agent contract (`spec.type: agent`). These fields now belong to the separate `agent-rhdh-chat` spec type provided by `@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent-rhdh-chat`.

**Breaking changes**

- `AgentAiResourceEntityV1alpha1['spec']` no longer declares `inferenceProvider` or `executionMode`, and the agent JSON schema no longer defines them.
- The agent catalog processor no longer validates `spec.inferenceProvider` or `spec.executionMode`. Entities that need these fields should use `spec.type: agent-rhdh-chat` instead.
