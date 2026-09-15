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
- When implementing a feature that changes behavior documented in `openspec/changes/`, update the affected documentation as part of the same commit:
  - If the change adds or modifies behavior covered by a spec.md (behavioral requirements with scenarios), update the spec to include new requirements and scenarios that reflect the implemented behavior
  - If the change affects the data flow or architecture described in a design.md, update the relevant section to match the new implementation
  - If the change adds user-facing configuration (new annotations, config keys, API surface), update the affected plugin's README with usage documentation

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

## Entity Provider Conventions

Plugins that implement `EntityProvider` (from `@backstage/plugin-catalog-node`)
must follow these conventions. The reference implementation is
`catalog-backend-module-model-catalog` — review its provider class, `config.d.ts`,
and test file before writing a new provider.

### Source-location annotation format

All `backstage.io/source-location` annotations must use the Backstage
location-ref format with a `url:` prefix. Bare scheme URIs are rejected at
ingestion time.

```ts
// ✅ Correct — Backstage location-ref format
entity.metadata.annotations['backstage.io/source-location'] =
  'url:oci://quay.io/org/model:tag';

// ❌ Wrong — bare URI; collectOciErrors.ts rejects this
entity.metadata.annotations['backstage.io/source-location'] =
  'oci://quay.io/org/model:tag';
```

The `collectOciErrors.ts` validator in
`catalog-backend-module-ai-resource-extensions` uses upstream
`parseLocationRef` to enforce this. A bare `oci://…` parses as location-ref
type `oci` instead of type `url`, which breaks UrlReader integration and
fails validation.

### Full-mutation error handling

Providers using `type: 'full'` mutations must guard against replacing all
catalog entities with an empty set on transient failures. When the
index/list API succeeds but all individual item fetches fail, the resulting
entity array is empty — applying `{ type: 'full', entities: [] }` deletes
every healthy entity the provider previously ingested.

Guard pattern: if the item-fetch phase produces zero entities but the index
returned a non-empty list, skip the mutation and log a warning instead.

```ts
const keys = await fetchIndex(url, token);
const entities = await fetchAllItems(keys);

// Guard: do not wipe the catalog on transient failures
if (entities.length === 0 && keys.length > 0) {
  logger.warn(
    `All ${keys.length} item fetches failed; skipping full mutation ` +
      'to avoid deleting healthy entities',
  );
  return;
}

await connection.applyMutation({
  type: 'full',
  entities: entities.map(e => ({ entity: e, locationKey: providerName })),
});
```

### Per-request timeout

Use `AbortController` with a 30-second timeout on individual HTTP requests.
Without a timeout, a stalled upstream endpoint blocks the provider's
scheduled task runner indefinitely.

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
try {
  const res = await fetch(url, {
    signal: controller.signal,
    headers: { Authorization: `Bearer ${token}` },
  });
  // ...
} finally {
  clearTimeout(timeout);
}
```

### Response size limits

Buffer and check response body size before JSON parsing. Unbounded
responses from an upstream API can exhaust Node.js heap memory and crash
the backend.

Define a `MAX_ARTIFACT_BYTES` constant (e.g. 10 MB) and verify the
`Content-Length` header or accumulated buffer size before calling
`JSON.parse()`. Reject oversized responses with a descriptive error.

```ts
const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024; // 10 MB

const res = await fetch(url, { signal: controller.signal, headers });
const contentLength = Number(res.headers.get('content-length') ?? '0');
if (contentLength > MAX_ARTIFACT_BYTES) {
  throw new Error(
    `Response from ${url} exceeds size limit ` +
      `(${contentLength} > ${MAX_ARTIFACT_BYTES} bytes)`,
  );
}
const body = await res.text();
if (body.length > MAX_ARTIFACT_BYTES) {
  throw new Error(`Response body exceeds size limit`);
}
const data = JSON.parse(body);
```

### Pagination

List API endpoints that return collections must handle pagination
tokens or cursors. Do not assume a single request returns all results.
Follow the upstream API's pagination scheme (typically a `nextPageToken`
or `Link` header) and accumulate results across pages.

```ts
let allItems: Item[] = [];
let pageToken: string | undefined;
do {
  const url = new URL(`${baseUrl}/list`);
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const res = await fetch(url.toString(), { headers });
  const page = await res.json();
  allItems = allItems.concat(page.items);
  pageToken = page.nextPageToken;
} while (pageToken);
```

### Shared patterns (`catalog-ai-skills-common`)

Common entity-building logic, fetch helpers, and name-normalization
functions should live in a shared `catalog-ai-skills-common` package
rather than being duplicated across providers. This reduces code
duplication (SonarQube enforces a 3% threshold) and ensures consistent
behavior.

Candidates for shared code:

- Entity annotation builders (source-location, origin-location)
- Fetch wrappers with timeout and size-limit enforcement
- Metadata name sanitization (`sanitizeMetadataName`)
- Tag validation helpers
- Common provider test utilities (mock task runners, mock connections)

When adding a new provider, check `catalog-ai-skills-common` for existing
helpers before writing new ones. When duplicating logic across two or more
providers, extract it into the shared package.

### Reference implementation

New entity providers should follow the structure established by
`catalog-backend-module-model-catalog`:

- **`config.d.ts`** — typed config with `@visibility backend` on all
  backend-only fields (cluster URLs, API endpoints, credentials)
- **`src/providers/`** — provider class implementing `EntityProvider`, with
  `fromConfig()` static factory, scheduled task runner, and `run()` method
- **`src/providers/config.ts`** — config reader that maps app-config to
  typed provider config
- **`src/providers/types.ts`** — provider-specific type definitions
- **`src/clients/`** — API client functions separated from the provider class
- **`src/module.ts`** — Backstage backend module that registers the provider
  on the catalog extension point

## PR Conventions

- All commits must have an `Assisted-by: <model>` footer below the sign offs
