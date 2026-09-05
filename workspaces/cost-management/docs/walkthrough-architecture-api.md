# Cost Management Plugin — Architecture & API Walkthrough

Walkthrough of architecture and API flow end to end. Deeper detail: [`architecture.md`](./architecture.md) · [`api-flow.md`](./api-flow.md).

## Contents

1. [Prerequisites](#1-prerequisites)
2. [What & Why](#2-what--why)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Step-by-step: Viewing Optimizations Data](#4-step-by-step-viewing-optimizations-data)
5. [Applying a Recommendation](#5-applying-a-recommendation)
6. [Hands-on Verification](#6-hands-on-verification)
7. [RBAC & Where To Go Deeper](#7-rbac--where-to-go-deeper)
8. [Related Documentation](#8-related-documentation)

---

## 1. Prerequisites

Same list as [`architecture.md` §1](./architecture.md#1-prerequisites):

- [What is Backstage](https://backstage.io/docs/overview/what-is-backstage)
- [Backend system overview](https://backstage.io/docs/backend-system/)
- [Permissions overview](https://backstage.io/docs/permissions/overview/)
- [About RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/about_red_hat_developer_hub/index)

Optional product context: [Cost Management service](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/analyzing_your_cost_data/index) · [Resource Optimization for OpenShift](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index).

---

## 2. What & Why

- Two Hybrid Cloud Console services in RHDH: **OpenShift cost tracking** and **Optimizations** (including Apply).
- Three packages, one `pluginId` (`cost-management`): frontend, backend (secure proxy + RBAC + SSO), common.
- **Core rule:** the frontend never holds Red Hat service-account credentials or the upstream RH SSO token — those stay in the backend.

**Detail:** [`architecture.md` §2](./architecture.md#2-what-this-plugin-does)–[§3](./architecture.md#3-packages).

---

## 3. High-Level Architecture

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

| Token you might see                     | Where                                | What it is                                                          |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| `Authorization: Bearer <Backstage JWT>` | Browser → `/api/cost-management/...` | Logged-in Backstage user (expected; added by `fetchApi`)            |
| `Authorization: Bearer <RH SSO token>`  | Backend → `console.redhat.com` only  | Service-account token from `client_credentials` (never in DevTools) |

Upstream traffic uses this plugin’s secure proxy at `/api/cost-management/proxy/*`.

**Detail:** [`architecture.md` §4](./architecture.md#4-high-level-architecture).

---

## 4. Step-by-step: Viewing Optimizations Data

Follow this sequence while pointing at the linked files.

### Step 1 — UI loads and calls the client

Page `/cost-management/optimizations` → [`OptimizationsPage.tsx`](../plugins/cost-management/src/pages/optimizations/OptimizationsPage.tsx) uses `useApi(optimizationsApiRef)` and `getRecommendationList()`.

API factories (no hardcoded URLs, no RH credentials) live in [`plugin.ts`](../plugins/cost-management/src/plugin.ts) — `discoveryApiRef` + `fetchApiRef`.

### Step 2 — Client targets the backend proxy

[`DiscoveryApi`](https://backstage.io/docs/reference/core-plugin-api.discoveryapi/) resolves plugin base URLs at runtime so the UI never hardcodes the backend host. [`OptimizationsClient.ts`](../plugins/cost-management-common/src/clients/optimizations/OptimizationsClient.ts) calls `discoveryApi.getBaseUrl('cost-management')` then appends `/proxy` (wired via `discoveryApiRef` in [`plugin.ts`](../plugins/cost-management/src/plugin.ts)). Locally that becomes `http://localhost:7007/api/cost-management/proxy/...`; on RHDH it uses the deployed backend URL the same way.

Browser request looks like:

`GET http://localhost:7007/api/cost-management/proxy/recommendations/openshift?...`

Backstage `fetchApi` may attach `Authorization: Bearer <Backstage user JWT>` — that authenticates you **to the Backstage backend**, not to Red Hat.

### Step 3 — Backend route + auth policy

- Route: [`router.ts`](../plugins/cost-management-backend/src/service/router.ts) → `GET /proxy/*` → `secureProxy`
- Policy: [`plugin.ts`](../plugins/cost-management-backend/src/plugin.ts) → `allow: 'user-cookie'` on `/proxy`

### Step 4 — Secure proxy (RBAC → SSO → filters → forward)

[`secureProxy.ts`](../plugins/cost-management-backend/src/routes/secureProxy.ts):

1. `resolveAccess()` — RBAC via [`checkPermissions.ts`](../plugins/cost-management-backend/src/util/checkPermissions.ts); deny → `403` + audit log
2. `getTokenFromApi()` — RH SSO token ([`tokenUtil.ts`](../plugins/cost-management-backend/src/util/tokenUtil.ts))
3. Strip client `cluster`/`project` params; `injectRbacFilters()`
4. `fetch(console.redhat.com…)` with `Authorization: Bearer <RH SSO token>`
5. Pass status/body back; emit audit `ALLOW`

Proxy is **GET-only**. Client-supplied cluster/project filters cannot widen access.

**Detail:** [`api-flow.md` §3](./api-flow.md#3-reading-data)–[§4](./api-flow.md#4-sso-token).

---

## 5. Applying a Recommendation

Only write action: `POST /api/cost-management/apply-recommendation` ([`applyRecommendation.ts`](../plugins/cost-management-backend/src/routes/applyRecommendation.ts)). Frontend Apply button `usePermission` is UX only; backend re-checks `ros.apply`.

Orchestrator design and demo: [`architecture.md` §6](./architecture.md#6-applying-a-recommendation).

---

## 6. Hands-on Verification

1. Open Optimizations → DevTools → Network → filter `cost-management`.
2. Select `…/proxy/recommendations/openshift…`.
3. Confirm:
   - URL host is the Backstage backend (`localhost:7007`), **not** `console.redhat.com`.
   - If `Authorization` is present, decode the JWT — it should be a **Backstage user token**, not the RH SSO service-account token from `clientId`/`clientSecret`.
4. **Audit logs** (structured `"audit":true` lines from [`auditLog.ts`](../plugins/cost-management-backend/src/util/auditLog.ts), via Backstage [Logger Service](https://backstage.io/docs/backend-system/core-services/logger/)):
   - Terminal running `yarn start` / `yarn start-backend` — search `"audit":true` for `ALLOW`/`DENY`, actor, filters. No separate audit UI.
5. Optional: logs from [`tokenUtil.ts`](../plugins/cost-management-backend/src/util/tokenUtil.ts) (`Using cached access token` / `Requesting new access token`) prove SSO is server-side.

More on audit purpose and format: [`architecture.md` §8](./architecture.md#8-audit-logging) · [`api-flow.md` §8](./api-flow.md#8-errors--debugging).

---

## 7. RBAC & Where To Go Deeper

- Domains: `ros.*` / `cost.*`, plus `ros.apply` for write.
- Server-side enforcement only — see [`rbac.md`](./rbac.md).

| Want…                    | Go to                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Big picture              | [`architecture.md`](./architecture.md)                                                    |
| Request hops / debugging | [`api-flow.md`](./api-flow.md)                                                            |
| Permission catalogue     | [`rbac.md`](./rbac.md)                                                                    |
| Local / dynamic install  | [`local-dev-setup.md`](./local-dev-setup.md) · [`dynamic-plugin.md`](./dynamic-plugin.md) |

---

## 8. Related Documentation

- [`architecture.md`](./architecture.md) · [`api-flow.md`](./api-flow.md) · [`rbac.md`](./rbac.md)
- [`local-dev-setup.md`](./local-dev-setup.md) · [`dynamic-plugin.md`](./dynamic-plugin.md)
- [Workspace `README.md`](../README.md)
