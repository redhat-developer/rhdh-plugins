# Cost Management Plugin for RHDH

## Build & Test Commands

Run all commands from `workspaces/cost-management/` (the workspace root).

- Install: `yarn install`
- Dev (full app + backend, slow): `yarn start`
- Dev (plugin hot-reload, fast): `yarn start:dev`
- Dev (frontend plugin only): `yarn start:fe-plugin`
- Dev (backend plugin only): `yarn start:be-plugin`
- Build all: `yarn build:all`
- Test all (with coverage): `yarn test:all`
- Test single file: `yarn test -- path/to/test.ts`
- Lint (changed files only): `yarn lint`
- Lint all: `yarn lint:all`
- Lint and fix: `yarn lint --fix path/to/file.ts`
- Type check: `yarn tsc`
- Prettier check: `yarn prettier:check`
- Prettier fix: `yarn prettier:fix`
- Clean: `yarn clean`
- Generate API reports: `yarn build:api-reports:only`

Node version: 22 or 24.

## Workspace Layout

```
workspaces/cost-management/
├── plugins/
│   ├── cost-management/           # Frontend plugin (@red-hat-developer-hub/plugin-cost-management)
│   ├── cost-management-backend/   # Backend plugin (@red-hat-developer-hub/plugin-cost-management-backend)
│   └── cost-management-common/    # Shared types, API clients, permissions
│       └── src/generated/         # Auto-generated OpenAPI types — do not hand-edit
├── packages/                      # Dev environment shell only (app + backend wiring)
├── docs/
│   ├── rbac.md                    # Full RBAC permission reference
│   └── dynamic-plugin.md          # Dynamic plugin installation guide
└── policy.local.csv               # Local RBAC policy for dev/testing
```

**`packages/` is strictly the dev environment shell. Never add product logic there.**
All plugin code lives under `plugins/`.

## Key Conventions

- UI uses **MUI v4** components; charts use **PatternFly Victory** (react-intl for i18n)
- Do not add a `proxy:` block in `app-config.yaml` for cost APIs — the backend plugin is a full
  server-side secure proxy; the frontend never holds SSO tokens or calls RHHCC directly
- The Orchestrator plugin is **not** a compile-time dependency; it is resolved at runtime via
  Backstage service discovery. Do not add orchestrator packages to `package.json` for normal dev.
  Only add them locally when testing the Apply Recommendation workflow end-to-end (see README)
- Generated files under `plugins/cost-management-common/src/generated/` are produced from the
  OpenAPI spec — do not hand-edit them

## Architecture (Only Non-Obvious Parts)

### Backend secure proxy

All communication with Red Hat Hybrid Cloud Console (RHHCC) happens server-side:

1. `GET /api/cost-management/proxy/*` — authenticated via Backstage `httpAuth`, RBAC-checked,
   then forwarded to RHHCC `https://console.redhat.com/api/cost-management/v1/`
2. SSO token is acquired via OAuth2 `client_credentials` grant using `costManagement.clientId` /
   `costManagement.clientSecret` from `app-config.yaml` — never sent to the browser
3. Client-supplied `cluster`/`project` query params are ignored and overwritten — the backend
   injects its own server-authorized filters from the RBAC policy. Do not add these params on the frontend.
4. Cluster/project data is cached in-memory with a 15-minute TTL to avoid redundant upstream calls

### Permission namespaces (easy to mix up)

| Section        | Plugin-level (read all) | Cluster-level  | Cluster+Project-level  | Apply       |
| -------------- | ----------------------- | -------------- | ---------------------- | ----------- |
| Optimizations  | `ros.plugin`            | `ros/CLUSTER`  | `ros/CLUSTER/PROJECT`  | `ros.apply` |
| OpenShift cost | `cost.plugin`           | `cost/CLUSTER` | `cost/CLUSTER/PROJECT` | —           |

- **Dot separator** (`ros.plugin`, `cost.plugin`, `ros.apply`) → generic/action permissions
- **Slash separator** (`ros/cluster`, `cost/cluster/project`) → resource-scoped permissions
- Old dot-separated cluster/project names (`ros.demolab.thanos`) are **deprecated** — use slash
- `ros.plugin = ALLOW` bypasses all cluster/project filters (full access)
- `ros.plugin = ALLOW` (or `cost.plugin = ALLOW`) grants access to **all** clusters — you cannot then
  deny a specific cluster with `ros/CLUSTER = deny`; cluster-level deny is ignored when the plugin-level is allowed

### Filter injection (ROS vs cost API differ)

The RHHCC APIs use different query param keys:

- Optimizations API: `cluster=`, `project=`
- OpenShift cost API: `filter[exact:cluster]=`, `filter[exact:project]=`

The backend determines the correct key based on the proxy path prefix (`recommendations/` → ROS).

### Endpoints

All endpoints except `/health` require an authenticated user (Backstage `httpAuth`).

| Path                                              | Description                                                |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `GET /api/cost-management/health`                 | Health check (no auth)                                     |
| `GET /api/cost-management/proxy/*`                | Secure proxy to RHHCC                                      |
| `GET /api/cost-management/access`                 | Check Optimizations RBAC access                            |
| `GET /api/cost-management/access/cost-management` | Check OpenShift cost RBAC access                           |
| `POST /api/cost-management/apply-recommendation`  | Apply optimization via Orchestrator (requires `ros.apply`) |

### apply-recommendation

- `resourceType` is validated server-side against an allowlist:
  `deployment`, `replicaset`, `daemonset`, `statefulset`, `deploymentconfig`, `replicationcontroller`
- Calls the Orchestrator plugin backend using service-to-service auth (not user credentials)
- Emits a structured audit log entry including actor, decision, cluster, namespace, workload, workflow ID

### Audit logging

All backend endpoints emit structured audit log entries with:

- `actor` — authenticated user entity ref (e.g. `user:default/admin`)
- `action` — `data_access`, `apply_recommendation`, or `access_check`
- `decision` — `ALLOW` or `DENY`
- `resource` — upstream API path
- `filters` — server-injected cluster/project filters

## RBAC Local Testing

Enable in `app-config.yaml`:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: <absolute-path-to>/policy.local.csv
    policyFileReload: true
    admin:
      users:
        - name: user:default/YOUR_USER
```

Edit `policy.local.csv` for local policy iteration. See `docs/rbac.md` for the full permission
reference and policy examples.

## app-config.yaml Minimal Setup

```yaml
costManagement:
  clientId: ${RHHCC_SA_CLIENT_ID}
  clientSecret: ${RHHCC_SA_CLIENT_SECRET}
  optimizationWorkflowId: 'patch-k8s-resource' # only needed for apply-recommendation
```

No `proxy:` block required. The backend handles all upstream communication.

## PR Conventions

- All commits must include an `Assisted-by: <model>` footer below sign-offs when generated
  with AI assistance (e.g. `Assisted-by: Claude Sonnet 4.6`)
- Reference the JIRA ticket in the PR title (e.g. `RHIDP-XXXXX: ...`)
- Add a `.changeset/*.md` entry for any user-facing change (run `yarn changeset`)
