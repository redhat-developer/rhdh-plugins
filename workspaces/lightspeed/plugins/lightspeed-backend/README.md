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
  mcpServers: # Optional - only one mcp server is currently supported
    - name: <mcp server name> # must match the name configured in LCS
      token: ${MCP_TOKEN}
```

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

### AI Notebooks (Developer Preview)

AI Notebooks is an experimental feature that enables document-based conversations with Retrieval-Augmented Generation (RAG).

For user-facing feature documentation, see the [Lightspeed Frontend README](../lightspeed/README.md#ai-notebooks-developer-preview).

#### Prerequisites

AI Notebooks requires a **Llama Stack service** to be running. Llama Stack provides the vector database, embeddings, and RAG capabilities.

For Llama Stack setup and configuration, refer to the [Llama Stack documentation](https://github.com/llamastack/llama-stack).

#### Configuration

To enable AI Notebooks, add the following configuration to your `app-config.yaml`:

```yaml
lightspeed:
  aiNotebooks:
    enabled: true # Enable AI Notebooks feature (default: false)

    # Required when enabled: Llama Stack service configuration
    llamaStack:
      port: 8321 # Llama Stack API endpoint (required, commonly 8321)

      # Optional embedding configuration
      embeddingModel: sentence-transformers/nomic-ai/nomic-embed-text-v1.5 # (default shown)
      embeddingDimension: 768 # Embedding vector dimension (default: 768)
      vectorIo:
        providerId: rhdh-docs # Vector store provider ID (default: rhdh-docs)

    # Optional: File processing timeout (default: 30000ms = 30 seconds)
    fileProcessingTimeoutMs: 30000

    # Optional: Chunking strategy for document processing
    chunkingStrategy:
      type: auto # 'auto' or 'static' (default: auto)
      # For 'static' chunking:
      maxChunkSizeTokens: 512 # Maximum tokens per chunk (default: 512)
      chunkOverlapTokens: 50 # Overlap between chunks (default: 50)
```

**Configuration Options**:

- **`enabled`**: Enable or disable the AI Notebooks feature (default: `false`)
- **`llamaStack.port`**: Port of the Llama Stack service (default: `8321`)
- **`llamaStack.embeddingModel`**: Model used for generating embeddings (default: `sentence-transformers/nomic-ai/nomic-embed-text-v1.5`)
- **`llamaStack.embeddingDimension`**: Dimension of embedding vectors (default: `768`)
- **`llamaStack.vectorIo.providerId`**: Vector store provider in Llama Stack config (default: `rhdh-docs`)
- **`fileProcessingTimeoutMs`**: Timeout for file processing in milliseconds (default: `30000`)
- **`chunkingStrategy.type`**: Document chunking strategy - `auto` (automatic) or `static` (fixed size) (default: `auto`)
- **`chunkingStrategy.maxChunkSizeTokens`**: Maximum chunk size in tokens for static chunking (default: `512`)
- **`chunkingStrategy.chunkOverlapTokens`**: Token overlap between chunks for static chunking (default: `50`)

#### API Endpoints

When enabled, AI Notebooks exposes the following REST API endpoints:

- **Health Check**:
  - `GET /lightspeed/ai-notebooks/health` - Health check endpoint

- **Sessions**:
  - `POST /lightspeed/ai-notebooks/v1/sessions` - Create a new session
  - `GET /lightspeed/ai-notebooks/v1/sessions` - List all sessions
  - `GET /lightspeed/ai-notebooks/v1/sessions/:sessionId` - Get session details
  - `PUT /lightspeed/ai-notebooks/v1/sessions/:sessionId` - Update session
  - `DELETE /lightspeed/ai-notebooks/v1/sessions/:sessionId` - Delete session

- **Documents**:
  - `POST /lightspeed/ai-notebooks/v1/sessions/:sessionId/documents/upload` - Upload document
  - `GET /lightspeed/ai-notebooks/v1/sessions/:sessionId/documents` - List documents
  - `PUT /lightspeed/ai-notebooks/v1/sessions/:sessionId/documents/:documentId` - Update document
  - `DELETE /lightspeed/ai-notebooks/v1/sessions/:sessionId/documents/:documentId` - Delete document

- **Queries**:
  - `POST /lightspeed/ai-notebooks/v1/sessions/:sessionId/query` - Query documents with RAG

#### Permission Framework Support for AI Notebooks

When RBAC is enabled, users need the following permission to use AI Notebooks:

```CSV
p, role:default/team_a, lightspeed.notebooks.use, update, allow

g, user:default/<your-user-name>, role:default/team_a
```

Add this to your `rbac-policy.csv` file along with the existing lightspeed permissions.
