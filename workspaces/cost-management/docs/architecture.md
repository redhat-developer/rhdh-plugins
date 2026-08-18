# Cost Management Plugin — Architecture (KT Guide)

## Contents

1. [Prerequisites](#1-prerequisites)
2. [What This Plugin Does](#2-what-this-plugin-does)
3. [The Three Packages](#3-the-three-packages)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Flow: Viewing Cost / Optimization Data](#5-flow-viewing-cost--optimization-data)
6. [Flow: Applying a Recommendation](#6-flow-applying-a-recommendation)
7. [Permissions — High Level Only](#7-permissions--high-level-only)
8. [Configuration Essentials](#8-configuration-essentials)
9. [Deployment Models](#9-deployment-models)
10. [Things To Know Before You Touch This](#10-things-to-know-before-you-touch-this)
11. [Related Documentation](#11-related-documentation)

---

## 1. Prerequisites

This doc assumes basic familiarity with Backstage and RHDH concepts. If any of these are new to you, skim the linked official docs first — it'll make the rest of this guide click much faster.

| Concept                                                                  | Why it matters here                                                                                   | Official doc                                                                                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backstage basics (frontend/backend plugins)                              | This plugin _is_ a frontend plugin + backend plugin + common library                                  | [What is Backstage](https://backstage.io/docs/overview/what-is-backstage)                                                                                      |
| New backend system (`createBackendPlugin`, service refs, `coreServices`) | The backend plugin ([§4](#4-high-level-architecture)) is built entirely on this API                   | [Backend system overview](https://backstage.io/docs/backend-system/)                                                                                           |
| Frontend system / routable extensions                                    | How `ResourceOptimizationPage` / `OpenShiftPage` get mounted into the app                             | [Building plugins](https://backstage.io/docs/frontend-system/building-plugins/index/)                                                                          |
| Permission framework (`createPermission`, `PermissionsService`)          | Underpins everything in [§7](#7-permissions--high-level-only) (covered fully in the separate RBAC KT) | [Permissions overview](https://backstage.io/docs/permissions/overview/)                                                                                        |
| Plugin discovery & service-to-service auth                               | How the backend finds/calls the Orchestrator plugin ([§6](#6-flow-applying-a-recommendation))         | [Service-to-service auth](https://backstage.io/docs/auth/service-to-service-auth/)                                                                             |
| Dynamic plugins                                                          | How RHDH loads this plugin in production (vs. compiling it statically)                                | [RHDH dynamic plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/installing_and_viewing_plugins_in_red_hat_developer_hub/index) |
| RHDH overview                                                            | The distribution this plugin ships in                                                                 | [About RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/about_red_hat_developer_hub/index)                                       |
| RBAC in RHDH                                                             | Who makes the allow/deny decision this plugin defers to                                               | [Authorization in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/authorization_in_red_hat_developer_hub/index)                 |
| Orchestrator plugin (SonataFlow/OSL)                                     | Backs the "Apply Recommendation" feature ([§6](#6-flow-applying-a-recommendation))                    | [Orchestrator in RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/orchestrator_in_red_hat_developer_hub/index)                   |

Not required, but useful context for _why_ this plugin exists:

- [Cost Management service overview](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/analyzing_your_cost_data/index)
- [Resource Optimization for OpenShift](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index)

---

## 2. What This Plugin Does

The Cost Management plugin brings two Red Hat Hybrid Cloud Console (`console.redhat.com`) services into RHDH:

| Section           | Shows                                                                                             | Backed by                               |
| ----------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **OpenShift**     | Cost tracking for OpenShift clusters — group by cluster/project/node/tag, month-over-month trends | Cost Management Service                 |
| **Optimizations** | CPU/memory right-sizing recommendations for workloads, with an option to apply them automatically | Resource Optimization Service (ROS-OCP) |

It's a **thin, secure client** for those cloud services — no business logic or data storage lives in this plugin itself. The real product decision baked into this plugin is: **the frontend never sees a secret or an upstream token.** Everything sensitive happens in the backend.

---

## 3. The Three Packages

All three share the same Backstage `pluginId`: **`cost-management`**, and always ship together.

| Package                          | Role              | One-line job                                                            |
| -------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `plugin-cost-management`         | `frontend-plugin` | React UI — pages, tables, charts, filters                               |
| `plugin-cost-management-backend` | `backend-plugin`  | Secure proxy + SSO token mgmt + RBAC enforcement + Orchestrator gateway |
| `plugin-cost-management-common`  | `common-library`  | Shared permissions, API clients, types used by both                     |

**Repo orientation:** inside `workspaces/cost-management/`, `plugins/cost-management*` is the actual shipped product; `packages/app` + `packages/backend` are a throwaway local dev shell (never shipped to customers). If you're adding a feature, you almost always want `plugins/`, not `packages/`.

---

## 4. High-Level Architecture

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
       |  - Orchestrator gateway  (only for "Apply Recommendation", see §6)
       v
  [ console.redhat.com ]          Cost Management API / ROS-OCP API / Red Hat SSO


  [ Backend: apply-recommendation ]  -->  [ Orchestrator plugin ]  -->  [ Target OpenShift cluster ]
       (only exercised when a user clicks "Apply Recommendation" — see §6)
```

_(Responses flow back the same path each arrow points — the browser only ever talks to the Backstage backend, never directly to console.redhat.com or Orchestrator.)_

**Why this matters:** the browser authenticates to the backend with a normal Backstage session cookie — nothing else. The backend is the only thing that holds the Red Hat service-account credentials, the upstream SSO token, and the authority to decide what data a user can see.

---

## 5. Flow: Viewing Cost / Optimization Data

Every OpenShift/Optimizations page ultimately calls one backend endpoint: `GET /api/cost-management/proxy/*`. This is the **secure proxy**.

```text
  [ Browser ]
       |  1. GET /proxy/... (session cookie only)
       v
  [ Backend: secure proxy ]
       |  2. check permission, resolve authorized clusters/projects (RBAC — see §7)
       |  3. get SSO access token (cached; refresh via client_credentials if expired)
       |  4. strip any client-supplied cluster/project filters, inject server-authorized ones
       v
  [ console.redhat.com — Cost Mgmt / ROS-OCP API ]
       |  5. returns JSON (Bearer token auth)
       v
  [ Backend ] -- audit log (allow/deny, filters, actor) --> [ Browser renders table/chart ]
```

**Key facts:**

- The proxy is **GET-only** — there's no generic write path to the upstream API.
- Client-supplied `cluster`/`project` query params are always discarded; the backend injects its own — this is what makes it impossible to widen access by editing a request in devtools.
- The SSO `clientId`/`clientSecret` (from app-config) and the resulting access token never leave the backend process.

---

## 6. Flow: Applying a Recommendation

This is the one "write" action in the plugin — triggering an Orchestrator workflow to patch a workload's resource config.

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

**Key facts:**

- The frontend **never** calls Orchestrator directly to execute a workflow — everything routes through this backend gateway (hardened this way after a security review, see [ADR-0002](./adrs/0002-applying-optimizations-using-the-orchestrator-plugin.md)).
- This is a **runtime** dependency on the Orchestrator plugin (resolved via Backstage discovery), not a compile-time one — viewing data works fine without Orchestrator installed; only "Apply" needs it.

**More detail on the Orchestrator workflow integration:**

- [Design doc](https://docs.google.com/document/d/1DPDMQnLnEKcl7efcqpobKwD0Yw9wmKTkuN8qIyfogQ4/edit?tab=t.0)
- [Demo recording](https://drive.google.com/file/d/1q_Tk0FgbrQTuGTrEpIfjNYp9Lc7yu5J6/view?usp=sharing)

---

## 7. Permissions — High Level Only

> Full permission catalogue, policy CSV syntax, and per-role examples are covered in a **separate RBAC KT** and in [`docs/rbac.md`](./rbac.md). Just enough context here to follow the rest of this doc:

- Two independent permission domains: **`ros.*`/`ros/…`** (Optimizations) and **`cost.*`/`cost/…`** (OpenShift cost). Each has a plugin-wide permission plus dynamic cluster/project-scoped ones.
- A separate `ros.apply` permission gates the "Apply Recommendation" action.
- The plugin **defines** permissions; the decision to allow/deny is made by whatever `PermissionsService` RHDH is configured with (RBAC plugin in production).
- **Enforcement is 100% server-side** — the frontend has zero authority to widen access.

---

## 8. Configuration Essentials

```yaml
# app-config.yaml (static) or pluginConfig (dynamic plugin)
costManagement:
  clientId: ${RHHCC_SA_CLIENT_ID} # backend: SSO client_credentials
  clientSecret: ${RHHCC_SA_CLIENT_SECRET} # backend: SSO client_credentials (secret)
  optimizationWorkflowId: 'patch-k8s-resource' # frontend: which Orchestrator workflow to trigger
```

| Key                                        | Required                              | Notes                                                              |
| ------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `costManagement.clientId` / `clientSecret` | Yes                                   | Red Hat service account with `Cost OpenShift Viewer` role          |
| `costManagement.optimizationWorkflowId`    | For "Apply" only                      | Read by the **frontend**, sent to the backend in the apply request |
| `costManagementProxyBaseUrl`               | No (default `console.redhat.com/api`) | Override proxy target                                              |

No `proxy.endpoints` config is needed or supported — that pattern was removed in favor of this plugin's own secure proxy.

---

## 9. Deployment Models

| Model                                 | How                                                            | Notes                                                 |
| ------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| **Dynamic plugin (RHDH prod)**        | OCI image in `dynamic-plugins-rhdh` ConfigMap + `secrets-rhdh` | See [`docs/dynamic-plugin.md`](./dynamic-plugin.md)   |
| **Static plugin (vanilla Backstage)** | `yarn add` into `packages/app`/`packages/backend`              | See [workspace README](../README.md)                  |
| **Local dev**                         | Yarn workspace symlink, `yarn start`                           | See [`docs/local-dev-setup.md`](./local-dev-setup.md) |

---

## 10. Things To Know Before You Touch This

- **Dynamic permissions register only at startup.** New clusters/projects that appear after the backend starts aren't selectable as RBAC scopes until the next restart. (Detail in [`docs/rbac.md`](./rbac.md).)
- **Dual OpenShift routing.** `OpenShiftPage` is reachable both as its own top-level route (`/cost-management/openshift`, used in prod menus) and nested under the optimizations router — a historical artifact, not two implementations.
- **Two API "shapes" in the common package.** ROS recommendations are OpenAPI-generated (`yarn generate-client` regenerates them); Cost Management report/search/tag types are hand-maintained because no public spec exists yet for that API.
- **No React Query/SWR.** Data fetching uses `react-use`'s `useAsync`. Some URL-filter-sync hooks exist in the code but aren't wired into any page yet — filters are in-memory only today.
- **Naming is inconsistent but harmless.** Internal export is `resourceOptimizationPlugin`; product name is "Cost Management" with "Optimizations" as a sub-section. Cosmetic, not architectural.

---

## 11. Related Documentation

- [`docs/presentation.md`](./presentation.md) — team presentation outline built from this doc + `api-flow.md`
- [`docs/rbac.md`](./rbac.md) — full permission/policy reference (separate RBAC KT)
- [`docs/dynamic-plugin.md`](./dynamic-plugin.md) — installing as a dynamic plugin on RHDH
- [`docs/local-dev-setup.md`](./local-dev-setup.md) — local dev walkthrough
- [`docs/testing-cost-management-on-rhdh-local.md`](./testing-cost-management-on-rhdh-local.md) — testing against `rhdh-local`
- ADRs: [0000](./adrs/0000-record-architecture-decisions.md) · [0001](./adrs/0001-optimizations-plugin-for-red-hat-developer-hub-phase-1.md) · [0002](./adrs/0002-applying-optimizations-using-the-orchestrator-plugin.md)
- Orchestrator workflow: [design doc](https://docs.google.com/document/d/1DPDMQnLnEKcl7efcqpobKwD0Yw9wmKTkuN8qIyfogQ4/edit?tab=t.0) · [demo recording](https://drive.google.com/file/d/1q_Tk0FgbrQTuGTrEpIfjNYp9Lc7yu5J6/view?usp=sharing)
- [`plugins/cost-management-backend/README.md`](../plugins/cost-management-backend/README.md) — endpoint table + audit log format
- [Workspace `README.md`](../README.md) — install instructions, service-account setup
