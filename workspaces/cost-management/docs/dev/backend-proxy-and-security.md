# Backend Proxy and Security — Cost Management Plugin

This document covers why the Cost Management plugin uses its own secure proxy instead of the generic Backstage proxy, the security controls enforced on the backend, and the old-vs-new architecture change. It is the **security-focused companion** to the other docs in this workspace.

For architecture, request flow, code map, and configuration see [`architecture.md`](./architecture.md) and [`api-flow.md`](./api-flow.md). For permissions and policy CSV examples see [`rbac.md`](../rbac.md). For installation see [`dynamic-plugin.md`](../dynamic-plugin.md).

---

## Table of Contents

- [Why a plugin-owned secure proxy (and what changed)](#why-a-plugin-owned-secure-proxy-and-what-changed)
- [Two-credential architecture](#two-credential-architecture)
- [How the secure proxy works — frontend to upstream](#how-the-secure-proxy-works--frontend-to-upstream)
- [Security properties](#security-properties)
- [Error code meaning](#error-code-meaning)
- [Official documentation links](#official-documentation-links)
- [Related documents](#related-documents)

---

## Why a plugin-owned secure proxy (and what changed)

### What we had before (pre-2.2.0)

The Cost Management plugin originally used the generic Backstage proxy ([`@backstage/plugin-proxy-backend`](https://backstage.io/docs/plugins/proxying/), configured via `proxy.endpoints` in `app-config.yaml`). The flow was:

1. Frontend called `GET /api/cost-management/token` — the backend returned the HCC SSO token **directly to the browser**.
2. Frontend called `GET /api/proxy/cost-management/v1/recommendations/openshift?cluster=X&project=Y` — the generic Backstage proxy forwarded this to `console.redhat.com`, configured with `credentials: dangerously-allow-unauthenticated`.
3. The frontend JavaScript added `?cluster=X&project=Y` query params based on RBAC as the **only** access control.

### What was wrong

- **Token exposure** — the SSO token was visible in DevTools, HAR exports, and vulnerable to XSS. Any script on the page could steal it.
- **No user identity check** — the generic proxy with `dangerously-allow-unauthenticated` forwarded any request to HCC, including crafted ones.
- **Bypassable RBAC** — since the token was in the browser and the proxy was unauthenticated, anyone could call the proxy directly **without** the RBAC filters and see all data the service account had access to.

### What we changed (2.2.0)

This was a **breaking security change** in plugin **2.2.0** (`ab26a80`), driven by the threat model remediation effort. All three packages (frontend, backend, common) were updated together.

**Cost Management now owns its own secure proxy** at `/api/cost-management/proxy/*`. Do not add `proxy.endpoints['/cost-management/v1']`. The plugin authenticates the RHDH user, enforces RBAC, fetches the SSO token server-side, and injects authorized filters before forwarding to HCC. See [How the secure proxy works](#how-the-secure-proxy-works--frontend-to-upstream) for the step-by-step flow.

That is why [`dynamic-plugin.md`](../dynamic-plugin.md) says no `proxy` configuration is required.

```
BEFORE (do not use)                          NOW
───────────────────                          ───
Browser                                      Browser
  │ GET /token → SSO token in browser          │ GET /proxy/recommendations/…
  │ GET /api/proxy/cost-management/v1/…        │ (session cookie only, no HCC token)
  │ (dangerously-allow-unauthenticated)        ▼
  ▼                                          cost-management-backend secureProxy
console.redhat.com                             │ httpAuth + RBAC + server-side SSO token
  token visible in DevTools                    │ strip + inject cluster/project filters
                                               ▼
                                             console.redhat.com
                                               token never leaves the backend
```

---

## Two-credential architecture

Two credentials are involved, and they must stay on different sides of the backend:

| Credential                | Who issues it                                    | Where it lives     | What it authorizes                               |
| ------------------------- | ------------------------------------------------ | ------------------ | ------------------------------------------------ |
| RHDH user session         | RHDH auth provider (OIDC, GitHub, …)             | Browser cookie     | _Which RHDH user_ is calling the plugin          |
| HCC service-account token | `sso.redhat.com` via OAuth2 `client_credentials` | Backend cache only | _The plugin's_ access to the Cost Management API |

The service account is shared (not per-user). RHDH RBAC controls what each user can see. The HCC account should have the **Cost OpenShift Viewer** role.

Key distinction: **403** = RHDH RBAC denied this user. **502** = the plugin cannot authenticate to HCC (bad `clientId`/`clientSecret`, network, or SSO outage).

For the full auth-at-each-hop breakdown, see [`api-flow.md` §6](./api-flow.md#6-auth-at-each-hop).

---

## How the secure proxy works — frontend to upstream

Full path from browser to `console.redhat.com`, with code references.

### Step 1 — Frontend → backend (no HCC token)

- [`OptimizationsClient.ts:80-82`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-common/src/clients/optimizations/OptimizationsClient.ts#L80-L82) — `proxyClient` resolves `getBaseUrl('cost-management') + '/proxy'`
  → e.g. `GET /api/cost-management/proxy/recommendations/openshift?limit=10`
- [`CostManagementSlimClient.ts:550-557`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-common/src/clients/cost-management/CostManagementSlimClient.ts#L550-L557) — `fetchViaBackendProxy()` sends **no** `Authorization` header — auth is the RHDH session cookie only.
- [`CostManagementSlimClient.ts:275-276`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-common/src/clients/cost-management/CostManagementSlimClient.ts#L275-L276) — the frontend **does** send `filter[exact:cluster]` for OpenShift cost pages, but the backend strips and replaces it — see Step 3.

### Step 2 — Route match + validation

- [`router.ts:181`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/service/router.ts#L181) — `router.get('/proxy/*', secureProxy(options))` — **GET only**. The `*` wildcard means Express puts everything after `/proxy/` into `req.params[0]` (e.g. `/proxy/recommendations/openshift?limit=10` → `proxyPath = "recommendations/openshift"`).
- [`plugin.ts:85-88`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/plugin.ts#L85-L88) — auth policy requires `user-cookie` on `/proxy`.
- [`secureProxy.ts:311-312`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L311-L312) — empty path → 400.
- [`secureProxy.ts:315-318`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L315-L318) — path traversal (`..` segments or absolute paths like `/evil`) → 400 via [`isPathTraversal()` (line 251)](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L251). This is the **first layer** of defense — without it, a crafted path like `../../other-api/v1/secrets` could escape `/cost-management/v1/` and hit a different HCC API using the plugin's SSO token. The **second layer** is the prefix check in Step 4.
- [`secureProxy.ts:50-55`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L50-L55) — `resolveAccess()` picks the permission namespace: `recommendations/…` → `ros.*`, anything else → `cost.*`.
- [`secureProxy.ts:87-99`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L87-L99) — plugin-level check first. ALLOW → full access, no filter ceiling. Otherwise → load cluster/project catalog from upstream (cached 15 min per [`line 32`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L32)), batch-check per-cluster/project permissions. Empty set → **403** ([line 336](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L336)).

### Step 3 — Filter stripping + injection

Server-side filter enforcement:

- [`secureProxy.ts:355-358`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L355-L358) — RBAC-controlled keys: `filter[exact:cluster]`, `filter[exact:project]`.
- [`secureProxy.ts:260-283`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L260-L283) — `parseClientQueryParams()` walks the **raw** query string and **drops** those keys. Malformed encoding → **400** ([line 364-368](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L364-L368)). All other client params pass through.
- [`secureProxy.ts:290-297`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L290-L297) — `injectRbacFilters()` appends the **server-authorized** exact filters.

| User type                   | What happens                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin-level ALLOW          | No filters injected. Client params pass through unchanged.                                                                                                                         |
| Scoped (e.g. `ros/CLUSTER`) | Client `filter[exact:cluster\|project]` **stripped**. Server injects authorized filters. UI search params like `cluster=` still pass through (can only narrow within the ceiling). |

A client **cannot widen access** — `filter[exact:cluster]=someone-elses-cluster` is stripped and replaced.

### Step 4 — SSO token + upstream request + audit log

- [`tokenUtil.ts`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/util/tokenUtil.ts) — `getTokenFromApi()` returns a cached SSO token or fetches a new one via `client_credentials`.
- [`secureProxy.ts:341-345`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L341-L345) — the upstream URL is built by resolving `proxyPath` against the base: `new URL(proxyPath, basePath)` where `basePath` = `{costManagementProxyBaseUrl}/cost-management/v1/` (default `https://console.redhat.com/api` from [`constant.ts:20-21`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/util/constant.ts#L20-L21), overridable via `costManagementProxyBaseUrl` in app-config). For example: `proxyPath = "recommendations/openshift"` → `https://console.redhat.com/api/cost-management/v1/recommendations/openshift`.
- [`secureProxy.ts:347`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L347) — **second layer** (defense in depth): after URL resolution, verifies `targetUrl.pathname.startsWith(basePath)` — even if `isPathTraversal()` missed a case, this ensures the final URL didn't escape `/cost-management/v1/`.
- [`secureProxy.ts:376-385`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L376-L385) — `emitAuditLog()` records actor, decision, resource path, and injected filters — **before** the upstream fetch.
- [`secureProxy.ts:387-393`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L387-L393) — `fetch()` with `Authorization: Bearer <SSO token>`, `method: 'GET'`. The upstream host is config-only (default `https://console.redhat.com/api`) — clients cannot redirect it.
- [`secureProxy.ts:397-404`](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/cost-management/plugins/cost-management-backend/src/routes/secureProxy.ts#L397-L404) — upstream status and body returned to the browser as-is.

For audit log format and debugging tips, see [`api-flow.md` §8](./api-flow.md#8-errors--debugging).

---

## Security properties

These concerns were addressed as part of the security threat model remediation. In summary, the current design guarantees:

- **No token exposure** — HCC service-account token never reaches the browser.
- **No filter bypass** — server strips and re-injects cluster/project filters; clients cannot widen access.
- **No unauthenticated access** — all data endpoints require `user-cookie` auth.
- **GET-only proxy** — writes go through `/apply-recommendation` with `ros.apply` + resource type allowlist.
- **No secrets in frontend bundle** — `clientSecret` is `@visibility secret` in [`config.d.ts`](../../plugins/cost-management-backend/config.d.ts).

**Limitations:** RHDH RBAC can only **narrow** what the HCC service account sees (it cannot grant access beyond **Cost OpenShift Viewer** scope). Plugin-level `ros.plugin` / `cost.plugin` ALLOW is all-or-nothing for that section.

---

## Error code meaning

| Status  | Meaning                                                     | Where to look                                                                    |
| ------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **400** | Bad proxy path (empty, traversal) or invalid Apply body     | `secureProxy.ts`, `applyRecommendation.ts`                                       |
| **403** | RHDH RBAC denied this user                                  | `secureProxy.ts` / `applyRecommendation.ts` — check policy CSV / RBAC admin UI   |
| **502** | SSO authentication failed (`clientId`/`clientSecret` issue) | `tokenUtil.ts` — log says "Unable to authenticate with the hybrid cloud console" |
| **500** | Unexpected error                                            | Catch block in `secureProxy.ts` / `applyRecommendation.ts`                       |

---

## Official documentation links

### Backstage (proxy and security related)

| Resource                                              | URL                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| Proxying (labeled "Legacy" — config format unchanged) | https://backstage.io/docs/plugins/proxying/                              |
| Using the proxy from a plugin                         | https://backstage.io/docs/tutorials/using-backstage-proxy-within-plugin/ |
| HTTP Router + `addAuthPolicy`                         | https://backstage.io/docs/backend-system/core-services/http-router       |
| HTTP Auth                                             | https://backstage.io/docs/backend-system/core-services/http-auth         |
| Permissions overview                                  | https://backstage.io/docs/permissions/overview                           |
| Service-to-service auth                               | https://backstage.io/docs/auth/service-to-service-auth                   |

### Red Hat Developer Hub

| Resource                              | URL                                                                                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RHDH 1.10 docs                        | https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/                                                                                                                                       |
| Authorization / RBAC                  | https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/index                                                                                      |
| Enable RBAC — `pluginsWithPermission` | https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/enable-and-give-access-to-the-role-based-access-control-rbac-feature_authorization-in-rhdh |

For the full list of prerequisite reading (Backstage, RHDH, Cost Management), see [`architecture.md` §1](./architecture.md#1-prerequisites).

---

## Related documents

| Document                                                               | What it covers                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)                                 | High-level architecture, packages, request flow diagram, config      |
| [`api-flow.md`](./api-flow.md)                                         | Hop-by-hop request/response, code links, auth at each hop, debugging |
| [`walkthrough-architecture-api.md`](./walkthrough-architecture-api.md) | Step-by-step walkthrough + hands-on verification checklist           |
| [`rbac.md`](../rbac.md)                                                | Permission names, policy CSV examples, cluster/project scoping       |
| [`dynamic-plugin.md`](../dynamic-plugin.md)                            | OCI install, secrets, and "no proxy config required"                 |
| [`local-dev-setup.md`](./local-dev-setup.md)                           | Local dev environment, RBAC setup, testing on rhdh-local             |
| [Backend README](../../plugins/cost-management-backend/README.md)      | Endpoint table, audit log format                                     |
