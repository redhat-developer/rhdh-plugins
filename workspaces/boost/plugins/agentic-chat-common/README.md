# Agentic chat common

Browser-safe permission, run-request schema and interpreted-agent input types for the agentic-chat backend. This package imports no backend service or execution SDK.

Exports `agenticChatPermission` (`agentic-chat.chat`, RBAC action `use`), `runAgentRequestSchema`, `RunAgentRequest`, `AgentExecutionMode`, `AgentExecutionInput`.

Run requests require nonblank `agentRef`, `query`, `provider` and `model` strings, with optional `conversation_id`. The backend resolves the requested agent through authorized Catalog access for each run. Provider/model selection comes from the frontend; agent instructions and capabilities remain Catalog-owned. Unknown request fields are rejected.
