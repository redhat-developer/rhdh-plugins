# Configuration Reference

This document describes every configuration surface for the Augment plugin: what YAML requires, what the admin UI can override, the precedence rules, and the default values applied when fields are omitted.

## Minimum Required YAML

The plugin will **not load** without these two fields. In RHDH, Backstage validates the ConfigMap against the plugin's config schema at startup and rejects the plugin if they are missing.

```yaml
augment:
  llamaStack:
    baseUrl: 'https://your-llama-stack-server.com'
    model: 'meta-llama/Llama-3.3-70B-Instruct'
```

Everything else is optional and has code-level defaults.

## Configuration Precedence

The plugin resolves configuration at runtime using a two-layer model:

```
EffectiveConfig = YAML baseline + DB admin overrides
```

1. **YAML** (`app-config.yaml` / ConfigMap) is loaded at startup into memory by Backstage. The plugin reads from this in-memory config — it does not re-read the file.
2. **DB** (admin UI saves to the `augment_admin_config` database table) overrides YAML per-key. If a DB value exists for a key, it wins. If no DB value exists, the YAML value (or its code-level default) is used.
3. **Cache**: The merged result is cached for 5 seconds. After an admin save, the cache is immediately invalidated.
4. **Fallback**: If the DB is unreachable, the system falls back to YAML-only and logs a warning. Chat is never blocked by a database outage.

### Special Merge Behaviors

Most keys are simple "DB replaces YAML" overrides, but three keys have different logic:

| Key          | Merge Rule                                                                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `branding`   | Shallow merge: `{ ...yamlBranding, ...dbBranding }`. DB fields win, but YAML-only fields survive.                                                                                                        |
| `mcpServers` | Smart merge: DB servers with matching IDs override YAML properties (url, name, type) while preserving YAML-only auth fields. New DB servers are appended. Servers in `disabledMcpServerIds` are removed. |
| `agents`     | Full replacement: DB agents completely replace YAML agents. The admin UI sends the entire roster on save. If an agent is removed in the UI, it does not reappear from YAML.                              |

### Reset to Defaults

The admin UI "Reset to Defaults" action deletes the DB entry for a key via `DELETE /admin/config/:key`. The next config resolution finds no DB value and falls back to the current YAML value.

### YAML Changes Require a Restart

The plugin does not watch for YAML file changes. Any change to `app-config.yaml` or the ConfigMap requires a backend restart (rolling update in RHDH on OpenShift) to take effect.

### "Invisible YAML" Caveat

Once a DB override exists for a key, subsequent YAML changes to that key are silently ignored. The DB value continues to win until an admin either updates it or resets to defaults.

## Code-Level Defaults

When YAML fields are omitted, these defaults are applied by `ConfigLoader` and `RuntimeConfigResolver`:

| Field                   | Default Value                                                                   | Constant                      |
| ----------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| `systemPrompt`          | `''` (empty string — falls back to `'You are a helpful assistant.'` at runtime) | `DEFAULT_SYSTEM_PROMPT`       |
| `vectorStoreName`       | `'augment-knowledge-base'`                                                      | `DEFAULT_VECTOR_STORE_NAME`   |
| `embeddingModel`        | `'sentence-transformers/all-MiniLM-L6-v2'`                                      | `DEFAULT_EMBEDDING_MODEL`     |
| `embeddingDimension`    | `384`                                                                           | `DEFAULT_EMBEDDING_DIMENSION` |
| `chunkingStrategy`      | `'auto'`                                                                        | —                             |
| `maxChunkSizeTokens`    | `512`                                                                           | `DEFAULT_CHUNK_SIZE`          |
| `chunkOverlapTokens`    | `50`                                                                            | `DEFAULT_CHUNK_OVERLAP`       |
| `skipTlsVerify`         | `false`                                                                         | —                             |
| `verboseStreamLogging`  | `false`                                                                         | —                             |
| `enableWebSearch`       | `false`                                                                         | —                             |
| `enableCodeInterpreter` | `false`                                                                         | —                             |
| `zdrMode`               | `false`                                                                         | —                             |
| `security.mode`         | `'plugin-only'`                                                                 | —                             |
| `vectorStoreIds`        | `[]` (auto-creates a vector store using `vectorStoreName`)                      | —                             |
| `mcpServers`            | `[]` (none configured)                                                          | —                             |
| `agents`                | `undefined` (single-agent mode — no multi-agent orchestration)                  | —                             |
| `documents`             | `null` (no document ingestion)                                                  | —                             |
| `toolChoice`            | `undefined` (model decides, equivalent to `'auto'`)                             | —                             |
| `branding`              | Built-in defaults from `DEFAULT_BRANDING`                                       | —                             |

## What the Admin UI Can Configure

The admin panel stores overrides in the `augment_admin_config` database table. These 29 keys can be changed at runtime without restarting:

### LLM / Inference

