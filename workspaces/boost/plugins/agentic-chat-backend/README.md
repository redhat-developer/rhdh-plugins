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

- POST `/v1/agent/run`: `{ "query": "Hello", "provider": "openai", "model": "gpt-4o", "agentRef": "airesource:default/support", "conversation_id": "550e8400-e29b-41d4-a716-446655440000" }`. `agentRef`, `query`, `provider` and `model` are required nonblank strings. Missing or invalid selections return 400 without calling LCORE. The requested agent is resolved through Catalog using the caller's credentials. Each request selects one accessible agent from any number of Catalog agents. Missing agents return 404; Catalog access denials prevent dispatch. Caller-supplied identity, definitions and capability overrides are rejected.
- GET `/v2/conversations`: proxy the authenticated caller's history request.
- GET `/v2/conversations/:conversationId`: proxy one conversation.
- DELETE `/v2/conversations/:conversationId`: proxy deletion and preserve the runtime's status/body, including no-content responses.

### Successful responses

The backend passes through LCORE's success status and JSON body. The routes below are relative to `/api/agentic-chat`.

- POST `/v1/agent/run` returns `202 Accepted` with `{ "workflow_id": "wf-1", "status": "running" }` when LCORE accepts the run.
- GET `/v2/conversations` returns `200 OK` with a `conversations` array. Each entry contains `conversation_id`, `topic_summary` (which can be null), and `last_message_timestamp` (Unix seconds). An empty list is `{ "conversations": [] }`.
- GET `/v2/conversations/:conversationId` returns `200 OK` with `conversation_id` and a `chat_history` array of turns.
- DELETE `/v2/conversations/:conversationId` returns `200 OK` with `conversation_id`, a boolean `deleted`, and a human-readable `response` when LCORE returns JSON. If the runtime returns `204 No Content`, the response has an empty body.

The backend forwards conversation IDs to LCORE for format validation. The `conversation_id` field in an agent run request is optional.

See the [LCORE conversation response models](https://github.com/lightspeed-core/lightspeed-stack/blob/main/src/models/api/responses/successful/conversations.py) for details on the conversation payloads.

## Single-agent mapping

Chat runs use Catalog `AiResource` entities with `spec.type: agent-rhdh-chat`. Catalog `metadata.name` becomes `agent`; request `query` becomes `prompt`. Instructions, tools and object outputSchema map to `instructions`, `tools` and `output_schema`. The frontend request supplies `provider` → `inference_provider.name` and `model` → `inference_provider.model`. No top-level `provider` is sent to LCORE; the interpreted agent's `inference_provider` is the selection source. Frontend selection takes precedence over Catalog model/provider values. The optional Catalog `spec.inferenceProvider.modelConfig` supplies `temperature` and `maxTokens` only when both selected values match the Catalog provider and model. Selecting a different provider or model omits `inference_provider.modelConfig`. LCORE validates provider/model authorization and resolves credentials; the browser cannot supply credentials or capabilities.

`executionMode` maps in-process → none, subprocess → local, sandbox → ephemeral. Omission stays absent, allowing the runtime default. RHDH sends a flat interpreted-agent body, with no workflow envelope or step name/type/output_key. Optional `conversation_id` is forwarded unchanged as conversation identity. LCORE constructs the workflow and supplies its fixed step name `agent`, type `agent` and output key `result`. String-form outputSchema is rejected. LCORE validates and carries model settings as run metadata. The pinned Cloud Agents executor does not apply them to inference. Tool identifiers pass through unchanged as requested; the runtime must resolve and enforce them.
