# AGENTS.md

## Project overview

Boost is a clean-room reimplementation of the Augment agentic developer portal for Red Hat Developer Hub (RHDH). It is a Backstage plugin workspace — not a fork of Augment. The project context, design principles, and relationship to Augment are documented in `specifications/boost-context.md`. Read that file before making any implementation decisions.

## Specification-driven development

This workspace uses a specification-first approach. Before writing code, read the relevant specifications:

```
workspaces/boost/
├── specifications/                # Product requirements
│   ├── boost-context.md           # Project rationale, 12 design principles, upstream monitoring
│   └── prd/                       # Product Requirements Documents (one per capability area)
│       ├── use-case-index.md      # All 25 use cases at a glance
│       ├── ai-chat-interaction-experience.md
│       ├── agent-creation-discovery.md
│       ├── pluggable-ai-platform-architecture.md
│       ├── platform-operations-deployment.md
│       └── security-safety-governance.md
├── openspec/                      # Implementation specifications
│   └── changes/                   # One directory per capability area:
│       ├── ai-chat-interaction-experience/
│       ├── agent-creation-discovery/
│       ├── pluggable-ai-platform-architecture/
│       ├── platform-operations-deployment/
│       └── security-safety-governance/
│           ├── proposal.md        # What and why
│           ├── design.md          # Architecture decisions
│           ├── tasks.md           # Implementation task breakdown
│           └── specs/             # Behavioral specs (Given/When/Then)
├── plugins/                       # Plugin packages (implementation target)
└── scripts/                       # Dev/deployment helper scripts
    └── load-secrets.sh            # Loads env vars from K8s secrets for local dev
```

When implementing an issue:

1. Read `specifications/boost-context.md` for design principles — these are non-negotiable
2. Find the relevant PRD in `specifications/prd/` for product requirements
3. Find the matching change in `openspec/changes/` for design decisions, task breakdown, and behavioral specs
4. The `specs/` subdirectories contain acceptance criteria as scenarios — implementation must satisfy these

## Architecture rules

### Backstage-native services only

Use Backstage `cacheService`, `permissions`, `httpAuth`, `configApi`, `catalogApi`, and `scheduler`. Never build custom equivalents. All caches use `coreServices.cache` — no raw `Map<>` caches. Scheduled or periodic tasks must use `coreServices.scheduler` (`SchedulerService`) — never raw `setInterval`, `setTimeout`, or cron libraries. `SchedulerService` provides distributed scheduling, lifecycle management, and proper shutdown handling.

### Provider isolation

Each AI provider (`boost-backend-module-ogx`, `boost-backend-module-kagenti`) is a separate `createBackendModule`. Providers must not import from each other. Shared types live in `boost-common`.

### Capability checks, not identity checks

Frontend rendering decisions use `ProviderCapabilities` interface checks. Never use `providerId === 'string'` comparisons.

### Permissions as sole authorization

All authorization decisions use `permissions.authorize()` (single-resource endpoints) or `permissions.authorizeConditional()` (list endpoints with resource-scoped permissions) with fine-grained permissions (`boost.agent.*`, `boost.tool.*`, `boost.kagenti.admin`). No custom route-level authorization logic.

### Schema-driven validation

Config validation uses Zod schemas as single source of truth. TypeScript types are generated from Zod. No hand-written validators.

### Catalog entities for domain objects

Agents, tools, models, MCP servers, and vector stores are Backstage catalog entities — not in-memory caches. Entity providers emit standard catalog entities.

## Code conventions

### Adding new config fields

When introducing new `boost.*` configuration keys, complete all of
the following steps. Omitting any step causes runtime validation
failures or config-surface drift.

1. Add TypeScript declarations in
   `plugins/boost-backend/config.d.ts` with `@configScope` and
   `@visibility` JSDoc annotations matching the field's scope
2. Register the field in `src/config/schemas.ts` under
   `boostConfigFields` with a Zod schema, `configScope`, and
   `description`
3. Bump `BOOST_CONFIG_SCHEMA_VERSION` in `src/config/schemas.ts`
4. Add example usage in `examples/app-config.connectors.yaml` (or
   the appropriate `app-config.*.yaml` example file)
