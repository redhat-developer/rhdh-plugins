# Contributing — Orchestrator Loki backend module

Developer guide for
`@red-hat-developer-hub/backstage-plugin-orchestrator-backend-module-loki`. For
operator install and Loki configuration, see [README.md](./README.md).

## Prerequisites

- Node.js **22 or 24** (see workspace `engines` in
  `workspaces/orchestrator/package.json`)
- Yarn (this workspace has its own `yarn.lock`; run commands from
  `workspaces/orchestrator/`)
- The host
  [`orchestrator-backend`](../orchestrator-backend) plugin (this module
  registers against its workflow-logs extension point)

## Development harness

This package has **no** standalone `dev/` harness. Day-to-day work uses package
tests. To exercise the module in a running backend, load it next to
`orchestrator-backend` (see [README.md](./README.md) installation), for example
in a consumer app or the workspace
[`yarn dev`](../../docs/local-development.md) stack with Loki configured.

Do not add a second full Backstage application under this package.

### Config notes

Required Loki keys live under `orchestrator.workflowLogProvider.loki` (`baseUrl`,
`token`, and optional hardening flags). Use local-only placeholder values for
development — do not commit secrets. See [README.md](./README.md) for the full
config table.

## Validation commands

From the workspace root (`workspaces/orchestrator`):

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-orchestrator-backend-module-loki test
yarn workspace @red-hat-developer-hub/backstage-plugin-orchestrator-backend-module-loki lint
yarn tsc:full
```

## What automated tests cover

CI exercises:

- **Module wiring** — `startTestBackend` smoke that the module calls
  `addWorkflowLogProvider` once with a provider whose id is `loki`
- **LokiProvider / helpers** — config validation (base URL, hosts, pipeline
  filters), query URL construction, and HTTP error mapping

CI does **not** replace reading
[Backstage release notes](https://github.com/backstage/backstage/releases) for
the `@backstage/*` packages this module depends on. After a dependency bump,
review those notes and decide whether additional validation is warranted.

Live Loki log-content matrices and production log pipelines are out of scope for
bump-trust CI.

## Full workspace app evaluation

Bump default for this module is **package tests** (registration smoke + provider
units). The orchestrator workspace also includes `packages/app` and
`packages/backend`, started with [`yarn dev`](../../docs/local-development.md)
when you need SonataFlow + UI + a real Loki endpoint.

End-to-end “view log” flows against a live Loki tenant belong in a consumer
Backstage / RHDH app or in
[rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays).

## Optional manual smoke checklist

Use when you change extension-point registration or Loki client wiring, or when
reviewing a Backstage version bump:

1. Confirm `yarn test` passes, including `src/module.test.ts`.
2. Optionally load this module with `orchestrator-backend` in a consumer or
   workspace backend that has `orchestrator.workflowLogProvider.loki` configured,
   then hit
   `/api/orchestrator/v2/workflows/instances/<instanceId>/logs` for a known
   instance.
3. Playwright / production Loki coverage belongs in overlays or a consumer
   deployment — not as a required signal for this module’s bump trust.

## Related packages

- [@red-hat-developer-hub/backstage-plugin-orchestrator-backend](../orchestrator-backend)
  — host plugin that owns `workflowLogsExtensionEndpoint`
- [@red-hat-developer-hub/backstage-plugin-orchestrator-node](../orchestrator-node)
  — extension-point and `WorkflowLogProvider` contract
