# Contributing to the Extensions backend plugin

Local development for `@red-hat-developer-hub/backstage-plugin-extensions-backend`. Operator install and configuration stay in the [README](./README.md).

## Prerequisites

From `workspaces/extensions`:

```bash
yarn install
```

Commands below assume that workspace as the current directory unless noted.

## Plugin `dev/` harness

The standalone harness reads [`app-config.yaml`](./app-config.yaml) in this package. Supply a **local-only** static token before starting (Backstage requires at least 8 characters). Do not commit real secrets; `*.local.yaml` is gitignored.

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend start
```

The server listens on `http://localhost:7007`. Default auth policy applies: requests without `Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}` are rejected.

[`app-config.yaml`](./app-config.yaml) registers that token as `backend.auth.externalAccess` (see [service-to-service auth](https://backstage.io/docs/auth/service-to-service-auth)):

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${BACKSTAGE_DEV_STATIC_TOKEN}
          subject: extensions-dev
```

Optional overrides can go in an untracked `app-config.local.yaml` next to the harness config (or at the workspace root for the full app).

This harness does **not** run `@backstage/plugin-catalog-backend` or the catalog module. Catalog-backed list/get routes (`GET /api/extensions/plugins`, packages, collections) need the [full workspace](#when-to-use-the-full-workspace). Routes that only read process env or plugin config work here.

### Config keys (names only)

| Key                                             | Purpose                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `backend.auth.externalAccess`                   | Static bearer token for local API calls (`type: static`). Contributor-supplied; not for production. |
| `extensions.installation.enabled`               | Enables write/install APIs. Defaults to `false` (standalone `dev/` is disabled).                    |
| `extensions.installation.saveToSingleFile.file` | Path to the YAML file used when installation is enabled.                                            |

Do not commit real file paths from local machines or any tokens. See `config.d.ts` for the extensions schema.

### Curl smoke

```bash
curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
  http://localhost:7007/api/extensions/environment
# 200 { "nodeEnv": "..." }

curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
  http://localhost:7007/api/extensions/plugins/configure
# 200 { "enabled": false }  unless installation is enabled in config
```

Mutating configuration while installation is disabled (the `dev/` default):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:7007/api/extensions/plugin/default/plugin1/configuration \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
  -d '{"configYaml":"kind: Plugin"}'
# 503 InstallationInitError — installation disabled
```

A **403** on those routes is expected when the permission framework is enabled in the [full workspace](#when-to-use-the-full-workspace) and the caller lacks write permission. The harness static token is a service subject (`extensions-dev`), not an RBAC user.

### Permission CSV (reference)

Resource type is `extensions-plugin`. Permission names from `extensions-common`:

```csv
p, role:default/extensions-config-reader, extensions.plugin.configuration.read, read, allow
p, role:default/extensions-config-admin, extensions.plugin.configuration.write, create, allow
```

## Tests, lint, typecheck

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend test
yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend lint
yarn tsc
```

Jest is `backstage-cli package test` (coverage is on for this package). Use `CI=true` and `--watchAll=false` in non-interactive environments.

There is no package OpenAPI script. HTTP contract checks live in `src/plugin.test.ts` and `src/router.test.ts`.

## When to use the full workspace

Use plugin `dev/` plus the scoped test command for day-to-day backend work and **Backstage version-bump PRs**.

Use the workspace apps when you need **install APIs and the catalog module together**, real catalog entities, or RBAC:

| Command             | What it starts                                               |
| ------------------- | ------------------------------------------------------------ |
| `yarn start`        | NFS frontend (`packages/app`) + `packages/backend`           |
| `yarn start:legacy` | Legacy frontend (`packages/app-legacy`) + `packages/backend` |

For curl against the workspace backend, add the same `backend.auth.externalAccess` block to gitignored `workspaces/extensions/app-config.local.yaml` (or export `BACKSTAGE_DEV_STATIC_TOKEN` and uncomment the example in `app-config.yaml`). Workspace `app-config.yaml` does not ship a live token.

`packages/backend` already loads `extensions-backend`, `catalog-backend-module-extensions`, and RBAC. Do not add a third full app.

Workspace Playwright (`yarn test:e2e:ci`) covers catalog UI browse, i18n, and accessibility. It is **not** the merge gate for bump-trust (plugin init, router mount, permission rules, backend client). It does **not** cover install/configure flows, RBAC denial, or live dynamic-plugin install. Those belong in [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays) or a consumer RHDH deployment.

See the [workspace contributor index](../../CONTRIBUTING.md) for package test commands.
