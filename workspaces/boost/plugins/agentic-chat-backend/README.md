# Agentic chat backend

Package: `@red-hat-developer-hub/backstage-plugin-agentic-chat-backend`.
Directory: `workspaces/boost/plugins/agentic-chat-backend`.
Plugin ID: `agentic-chat`; Backstage base path: `/api/agentic-chat`.

The Boost development backend registers this plugin in `packages/backend`. For another Backstage backend with the Catalog service, register it with:

```ts
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-agentic-chat-backend'),
);
```

```yaml
agentic-chat:
  servicePort: 8090
```

All routes use `agentic-chat.chat` with RBAC action `use`:

```csv
p, role:default/agentic-chat-user, agentic-chat.chat, use, allow
g, group:default/APPROVED_GROUP, role:default/agentic-chat-user
```

- POST `/v1/agent/run`: `{ "query": "Hello", "provider": "openai", "model": "gpt-4o", "agentRef": "airesource:default/support", "conversation_id": "optional-conversation-id" }`. `agentRef`, `query`, `provider` and `model` are required nonblank strings. Missing or invalid selections return 400 without calling LCore. The requested agent is resolved through Catalog using the caller's credentials. Each request selects one accessible agent from any number of Catalog agents. Missing agents return 404; Catalog access denials prevent dispatch. Caller-supplied identity, definitions and capability overrides are rejected.
- GET `/v2/conversations`: proxy the authenticated caller's history request.
- GET `/v2/conversations/:conversationId`: proxy one conversation.
- DELETE `/v2/conversations/:conversationId`: proxy deletion and preserve the runtime's status/body, including no-content responses.

## Single-agent mapping

Catalog `metadata.name` becomes `agent`; request `query` becomes `prompt`. Instructions, tools and object outputSchema map to `instructions`, `tools` and `output_schema`. The frontend request supplies `provider` → `inference_provider.name` and `model` → `inference_provider.model`. No top-level `provider` is sent to LCore; the interpreted agent's `inference_provider` is the selection source. Frontend selection takes precedence over Catalog model/provider values. Catalog `spec.model` is not used for execution. LCore validates provider/model authorization and resolves credentials; the browser cannot supply credentials or capabilities.

`executionMode` maps in-process → none, subprocess → local, sandbox → ephemeral. Omission stays absent, allowing the runtime default. RHDH sends a flat interpreted-agent body, with no workflow envelope or step name/type/output_key. Optional `conversation_id` is forwarded unchanged as conversation identity. LCore constructs the workflow and supplies its fixed step name `agent`, type `agent` and output key `result`. Catalog handoffs are ignored and are not forwarded or traversed. String-form outputSchema is rejected. SDK model settings are outside this slice. Tool identifiers pass through unchanged as requested; the runtime must resolve and enforce them.
