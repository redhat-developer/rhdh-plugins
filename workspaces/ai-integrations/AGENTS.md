# AI Integration Plugins for RHDH

## Build & Test Commands

- Install: `yarn install`
- Build: `yarn build:all`
- Test all: `yarn test:all`
- Test single file: `yarn test -- path/to/test.ts`
- Lint: `yarn lint:all`
- Lint single file: `yarn lint --fix path/to/file.ts`
- Type check: `yarn tsc`
- Dev environment: `yarn dev`
- Debug: `yarn dev:debug`

## Key Conventions

- Follows standard Backstage plugin structure: frontend plugin, backend plugin, and common shared library
- Backend module (e.g. `catalog-backend-module-model-catalog`) extend Backstage catalog plugin

## Architecture (only non-obvious parts)

- `packages/` in each plugin is strictly for the dev environment; do not add application code there
- `ai-experience-common` holds shared types and API definitions used by both frontend and backend

## AiResource typed variant packages

Each AiResource `spec.type` variant (skill, rule, agent, mcp-server, etc.)
lives in its own dedicated package pair:

- `plugins/catalog-model-ai-resource-{type}/` — TypeScript types, JSON schema,
  KindValidator, type guard, CatalogModelLayer, and `report.api.md`
- `plugins/catalog-backend-module-ai-resource-{type}/` — backend module that
  calls `catalogModelExtensionPoint.addModelSource()` and is wired into
  `packages/backend/src/index.ts`

Do NOT place typed-variant types in `ai-experience-common`. Follow the
existing skill/rule packages as the reference implementation. When creating
a new typed variant:

1. Create both packages following the naming convention above
2. Export the CatalogModelLayer from the catalog-model package
3. Wire the backend module into `packages/backend`
4. Include a smoke test for the backend module export
5. Add a minor changeset covering both new packages

## Specifications

- When a task is driven by local implementation specs, check `openspec/changes/` for proposal, design, tasks, and behavioral requirements
- Prefer local workspace OpenSpec materials over external copies when both exist

## Backstage Backend Conventions

### Service-to-service auth (`targetPluginId`)

When calling `auth.getPluginRequestToken({ onBehalfOf, targetPluginId })`,
`targetPluginId` must be the **receiving** plugin's ID as registered in its
`createBackendPlugin({ pluginId: '...' })` call. Look up the target plugin's
`plugin.ts` and use the exact `pluginId` string — do not use a service ref ID,
a variable reference like `someServiceRef.id`, or an arbitrary string.

```ts
// ✅ Correct — matches the target plugin's registered pluginId
const token = await auth.getPluginRequestToken({
  onBehalfOf: await auth.getOwnServiceCredentials(),
  targetPluginId: 'kserve-kubeflow-connector', // from createBackendPlugin({ pluginId: 'kserve-kubeflow-connector' })
});

// ❌ Wrong — service ref IDs are not plugin IDs
const token = await auth.getPluginRequestToken({
  onBehalfOf: await auth.getOwnServiceCredentials(),
  targetPluginId: urlReaderFactoriesServiceRef.id,
});
```

### Config visibility annotations

Fields in `config.d.ts` that contain backend-only values (cluster URLs, API
endpoints, credentials, cluster names) must use `@visibility backend`. Only
use `@visibility frontend` for values the browser genuinely needs to render
the UI. Exposing backend-only values to the frontend is a security risk.

```ts
// ✅ Correct — backend-only fields use @visibility backend
export interface Config {
  catalog?: {
    providers?: {
      myPlugin?: {
        /** @visibility backend */
        apiUrl?: string;
        /** @visibility backend */
        clusterName?: string;
      };
    };
  };
}

// ❌ Wrong — exposes backend secrets to the browser
export interface Config {
  catalog?: {
    providers?: {
      myPlugin?: {
        /** @visibility frontend */
        apiUrl?: string;
      };
    };
  };
}
```

### ConfigReader `getOptionalString()` edge case

Backstage's `ConfigReader` throws `TypeError` when the underlying config
value is an empty string (e.g., from env var substitution like
`${UNSET_ENV_VAR:-}`), rather than returning `undefined`. When reading
config values that may come from environment variable substitution, wrap
calls in a try-catch that returns `undefined` (or a default) on
`TypeError`:

```ts
function safeGetOptionalString(
  config: Config,
  key: string,
): string | undefined {
  try {
    return config.getOptionalString(key);
  } catch {
    // ConfigReader throws TypeError for empty-string values
    // from env var substitution like ${VAR:-}
    return undefined;
  }
}
```

## PR Conventions

- All commits must have an `Assisted-by: <model>` footer below the sign offs
