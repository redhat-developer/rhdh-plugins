# X2Ansible Backstage Plugin

Backstage plugin workspace providing a web UI for the [X2Ansible](https://github.com/x2ansible/x2a-convertor) project — LLM-powered migration of applications to Ansible playbooks.

## Dev Environment

Prerequisites: Node.js 22 or 24, Yarn.

```sh
yarn install
```

Optional environment variables for OAuth sign-in (see `app-config.yaml` `auth:` section):

```sh
export AUTH_GITHUB_CLIENT_ID=...
export AUTH_GITHUB_CLIENT_SECRET=...
export AUTH_GITLAB_CLIENT_ID=...
export AUTH_GITLAB_CLIENT_SECRET=...
export AUTH_BITBUCKET_CLIENT_ID=...
export AUTH_BITBUCKET_CLIENT_SECRET=...
```

Start the frontend and backend plugins only:

```sh
yarn dev
```

Start the full Backstage application (includes scaffolder, RBAC, catalog):

```sh
yarn start
```

Frontend: `http://localhost:3000`, backend: `http://localhost:7007`.

## Build

```sh
yarn build:all          # Build all packages
yarn build:backend      # Build backend only
yarn tsc:full           # Full TypeScript check (no incremental)
```

Build dynamic plugin OCI images:

```sh
./scripts/build-dynamic-plugins.sh          # Build all
./scripts/build-dynamic-plugins.sh --report # Print image report (no build)
```

## Test

Unit tests use Jest via `backstage-cli`. Backend tests require `NODE_OPTIONS='--experimental-vm-modules'` (already set in per-package scripts).

```sh
yarn test              # Unit tests (SQLite only)
yarn test:pg           # Unit tests (SQLite + PostgreSQL via testcontainers, requires Docker/Podman)
yarn test:all          # Full suite: openapi-generate + prettier + lint + test --coverage
yarn test:all:pg       # Full suite with PostgreSQL
```

Run a single package's tests:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-x2a-backend test
```

PostgreSQL tests use `testcontainers` and need `CI=true` plus a running Docker/Podman daemon. On Fedora/RHEL with Podman:

```sh
systemctl --user enable --now podman.socket
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
```

Test files live next to the source they test, named `*.test.ts` / `*.test.tsx`.

E2E tests use Playwright (`packages/app/e2e-tests/`). Currently a placeholder — the scaffold is in place but no real tests yet.

```sh
yarn test:e2e          # (skipped until tests exist)
```

## Code Style

Prettier config: `@backstage/cli/config/prettier`. ESLint config inherits from `../../.eslintrc.cjs` (root repo).

```sh
yarn prettier:check    # Check formatting
yarn prettier:fix      # Fix formatting
yarn lint              # Lint changed packages (since origin/main)
yarn lint:all          # Lint all packages
yarn lint:all --fix    # Auto-fix lint issues
```

Key lint rules (from root `.eslintrc.cjs`):

- Copyright header required: `Copyright (The Backstage Authors|Red Hat, Inc.|...)`.
- Use `.toLocaleLowerCase('en-US')` / `.toLocaleUpperCase('en-US')` instead of `.toLowerCase()` / `.toUpperCase()`.
- Production code: avoid raw `<button>`, `<p>`, `<span>` — use Material UI components.
- Avoid implicit globals — prefix with `window.`.

Changesets are required for every user-facing change. Config: `.changeset/config.json`.

## OpenAPI Code Generation

The backend plugin defines its API in `plugins/x2a-backend/src/schema/openapi.yaml`. After editing, regenerate types:

```sh
yarn openapi-generate
```

This generates:

- Server types in `plugins/x2a-backend/src/schema/openapi/generated/`
- Client types in `plugins/x2a-common/client/src/schema/openapi/generated/`

Implement new endpoints in `plugins/x2a-backend/src/router/`. Import generated types from `./schema/openapi`.

## Architecture

This is a Yarn workspaces monorepo (`packages/*`, `plugins/*`).

### Packages

| Package            | Role                   | npm name  |
| ------------------ | ---------------------- | --------- |
| `packages/app`     | Backstage frontend app | (private) |
| `packages/backend` | Backstage backend app  | (private) |

### Plugins

| Directory                               | Role                                                  | npm name                                                                |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `plugins/x2a`                           | Frontend plugin                                       | `@red-hat-developer-hub/backstage-plugin-x2a`                           |
| `plugins/x2a-backend`                   | Backend plugin (REST API, K8s jobs, DB)               | `@red-hat-developer-hub/backstage-plugin-x2a-backend`                   |
| `plugins/x2a-common`                    | Shared library (types, domain objects, CSV parsing)   | `@red-hat-developer-hub/backstage-plugin-x2a-common`                    |
| `plugins/x2a-node`                      | Backend node library (service interfaces, refs)       | `@red-hat-developer-hub/backstage-plugin-x2a-node`                      |
| `plugins/x2a-dcr`                       | Frontend plugin for OAuth Dynamic Client Registration | `@red-hat-developer-hub/backstage-plugin-x2a-dcr`                       |
| `plugins/x2a-mcp-extras`                | Backend plugin exposing MCP tools                     | `@red-hat-developer-hub/backstage-plugin-x2a-mcp-extras`                |
| `plugins/scaffolder-backend-module-x2a` | Scaffolder module for project creation templates      | `@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-x2a` |

### Key directories inside plugins

- `plugins/x2a-backend/src/router/` — REST API route handlers
- `plugins/x2a-backend/src/services/` — Business logic (database, Kubernetes, etc.)
- `plugins/x2a-backend/src/schema/openapi.yaml` — OpenAPI spec (source of truth for the API)
- `plugins/x2a-backend/migrations/` — Knex database migrations (run automatically on start)
- `plugins/x2a/src/components/` — React UI components
- `plugins/x2a/src/hooks/` — React hooks
- `plugins/x2a/src/translations/` — i18n translation strings
- `plugins/x2a-common/src/domain/` — Domain value objects (`Phase`, `JobStatus`, `ArtifactKind`, `ProjectState`)
- `plugins/x2a-common/src/scm/` — SCM provider detection logic
- `plugins/x2a-common/src/csv/` — CSV bulk import parsing

### Database

Default: SQLite in-memory (local dev). Supports PostgreSQL via Knex.js. Config in `app-config.yaml` under `backend.database`. Migrations in `plugins/x2a-backend/migrations/` — naming pattern: `YYYYMMDDHH_description.ts`.

### RBAC / Permissions

Permission framework is enabled (`permission.enabled: true`). Two permission types:

- `x2a.admin` — read/update all projects
- `x2a.user` — read/update own projects

Example policy: `examples/example-rbac-policy.csv`.

## PR and Commit Conventions

Commit messages follow `type(scope): description` — e.g. `feat(x2a): ...`, `fix(x2a): ...`, `chore(x2a): ...`.

Every PR that changes published packages must include a changeset (`.changeset/`). Releases are managed via `@changesets/cli`. The `baseBranch` is `main`.

## CI

CI runs via `.github/workflows/ci.yml` on pull requests. For each changed workspace it runs (on Node 22 and 24):

1. `yarn install --immutable`
2. `yarn fix --check`
3. `yarn backstage-cli config:check --lax`
4. `yarn tsc:full`
5. `yarn prettier:check`
6. `yarn build:api-reports:only --ci`
7. `yarn backstage-cli repo build --all`
8. `yarn backstage-cli repo lint --since origin/main`
9. `yarn backstage-cli repo fix --check --publish`
10. `yarn test:all` (with coverage)
11. Playwright tests (if `playwright.config.ts` exists)
12. Clean working directory check

A separate verify job checks lockfile duplicates and changesets.

Run the full pre-CI check locally:

```sh
yarn chores   # prettier:fix + lint:all --fix + tsc:full + build:api-reports + test:all:pg
```

## Security

- Credential management (LLM keys, AAP passwords) is handled via Kubernetes secrets — see `plugins/x2a-backend/src/services/`. Changes here require careful review.
- RBAC permission checks live in `plugins/x2a-node/src/` and `plugins/x2a-backend/src/router/`. Verify permission logic when adding or changing endpoints.
- OAuth token handling for SCM providers is in `plugins/x2a/src/repoAuth/` and `plugins/x2a/src/scaffolder/`. Tokens are stored as scaffolder secrets.
