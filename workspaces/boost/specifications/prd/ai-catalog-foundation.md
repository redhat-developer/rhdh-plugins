# PRD: AI Catalog Foundation

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Partially implemented (scaffold delivered 2026-06-30; gallery/content deferred)
**Date:** 2026-06-30
**Updated:** 2026-06-30 — reverse-engineered from implementation commits `0fb77e76..5fe7580c`
**Priority:** P0 (prerequisite for all frontend work)
**Provenance:** Reverse-engineered from shipped implementation. See `specifications/boost-context.md` for project context.
**Related PRDs:** [Agent Creation & Discovery](agent-creation-discovery.md) (future gallery content), [Platform Operations & Deployment](platform-operations-deployment.md) (deployment paths, UC-15)

---

## Why

Developers need a runnable Boost frontend before building agent gallery, chat, or admin UI. The AI Catalog route is the designated primary navigation entry point for discovering AI agents and related catalog entities.

This PRD captures the bootstrap intent established by the first frontend implementation: create the Backstage New Frontend System (NFS) plugin, wire it into a full local dev shell, and reserve `/ai-catalog` as the home for future discovery UX. The page scaffold is intentionally empty — it establishes routing, navigation, and development infrastructure, not the full agent gallery described in UC-4 and UC-9.

## What This Product Does

Boost ships `@red-hat-developer-hub/backstage-plugin-boost` as a Backstage NFS frontend plugin. The plugin registers a lazy-loaded `/ai-catalog` page with a sidebar nav item and icon. A full-stack local dev shell (`packages/app` + `packages/backend`) wires all existing Boost backend plugins for end-to-end testing. Local and production app-config templates provide the `boost.*` configuration namespace.

The current AI Catalog page renders a header and an empty content container — a placeholder for agent gallery, search, filter, and preview panel functionality defined in the Agent Creation & Discovery PRD.

## Who It's For

### Boost Developer

Iterates on frontend features against a real app and backend. Uses `yarn start` for full-stack development or `yarn dev` for isolated plugin iteration.

### Plugin Consumer

References this PRD when registering the boost plugin in a custom NFS app or RHDH dynamic plugin deployment.

## Boundaries

### In Scope

- NFS frontend plugin package structure and extension patterns (`PageBlueprint`, `createRouteRef`, lazy loader)
- `/ai-catalog` routable page extension with title and icon
- Dev shell (`packages/app`, `packages/backend`) with boost plugin registration
- Local dev configuration (guest auth, allow-all permissions — explicitly dev-only)
- Production config overlay skeleton (env vars, PostgreSQL, full security mode)
- Plugin family metadata (`pluginPackages`)
- Basic extension and app smoke tests

### Out of Scope

- Agent gallery UI (search, filter, tabs, preview panel) — see [Agent Creation & Discovery PRD](agent-creation-discovery.md) UC-4, UC-9
- Chat UI, admin panels, capability-gated rendering — see [AI Chat & Interaction PRD](ai-chat-interaction-experience.md) and [Platform Operations PRD](platform-operations-deployment.md)
- Fine-grained RBAC — see [Security & Governance PRD](security-safety-governance.md)
- Real catalog entity rendering on the AI Catalog page
- E2E tests for the full app flow
- Production-ready Docker image (Dockerfile ships with dev-config warning)

### UX/UXD Integration

The scaffold page uses Backstage `@backstage/ui` primitives only. Full AI Catalog UX (agent cards, gallery layout, preview panel) requires UX/UXD mockups per the Agent Creation & Discovery PRD before implementation replaces the empty container.

---

## Capabilities

### 1. Boost Frontend Plugin on NFS

**Goal:** Establish the boost frontend plugin using Backstage's New Frontend System as the foundation for all future UI.

**Package:**

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| npm name       | `@red-hat-developer-hub/backstage-plugin-boost` |
| Backstage role | `frontend-plugin`                               |
| pluginId       | `boost`                                         |
| Location       | `workspaces/boost/plugins/boost/`               |

**How it works:**

- Plugin instance created via `createFrontendPlugin({ pluginId: 'boost', extensions: [boostPage], routes: { root: rootRouteRef } })`
- Page extension defined via `PageBlueprint.make` with lazy loader
- Default export is the plugin instance (`export { boostPlugin as default }`)
- Route ref created via `createRouteRef()` in `routes.ts`
- Plugin family metadata lists six boost npm packages in `backstage.pluginPackages`

