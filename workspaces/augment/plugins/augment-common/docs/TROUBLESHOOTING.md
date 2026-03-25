# Troubleshooting

Common issues and diagnostic steps for the Augment plugin.

## 400 Error When Updating Agent Config via Admin Console

### Symptom

Saving agent configuration through the admin console returns HTTP 400 (Bad Request).

### Diagnostic Steps

**Step 1: Check the exact error message**

The 400 response body contains a specific validation error. Check the browser's Network tab or the backend logs for the full message. Common messages:

| Error Message                                                 | Cause                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Agent "X" must have a non-empty name`                        | The `name` field is missing or empty                                                       |
| `Agent "X" must have non-empty instructions`                  | The `instructions` field (the agent's system prompt) is missing or empty                   |
| `Agent "X" has handoff to "Y" which does not exist`           | Agent X references agent Y in its `handoffs` array, but Y is not in the roster being saved |
| `Agent "X" has asTools reference to "Y" which does not exist` | Agent X references agent Y in its `asTools` array, but Y is not in the roster              |
| `agents must be a non-null object`                            | The payload structure is wrong (not a `{ key: agentConfig }` object)                       |
| `Request body must contain a "value" field`                   | The PUT request body is missing `{ "value": ... }`                                         |

**Step 2: Verify the plugin is loaded**

If the YAML ConfigMap was "cleaned up" and `augment.llamaStack.baseUrl` or `augment.llamaStack.model` were removed, the plugin will not load at all.

Check:

- `GET /api/augment/status` — if it returns 404, the plugin never loaded
- Pod logs — look for `Augment configuration validated successfully` (plugin loaded) or `ConfigValidationError` (plugin failed to load)

**Step 3: Understand the agent save behavior**

The admin UI sends the **entire agent roster** as a single `PUT /admin/config/agents` request. There is no partial update for individual agents. This means:

- If any single agent in the payload fails validation, the entire save is rejected
- All `handoffs` and `asTools` references must point to agent keys that exist within the same save payload
- Removing an agent from the roster and saving will permanently remove it (DB agents fully replace YAML agents)

**Step 4: Check if agents were ever in the DB**

If agents were previously defined in YAML and the YAML was cleaned up without first saving them through the admin console, the DB has no agent data. The system falls back to YAML, which now has nothing. The admin UI may be trying to save agents for the first time with an incomplete payload.

### Resolution

Ensure every agent in the save payload has at minimum:

```json
{
  "agentKey": {
    "name": "Agent Display Name",
    "instructions": "You are a helpful agent that..."
  }
}
```

And that all `handoffs` / `asTools` references point to keys that exist in the same object.

---

## Plugin Not Loading in RHDH

### Symptom

The Augment page shows a blank screen, 404 errors, or the plugin is missing from the sidebar.

### Diagnostic Steps

1. **Verify OCI image is accessible**: The RHDH pod must be able to pull the OCI image specified in `dynamic-plugins.override.yaml`.

2. **Check ConfigMap**: The plugin requires at minimum:

   ```yaml
   augment:
     llamaStack:
       baseUrl: 'https://your-llama-stack-server.com'
       model: 'your-model-id'
   ```

   If these are missing, the Backstage config schema validation will reject the plugin before it even initializes.

3. **Check `dynamic-plugins.override.yaml`**: Verify the plugin entries are present with `disabled: false`.

4. **Review pod logs**:
   ```bash
   # RHDH pod logs
   podman compose logs rhdh
   # or in OpenShift
   oc logs deployment/rhdh
   ```
   Look for:
   - `Augment configuration validated successfully` — plugin loaded
   - `ConfigValidationError` — missing required config
   - `Failed to initialize` — provider or network error

---

## RAG Not Returning Results

### Symptom

Questions receive generic answers without referencing the knowledge base.

### Diagnostic Steps

1. **Check vector store**: Verify `vectorStoreId` or `vectorStoreIds` in the YAML config points to a valid vector store. If omitted, the plugin auto-creates one named `augment-knowledge-base`.

2. **Check document ingestion**: Go to `GET /api/augment/documents` to see if documents have been indexed. If the list is empty, check:
   - The `documents` section in YAML has configured sources
   - The sources are accessible (URLs reachable, GitHub token valid, directories exist)
   - Pod logs for ingestion errors

3. **Check Llama Stack server**: Ensure the Llama Stack server has the Files API, Vector Stores API, and file_search tool support enabled.

4. **Check score threshold**: If `fileSearchScoreThreshold` is set too high in the vector store config, relevant results may be filtered out.

---

## MCP Tools Not Available

### Symptom

MCP tools don't appear in the agent status panel or fail when called.

### Diagnostic Steps

1. **Verify MCP server URL**: The URL must be reachable from wherever tool execution happens:
   - In `direct` mode: reachable from the Llama Stack server
   - In `backend` mode: reachable from the Backstage backend pod

2. **Check server type**: Must be `streamable-http` or `sse`.

3. **Check disabled servers**: The admin UI can disable MCP servers via `disabledMcpServerIds`. Check `GET /admin/effective-config` to see the merged MCP server list.

4. **Check agent scoping**: In multi-agent mode, each agent can only access MCP servers listed in its `mcpServers` array. If the array is empty or missing, the agent has no MCP access.

5. **Test connection**: Use `POST /admin/mcp/test-connection` with the server URL to verify connectivity.

---

## Conversation History Not Loading

### Symptom

Previous conversations are not visible or fail to load.

### Diagnostic Steps

1. **Check Llama Stack Conversations API**: The plugin uses `/v1/conversations` for persistence. Verify the Llama Stack server has this endpoint available.

2. **Check ZDR mode**: If `zdrMode: true` is set in YAML, responses are not stored server-side and conversation history is disabled.

3. **Check network requests**: In the browser's Network tab, look for errors on `GET /api/augment/conversations`.

---

## Admin Console Shows "Config Not Loading"

### Symptom

The admin panel tabs display loading spinners or error messages.

### Diagnostic Steps

1. **Check admin access**: In `plugin-only` or `full` security mode, only users listed in `security.adminUsers` (or with RBAC admin policy when `permission.enabled: true`) can access the admin panel.

2. **Check database**: The admin config is stored in the plugin's database. If the database is unreachable:
   - Admin reads will fail
   - Chat will still work (falls back to YAML baseline)
   - Pod logs will show `Failed to read admin config overrides, using YAML baseline`

3. **Check the effective config endpoint**: `GET /admin/effective-config` returns the merged config. If this works, the issue is in a specific admin panel component.

---

## Config Changes Not Taking Effect

### Symptom

After changing a value in the admin console or YAML, the old value is still used.

### Diagnostic Steps

1. **Admin console changes**: These take effect within 5 seconds (the runtime config cache TTL). The cache is also invalidated immediately after a save. If changes still don't apply, check:
   - The save returned a success response
   - `GET /admin/effective-config` shows the new value
   - The browser is not caching the old page

2. **YAML changes**: YAML changes require a full backend restart. There is no hot-reload.

3. **"Invisible YAML" problem**: If a DB override exists for a key, YAML changes to that key are silently ignored. Check `GET /admin/config/:key` — if `source` is `'database'`, the DB value is active. Reset to defaults (`DELETE /admin/config/:key`) to revert to YAML.

4. **YAML-only keys**: Some keys cannot be overridden by the admin UI (see [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md)). Changes to these always require a restart.
