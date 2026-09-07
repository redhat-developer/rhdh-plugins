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

### OpenSpec scenario step discipline

Each bullet in a scenario (GIVEN/WHEN/THEN/AND) must be a testable assertion — something a test can verify at runtime. Do not place non-normative notes inside scenario step lists. These belong in prose paragraphs above or below the scenario block:

- SDK caveats (e.g., "SDK only requires non-empty string")
- Extensibility disclaimers (e.g., "additional values may be added")
- Design rationale or cross-references
- RFC-2119 constraints that apply broadly rather than to one scenario

**Wrong** — non-normative note as a scenario step:

```
#### Scenario: Source annotation format
- WHEN an entity provider emits an entity
- THEN the entity has the annotation in format: connector-name/registry-instance-id
- AND connector-name is one of: kagenti, ogx
- AND additional connector names may be added; the SDK only requires a non-empty string   <-- not testable
- AND registry-instance-id is the app-config provider instance ID
```

**Right** — note in a prose paragraph outside the scenario:

```
Additional connector names may be added when new connectors ship. The SDK today
only requires a non-empty string and MUST NOT enum-validate connector-name.

#### Scenario: Source annotation format
- WHEN an entity provider emits an entity
- THEN the entity has the annotation in format: connector-name/registry-instance-id
- AND connector-name is one of: kagenti, ogx
- AND registry-instance-id is the app-config provider instance ID
```

When writing new scenarios or reviewing spec file changes, verify that every AND/THEN bullet is a concrete assertion, not contextual guidance for human readers.

### Cancelling or removing an openspec component

When a spec, epic, or task is cancelled, apply strikethrough to the cancelled item and then verify all cross-file references using this checklist. Each step must be checked before the cancellation PR is considered complete.

1. **Numeric counts** — Search `design.md` and `proposal.md` for cardinal numbers that reference the list containing the cancelled item (e.g., "7 epics", "4 remaining"). Decrement each count to reflect the removal. Check both prose paragraphs and blockquote summaries.

2. **Cross-spec dependencies** — Check whether surviving specs in the same `specs/` directory reference the cancelled capability as a trigger, precondition, or data source. If a scenario's GIVEN/WHEN clause references the cancelled feature (e.g., "via the admin UI"), update it to reflect the replacement path (e.g., "via YAML configuration") and verify that dependent fields (actor, preconditions) are consistent with the new trigger.

3. **Design decisions** — Verify that decisions in `design.md` referencing the cancelled spec are either struck through or rewritten. If a decision described trade-offs involving the cancelled approach (e.g., a standalone UI vs. an existing plugin), update the rationale to reflect that only the surviving approach remains.

4. **Task dependencies** — In `tasks.md`, check that no active task depends on a cancelled task. If a surviving task listed the cancelled item as a prerequisite or input, strike or reassign that dependency.

5. **Strikethrough scope** — Apply strikethrough to the item title and content, not to status labels like "CANCELLED". Striking through "CANCELLED" reads as reverting the cancellation. Correct: `~~RBAC Admin UI — Dashboard~~ CANCELLED`. Incorrect: `~~RBAC Admin UI — Dashboard — CANCELLED~~`.

**Finding cross-references to a cancelled spec:**

```bash
# From the openspec change area directory, search for references to the
# cancelled spec slug across all openspec and specification files:
grep -rn "rbac-admin-ui\|RBAC Admin UI\|RHIDP-15304" \
  workspaces/boost/openspec/ workspaces/boost/specifications/
```

Replace the slug, display name, and ticket ID with those of the spec being cancelled. Review each match and update or strike references as appropriate.

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
   `description`. Optional `defaultValue` is the read-time fallback
   (DB → YAML → field default); do not use Zod `.default()` — that
   collapses "unset" during `validateConfigValue` and breaks resolver
   precedence.