**Plugin family packages (`pluginPackages`):**

- `@red-hat-developer-hub/backstage-plugin-boost`
- `@red-hat-developer-hub/backstage-plugin-boost-backend`
- `@red-hat-developer-hub/backstage-plugin-boost-common`
- `@red-hat-developer-hub/backstage-plugin-boost-node`
- `@red-hat-developer-hub/backstage-plugin-boost-responses-api-toolkit`
- `@red-hat-developer-hub/backstage-plugin-boost-toolscope`

**Acceptance criteria:**

- Plugin builds and exports as a valid NFS frontend plugin
- Default export resolves to the plugin instance
- All six family packages listed in `pluginPackages`

### 2. AI Catalog Routable Page

**Goal:** Register `/ai-catalog` as the primary Boost navigation entry point with lazy-loaded page content.

**How it works:**

- `PageBlueprint` params: `path: '/ai-catalog'`, `title: 'AI Catalog'`, `icon: <AiCatalogIcon />`
- Page component loaded via `import('./components/AiCatalogPage').then(m => <m.AiCatalogPage />)`
- `AiCatalogIcon` wraps MUI `StorefrontIcon` as a placeholder sidebar icon
- Scaffold page renders `@backstage/ui` `Header` with title "AI Catalog" and an empty `Container`

**Acceptance criteria:**

- Navigating to `/ai-catalog` renders the AI Catalog page
- Sidebar shows "AI Catalog" with the plugin icon
- Page component is lazy-loaded (not bundled in the main plugin entry)
- Unit test asserts extension route path is `/ai-catalog` and title is `AI Catalog`

### 3. Local Dev Shell

**Goal:** Provide a full Backstage app and backend for end-to-end Boost development without requiring an external RHDH instance.

**Frontend (`packages/app`):**

- NFS app created via `createApp({ features: [...] })`
- Registered features: RHDH theme module, custom nav module, guest sign-in module, catalog plugin, boost plugin
- Nav sidebar surfaces `page:catalog` (Software Catalog) and `page:boost` (AI Catalog)
- Catalog index page mounted at `/` via app extension config

**Backend (`packages/backend`):**

- Standard Backstage plugins: app, proxy, scaffolder, techdocs, auth (guest), catalog, permission (allow-all policy), search, kubernetes, notifications, signals, mcp-actions
- All Boost backend plugins: `boost-backend`, `boostAiProviderServiceFactory`, `boost-backend-module-llamastack`, `boost-backend-module-kagenti`, `llamastack-entity-provider`, `kagenti-entity-provider`

**Acceptance criteria:**

- `yarn start` from workspace root launches frontend and backend
- Boost plugin appears in sidebar alongside Software Catalog
- Backend registers all six Boost backend packages
- App smoke test renders without error

### 4. Configuration

**Goal:** Supply local and production configuration templates for the dev shell and boost namespace.

**Local dev (`app-config.yaml`):**

| Key                     | Value / purpose                             |
| ----------------------- | ------------------------------------------- |
| `app.title`             | `Boost Dev`                                 |
| `backend.database`      | `better-sqlite3`, in-memory                 |
| `auth.providers.guest`  | Guest provider with auto sign-in (dev only) |
| `permission.enabled`    | `true` with allow-all policy module         |
| `boost.security.mode`   | `development-only-no-auth`                  |
| `boost.model`           | Local Llama Stack endpoint                  |
| `boost.providers`       | Llama Stack and Kagenti base URLs           |
| `boost.entityProviders` | Matching entity provider base URLs          |

**Production overlay (`app-config.production.yaml`):**

| Key                   | Value / purpose                                        |
| --------------------- | ------------------------------------------------------ |
| `backend.database`    | PostgreSQL via env vars                                |
| `backend.auth.keys`   | Service-to-service auth secret                         |
| `auth.environment`    | `production`                                           |
| `boost.security.mode` | `full`                                                 |
| `boost.*` endpoints   | Env-var placeholders (`${BOOST_MODEL_BASE_URL}`, etc.) |

**Acceptance criteria:**

- Local config includes comments marking dev-only settings (guest auth, allow-all permissions, in-memory database)
- Production overlay overrides database, auth, and security mode
- `boost.*` namespace present in both configs