5. Run `yarn tsc:full && yarn build:api-reports:only` and commit the
   updated `report.api.md`

When reviewing PRs that add or modify `boost.*` config keys, verify all five registration steps above were completed.

### Entity provider schema contracts

Entity providers must emit entities that satisfy the upstream kind
module's schema validator. The `catalog-backend-module-ai-resource-agent`
and `catalog-backend-module-ai-model-server` processors validate
entities at ingestion time — missing required fields cause the entity
to be rejected.

Canonical schemas live in the `ai-integrations` workspace:

- `plugins/catalog-model-ai-resource-agent/src/AiResource.v1alpha1.agent.schema.json`
- `plugins/catalog-model-ai-model-server/src/API.v1alpha1.ai-model-server.schema.json`

When in doubt, read those files — they are the single source of truth.

#### AiResource / agent

Schema-required fields (`spec`):

- `type`: must be `'agent'`
- `lifecycle`: non-empty string (e.g. `'production'`, `'experimental'`)
- `owner`: entity reference string (e.g. `'ai-platform-team'`)

Key optional fields — entity providers should populate these when the
data is available, since they carry agent-specific semantics that the
catalog UI and downstream consumers rely on:

- `instructions`: string — the agent's system prompt. Omit only
  when the agent image/runtime already provides a default prompt.
  In practice most provider-emitted agents should include this
  field, falling back to the agent's description or a
  provider-prefixed placeholder if no explicit prompt is configured.
- `handoffs`: string array — opaque references to other agents
  this agent can hand off to. This is the upstream convention for
  agent delegation targets; do **not** use `spec.dependsOn` for
  agent handoffs (the AiResource agent schema does not register
  `dependsOn` relation fields).
- `handoffDescription`: string — description shown when this
  agent appears as a handoff target in another agent's list.
- `model`: string — model identifier for this agent.
- `tools`: string array — opaque references to tools available
  to this agent.
- `modelSettings`: object with `temperature`, `maxTokens`,
  `toolChoice` (closed schema, `additionalProperties: false`).

The `AiResourceAgentProcessor` also validates type constraints on
all optional fields at ingestion time via `preProcessEntity` (e.g.
`handoffs` must be an array if present, `instructions` must be a
string if present). See `collectAgentErrors.ts` in the
`catalog-backend-module-ai-resource-agent` plugin.

#### AiModelServerAPI / ai-model-server

Schema-required fields (`spec`):

- `type`: must be `'ai-model-server'`
- `lifecycle`: non-empty string
- `owner`: entity reference string
- `serverType`: API contract type (e.g. `'openai-v1'`, `'anthropic'`)
- `serverUrl`: base URL of the inference endpoint

Key optional fields:

- `models.available`: string array of model identifiers available
  on this server
- `models.default`: recommended default model identifier
- `models.discoverable`: boolean — whether the server exposes a
  model listing endpoint
- `requiresApiKey`: boolean — whether consumers need an API key

### Package structure

| Package                        | Purpose                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `boost`                        | Chat UI, agent gallery, admin panels, composable routable extensions                          |
| `boost-common`                 | Shared types, permissions (browser-safe, `common-library` role)                               |
| `boost-node`                   | `boostAiProviderServiceRef`, extension points (`node-library` role)                           |
| `boost-connector-utils`        | Shared connector utils (`node-library` role) — CA bundle, fault isolation, startup validation |
| `boost-backend`                | Core routes, services, middleware, ProviderManager                                            |
| `boost-backend-module-ogx`     | OGX provider module                                                                           |
| `boost-backend-module-kagenti` | Kagenti provider module                                                                       |
| `ogx-entity-provider`          | Independently deployable catalog entity provider                                              |
| `kagenti-entity-provider`      | Independently deployable catalog entity provider                                              |

### ConfigReader `getOptionalString()` edge case

Backstage's `ConfigReader` throws `TypeError` when the underlying config
value is an empty string (e.g., from env var substitution like
`${UNSET_ENV_VAR:-}`), rather than returning `undefined`. When reading
config values that may come from environment variable substitution, use
`safeGetOptionalString` from
`@red-hat-developer-hub/backstage-plugin-boost-connector-utils`:

