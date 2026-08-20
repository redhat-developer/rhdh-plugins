# Cost Management Plugin — Architecture

High-level picture of how the Cost Management plugin is put together. For hop-by-hop API behavior and code links see [`api-flow.md`](./api-flow.md); for a short walkthrough see [`walkthrough-architecture-api.md`](./walkthrough-architecture-api.md).

## Contents

1. [Prerequisites](#1-prerequisites)
2. [What This Plugin Does](#2-what-this-plugin-does)
3. [Packages](#3-packages)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Reading Data (Secure Proxy)](#5-reading-data-secure-proxy)
6. [Applying a Recommendation](#6-applying-a-recommendation)
7. [Permissions](#7-permissions)
8. [Audit Logging](#8-audit-logging)
9. [Configuration](#9-configuration)
10. [Related Documentation](#10-related-documentation)

---

## 1. Prerequisites

Skim these if the concepts are new:

- [What is Backstage](https://backstage.io/docs/overview/what-is-backstage)
- [Backend system overview](https://backstage.io/docs/backend-system/) — `createBackendPlugin`, service refs, `coreServices`
- [Permissions overview](https://backstage.io/docs/permissions/overview/)
- [Logger Service](https://backstage.io/docs/backend-system/core-services/logger/) — how this plugin writes structured audit lines (`coreServices.logger`)
- [`DiscoveryApi`](https://backstage.io/docs/reference/core-plugin-api.discoveryapi/) — resolves a plugin’s base URL at runtime (e.g. `getBaseUrl('cost-management')` → `/api/cost-management`) so clients never hardcode hosts; works the same locally and on RHDH. Backend twin: `DiscoveryService`.
- [About RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/about_red_hat_developer_hub/index)
- [Authorization in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/index)
- [RHDH dynamic plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/installing_and_viewing_plugins_in_red_hat_developer_hub/index)

Product context (optional): [Cost Management service](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/analyzing_your_cost_data/index) · [Resource Optimization for OpenShift](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index)

---

## 2. What This Plugin Does

Surfaces two Hybrid Cloud Console (`console.redhat.com`) services inside RHDH:

| Section           | Shows                                                    | Upstream                                |
| ----------------- | -------------------------------------------------------- | --------------------------------------- |
| **OpenShift**     | Cluster/project/node/tag cost tracking and trends        | Cost Management Service                 |
| **Optimizations** | CPU/memory right-sizing recommendations, including Apply | Resource Optimization Service (ROS-OCP) |

It is a **thin secure client** — no business logic or data storage in the plugin. The core rule: **the frontend never holds Red Hat service-account credentials or the upstream RH SSO token.** Everything sensitive stays in the backend.

---

## 3. Packages

All three share `pluginId` **`cost-management`** and ship together.

| Package                          | Role     | Job                                          | Code                                                                            |
| -------------------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `plugin-cost-management`         | frontend | React UI — pages, tables, charts, filters    | [`plugins/cost-management/src`](../plugins/cost-management/src)                 |
| `plugin-cost-management-backend` | backend  | Secure proxy + SSO tokens + RBAC enforcement | [`plugins/cost-management-backend/src`](../plugins/cost-management-backend/src) |
| `plugin-cost-management-common`  | common   | Shared permissions, API clients, types       | [`plugins/cost-management-common/src`](../plugins/cost-management-common/src)   |

In this workspace, `plugins/cost-management*` is the product; `packages/app` + `packages/backend` are a local-dev shell only.

---

## 4. High-Level Architecture

```text
  [ Browser ]                     plugin-cost-management
       |
       |  Backstage session (+ often Backstage Bearer JWT via fetchApi)
       |  — never the RH SSO service-account token
       v
  [ Backstage backend ]           plugin-cost-management-backend
       |  /api/cost-management/proxy/*
       |  - RBAC (PermissionsService)
       |  - SSO token manager (client_credentials, cached)
       |  - server-side cluster/project filter injection
       v
  [ console.redhat.com ]          Cost Management / ROS-OCP / Red Hat SSO
       |  Authorization: Bearer <RH SSO service-account token>
```

The browser only talks to the Backstage backend. The backend alone holds `costManagement.clientId` / `clientSecret`, obtains the RH SSO token, and decides what each user can see.

| Token                                                     | Hop                            | Meaning                                            |
| --------------------------------------------------------- | ------------------------------ | -------------------------------------------------- |
| Backstage user JWT (optional `Authorization` in DevTools) | Browser → backend              | Identifies the logged-in Backstage user            |
| RH SSO service-account token                              | Backend → `console.redhat.com` | Authenticates the plugin’s service account to RHCC |

Upstream traffic goes through `/api/cost-management/proxy/*` ([`secureProxy.ts`](../plugins/cost-management-backend/src/routes/secureProxy.ts)).

For Apply / Orchestrator, see [§6](#6-applying-a-recommendation).

---

## 5. Reading Data (Secure Proxy)

All OpenShift/Optimizations UI data goes through `GET /api/cost-management/proxy/*` ([`router.ts`](../plugins/cost-management-backend/src/service/router.ts)).

```text
  Browser
     |  1. GET /proxy/... (Backstage session / user JWT)
     v
  Backend secure proxy
     |  2. RBAC check → authorized clusters/projects
     |  3. RH SSO access token (cached) — tokenUtil.ts
     |  4. discard client cluster/project filters; inject server-authorized ones
     v
  console.redhat.com  →  JSON (Bearer RH SSO token)
     v
  Backend audit log  →  Browser renders UI
```

- Proxy is **GET-only**.
- Client-supplied `cluster`/`project` params are always replaced server-side (cannot widen access via DevTools).
- `clientId` / `clientSecret` and the **RH SSO** token never leave the backend process.

Key files:

- Frontend page: [`OptimizationsPage.tsx`](../plugins/cost-management/src/pages/optimizations/OptimizationsPage.tsx)
- Client: [`OptimizationsClient.ts`](../plugins/cost-management-common/src/clients/optimizations/OptimizationsClient.ts)
- Proxy: [`secureProxy.ts`](../plugins/cost-management-backend/src/routes/secureProxy.ts)
- SSO: [`tokenUtil.ts`](../plugins/cost-management-backend/src/util/tokenUtil.ts)
- Permissions helper: [`checkPermissions.ts`](../plugins/cost-management-backend/src/util/checkPermissions.ts)

[`DiscoveryApi`](https://backstage.io/docs/reference/core-plugin-api.discoveryapi/) (`discoveryApiRef` in [`plugin.ts`](../plugins/cost-management/src/plugin.ts)) looks up the cost-management backend base URL at runtime. Clients call `getBaseUrl('cost-management')` and append `/proxy` — no hardcoded `localhost:7007`. On Apply, discovery also finds the Orchestrator plugin via `getBaseUrl('orchestrator')`.

Details: [`api-flow.md`](./api-flow.md) · Step-by-step: [`walkthrough-architecture-api.md` §4](./walkthrough-architecture-api.md#4-step-by-step-viewing-optimizations-data).

---

## 6. Applying a Recommendation

The only write path: `POST /api/cost-management/apply-recommendation` ([`applyRecommendation.ts`](../plugins/cost-management-backend/src/routes/applyRecommendation.ts)). Apply uses Orchestrator for workflow execution.

**Orchestrator workflow integration:**

- [Design doc](https://docs.google.com/document/d/1DPDMQnLnEKcl7efcqpobKwD0Yw9wmKTkuN8qIyfogQ4/edit?tab=t.0)
- [Demo recording](https://drive.google.com/file/d/1q_Tk0FgbrQTuGTrEpIfjNYp9Lc7yu5J6/view?usp=sharing)

---

## 7. Permissions

Full catalogue and policy examples: [`rbac.md`](./rbac.md).

- Domains: **`ros.*`/`ros/…`** (Optimizations) and **`cost.*`/`cost/…`** (OpenShift cost) — plugin-wide plus cluster/project-scoped.
- **`ros.apply`** gates Apply.
- Plugin **defines** permissions; RHDH’s `PermissionsService` (RBAC plugin in prod) decides allow/deny.
- Enforcement is **server-side only**.

Dynamic cluster/project permissions register at backend startup — new clusters need a restart before they appear as RBAC scopes.

---

## 8. Audit Logging

Proxy, access-check, and Apply paths emit structured audit lines via Backstage’s [Logger Service](https://backstage.io/docs/backend-system/core-services/logger/) (`coreServices.logger` → `logger.info`), not the separate [Auditor Service](https://backstage.io/docs/backend-system/core-services/auditor/). Implementation: [`auditLog.ts`](../plugins/cost-management-backend/src/util/auditLog.ts) writes one JSON object per event with `"audit": true`, plus `actor`, `action`, `decision`, `resource`, and optional `filters` / `meta`.

**Why:** accountability and debugging after the secure-proxy / server-side Apply hardening — who accessed what, ALLOW/DENY, and which cluster/project filters were injected. Separate from operational `logger.error` lines (e.g. proxy exceptions).

**Where to see them:** backend process stdout only (no plugin UI). With `yarn start` / `yarn start-backend`, search the backend terminal (`:7007`) for `"audit":true`.

Format example: [`plugins/cost-management-backend/README.md`](../plugins/cost-management-backend/README.md).

---

## 9. Configuration

```yaml
costManagement:
  clientId: ${RHHCC_SA_CLIENT_ID}
  clientSecret: ${RHHCC_SA_CLIENT_SECRET}
  optimizationWorkflowId: 'patch-k8s-resource' # required for Apply — see §6
```

| Key                                        | Required        | Notes                                        |
| ------------------------------------------ | --------------- | -------------------------------------------- |
| `costManagement.clientId` / `clientSecret` | Yes             | Service account with `Cost OpenShift Viewer` |
| `costManagement.optimizationWorkflowId`    | Yes (for Apply) | Sent by the frontend on Apply                |
| `costManagementProxyBaseUrl`               | No              | Default `https://console.redhat.com/api`     |

Schemas: [`cost-management-backend/config.d.ts`](../plugins/cost-management-backend/config.d.ts) · [`cost-management/config.d.ts`](../plugins/cost-management/config.d.ts).

Install / local setup: [`dynamic-plugin.md`](./dynamic-plugin.md) · [`local-dev-setup.md`](./local-dev-setup.md) · [workspace README](../README.md).

---

## 10. Related Documentation

- [`walkthrough-architecture-api.md`](./walkthrough-architecture-api.md) — walkthrough + verification
- [`api-flow.md`](./api-flow.md) — request/response flow with code links
- [`rbac.md`](./rbac.md) — permissions and policies
- [`plugins/cost-management-backend/README.md`](../plugins/cost-management-backend/README.md) — endpoints and audit log format
- [Backstage Logger Service](https://backstage.io/docs/backend-system/core-services/logger/) — logging API this plugin uses