3. Bump `BOOST_CONFIG_SCHEMA_VERSION` in `src/config/schemas.ts`.
   Per-connector `__schemaVersion` leaves (`configScope: db-only`) are
   the versioning machinery itself and do not require bumping this
   constant.
4. Add example usage in `examples/app-config.connectors.yaml` (or
   the appropriate `app-config.*.yaml` example file)
5. Run `yarn tsc:full && yarn build:api-reports:only` and commit the
   updated `report.api.md`

When reviewing PRs that add or modify `boost.*` config keys, verify all five registration steps above were completed.

### Wiring startup logic

When adding a new initialization, migration, or validation method to
`RuntimeConfigResolver`, `AdminConfigService`, or any plugin-scoped
service:

1. Implement the method with unit tests.
2. Wire it into the corresponding `plugin.ts` module setup — verify
   the method is actually called during startup.
3. If the method must run before other initialization (e.g., migration
   before config reads), place the call in the correct order within
   the setup function.
4. Confirm the plugin still starts cleanly by running the full test
   suite.

### Migration patterns

Connector schema migrations (`migrateConnectorSchemas` in
`RuntimeConfigResolver`) follow these robustness requirements:

- **Per-step version stamping:** After each successful migration step
  (e.g., v1 to v2), stamp the new version immediately. This makes
  migrations resumable — a failure at v2-to-v3 does not re-run v1-to-v2
  on the next startup.
- **Per-entity error isolation:** Wrap each connector's migration in
  try/catch. A failure migrating one connector (e.g., jira) must not
  prevent migration of others (github, gitlab). Accumulate the first
  error and rethrow after all connectors are attempted.
- **Preserve original errors:** When post-migration cleanup (e.g.,
  cache invalidation) also fails, preserve the original migration
  error. Use `firstError ??= cleanupError` so the root cause is not
  masked.
- **Missing version = v1:** Treat a missing `__schemaVersion` as v1
  (the initial version), not as the current version. Write v1
  explicitly and fall through to the migration loop.

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
| `boost-migration-readiness`    | Migration-readiness CLI tool (`node-library` role with custom CLI build)                      |

### CLI binary packages

When a `node-library` package has a `bin` entry in `package.json`, the
Backstage `backstage-cli package build` command (node-library role) only
produces library output (`dist/index.cjs.js`, `dist/index.esm.js`,
`dist/index.d.ts`). It does not bundle standalone CLI binaries. A custom
build step is required to produce the executable referenced by `bin`.

**Pattern — esbuild build script:**

1. Create `scripts/build-cli.js` in the package directory. Use esbuild to
   bundle the CLI entry point into a single CJS file targeting Node:

   ```js
   const { build } = require('esbuild');

   build({
     entryPoints: ['src/cli.ts'],
     outfile: 'dist/cli.cjs.js',
     bundle: true,
     platform: 'node',
     format: 'cjs',
     packages: 'external',
     banner: { js: '#!/usr/bin/env node' },
     logLevel: 'info',
   }).catch(() => {
     process.exit(1);
   });
   ```

   Key options:
   - `packages: 'external'` — bundle only local (relative-import) modules;
     leave npm packages to be resolved from `node_modules` at runtime, same
     as the node-library build output.
   - `banner` — adds the shebang line so the file is directly executable.
   - `platform: 'node'` and `format: 'cjs'` — match the node-library
     output format.

2. Add `esbuild` as a `devDependency` in `package.json`.

3. Wire the CLI build into the `build` script so it runs after the
   standard library build:

   ```json
   {
     "scripts": {
       "build": "backstage-cli package build && node scripts/build-cli.js"
     }
   }
   ```

4. Set the `bin` field to point to the bundled output:

   ```json
   {
     "bin": {
       "<command-name>": "dist/cli.cjs.js"
     }
   }
   ```

5. Keep the CLI entry point (`src/cli.ts`) separate from the library
   entry point (`src/index.ts`). Do not re-export CLI code from
   `index.ts` — the CLI calls `main()` at module scope, which would
   run as a side effect of importing the library.

