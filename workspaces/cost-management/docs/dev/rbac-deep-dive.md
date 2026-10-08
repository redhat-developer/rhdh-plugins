# RBAC Deep Dive — Cost Management Plugin

How RBAC works in the Cost Management plugin, how to configure it, and the differences between local development and a real RHDH instance on OpenShift. This is the **RBAC-focused companion** to the other docs in this workspace.

For the high-level architecture see [`architecture.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/architecture.md). For proxy/security internals see [`backend-proxy-and-security.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/backend-proxy-and-security.md). For permission names and CSV examples see [`rbac.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/rbac.md). For API flow see [`api-flow.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/api-flow.md).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Core concepts](#core-concepts)
- [Permission catalogue](#permission-catalogue)
- [How RBAC enforcement works — code walkthrough](#how-rbac-enforcement-works--code-walkthrough)
- [Local development RBAC setup](#local-development-rbac-setup)
- [RHDH on OpenShift — how RBAC works in production](#rhdh-on-openshift--how-rbac-works-in-production)
- [Local vs production — key differences](#local-vs-production--key-differences)
- [Debugging RBAC issues](#debugging-rbac-issues)
- [Related documents](#related-documents)

---

## Prerequisites

You should be familiar with:

- [Backstage Permissions overview](https://backstage.io/docs/permissions/overview/) — how plugins define and check permissions
- [Authorization in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/index) — RHDH's RBAC model built on top of Backstage permissions
- [Casbin RBAC](https://casbin.org/docs/rbac) — the policy engine behind RHDH's RBAC plugin (CSV syntax)
- [Authentication in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authentication_in_red_hat_developer_hub/index) — how users/groups are provisioned from identity providers (determines the `user:default/…` identity RBAC evaluates)
- [`@backstage-community/plugin-rbac-backend`](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend) — the community RBAC backend that evaluates policies (used locally; built into RHDH in production)
- [`@backstage-community/plugin-rbac`](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac) — the RBAC frontend (Admin UI for managing roles and policies)
- [`backend-proxy-and-security.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/backend-proxy-and-security.md) — why RBAC is enforced server-side and how the secure proxy works

---

## Core concepts

| Concept                        | What it means for this plugin                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plugin defines permissions** | [`permissions.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-common/src/permissions.ts) creates permission objects (`ros.plugin`, `cost.plugin`, `ros/{cluster}`, etc.). The plugin **never** decides allow/deny itself.                                                                                                                                                                                 |
| **RBAC backend decides**       | Backstage's `PermissionsService` (backed by the RBAC plugin) evaluates policies and returns ALLOW/DENY.                                                                                                                                                                                                                                                                                                                                                                      |
| **Server-side only**           | All enforcement happens in [`secureProxy.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts) and [`applyRecommendation.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/applyRecommendation.ts). The frontend `usePermission` on the Apply button is UX only — the backend re-checks. |
| **Two domains**                | **`ros.*`/`ros/…`** for Optimizations, **`cost.*`/`cost/…`** for OpenShift cost — independent permission trees.                                                                                                                                                                                                                                                                                                                                                              |
| **Dynamic registration**       | At startup, [`router.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/service/router.ts) fetches all known clusters/projects from the upstream API and registers `ros/{cluster}`, `ros/{cluster}/{project}`, `cost/{cluster}`, `cost/{cluster}/{project}` permissions with the permission integration router. **New clusters require a restart.**                                              |

---

## Permission catalogue

### Optimizations (`ros.*`)

| Permission                | Action   | Scope                                           |
| ------------------------- | -------- | ----------------------------------------------- |
| `ros.plugin`              | `read`   | All optimizations data (plugin-wide)            |
| `ros/{CLUSTER}`           | `read`   | Cluster-specific (all projects in that cluster) |
| `ros/{CLUSTER}/{PROJECT}` | `read`   | Project-specific within a cluster               |
| `ros.apply`               | `update` | Execute Apply Recommendation workflow           |

### OpenShift Cost (`cost.*`)

| Permission                 | Action | Scope                                           |
| -------------------------- | ------ | ----------------------------------------------- |
| `cost.plugin`              | `read` | All OpenShift cost data (plugin-wide)           |
| `cost/{CLUSTER}`           | `read` | Cluster-specific (all projects in that cluster) |
| `cost/{CLUSTER}/{PROJECT}` | `read` | Project-specific within a cluster               |

**Hierarchy rule:** plugin-level ALLOW (`ros.plugin` / `cost.plugin`) grants full access — you **cannot** selectively deny a cluster underneath it. Grant plugin-wide only for admins; use cluster/project scoping for everyone else.

Full examples and migration guide (dot → slash separator change): [`rbac.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/rbac.md).

---

## How RBAC enforcement works — code walkthrough

### Step 1 — Permissions are defined in `cost-management-common`

[`permissions.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-common/src/permissions.ts) uses Backstage's `createPermission` to define all permission objects. Cluster/project permissions are factory functions:

```typescript
// Plugin-wide
export const rosPluginReadPermission = createPermission({
  name: 'ros.plugin',
  attributes: { action: 'read' },
});

// Cluster-specific (generated per cluster name)
export const rosClusterSpecificPermission = (clusterName: string) =>
  createPermission({
    name: `ros/${clusterName}`,
    attributes: { action: 'read' },
  });

// Cluster+Project-specific
export const rosClusterProjectPermission = (
  clusterName: string,
  projectName: string,
) =>
  createPermission({
    name: `ros/${clusterName}/${projectName}`,
    attributes: { action: 'read' },
  });
```

The same pattern exists for `cost.*` permissions.

### Step 2 — Dynamic permissions are registered at startup

[`router.ts:79-149`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/service/router.ts#L79-L149) — `fetchDynamicPermissions()` calls the upstream APIs to discover all clusters and projects, then builds a permission object for every `ros/{cluster}`, `ros/{cluster}/{project}`, `cost/{cluster}`, and `cost/{cluster}/{project}` combination. These are passed to `createPermissionIntegrationRouter` so the RBAC backend knows they are valid permissions:

```typescript
const permissionsIntegrationRouter = createPermissionIntegrationRouter({
  permissions: [
    ...rosPluginPermissions, // ros.plugin
    ...rosApplyPermissions, // ros.apply
    ...costPluginPermissions, // cost.plugin
    ...dynamicPermissions, // ros/{cluster}, cost/{cluster}, etc.
  ],
});
```

Without this registration, the RBAC backend would return DENY for any `ros/my-cluster` policy because it wouldn't recognise that permission.

### Step 3 — Every request goes through `resolveAccess()`

[`secureProxy.ts:46-56`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L46-L56) — when a request hits `/proxy/*`, `resolveAccess()` picks the domain based on the path:

- `recommendations/…` → `ros.*` permissions
- Anything else → `cost.*` permissions

### Step 4 — Plugin-level check, then cluster/project filtering

[`secureProxy.ts:71-153`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L71-L153) — `resolveAccessForSection()`:

1. **Plugin-level check** — calls `authorize()` with `rosPluginPermissions` or `costPluginPermissions`. If ALLOW → full access, no filters injected.
2. **Cluster-level check** — if plugin-level is DENY, fetches all clusters from the upstream API (cached 15 min), checks `ros/{cluster}` or `cost/{cluster}` for each cluster.
3. **Project-level check** — for clusters where the user has no cluster-wide access, checks `ros/{cluster}/{project}` or `cost/{cluster}/{project}` for each combination. Project-level access also grants cluster access (the user sees the cluster, but only data for that project).

[`checkPermissions.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/util/checkPermissions.ts) implements the actual `authorize()` call (OR logic — any matching permission = ALLOW) and `filterAuthorizedClustersAndProjects()` (combined cluster + project authorization).

### Step 5 — Filter stripping + injection

[`secureProxy.ts:353-374`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L353-L374) — the server:

1. **Strips** any `filter[exact:cluster]` and `filter[exact:project]` the client sent.
2. **Injects** only the RBAC-authorized clusters/projects as `filter[exact:…]` params.

This is the key security property — a user **cannot widen** their access by editing query params in DevTools. See [`backend-proxy-and-security.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/backend-proxy-and-security.md) for the full security analysis.

### Step 6 — Audit log

Every ALLOW/DENY decision is logged with actor identity, resource path, and injected filters — see [`api-flow.md` §8](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/api-flow.md#8-errors--debugging).

---

## Local development RBAC setup

Locally, the plugin runs inside a throwaway Backstage instance (`packages/app` + `packages/backend`). RBAC is provided by explicitly adding [`@backstage-community/plugin-rbac-backend`](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend).

### What wires it together

[`packages/backend/src/index.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/packages/backend/src/index.ts):

```typescript
// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// rbac provides the policy implementation for the permission plugin
backend.add(import('@backstage-community/plugin-rbac-backend'));
```

`app-config.local.yaml` (git-ignored, each developer creates their own) enables it:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: ${PROJECT_CWD}/policy.local.csv
    policyFileReload: true
    pluginsWithPermission:
      - cost-management
    admin:
      users:
        - name: group:default/admins
```

### The policy file — `policy.local.csv`

`policy.local.csv` (git-ignored, at the workspace root) defines local RBAC rules using [Casbin CSV format](https://casbin.org/docs/rbac). Example:

```csv
# Plugin-wide access for admin
p, role:default/rosAdmin, ros.plugin, read, allow
p, role:default/rosAdmin, cost.plugin, read, allow

# Scoped access for a regular user
p, role:default/rosUser, ros.plugin, read, deny
p, role:default/rosUser, ros/Openshift on Azure/mobile, read, allow
p, role:default/rosUser, ros/Openshift on Azure/openshift, read, allow

# OpenShift cost — cluster-level access
p, role:default/rosUser, cost.plugin, read, allow
p, role:default/rosUser, cost/Openshift on Azure, read, allow

# Role assignments
g, user:default/pw-test-user, role:default/rosUser
g, group:default/admins, role:default/rosAdmin
```

**Key points:**

- `policyFileReload: true` means edits to `policy.local.csv` take effect without restarting the backend.
- `pluginsWithPermission` must include `cost-management` — otherwise the RBAC backend won't evaluate its permissions.
- Duplicate rows in the CSV **silently break the entire file reload**. Check with: `sort policy.local.csv | uniq -d`.

### Testing different users locally

The local dev shell supports **guest** (auto-admin if listed in `admin.users`) and **GitHub** auth. To test scoped access:

1. Sign in as a non-admin user (e.g. via GitHub OAuth with a test account).
2. Ensure the user is listed in `policy.local.csv` with a role assignment (`g, user:default/USERNAME, role:default/rosUser`).
3. Add scoped rules for that role (e.g. `p, role:default/rosUser, ros/demolab, read, allow`).
4. Verify in the UI — the user should only see data for allowed clusters/projects.

---

## RHDH on OpenShift — how RBAC works in production

On a real RHDH instance deployed via the Operator or Helm chart on OpenShift, the RBAC infrastructure is **built into RHDH** — you don't install `@backstage-community/plugin-rbac-backend` yourself. The Cost Management plugin code is identical; only the surrounding environment differs.

### Enabling RBAC for the plugin

RHDH must be told that this plugin participates in the permission framework. In the RHDH `app-config` (typically a ConfigMap):

```yaml
permission:
  enabled: true
  rbac:
    pluginsWithPermission:
      - cost-management
```

Without `cost-management` in `pluginsWithPermission`, the RBAC backend won't evaluate `ros.*` / `cost.*` permissions — every check returns DENY. See [RHDH docs: Enable RBAC — pluginsWithPermission](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/enable-and-give-access-to-the-role-based-access-control-rbac-feature_authorization-in-rhdh).

### Managing policies in RHDH

In production, policies can be managed through:

| Method                                                                                                     | How                                                     | When to use                                     |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **[RBAC Admin UI](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac)** | RHDH sidebar → Administration → RBAC                    | Ad-hoc changes, exploring available permissions |
| **Policy CSV file**                                                                                        | Mount as a ConfigMap, reference via `policies-csv-file` | GitOps / version-controlled policies            |

The CSV format is identical to `policy.local.csv` — the same Casbin syntax works everywhere:

```csv
p, role:default/cost-viewer, cost.plugin, read, allow
p, role:default/ros-viewer, ros/production-cluster, read, allow
p, role:default/ros-viewer, ros.apply, update, deny

g, user:default/jane, role:default/cost-viewer
g, user:default/jane, role:default/ros-viewer
```

### Auth providers in production

Locally, you typically use guest or GitHub OAuth. On OpenShift, RHDH is configured with an enterprise identity provider (OIDC via Red Hat SSO / Keycloak, LDAP, etc.). The user identity that RBAC evaluates comes from whichever auth provider is configured — the plugin doesn't care which one, it just calls `httpAuth.credentials(req)`. See [Authentication in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authentication_in_red_hat_developer_hub/index) for how to configure identity providers and provision users/groups into the catalog.

### Dynamic permission registration — restart requirement

The cluster/project permissions (`ros/{cluster}`, `cost/{cluster}`, etc.) are fetched from the upstream API **once at plugin startup** ([`router.ts:79-149`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/service/router.ts#L79-L149)). If a new OpenShift cluster is added to the Cost Management service account:

- The RBAC admin can write a policy rule for `ros/new-cluster` immediately.
- But the RBAC backend won't recognise that permission until the Backstage instance (or the RHDH pod) is restarted and the plugin re-fetches the cluster list.

---

## Local vs production — key differences

| Aspect                        | Local (`yarn start`)                                                                | RHDH on OpenShift                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **RBAC backend**              | `@backstage-community/plugin-rbac-backend` added in `packages/backend/src/index.ts` | Built into RHDH — no manual install                                                                                                                                                                             |
| **Plugin loading**            | Source-level via Yarn workspaces                                                    | Dynamic plugin (OCI image)                                                                                                                                                                                      |
| **Policy source**             | `policy.local.csv` file with `policyFileReload: true`                               | ConfigMap, RBAC Admin UI, or REST API                                                                                                                                                                           |
| **Auth provider**             | Guest / GitHub OAuth                                                                | Enterprise OIDC (Keycloak, RHSSO, etc.)                                                                                                                                                                         |
| **User identity**             | `user:default/guest` or `user:default/github-username`                              | `user:default/sso-username` or from LDAP/OIDC claim                                                                                                                                                             |
| **`pluginsWithPermission`**   | Set in `app-config.local.yaml`                                                      | Set in RHDH ConfigMap                                                                                                                                                                                           |
| **New cluster pickup**        | Restart backend (`Ctrl+C` + `yarn start-backend`)                                   | Restart RHDH pod (`oc rollout restart deployment/...`)                                                                                                                                                          |
| **Testing with `rhdh-local`** | N/A — that's a separate Podman/Docker setup                                         | Closer to production; see [`testing-cost-management-on-rhdh-local.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/testing-cost-management-on-rhdh-local.md) |

**The plugin code is identical in all environments.** The difference is only in how the surrounding platform (local Backstage vs RHDH) provides the `PermissionsService` and how policies are loaded.

---

## Debugging RBAC issues

| Symptom                                      | Likely cause                                      | What to check                                                     |
| -------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| **403 on all requests**                      | `pluginsWithPermission` missing `cost-management` | `app-config` → `permission.rbac.pluginsWithPermission`            |
| **403 for a specific user**                  | No matching policy rule                           | CSV file or RBAC Admin UI — is the user's role assigned?          |
| **User sees all data despite scoped policy** | `ros.plugin` / `cost.plugin` is ALLOW             | Plugin-level ALLOW overrides all cluster/project rules            |
| **Scoped rule has no effect**                | Cluster name mismatch (case-sensitive)            | Names in CSV must match exactly what the upstream API returns     |
| **Policy edits ignored**                     | Duplicate row in CSV                              | `sort policy.local.csv \| uniq -d` — any output = problem         |
| **New cluster not in RBAC**                  | Permissions not registered                        | Restart backend/RHDH pod to re-fetch cluster list                 |
| **403 vs 502 confusion**                     | 403 = RBAC denied, 502 = SSO auth failed          | Check audit logs — 403 has `"decision":"DENY"`, 502 has SSO error |

**Audit logs** are the primary debugging tool. Filter backend stdout for `"audit":true` to see every ALLOW/DENY decision with actor, resource, and injected filters. See [`api-flow.md` §8](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/api-flow.md#8-errors--debugging).

---

## Related documents

| Document                                                                                                                                                                                                                                          | What it covers                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`rbac.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/rbac.md)                                                                                                                                   | Permission names, policy CSV examples, migration guide              |
| [`backend-proxy-and-security.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/backend-proxy-and-security.md)                                                                                   | Why server-side enforcement, filter stripping, two-credential model |
| [`architecture.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/architecture.md)                                                                                                               | High-level architecture, packages, config                           |
| [`api-flow.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/api-flow.md)                                                                                                                       | Hop-by-hop request flow, auth at each hop, debugging                |
| [`local-dev-setup.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/local-dev-setup.md)                                                                                                         | Local dev environment, RBAC in local dev                            |
| [`testing-cost-management-on-rhdh-local.md`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/docs/dev/testing-cost-management-on-rhdh-local.md)                                                             | Testing with `rhdh-local` (Podman/Docker Compose)                   |
| [RHDH Authorization docs](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/index)                                                                                                  | Official RHDH RBAC documentation                                    |
| [RHDH Authentication docs](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authentication_in_red_hat_developer_hub/index)                                                                                                | Identity providers, user/group provisioning, session management     |
| [Enable RBAC — pluginsWithPermission](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/enable-and-give-access-to-the-role-based-access-control-rbac-feature_authorization-in-rhdh) | How to enable RBAC for plugins in RHDH                              |
| [`@backstage-community/plugin-rbac-backend`](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend)                                                                                                       | Community RBAC backend — policy engine, CSV/DB storage, REST API    |
| [`@backstage-community/plugin-rbac`](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac)                                                                                                                       | Community RBAC frontend — Admin UI for roles and policies           |
