# Intelligent Assistant Backend

This is the intelligent-assistant backend plugin that enables you to interact with any LLM server running a model with OpenAI's API compatibility.

## Getting Started

### Installing the plugin

```bash
yarn add --cwd packages/backend  @red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend
```

### Configuring the Backend

Add the following to your `packages/backend/src/index.ts` file:

```ts title="packages/backend/src/index.ts"
const backend = createBackend();

// Add the following line
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend'),
);

backend.start();
```

### Migration from `lightspeed` to `intelligent-assistant`

If you are upgrading from a previous version, follow the steps below.

#### 1. npm packages

```bash
# Remove old packages
yarn remove @red-hat-developer-hub/backstage-plugin-lightspeed
yarn remove @red-hat-developer-hub/backstage-plugin-lightspeed-backend
yarn remove @red-hat-developer-hub/backstage-plugin-lightspeed-common

# Install new packages
yarn add @red-hat-developer-hub/backstage-plugin-intelligent-assistant
yarn add @red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend
yarn add @red-hat-developer-hub/backstage-plugin-intelligent-assistant-common
```

#### 2. Backend plugin import

Update `packages/backend/src/index.ts`:

```typescript
// Before
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-lightspeed-backend'),
);

// After
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend'),
);
```

#### 3. `app-config.yaml` namespace

Rename the top-level configuration key:

```yaml
# Before
lightspeed:
  notebooks:
    enabled: true

# After
intelligent-assistant:
  notebooks:
    enabled: true
```

All nested keys (`servicePort`, `systemPrompt`, `prompts`, `mcpServers`, `notebooks`, etc.) remain the same.

#### 4. RBAC policy names

Update permission names in your `rbac-policy.csv`:

| Before                     | After                                            |
| -------------------------- | ------------------------------------------------ |
| `lightspeed.chat.read`     | `intelligent-assistant.conversations.access`     |
| `lightspeed.chat.create`   | `intelligent-assistant.chat.use`                 |
| `lightspeed.chat.delete`   | `intelligent-assistant.conversations.manage`     |
| `lightspeed.chat.update`   | `intelligent-assistant.chat.update`              |
| `lightspeed.notebooks.use` | `intelligent-assistant.notebooks.use`            |
| `lightspeed.mcp.read`      | `intelligent-assistant.mcp.read`                 |
| `lightspeed.mcp.manage`    | `intelligent-assistant.mcp.manage`               |

#### 5. OFS dynamic plugin configuration

The top-level plugin key, route path, and drawer `config.id` change. `importName` values are **unchanged**:

```yaml
# Before
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-lightspeed:
      dynamicRoutes:
        - path: /lightspeed
          importName: LightspeedPage
          module: Legacy
      mountPoints:
        - mountPoint: application/internal/drawer-content
          importName: LightspeedChatContainer
          module: Legacy
          config:
            id: lightspeed

# After
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-intelligent-assistant:
      dynamicRoutes:
        - path: /intelligent-assistant
          importName: LightspeedPage          # unchanged
          module: Legacy
      mountPoints:
        - mountPoint: application/internal/drawer-content
          importName: LightspeedChatContainer  # unchanged
          module: Legacy
          config:
            id: intelligent-assistant
```

#### 6. NFS extension configuration

Update extension names in `app-config.yaml`:

```yaml
# Before
app:
  extensions:
    - app-root-wrapper:app/lightspeed-fab
    - app-drawer-content:lightspeed/lightspeed
    - translation:app/lightspeed-translations

# After
app:
  extensions:
    - app-root-wrapper:app/intelligent-assistant-fab
    - app-drawer-content:intelligent-assistant/intelligent-assistant
    - translation:app/intelligent-assistant-translations
```

#### 7. NFS module imports

For non-dynamic-plugin NFS consumers, update module imports:

```typescript
// Before

// After
import {
  intelligentAssistantFABModule,
  intelligentAssistantRedirectModule,
  intelligentAssistantTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant';
import {
  lightspeedFABModule,
  lightspeedRedirectModule,
  lightspeedTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed';
```

