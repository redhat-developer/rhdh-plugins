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

## Pre-commit Validation

Before committing, run `yarn tsc` in the workspace root to catch type errors.
CI runs `yarn tsc:full` (non-incremental), so type failures will block the PR.

Common pitfall: calling a method through an interface type (e.g.,
`CatalogProcessor`) may require more arguments than the concrete class
declares. Unit tests pass regardless because JavaScript ignores
extra/missing arguments — only the TypeScript compiler catches the
mismatch.

## Key Conventions

- Follows standard Backstage plugin structure: frontend plugin, backend plugin, and common shared library
- Backend module (e.g. `catalog-backend-module-model-catalog`) extend Backstage catalog plugin

## Test File Conventions

- `module.test.ts` should be a minimal smoke test (~25 lines) verifying the
  module export is defined and, optionally, that it registers the expected
  processors/providers on the extension point via `startTestBackend`.
- Processor behavior tests (validation logic, ingestion paths, error handling)
  belong in dedicated test files named after the class under test (e.g.,
  `AiResourceExtensionsProcessor.test.ts`).
- When test helpers like entity factory functions are needed by multiple test
  files, extract them into a shared `testUtils.ts` in the same `src/`
  directory.

## Architecture (only non-obvious parts)

- `packages/` in each plugin is strictly for the dev environment; do not add application code there
- `ai-experience-common` holds shared types and API definitions used by both frontend and backend

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

## Upstream-Tracking Packages

Some packages in this workspace replicate upstream `backstage/backstage`
schemas as stopgaps while the corresponding upstream PRs are pending.
These packages reference the upstream PR (e.g., `backstage/backstage#34476`)
in their changeset description or linked issue.

When a package explicitly tracks an upstream PR, upstream naming and API
conventions take precedence over workspace-local conventions. This includes:

- **Interface names** — upstream names are used as-is, even if they omit a
  version suffix (e.g., `AiModelServerApiEntity` instead of
  `AgentAiResourceEntityV1alpha1`)
- **`apiVersion` typing** — may use a broad `string` type instead of a
  pinned literal union, matching the upstream schema
- **Type guard patterns** — may omit `apiVersion` checks when the upstream
  pattern relies on dedicated kinds alone
- **`moduleId` format** — uses the upstream short form (e.g.,
  `'ai-model-server'`) matching the upstream convention (e.g., `'ai-model'`)

Do not flag convention deviations in upstream-tracking packages when the
deviation matches the cited upstream code. These are intentional for
migration parity and will be reconciled when the upstream PR merges.

The upstream PR number must be documented in the changeset description or
linked issue so reviewers (human and automated) can verify the upstream
alignment.

## PR Conventions

- All commits must have an `Assisted-by: <model>` footer below the sign offs
