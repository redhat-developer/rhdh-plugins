---
'@red-hat-developer-hub/backstage-plugin-agentic-chat-backend': minor
'@red-hat-developer-hub/backstage-plugin-agentic-chat-common': minor
---

Require frontend agentRef, provider and model selections in agent run requests. Resolve the selected accessible Catalog agent per request and forward frontend provider/model to LCore instead of deriving execution settings from the Catalog model.

Send interpreted agent information and inference_provider directly to LCore, without a workflow definition or a duplicate top-level provider. LCore constructs the single-agent workflow.
