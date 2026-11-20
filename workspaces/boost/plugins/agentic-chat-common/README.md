# Agentic chat common

Shared request and permission contracts for agentic chat.

- `agenticChatPermission` defines the `agentic-chat.chat` permission with RBAC action `use`.
- `runAgentRequestSchema` validates the browser's `RunAgentRequest`. It requires nonblank `agentRef`, `query`, `provider`, and `model`, accepts an optional `conversation_id`, and rejects unknown fields.

The frontend selects the agent, provider, and model. The backend resolves the agent through Catalog using the caller's credentials and reads its instructions and capabilities from the Catalog entity.

The package also exports `AgentExecutionInput` for the backend's request to LCORE and `AgentExecutionMode` for Catalog execution modes. The [backend README](../agentic-chat-backend/README.md#successful-responses) documents browser-facing responses.
