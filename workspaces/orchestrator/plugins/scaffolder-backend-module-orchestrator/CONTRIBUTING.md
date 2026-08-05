# Contributing — Orchestrator scaffolder backend module

Developer guide for
`@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator`.
For operator install and configuration, see [README.md](./README.md).

## Prerequisites

- Node.js **22 or 24** (see workspace `engines` in
  `workspaces/orchestrator/package.json`)
- Yarn (this workspace has its own `yarn.lock`; run commands from
  `workspaces/orchestrator/`)

## Development harness

Start this module in isolation with the package’s minimal harness config:

```bash
export BACKSTAGE_DEV_STATIC_TOKEN=dev-static-token-min-8

yarn workspace @red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator start \
  --config app-config.yaml
```

(`--config` paths are resolved from the plugins directory.)

This runs [`dev/index.ts`](dev/index.ts): a minimal backend with
`@backstage/plugin-scaffolder-backend` and this module. Use it to verify action
registration and local scaffolder integration work.

The harness listens on port **7007**. Only one plugin `dev/` harness should run
on that port at a time.

### Environment setup

Export these variables in your shell before starting the harness. Use local-only
placeholder values for development — do not commit secrets.

| Variable                     | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `BACKSTAGE_DEV_STATIC_TOKEN` | Static bearer token for authenticated `curl` calls to the dev backend |

[`app-config.yaml`](./app-config.yaml) in this package is the **minimal** config
required to run the dev harness (listen port and static auth). Prefer starting
with `--config app-config.yaml` as shown above.

Optional overrides can go in an untracked `app-config.local.yaml` next to the
config file you pass.

### API authentication for `curl`

The harness [`app-config.yaml`](./app-config.yaml) registers a **static**
backend access token (see
[service-to-service auth](https://backstage.io/docs/auth/service-to-service-auth)):

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${BACKSTAGE_DEV_STATIC_TOKEN}
          subject: user:default/guest
```

Authenticated scaffolder API requests must send that token:

```bash
curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
  "http://localhost:7007/api/scaffolder/v2/actions"
```

Requests without a valid `Authorization: Bearer …` header are rejected when the
default auth policy applies.

## Validation commands

From the workspace root (`workspaces/orchestrator`):

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator test
yarn workspace @red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator lint:check
yarn tsc:full
```

## What automated tests cover

CI exercises:

- **Module wiring** — scaffolder extension-point registration of
  `orchestrator:workflow:run` and `orchestrator:workflow:get_params`
- **Action handlers** — mocked discovery/auth happy paths, dry-run short-circuit
  (run), and representative error mapping via `getError`
- **Utils** — discovery base URL, plugin request token / secret fallback, axios
  error reshaping

CI does **not** replace reading
[Backstage release notes](https://github.com/backstage/backstage/releases) for
the `@backstage/*` packages this module depends on. After a dependency bump,
review those notes and decide whether additional validation is warranted.

## Full workspace app evaluation

Bump default for this package is **plugin `dev/` + package tests**. The
orchestrator workspace also has a full app (`packages/app`, `packages/backend`)
started with [`yarn dev`](../../docs/local-development.md) for SonataFlow + UI
flows. Do **not** add a second full Backstage application under this package.

End-to-end software-template runs against a live orchestrator backend belong in
a consumer Backstage / RHDH app or in
[rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays).

## Optional manual smoke checklist

Use when you change scaffolder integration code or are reviewing a Backstage
version bump:

1. Export the [environment variables](#environment-setup) and start this harness.
2. List registered scaffolder actions (requires Bearer token):

   ```bash
   curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
     "http://localhost:7007/api/scaffolder/v2/actions"
   ```

   Expect these action IDs in the response:

   - `orchestrator:workflow:run`
   - `orchestrator:workflow:get_params`

3. End-to-end template execution (running a software template through the UI or a
   full consumer Backstage app) is not covered by this harness alone. Confirm
   template output under `result` in a consumer app when needed. Live SonataFlow
   / Playwright coverage belongs in overlays or a consumer deployment — not as a
   required signal for this package’s bump trust.

## Related packages

- [@backstage/plugin-scaffolder-backend](https://www.npmjs.com/package/@backstage/plugin-scaffolder-backend)
  — host scaffolder backend plugin for this module
- [@red-hat-developer-hub/backstage-plugin-orchestrator-backend](../orchestrator-backend)
  — HTTP API these actions call via discovery
