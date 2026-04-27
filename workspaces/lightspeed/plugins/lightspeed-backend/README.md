# Lightspeed Backend

This is the lightspeed backend plugin that enables you to interact with any LLM server running a model with OpenAI's API compatibility.

## Getting Started

### Installing the plugin

```bash
yarn add --cwd packages/backend  @red-hat-developer-hub/backstage-plugin-lightspeed-backend
```

### Configuring the Backend

Add the following to your `packages/backend/src/index.ts` file:

```ts title="packages/backend/src/index.ts"
const backend = createBackend();

// Add the following line
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-lightspeed-backend'),
);

backend.start();
```

### Plugin Configurations

Add the following lightspeed configurations into your `app-config.yaml` file:

```yaml
lightspeed:
  servicePort: <portNumber> # Optional - Change the LS service port nubmer. Defaults to 8080.
  systemPrompt: <system prompt> # Optional - Override the default system prompt.
  mcpServers: # Optional - one or more MCP servers
    - name: <mcp server name> # must match the name configured in LCS
      token: ${MCP_TOKEN}
```

#### MCP servers settings endpoints

The backend exposes MCP server management endpoints used by the Lightspeed UI
settings panel:

- `GET /api/lightspeed/mcp-servers` lists configured servers and user-scoped
  state.
- `PATCH /api/lightspeed/mcp-servers/:name` updates user settings such as
  enabled state and token.

- `POST /api/lightspeed/mcp-servers/validate` validates a raw `{ url, token }`
  pair and returns whether credentials are valid.
- `POST /api/lightspeed/mcp-servers/:name/validate` validates a configured server
  by name using the effective token (user token override or configured token).

These endpoints power server selection and token configuration, including inline
success/error feedback while users enter tokens.

#### Permission Framework Support

The Lightspeed Backend plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access lightspeed backend API, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, lightspeed.chat.read, read, allow
p, role:default/team_a, lightspeed.chat.create, create, allow
p, role:default/team_a, lightspeed.chat.delete, delete, allow

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

For user-facing feature documentation, see the [Lightspeed Frontend README](../lightspeed/README.md#notebooks-developer-preview).

#### Prerequisites

Notebooks requires:

- **Lightspeed Core service** to be running (provides the backend API proxy)
- **Llama Stack service** to be accessible from Lightspeed Core (provides vector database, embeddings, and RAG capabilities)

For Llama Stack setup and configuration, refer to the [Llama Stack documentation](https://github.com/llamastack/llama-stack).

#### Configuration

To enable Notebooks, add the following configuration to your `app-config.yaml`:

```yaml
lightspeed:
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

- **`lightspeed.servicePort`** _(optional)_: Port where Lightspeed Core service is running (default: `8080`). The backend connects to Lightspeed Core at `http://0.0.0.0:{servicePort}` to proxy vector store operations.

**Notebooks Settings**:

- **`Notebooks.enabled`** _(optional)_: Enable or disable the Notebooks feature (default: `false`)

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
  - `GET /lightspeed/notebooks/health` - Health check endpoint

- **Sessions**:
  - `POST /lightspeed/notebooks/v1/sessions` - Create a new session
  - `GET /lightspeed/notebooks/v1/sessions` - List all sessions for the current user
  - `GET /lightspeed/notebooks/v1/sessions/:sessionId` - Get a specific session given the sessionID
  - `PUT /lightspeed/notebooks/v1/sessions/:sessionId` - Update session details
  - `DELETE /lightspeed/notebooks/v1/sessions/:sessionId` - Delete session

- **Documents**:
  - `PUT /lightspeed/notebooks/v1/sessions/:sessionId/documents` - Upload or update a document (multipart/form-data)
  - `GET /lightspeed/notebooks/v1/sessions/:sessionId/documents` - List all documents in a session
  - `GET /lightspeed/notebooks/v1/sessions/:sessionId/documents/:documentId/status` - Get document processing status
  - `DELETE /lightspeed/notebooks/v1/sessions/:sessionId/documents/:documentId` - Delete a document

- **Queries**:
  - `POST /lightspeed/notebooks/v1/sessions/:sessionId/query` - Query documents with RAG

**Notes**:

- All endpoints require authentication (user context is automatically provided by Backstage)
- All `/v1/*` endpoints require the `lightspeed.notebooks.use` permission
- Document endpoints verify session ownership before allowing operations
- `documentId` in paths is the document title (URL-encoded for special characters)

#### Permission Framework Support for Notebooks

When RBAC is enabled, users need the following permission to use Notebooks:

```CSV
p, role:default/team_a, lightspeed.notebooks.use, update, allow

g, user:default/<your-user-name>, role:default/team_a
```

Add this to your `rbac-policy.csv` file along with the existing lightspeed permissions.
