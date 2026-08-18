# Cost Management Plugin — Team Presentation

> **What this is:** a presentation outline covering both **architecture** and **API flow**, for the team. It's deliberately high-level — every section links to the full detail in [`docs/architecture.md`](./architecture.md) and [`docs/api-flow.md`](./api-flow.md) for anyone who wants to go deeper afterwards.

## Contents

1. [Prerequisites](#1-prerequisites)
2. [What & Why](#2-what--why)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Flow: Viewing Cost/Optimization Data](#4-flow-viewing-costoptimization-data)
5. [Flow: Applying a Recommendation](#5-flow-applying-a-recommendation)
6. [Live Demo](#6-live-demo)
7. [RBAC & Where To Go Deeper](#7-rbac--where-to-go-deeper)
8. [Related Documentation](#8-related-documentation)

---

## 1. Prerequisites

Same list as [`architecture.md` §1](./architecture.md#1-prerequisites):

- [What is Backstage](https://backstage.io/docs/overview/what-is-backstage) — frontend vs. backend plugins
- [Backend system overview](https://backstage.io/docs/backend-system/) — `createBackendPlugin`, service refs, `coreServices`
- [Permissions overview](https://backstage.io/docs/permissions/overview/) — the framework this plugin defers all allow/deny decisions to
- [About RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/about_red_hat_developer_hub/index) — the distribution this plugin ships in

Not required, but good context for _why_ this plugin exists: [Cost Management service overview](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/analyzing_your_cost_data/index) and [Resource Optimization for OpenShift](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index).

---

## 2. What & Why

- Two Red Hat Hybrid Cloud Console services surfaced inside RHDH: **OpenShift cost tracking** and **Optimizations** (right-sizing recommendations, with an "Apply" action).
- Three packages, one `pluginId` (`cost-management`), always ship together: frontend (React UI), backend (secure proxy + RBAC + SSO + Orchestrator gateway), common (shared types/clients/permissions).
- **The one idea to remember from this whole talk:** the frontend never holds a secret or an upstream token. Everything sensitive happens in the backend.

**Detail:** `architecture.md` §2–3.

---

## 3. High-Level Architecture

```text
  [ Browser ]                     React frontend (plugin-cost-management)
       |
       |  Backstage session cookie only — no secrets, no tokens
       v
  [ Backstage backend ]           plugin-cost-management-backend
       |
       |  - secure proxy          (auth + RBAC + server-side filter injection)
       |  - SSO token manager     (client_credentials grant, cached)
       |  - RBAC enforcement      (delegates allow/deny to PermissionsService)
       |  - Orchestrator gateway  (only for "Apply Recommendation", see below)
       v
  [ console.redhat.com ]          Cost Management API / ROS-OCP API / Red Hat SSO
```

- Browser → backend: session cookie only.
- Backend → console.redhat.com: a service-account token the backend manages entirely on its own — the browser never sees it.
- This is a **thin client** — no business logic or data storage in the plugin itself.

**Detail:** `architecture.md` §4.

---

## 4. Flow: Viewing Cost/Optimization Data

```text
  [ Browser ]
       |  1. GET /proxy/... (session cookie only)
       v
  [ Backend: secure proxy ]
       |  2. check permission, resolve authorized clusters/projects (RBAC)
       |  3. get SSO access token (cached; refresh via client_credentials if expired)
       |  4. strip any client-supplied cluster/project filters, inject server-authorized ones
       v
  [ console.redhat.com — Cost Mgmt / ROS-OCP API ]
       |  5. returns JSON (Bearer token auth)
       v
  [ Backend ] -- audit log (allow/deny, filters, actor) --> [ Browser renders table/chart ]
```

- **Proxy is GET-only** — there's no generic write path to the upstream API.
- **Client-supplied `cluster`/`project` filters are always discarded and replaced server-side** — this is what makes it impossible to widen access by editing a request in DevTools. The single best security talking point in the whole plugin.

**Detail:** `architecture.md` §5 (concepts) → `api-flow.md` §5 (exact code, request/response examples).

---

## 5. Flow: Applying a Recommendation

```text
  [ Browser: user clicks "Apply" + confirms dialog ]
       |  1. POST /api/cost-management/apply-recommendation
       |     { workflowId, inputData }
       v
  [ Backend ]
       |  2. validate resourceType against a fixed allowlist
       |  3. check permission (server-side — the frontend's disabled button is UX only)
       |  4. get an on-behalf-of-user token for the Orchestrator plugin
       v
  [ Orchestrator plugin ]  --  executes the "patch-k8s-resource" workflow  -->  [ Target cluster ]
       |
       v
  [ Backend audit-logs outcome ] --> [ Browser redirected to /orchestrator/instances/{id} ]
```

- This is the **only** write action in the whole plugin — everything else is read-only.
- The frontend's disabled "Apply" button is UX only — the backend re-checks the permission server-side on every call.
- This was _hardened beyond the original design_ after a security review ([ADR-0002](./adrs/0002-applying-optimizations-using-the-orchestrator-plugin.md), tracked as FLPATH-3503) — the frontend used to be trusted to call Orchestrator directly; now everything routes through this backend gateway.
- Runtime dependency on Orchestrator, not compile-time — viewing data works fine without it installed.

**More detail on the Orchestrator integration itself:** [design doc](https://docs.google.com/document/d/1DPDMQnLnEKcl7efcqpobKwD0Yw9wmKTkuN8qIyfogQ4/edit?tab=t.0) · [demo recording](https://drive.google.com/file/d/1q_Tk0FgbrQTuGTrEpIfjNYp9Lc7yu5J6/view?usp=sharing).

**Detail:** `architecture.md` §6 (concepts) → `api-flow.md` §8 (exact code, on-behalf-of-user token mechanics).

---

## 6. Live Demo

Proving the "no secrets in the browser" claim instead of just asserting it. Checklist from `api-flow.md` §13:

1. Open DevTools → Network tab, filter `cost-management`, load the Optimizations page.
2. Click into the `/proxy/recommendations/openshift` request → show there's **no `Authorization` header**, only the session cookie.
3. Tail backend logs, search for `"audit":true` → show the same request as an `ALLOW` decision with the actor and injected cluster/project filters.
4. (If a spare cluster/workflow is available) Click "Apply Recommendation" once, then find the corresponding `apply_recommendation` audit log line.

---

## 7. RBAC & Where To Go Deeper

- Two permission domains: `ros.*`/`ros/…` (Optimizations) and `cost.*`/`cost/…` (OpenShift cost) — each with a plugin-wide permission plus dynamic cluster/project-scoped ones, plus a separate `ros.apply` for the write path.
- Enforcement is 100% server-side — the plugin only _defines_ permissions; RHDH's RBAC plugin makes the actual decision.
- **Full permission catalogue, policy CSV syntax, and per-role examples are a separate KT** — see [`docs/rbac.md`](./rbac.md).

**Self-serve map:**

| Want to know...                                                                                                | Go to                                             |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| The big picture, security rationale, deployment models                                                         | [`docs/architecture.md`](./architecture.md)       |
| Exact requests/responses, file:line code references, config keys, error codes, how to trace a request yourself | [`docs/api-flow.md`](./api-flow.md)               |
| Permission names, policy examples, role setup                                                                  | [`docs/rbac.md`](./rbac.md) (separate KT)         |
| Running this locally                                                                                           | [`docs/local-dev-setup.md`](./local-dev-setup.md) |
| Installing as an RHDH dynamic plugin                                                                           | [`docs/dynamic-plugin.md`](./dynamic-plugin.md)   |
| Why a decision was made a certain way                                                                          | `docs/adrs/`                                      |
| Backstage/RHDH concepts themselves                                                                             | Official docs — see [§1](#1-prerequisites)        |

---

## 8. Related Documentation

- [`docs/architecture.md`](./architecture.md) — full architecture KT doc
- [`docs/api-flow.md`](./api-flow.md) — code-level API flow reference
- [`docs/rbac.md`](./rbac.md) — full RBAC reference (separate KT)
- [`docs/local-dev-setup.md`](./local-dev-setup.md) · [`docs/dynamic-plugin.md`](./dynamic-plugin.md) — running/installing this plugin
- [Workspace `README.md`](../README.md) — install instructions, service-account setup