#### 8. Scalprum `exposedModules` keys

For OFS deployments referencing NFS modules:

```yaml
# Before
module: LightspeedFABModule
module: LightspeedTranslationsModule

# After
module: IntelligentAssistantFABModule
module: IntelligentAssistantTranslationsModule
```

> **Warning**: The old `lightspeed:` config key and `lightspeed.*` permission names are no longer recognized. Existing deployments that do not update will silently lose functionality.

### Plugin Configurations

Add the following intelligent-assistant configurations into your `app-config.yaml` file:

```yaml
intelligent-assistant:
  servicePort: <portNumber> # Optional - Change the LS service port number. Defaults to 8080.
  systemPrompt: <system prompt> # Optional - Override the default system prompt.
  prompts: # Optional - Custom prompts displayed to users in the chat UI
    - title: <prompt_title>
      message: <prompt_message>
  mcpServers: # Optional - one or more MCP servers
    - name: <mcp server name> # must match the name configured in LCS
      token: ${MCP_TOKEN}
  rateLimit: # Optional - per-user request rate limits (defaults apply if omitted)
    expensive:
      max: 25 # Max requests per minute per user for expensive endpoints (default: 25). Set to 0 to disable.
    general:
      max: 200 # Max requests per minute per user for other authenticated endpoints (default: 200). Set to 0 to disable.
```

#### Rate limiting

The backend applies per-user rate limits to authenticated endpoints as an abuse
prevention measure. Limits are keyed by the authenticated user's entity ref and
use a fixed 1-minute window.

**Tiers**:

- **Expensive** (default: 25 requests/minute per user): `POST /v1/query`, and
  (when Notebooks is enabled) notebook document uploads and RAG queries.
- **General** (default: 200 requests/minute per user): all other authenticated
  endpoints, including conversation listing, MCP server management, feedback,
  and notebook session CRUD.
- **Excluded**: `/health` and `/notebooks/health` are not rate limited.

When a limit is exceeded, the API returns `429 Too Many Requests` with a
`Retry-After` header and a JSON error body (`RateLimitExceeded`).

Set `max: 0` on a tier to disable rate limiting for that tier. If the entire
`rateLimit` block is omitted, the defaults above apply.

**Example** — tighter limits for a small deployment:

```yaml
intelligent-assistant:
  rateLimit:
    expensive:
      max: 10
    general:
      max: 100
```

#### MCP servers settings endpoints

The backend exposes MCP server management endpoints used by the Intelligent Assistant UI
settings panel:

- `GET /api/intelligent-assistant/mcp-servers` lists configured servers and user-scoped
  state.
- `PATCH /api/intelligent-assistant/mcp-servers/:name` updates user settings such as
  enabled state and token.

- `POST /api/intelligent-assistant/mcp-servers/validate` validates a raw `{ url, token }`
  pair and returns whether credentials are valid.
- `POST /api/intelligent-assistant/mcp-servers/:name/validate` validates a configured server
  by name using the effective token (user token override or configured token).

These endpoints power server selection and token configuration, including inline
success/error feedback while users enter tokens.

#### DCR authentication for Backstage-internal MCP servers (optional)

By default, MCP servers use **static tokens** (`token` in app-config or a personal
token in the UI). For Backstage-internal MCP servers that support OAuth, you can
instead use **Dynamic Client Registration (DCR)**: Lightspeed mints a per-user
Backstage plugin-request token on each request — no manual token is required.

DCR is **not enabled out of the box**. Adopters must configure the Backstage
instance, Lightspeed Core (LCS), and Lightspeed app-config as follows.

**1. Backstage backend** — register the MCP actions plugin in
`packages/backend/src/index.ts` and add the dependency (pin version **0.1.12**;
do not use `^0.1.14` with `backend-defaults@0.16` — the plugin will fail to start):

```bash
yarn add --cwd packages/backend @backstage/plugin-mcp-actions-backend@0.1.12
```

```ts
backend.add(import('@backstage/plugin-mcp-actions-backend'));
```

