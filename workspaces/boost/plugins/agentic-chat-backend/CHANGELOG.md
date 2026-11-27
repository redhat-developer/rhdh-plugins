# @red-hat-developer-hub/backstage-plugin-agentic-chat-backend

## 0.2.0

### Minor Changes

- 402e48d: Require frontend agentRef, provider and model selections in agent run requests. Resolve the selected accessible Catalog agent per request and forward frontend provider/model to LCore instead of deriving execution settings from the Catalog model.

  Send interpreted agent information and inference_provider directly to LCore, without a workflow definition or a duplicate top-level provider. LCore constructs the single-agent workflow.

- 402e48d: Resolve agent-rhdh-chat Catalog entities and forward their optional modelConfig when the frontend selection matches the Catalog provider and model.

### Patch Changes

- 402e48d: Add an unauthenticated health endpoint for the Agentic Chat backend.
- 402e48d: Preserve `conversation_id` in interpreted agent requests and defer conversation ID format validation to LCORE.
- Updated dependencies [402e48d]
- Updated dependencies [402e48d]
- Updated dependencies [402e48d]
  - @red-hat-developer-hub/backstage-plugin-agentic-chat-common@0.2.0