```ts
import { safeGetOptionalString } from '@red-hat-developer-hub/backstage-plugin-boost-connector-utils';

const endpoint = safeGetOptionalString(config, 'endpoint');
```

### Naming

- Config namespace: `boost.*` (e.g., `boost.features.agentCreation`, `boost.security.mode`)
- Permission names — two namespaces by design:
  - `boost.*` — application-layer agent/tool operations: `boost.agent.*`, `boost.tool.*`, `boost.kagenti.admin`, `boost.access`, `boost.admin`
  - `ai-catalog.*` — catalog-layer RBAC for AI asset visibility and governance: `ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, `ai-catalog.admin`
- Config: `ai-catalog.rbac.*` for catalog RBAC config (e.g., `ai-catalog.rbac.defaultPolicy`)
- Resource types: `boost-agent`, `boost-tool`, `ai-catalog-asset`
- DB tables: `boost_admin_config`, `boost_sessions`, `boost_messages`, `boost_feedback`
- Extension point: `boostProviderExtensionPoint`
- Service ref: `boostAiProviderServiceRef`
- Plugin ID: `boost` (used in `createBackendModule({ pluginId: 'boost', ... })`)

### Testing

Every feature ships with tests. Integration tests use real database and cache backends, not mocks.

### Frontend

- Composable routable extensions with `React.lazy()` at extension boundaries
- PatternFly design system components consistent with RHDH
- WCAG 2.1 AA accessibility
- Feature flags via `boost.features.*` in `app-config.yaml`

## Build & verify

| Task                | Command                                        |
| ------------------- | ---------------------------------------------- |
| Full build          | `yarn build:all`                               |
| Type-check          | `yarn tsc:full`                                |
| Lint                | `yarn lint:all`                                |
| Prettier            | `yarn prettier:fix`                            |
| Test                | `CI=true yarn test --watchAll=false`           |
| API reports         | `yarn tsc:full && yarn build:api-reports:only` |
| OpenSpec validation | `yarn openspec:validate`                       |

**After modifying any file that affects the public API surface** (including
`translations/ref.ts`, exported types, or API routes), run
`yarn tsc:full && yarn build:api-reports:only` and commit the updated
`report.api.md`. Always use the two-step sequence (`tsc:full` then
`build:api-reports:only`), not the all-in-one `build:api-reports:only`
variant without the `:only` suffix — the all-in-one command performs its
own TypeScript compilation with different member ordering that does not
match CI. The `:only` command reads from the `dist-types` produced by
`tsc:full`, which matches the CI pipeline.

## Import conventions

- **Icons**: use `@remixicon/react` (e.g., `RiCheckLine`, `RiDownload2Line`).
  Do NOT use `@mui/icons-material` — the plugin migrated in PR #3929.
- **Entity type comparisons**: always normalize with `.toLowerCase()` before
  comparing `spec.type` values (see `isAiAsset.ts`, `categoryMeta.ts`).

## What not to do

- Do not reference the `workspaces/augment/` codebase for implementation patterns — boost is a clean-room build
- Do not use `augment` as a prefix for any new identifiers (config keys, permissions, tables, etc.)
- Do not create raw `Map<>` caches — always use `coreServices.cache`
- Do not add authorization checks outside `permissions.authorize()` / `permissions.authorizeConditional()`
- Do not add provider ID string checks in the frontend
- Do not use raw `setInterval`, `setTimeout`, or cron libraries for scheduled work — always use `coreServices.scheduler`

## Before committing

- Run `yarn prettier:fix` from the workspace root and stage any reformatted files.
- If public exports or function signatures changed, run `yarn build:api-reports:only --ci`.

## Scripts directory

`scripts/load-secrets.sh` is sourced before local development to populate environment variables from a Kubernetes secret. The env var names it exports (e.g., `BOOST_OGX_URL`, `BOOST_MODEL`) and the route-discovery function names (e.g., `_discover_ogx_route`) must stay synchronized with the config keys in `app-config.yaml` (under `boost.providers.*`).

When renaming or refactoring config keys in `app-config.yaml`, also check and update `scripts/load-secrets.sh` for corresponding env var names, function names, and log messages.