Expose catalog/scaffolder actions as MCP tools (adjust plugin IDs for your setup):

```yaml
backend:
  actions:
    pluginSources:
      - catalog
      - scaffolder
```

**2. Backstage auth** — enable experimental DCR and use the new frontend app
(`@backstage/plugin-auth` is required for the OAuth consent flow; `yarn start`,
not `start:legacy`):

```yaml
auth:
  experimentalDynamicClientRegistration:
    enabled: true
    allowedRedirectUriPatterns:
      - '*'
```

**3. Lightspeed app-config** — mark the MCP server as DCR (omit `token`; it is
ignored when `auth: dcr` is set):

```yaml
intelligent-assistant:
  mcpServers:
    - name: test-mcp-server
      auth: dcr
```

**4. LCS (`lightspeed-stack.yaml`)** — point the server URL at your Backstage
MCP endpoint and use client authorization headers:

```yaml
mcp_servers:
  - name: test-mcp-server
    url: 'http://<backstage-host>:7007/api/mcp-actions/v1'
    authorization_headers:
      Authorization: client
```

**5. MCP clients (e.g. Cursor)** — connect to the same Backstage MCP URL. DCR
handles OAuth; no static token in `mcp.json` is needed when DCR is configured.

See also commented examples in the workspace `app-config.yaml` under
`intelligent-assistant.mcpServers` and `auth.experimentalDynamicClientRegistration`.

#### Permission Framework Support

The Intelligent Assistant Backend plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access intelligent-assistant backend API, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, intelligent-assistant.conversations.access, read, allow
p, role:default/team_a, intelligent-assistant.chat.use, create, allow
p, role:default/team_a, intelligent-assistant.conversations.manage, delete, allow
p, role:default/team_a, intelligent-assistant.chat.update, update, allow

# Required for Notebooks feature (if enabled)
p, role:default/team_a, intelligent-assistant.notebooks.use, update, allow

# Required for MCP server management (if configured)
p, role:default/team_a, intelligent-assistant.mcp.read, read, allow
p, role:default/team_a, intelligent-assistant.mcp.manage, update, allow

g, user:default/<your-user-name>, role:default/team_a

```

You can specify the path to this configuration file in your application configuration:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: /some/path/rbac-policy.csv
    policyFileReload: true
```

### Notebooks (Developer Preview)

Notebooks is an experimental feature that enables document-based conversations with Retrieval-Augmented Generation (RAG).