### 5. Developer Workflows

**Goal:** Support full-stack and isolated plugin development with a validation pipeline.

| Command         | Purpose                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------ |
| `yarn start`    | Full app (packages/app + packages/backend); navigate to `http://localhost:3000/ai-catalog` |
| `yarn dev`      | Parallel isolated frontend and backend plugin dev servers                                  |
| `yarn chores`   | Format, lint, typecheck, API reports, OpenSpec validate, tests                             |
| `yarn test:all` | Prettier, lint, tests with coverage                                                        |

**Isolated plugin dev (`plugins/boost/dev/index.tsx`):**

- Uses `createDevApp({ features: [plugin] })`
- Redirects `/` to `/ai-catalog` on load

**Acceptance criteria:**

- Both `yarn start` and isolated plugin dev land on `/ai-catalog`
- `yarn dev` starts boost frontend and boost-backend plugin servers in parallel

### 6. Verification

**Goal:** Ensure the plugin extension metadata and app integration are testable.

**Plugin tests (`plugins/boost/src/plugin.test.ts`):**

- Plugin instance is defined
- `boostPage` extension exposes route path `/ai-catalog` and title `AI Catalog`

**App tests (`packages/app/src/App.test.tsx`):**

- App renders without error given minimal test config

**Acceptance criteria:**

- Plugin unit tests pass
- App smoke test passes

---

## Architecture Context

**NFS over legacy:** The boost frontend plugin uses `@backstage/frontend-plugin-api` blueprints (`PageBlueprint`, `createFrontendPlugin`), not legacy `createPlugin` / routable extensions. Future pages (chat, admin) should follow the same pattern with lazy loading at extension boundaries.

**Naming:** The frontend package is `boost` (directory: `plugins/boost/`), not `boost-frontend`. npm scope is `@red-hat-developer-hub/backstage-plugin-boost`.

**Relationship to agent discovery:** `/ai-catalog` is the future home for UC-4 (Browse and Select an Agent) and UC-9 (Discover Agents in the Gallery) gallery UX. The current scaffold intentionally leaves the content container empty.

**Backstage version:** Workspace aligned to Backstage 1.52.0 (see `backstage.json`).

**Dev shell vs. production deployment:** The dev shell in `packages/` is for local development only. RHDH production deployment uses dynamic plugins (see `dynamic-plugins-filesystem-reference.yaml` and `dynamic-plugins-image-reference.yaml`). The backend Dockerfile includes a warning that it bundles dev-config and is not production-ready without overrides.

**Lazy loading convention:** All heavy UI should be loaded via dynamic `import()` at the PageBlueprint loader boundary. This establishes the pattern for future chat, admin, and gallery components.

---

## Future Evolution

The empty `Container` in `AiCatalogPage` will be replaced incrementally:

1. **Agent gallery content** — agent cards, search, filter, tabs, preview panel per [Agent Creation & Discovery PRD](agent-creation-discovery.md)
2. **Catalog entity integration** — render agents, models, tools, and MCP servers from Backstage catalog entities emitted by entity providers
3. **Additional routes** — chat experience and admin panels as additional `PageBlueprint` extensions or nested routes within the boost plugin

---

## Traceability

| Capability              | Use Case                      | Priority | Status      |
| ----------------------- | ----------------------------- | -------- | ----------- |
| AI Catalog route + nav  | UC-4, UC-9 (entry point only) | P0       | Scaffold    |
| Dev shell               | UC-15 (local dev path)        | P0       | Delivered   |
| Plugin registration     | UC-15 (static plugin path)    | P0       | Delivered   |
| NFS frontend plugin     | (foundation)                  | P0       | Delivered   |
| Configuration templates | UC-15                         | P0       | Delivered   |
| Developer workflows     | (foundation)                  | P0       | Delivered   |
| Gallery content         | UC-4, UC-9                    | P1       | Not started |
| Chat UI                 | UC-1                          | P0       | Not started |
| Admin panels            | UC-17, UC-21                  | P0       | Not started |

---

## Customer Context

This foundation enables the specification-driven development workflow defined in `AGENTS.md`: developers can now implement features against a runnable app, verify backend integration locally, and iterate on the AI Catalog page as agent discovery capabilities are built out per the Agent Creation & Discovery PRD.