**Canonical example:**
`plugins/boost-migration-readiness/scripts/build-cli.js` and its
`package.json` demonstrate this pattern end-to-end.

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
  - `ai-catalog.*` — catalog-layer RBAC for AI asset visibility and governance: `ai-catalog.asset.access`, `ai-catalog.asset.access.usage-docs`, `ai-catalog.admin` (uses `access` rather than `read` per issue #4041's naming decision; the underlying `attributes.action` stays `'read'`)
- Config: `ai-catalog.rbac.*` for catalog RBAC config (e.g., `ai-catalog.rbac.defaultPolicy`)
- Resource types: `boost-agent`, `boost-tool`, `ai-catalog-asset`
- DB tables: `boost_admin_config`, `boost_sessions`, `boost_messages`, `boost_feedback`
- Extension point: `boostProviderExtensionPoint`
- Service ref: `boostAiProviderServiceRef`
- Plugin ID: `boost` (used in `createBackendModule({ pluginId: 'boost', ... })`)
- Entity kind names (exact casing from `boost-common/src/aiAssetTaxonomy.ts`):
  - `AiResource` — agents, skills, rules (NOT `AIResource`)
  - `AiModelServerAPI` — model servers (`spec.type: ai-model-server`)
  - `API` — MCP servers (`spec.type: mcp-server`)
  - `Resource` — tools (`spec.type: ai-tool`), vector stores (`spec.type: vector-store`)

### Testing

Every feature ships with tests. Integration tests use real database and cache backends, not mocks.

### Frontend

- Composable routable extensions with `React.lazy()` at extension boundaries
- PatternFly design system components consistent with RHDH
- WCAG 2.1 AA accessibility
- Feature flags via `boost.features.*` in `app-config.yaml`

## Documentation conventions

### Relative markdown links

When creating or modifying relative links (`../` paths) between files in different directory subtrees (especially between `openspec/` and `specifications/`), verify each link resolves to an existing file. Count the directory levels from the source file to the nearest common ancestor directory, then from the ancestor to the target. Use `ls` or `stat` on the resolved path to confirm it exists before committing.

The `openspec/changes/` tree can be 5–7 levels deep under `workspaces/boost/`, while `specifications/` is only 1 level deep — miscounting `../` levels between these subtrees is the most common documentation error.

For example, a file at `openspec/changes/area/specs/group/spec.md` (6 levels deep) linking to `specifications/design.md` (1 level deep) requires 6 `../` segments to reach `workspaces/boost/`, then `specifications/design.md`:

```
../../../../../../specifications/design.md
```

Always verify:

```bash
# From the directory containing the source file, check the link resolves:
ls <relative-path-from-link>
```

### Fragment anchors for heading references

When a markdown link's display text names a specific heading (e.g., "Decision 1",
"Section 3"), include the GitHub-style fragment anchor in the URL. Read the target
file, find the matching heading, and convert it to a fragment using GitHub's rules:
lowercase, spaces to hyphens, strip punctuation.

Example: linking to `### Decision 1: Annotation independence from entity kinds`:

```
[Decision 1](../path/to/design.md#decision-1-annotation-independence-from-entity-kinds)
```

Do not link to the document root when the display text references a specific section.

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
- **Entity type comparisons**: always normalize with `.toLowerCase()` (or
  `.toLocaleLowerCase('en-US')` in `boost-common`, per its lint rule) before
  comparing `spec.type` values (see `boost-common/src/aiAssetTaxonomy.ts`,
  `categoryMeta.ts`). The AI asset kind/`spec.type` taxonomy
  (`AI_ASSET_SPEC_TYPES`, `isAiAsset`, `buildAiAssetCatalogFilter`) lives in
  `boost-common` as the single source of truth for both `boost` and
  `boost-backend` — do not re-duplicate it in either plugin.

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