For user-facing feature documentation, see the [Intelligent Assistant Frontend README](../intelligent-assistant/README.md#notebooks-developer-preview).

#### Prerequisites

Notebooks requires:

- **Lightspeed Core service** to be running (provides the backend API proxy)
- **Llama Stack service** to be accessible from Lightspeed Core (provides vector database, embeddings, and RAG capabilities)

For Llama Stack setup and configuration, refer to the [Llama Stack documentation](https://github.com/llamastack/llama-stack).

#### Configuration

To enable Notebooks, add the following configuration to your `app-config.yaml`:

```yaml
intelligent-assistant:
  servicePort: 8080 # Optional: Lightspeed Core service port (default: 8080)

  notebooks:
    enabled: false # Enable Notebooks feature (default: false)

    # Required: Query defaults for RAG queries
    # Both model and provider_id must be configured together
    queryDefaults:
      model: ${NOTEBOOKS_QUERY_MODEL} # Model to use for answering queries. Must map to a model available through the provider set in $NOTEBOOKS_QUERY_PROVIDER_ID
      provider_id: ${NOTEBOOKS_QUERY_PROVIDER_ID} # AI provider for the query model. Must map to a provider enabled in your Lightspeed config.yaml

    # Optional: Chunking strategy for document processing
    chunkingStrategy:
      type: auto # 'auto' or 'static' (default: auto)
      # For 'static' chunking:
      maxChunkSizeTokens: 512 # Maximum tokens per chunk (default: 512)
      chunkOverlapTokens: 50 # Overlap between chunks (default: 50)
```

**Configuration Options**:

**Core Settings**:

- **`intelligent-assistant.servicePort`** _(optional)_: Port where Lightspeed Core service is running (default: `8080`). The backend connects to Lightspeed Core at `http://{DEFAULT_LIGHTSPEED_SERVICE_HOST}:{servicePort}` to proxy vector store operations. The host is defined by the `DEFAULT_LIGHTSPEED_SERVICE_HOST` constant in the source.

**Notebooks Settings**:

- **`notebooks.enabled`** _(optional)_: Enable or disable the Notebooks feature (default: `false`)

**Query Defaults** _(required when enabled)_:

- **`queryDefaults.model`** _(required)_: The LLM model to use for answering RAG queries. Must be available in the configured provider.
- **`queryDefaults.provider_id`** _(required)_: The AI provider identifier for the query model (e.g., `ollama`, `vllm`). Both `model` and `provider_id` must be configured together.

> **Important**: The `model` and `provider_id` values must map to a provider and model that are actually enabled in your Lightspeed config.yaml configuration. If the provider or model is not available in Lightspeed, queries will fail. For example, if `openai` enabled in Lightspeed via ENABLE_OPENAI, then model must be available, e.g (model=gpt-4o-mini).

**Chunking Strategy** _(optional)_:

- **`chunkingStrategy.type`** _(optional)_: Document chunking strategy - `auto` (automatic, default) or `static` (fixed size)
- **`chunkingStrategy.maxChunkSizeTokens`** _(optional)_: Maximum chunk size in tokens for static chunking (default: `512`)
- **`chunkingStrategy.chunkOverlapTokens`** _(optional)_: Token overlap between chunks for static chunking (default: `50`)

**Where to Find These Values**:

- **Provider IDs**: Check your Llama Stack configuration file for configured providers (both for models and vector stores)
- **Model names**: Available models are listed in your Llama Stack provider configuration
- **Embedding dimensions**: Refer to the embedding model's documentation (e.g., `all-mpnet-base-v2` outputs 768 dimensions)
- **Lightspeed Core port**: Check your Lightspeed Core service deployment configuration

#### API Endpoints

When enabled, Notebooks exposes the following REST API endpoints:

- **Health Check**:
  - `GET /intelligent-assistant/notebooks/health` - Health check endpoint

- **Sessions**:
  - `POST /intelligent-assistant/notebooks/v1/sessions` - Create a new session
  - `GET /intelligent-assistant/notebooks/v1/sessions` - List all sessions for the current user
  - `GET /intelligent-assistant/notebooks/v1/sessions/:sessionId` - Get a specific session given the sessionID
  - `PUT /intelligent-assistant/notebooks/v1/sessions/:sessionId` - Update session details
  - `DELETE /intelligent-assistant/notebooks/v1/sessions/:sessionId` - Delete session

- **Documents**:
  - `PUT /intelligent-assistant/notebooks/v1/sessions/:sessionId/documents` - Upload or update a document (multipart/form-data)
  - `GET /intelligent-assistant/notebooks/v1/sessions/:sessionId/documents` - List all documents in a session
  - `GET /intelligent-assistant/notebooks/v1/sessions/:sessionId/documents/:documentId/status` - Get document processing status
  - `DELETE /intelligent-assistant/notebooks/v1/sessions/:sessionId/documents/:documentId` - Delete a document

- **Queries**:
  - `POST /intelligent-assistant/notebooks/v1/sessions/:sessionId/query` - Query documents with RAG

**Notes**:

- All endpoints require authentication (user context is automatically provided by Backstage)
- All `/v1/*` endpoints require the `intelligent-assistant.notebooks.use` permission
- Document endpoints verify session ownership before allowing operations
- `documentId` in paths is the document title (URL-encoded for special characters)

#### Permission Framework Support for Notebooks

When RBAC is enabled, users need the following permission to use Notebooks:

```CSV
p, role:default/team_a, intelligent-assistant.notebooks.use, update, allow

g, user:default/<your-user-name>, role:default/team_a
```

Add this to your `rbac-policy.csv` file along with the existing intelligent-assistant permissions.