| Admin Key               | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `model`                 | Override the LLM model identifier                                        |
| `baseUrl`               | Override the Llama Stack server URL                                      |
| `systemPrompt`          | Override the global system prompt                                        |
| `toolChoice`            | Tool selection strategy (`auto`, `required`, `none`, or a specific tool) |
| `enableWebSearch`       | Toggle the built-in web search tool                                      |
| `enableCodeInterpreter` | Toggle the built-in code interpreter                                     |
| `temperature`           | Sampling temperature                                                     |
| `maxOutputTokens`       | Maximum output tokens per response                                       |
| `maxToolCalls`          | Cap on tool calls per response (prevents runaway loops)                  |

### Multi-Agent

| Admin Key       | Description                                               |
| --------------- | --------------------------------------------------------- |
| `agents`        | Full agent roster — replaces YAML agents entirely on save |
| `defaultAgent`  | Which agent handles the first turn of a conversation      |
| `maxAgentTurns` | Maximum handoff turns before stopping                     |

### RAG / Vector Store

| Admin Key              | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `activeVectorStoreIds` | Which vector store IDs to search for RAG                    |
| `vectorStoreConfig`    | Embedding model, chunk sizes, search mode, score thresholds |

### MCP Servers

| Admin Key              | Description                               |
| ---------------------- | ----------------------------------------- |
| `mcpServers`           | Add or override MCP server configurations |
| `disabledMcpServerIds` | Disable specific MCP servers by ID        |

### Safety

| Admin Key          | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `safetyEnabled`    | Toggle safety checks on/off                                               |
| `inputShields`     | Shield IDs applied to user input                                          |
| `outputShields`    | Shield IDs applied to AI output                                           |
| `safetyOnError`    | `'allow'` (fail-open) or `'block'` (fail-closed) when a shield call fails |
| `safetyIdentifier` | Safety identifier override                                                |

### Evaluation

| Admin Key           | Description                                    |
| ------------------- | ---------------------------------------------- |
| `evaluationEnabled` | Toggle response quality evaluation             |
| `scoringFunctions`  | Scoring function IDs for evaluation            |
| `minScoreThreshold` | Minimum acceptable score (0-1)                 |
| `evaluationOnError` | `'skip'` or `'fail'` when a scoring call fails |

### UI / Branding

| Admin Key        | Description                                     |
| ---------------- | ----------------------------------------------- |
| `branding`       | Colors, logo URL, tagline, theme preset         |
| `promptGroups`   | Welcome screen prompt cards (grouped)           |
| `safetyPatterns` | Regex patterns for destructive action detection |

### Provider

| Admin Key        | Description              |
| ---------------- | ------------------------ |
| `activeProvider` | Which AI provider to use |

## What Is YAML-Only

These settings **cannot** be changed from the admin UI. They require a YAML change and a restart.

| YAML Key                       | Reason                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| `security.mode`                | Security-critical; read once at startup                       |
| `security.adminUsers`          | Controls who has admin access                                 |
| `security.mcpOAuth`            | Contains OAuth secrets                                        |
| `security.accessDeniedMessage` | Frontend-visibility setting                                   |
| `documents.*`                  | All ingestion config (sources, sync mode, schedule, patterns) |
| `token`                        | Secret: Llama Stack API authentication                        |
| `skipTlsVerify`                | Security-critical TLS setting                                 |
| `zdrMode`                      | Zero Data Retention compliance setting                        |
| `parallelToolCalls`            | Advanced tuning                                               |
| `textFormat`                   | Advanced structured output schema                             |
| `functions`                    | Global custom function definitions                            |
| `verboseStreamLogging`         | Operational debugging toggle                                  |
| `quickPrompts`                 | Read from YAML per request (no DB layer)                      |
| `workflows`                    | Read from YAML per request (no DB layer)                      |
| `mcpAuth`                      | Shared OAuth credentials for MCP servers                      |
| `toolExecutionMode`            | `'direct'` vs `'backend'` MCP execution                       |
| `serverCapabilities`           | Override auto-detected Llama Stack server capabilities        |
| `provider`                     | Provider type (only `'llamastack'` supported)                 |

## Admin API Endpoints

| Endpoint                  | Method | Description                                                             |
| ------------------------- | ------ | ----------------------------------------------------------------------- |
| `/admin/config`           | GET    | List all admin config entries stored in DB                              |
| `/admin/config/:key`      | GET    | Get a single config entry (returns `source: 'database'` or `'default'`) |
| `/admin/config/:key`      | PUT    | Set/update a config value (`{ "value": <payload> }`)                    |
| `/admin/config/:key`      | DELETE | Reset to defaults (deletes the DB entry)                                |
| `/admin/effective-config` | GET    | Get the merged effective config (YAML + DB)                             |

## Database Storage

Admin overrides are stored in the `augment_admin_config` table:

| Column         | Type        | Description                         |
| -------------- | ----------- | ----------------------------------- |
| `config_key`   | string (PK) | The admin config key                |
| `config_value` | text        | JSON-serialized value               |
| `updated_at`   | timestamp   | Last update time                    |
| `updated_by`   | string      | User entity ref who made the change |

Provider-scoped keys (e.g., `model`, `baseUrl`) are stored as `{providerId}::{key}` (e.g., `llamastack::model`).

In RHDH, each plugin gets its own PostgreSQL database automatically. The `augment_admin_config` table persists across pod restarts and OCI image updates.
