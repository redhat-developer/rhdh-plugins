# Contributing — Orchestrator backend plugin

Developer guide for
`@red-hat-developer-hub/backstage-plugin-orchestrator-backend`. For operator
install and configuration, see [README.md](./README.md) and the workspace
[Orchestrator frontend README](../orchestrator/README.md).

## Prerequisites

- Node.js **22 or 24** (see workspace `engines` in
  `workspaces/orchestrator/package.json`)
- Yarn (this workspace has its own `yarn.lock`; run commands from
  `workspaces/orchestrator/`)

## Development harness

Start this plugin in isolation:

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-orchestrator-backend start \
  --config app-config.yaml
```

(`--config` paths are resolved from the plugins directory.)

This runs [`dev/index.ts`](dev/index.ts): a minimal backend with
`orchestratorPlugin` only. Use it to verify HTTP mount and local API wiring.

The harness listens on the backend port from config (commonly **7007**). Only
one plugin `dev/` harness should run on that port at a time.

### Config stubs and `autoStart`

[`app-config.yaml`](./app-config.yaml) in this package is the **minimal** config
for local harness work (data-index URL stub). Prefer starting with
`--config app-config.yaml` as shown above.

Optional overrides can go in an untracked `app-config.local.yaml` next to the
config file you pass.

Integration tests and bump-trust CI must keep SonataFlow container launch off:

```yaml
orchestrator:
  sonataFlowService:
    autoStart: false
  dataIndexService:
    url: http://localhost:8080 # stub; tests mock service collaborators
```

`autoStart: true` launches a SonataFlow container via `DevModeService`. That is
for full workspace local development
([`docs/local-development.md`](../../docs/local-development.md)), not for
package unit/integration tests.

Do not commit secrets in package or test config.

### Unauthenticated health check

`GET /api/orchestrator/health` is registered with an unauthenticated auth
policy. You can smoke it without a bearer token:

```bash
curl "http://localhost:7007/api/orchestrator/health"
```

Expect `{ "status": "ok" }`.

## Validation commands

From the workspace root (`workspaces/orchestrator`):

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-orchestrator-backend test
yarn workspace @red-hat-developer-hub/backstage-plugin-orchestrator-backend lint:check
yarn tsc:full
```

## What automated tests cover

CI exercises:

- **Plugin wiring (`startTestBackend`)** — `/health` succeeds without auth;
  health remains open when permissions deny; representative **execute** and
  **logs** routes return **403** when permission is denied
- **Router authorization** — deeper ALLOW / DENY / CONDITIONAL matrices in
  `src/service/router.test.ts` (not re-duplicated at plugin level)
- **OrchestratorService** — proportional outcome assertions (not mock-call-only)
  for bump-sensitive paths such as abort and execute
- **Other unit suites** — SonataFlow client, data index, mappings, permissions
  rules, etc.

CI does **not** replace reading
[Backstage release notes](https://github.com/backstage/backstage/releases) for
the `@backstage/*` packages this plugin depends on. After a dependency bump,
review those notes and decide whether additional validation is warranted.

## Full workspace app evaluation

Bump default for this package is **plugin `dev/` + package tests**. The
orchestrator workspace also includes `packages/app` and `packages/backend`,
started with [`yarn dev`](../../docs/local-development.md) when you need
SonataFlow container auto-start, workflow clone, and the full UI.

Do **not** add a second full Backstage application under this package for
day-to-day contributor or CI work. Multi-user / credential-backed /
production-like e2e belongs in a consumer RHDH deployment or
[rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays).

## Optional manual smoke checklist

Use when you change HTTP router / auth-policy code or are reviewing a Backstage
version bump:

1. Start this harness with `--config app-config.yaml` (and local overrides if
   needed). Ensure `autoStart` is false / unset unless you intentionally want a
   SonataFlow container.
2. Hit health:

   ```bash
   curl "http://localhost:7007/api/orchestrator/health"
   ```

3. Protected execute/log routes require a running permission policy and (for
   most paths) a reachable data-index / workflow services. Prefer the automated
   DENY→403 cases in `src/plugin.test.ts` for bump confidence. Full SonataFlow
   / Playwright coverage belongs in overlays or a consumer deployment.

## Related packages

- [@red-hat-developer-hub/backstage-plugin-orchestrator](../orchestrator) —
  frontend plugin
- [@red-hat-developer-hub/backstage-plugin-orchestrator-backend-module-loki](../orchestrator-backend-module-loki)
  — workflow log provider module
- [@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator](../scaffolder-backend-module-orchestrator)
  — scaffolder actions that call this API
