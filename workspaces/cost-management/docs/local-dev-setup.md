# Local Development Setup — Cost Management Plugin

This guide walks a developer who is **new to Backstage and Red Hat Developer Hub (RHDH)** through setting up, running, and understanding the Cost Management plugin's local development environment.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Understanding Yarn Workspaces](#understanding-yarn-workspaces)
- [Repository & Workspace Layout](#repository--workspace-layout)
- [Getting Started](#getting-started)
- [Understanding the Config Files](#understanding-the-config-files)
- [Running the Plugin Locally](#running-the-plugin-locally)
- [Verifying Your Setup](#verifying-your-setup)
- [RBAC in Local Development](#rbac-in-local-development)
- [Testing Against a Real RHDH Instance](#testing-against-a-real-rhdh-instance)
- [Common Commands Cheat Sheet](#common-commands-cheat-sheet)
- [Troubleshooting](#troubleshooting)
- [File Reference](#file-reference)

---

## Prerequisites

- **[Backstage](https://backstage.io/docs/overview/what-is-backstage)** — an open-source developer portal framework (originally by Spotify, now a CNCF Incubating project). You assemble an instance from a frontend app + backend app, each built from **plugins**.
- **[RHDH](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.9/html/about_red_hat_developer_hub/index)** — Red Hat's supported distribution of Backstage. In production, RHDH loads most plugins **dynamically** (pre-built OCI artifacts) instead of compiling them into the app — see [Testing Against a Real RHDH Instance](#testing-against-a-real-rhdh-instance).
- **[Yarn](https://yarnpkg.com/) 4.17.1** — the package manager used across this repo, pinned at the **root** `rhdh-plugins/package.json` + `.yarnrc.yml` (not in this workspace's own `package.json`, but inherited automatically since Yarn merges `.yarnrc.yml` from parent directories — as long as you clone the full monorepo per [Getting Started](#getting-started)). The feature that matters most is **[Workspaces](https://yarnpkg.com/features/workspaces)**: `plugins/cost-management-backend` is symlinked straight into `node_modules` for anything that depends on it — no publish step needed to test local changes.

  If `yarn` isn't already on your machine, enable [Corepack](https://nodejs.org/api/corepack.html) (ships with Node.js): `corepack enable`. To verify `yarn` is resolving through Corepack (rather than a separate global install):

  ```bash
  cat "$(which yarn)" | grep -i corepack   # should print a match
  ```

- **Node.js 22 or 24** (`engines.node` in `package.json`).
- **Red Hat service account credentials** — the plugin talks to the real [Cost Management API](https://console.redhat.com/openshift/cost-management). You'll need a service account with the `Cost OpenShift Viewer` role ([create one here](https://console.redhat.com/iam/service-accounts/)) to see real data. You can still install/run without it — you just won't get data back.

---

## Understanding Yarn Workspaces

A **Yarn workspace** lets multiple packages in one repo be installed together, where packages that depend on each other locally are **symlinked** into `node_modules` instead of being fetched from npm. No publish step, no version bump — edit the source, and every dependent package sees the change immediately.

This workspace declares its members in `package.json`:

```json
"workspaces": {
  "packages": ["packages/*", "plugins/*"]
}
```

Each plugin then depends on another using the `workspace:^` protocol instead of a normal semver range, e.g. `plugins/cost-management` depends on the shared common package:

```json
"@red-hat-developer-hub/plugin-cost-management-common": "workspace:^"
```

After `yarn install`, that line becomes a real symlink on disk:

```
node_modules/@red-hat-developer-hub/plugin-cost-management-common -> ../../plugins/cost-management-common
```

The same thing happens for the throwaway dev shell: `packages/app` depends on `@red-hat-developer-hub/plugin-cost-management` via `workspace:^`, so `yarn start` always runs against your current, unpublished plugin source.

**Why it's built this way:** Backstage plugins are meant to be independently published npm packages that any Backstage app (including real RHDH) can install. But to develop and test them, you need something to run them in — that's what `packages/app` + `packages/backend` are for. Yarn workspaces are the bridge: they let that disposable test harness consume your live plugin code directly, instead of forcing a publish just to test a change.

One side effect worth knowing: dependencies are **hoisted** into a single shared `node_modules` at the workspace root (`workspaces/cost-management/node_modules`) rather than duplicated inside each package folder. So it's normal for `plugins/cost-management/`, `plugins/cost-management-backend/`, and `plugins/cost-management-common/` to have **no `node_modules` of their own** — Node resolves imports by walking up to the shared one.

---

## Repository & Workspace Layout

`rhdh-plugins` is a **monorepo of monorepos**. This is the one mental model worth internalizing:

```
rhdh-plugins/                          ← outer monorepo (yarn@4.17.1, root package.json)
└── workspaces/
    ├── cost-management/                ← an independent Yarn workspace root (its own yarn.lock!)
    │   ├── app-config.yaml             ← base Backstage config (committed)
    │   ├── app-config.local.yaml       ← personal local overrides (git-ignored)
    │   ├── packages/
    │   │   ├── app/                    ← throwaway Backstage frontend, dev only
    │   │   └── backend/                ← throwaway Backstage backend, dev only
    │   ├── plugins/
    │   │   ├── cost-management/            ← published frontend plugin
    │   │   ├── cost-management-backend/    ← published backend plugin
    │   │   └── cost-management-common/     ← shared types, API clients, permissions
    │   └── docs/                       ← this file, plus rbac.md, dynamic-plugin.md
    ├── orchestrator/                   ← a different plugin, own workspace root
    └── ...
```

**Critical distinction:**

| Directory                          | Published to npm?        | Purpose                                                                                        |
| ---------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `plugins/cost-management*`         | **Yes**                  | The actual product code shipped to customers                                                   |
| `packages/app`, `packages/backend` | **No** (`private: true`) | Throwaway Backstage instance used _only_ to run the plugin locally. RHDH never uses this code. |

If you're adding a feature, the answer is almost always `plugins/cost-management*`, never `packages/`.

---

## Getting Started

```bash
git clone https://github.com/redhat-developer/rhdh-plugins.git
cd rhdh-plugins

# 1. Root install (repo-wide tooling)
yarn install

# 2. Workspace install (the actual plugin dependencies)
cd workspaces/cost-management
yarn install
```

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for the full fork/branch/PR workflow.

---

## Understanding the Config Files

Backstage merges multiple YAML config files at startup (later files win on conflicts) — see [Backstage Configuration docs](https://backstage.io/docs/conf/). All paths below are relative to `workspaces/cost-management/`.

- **`app-config.yaml`** — base config, committed to git. Safe defaults, no secrets.
- **`app-config.local.yaml`** — **git-ignored**, loaded automatically on top of `app-config.yaml` when present. This is where your `costManagement.clientId` / `clientSecret` and other personal secrets/overrides live. Every developer keeps their own copy; nobody's secrets get pushed.

  ```yaml
  costManagement:
    clientId: <your-service-account-client-id>
    clientSecret: <your-service-account-client-secret>
    optimizationWorkflowId: 'patch-k8s-resource'
  ```

  > This file only affects the local dev shell (`packages/app` + `packages/backend`). It has **no effect on RHDH**.

### The same filename means two different things

|                      | `workspaces/cost-management/app-config.local.yaml` (this repo) | `rhdh-local/configs/app-config/app-config.local.yaml` (the `rhdh-local` repo)      |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Scope                | This plugin's throwaway dev shell                              | A full RHDH instance via Podman/Docker Compose                                     |
| How the plugin loads | Compiled in as a source-level workspace dependency             | Loaded as a **dynamic plugin** from an OCI image (like production)                 |
| When to use          | Fast local iteration on plugin code                            | Verifying the packaged artifact behaves correctly inside real RHDH before it ships |

Both need the same `costManagement.clientId` / `clientSecret` keys, but they're different files in different repos feeding different runtimes.

**Want to explore more?**

- [`rhdh-local`](https://github.com/redhat-developer/rhdh-local) — the repository referenced above, for reference
- [Demo recording: Testing Cost Management plugin with rhdh-local](https://drive.google.com/file/d/1d2Es7n8sAm8dRY0dIfVkFJFBW6asKaJk/view?usp=drive_web) — if interested

---

## Running the Plugin Locally

Run from `workspaces/cost-management/`:

| Command                                                            | What it does                                                                           | Use when...                                                                                                                                                                                                                               |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn start` **(recommended, day-to-day default)**                 | Full dev app: frontend (`:3000`) + backend (`:7007`), with catalog, auth, RBAC, search | Default choice for local dev — you get the real sidebar/catalog/RBAC, so what you see matches how the plugin behaves inside an actual Backstage instance                                                                                  |
| `yarn start-app` / `yarn start-backend`                            | Just one half of the full dev app (`packages/app` or `packages/backend` alone)         | You only need to restart/watch one side (e.g. backend logs are noisy, or you're only touching frontend code) while the other keeps running                                                                                                |
| `yarn start:dev` / `yarn start:fe-plugin` / `yarn start:be-plugin` | Isolated plugin dev servers via `createDevApp()` — no real sidebar, catalog, or RBAC   | Rarely needed; only for very fast, isolated hot-reload iteration on a single component/route when you don't care about the surrounding app context (see [Troubleshooting](#troubleshooting) for the "missing sidebar" gotcha this causes) |

> **In practice:** most day-to-day development in this plugin just uses `yarn start` (or `yarn start-app` / `yarn start-backend` individually) — that's what's documented and verified throughout the rest of this guide. The `start:dev`/`start:fe-plugin`/`start:be-plugin` trio is documented for completeness but isn't the typical workflow.

**What's actually running under the hood:** `backstage-cli package start` launches a different server depending on the package's `backstage.role`. For `packages/app` (`role: frontend`), it starts an **[Rspack](https://rspack.dev/)** dev server (`RspackDevServer`) — a Rust-based, webpack-compatible bundler with hot module reload — serving the UI on `:3000`. For `packages/backend` (`role: backend`), it just runs `src/index.ts` directly as a **plain Node.js process** (TypeScript transpiled on the fly, no bundler), auto-restarting on file changes, listening on `:7007`. Curious to dig deeper? See the [Backstage CLI docs](https://backstage.io/docs/tooling/cli/build-system) and the [Rspack documentation](https://rspack.dev/).

---

## Verifying Your Setup

With `yarn start` running, open **http://localhost:3000**, sign in (guest or GitHub), and confirm:

- **Cost Management** appears in the sidebar
- **Optimizations** and **OpenShift** tabs load
- If your `costManagement` credentials are valid, real data from console.redhat.com populates the pages (otherwise expect 401/403 — see [Troubleshooting](#troubleshooting))

---

## RBAC in Local Development

The plugin doesn't ship an RBAC engine — it only consumes Backstage's abstract `PermissionsService`. Locally, `packages/backend/src/index.ts` explicitly adds `@backstage-community/plugin-rbac-backend`, reading policies from `policy.local.csv`. In RHDH production, RHDH provides its own RBAC backend instead — the plugin code is identical either way.

Full permission/policy reference: [docs/rbac.md](./rbac.md).

---

## Testing Against a Real RHDH Instance

Once a change works in the local dev shell, validate it inside an actual RHDH instance, loading the plugin as a **dynamic plugin** (OCI image) the way a customer would:

- **[`rhdh-local`](https://github.com/redhat-developer/rhdh-local)** — Podman/Docker Compose-based local RHDH stack
- **A real RHDH cluster** (Operator/Helm) — see [docs/dynamic-plugin.md](./dynamic-plugin.md) for the ConfigMap/Secret setup

See it in action: [Demo recording: Testing Cost Management plugin with rhdh-local](https://drive.google.com/file/d/1d2Es7n8sAm8dRY0dIfVkFJFBW6asKaJk/view?usp=drive_web).

---

## Common Commands Cheat Sheet

Run from `workspaces/cost-management/`:

| Command                                 | What it does                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `yarn install`                          | Install dependencies                                                                                        |
| `yarn start`                            | Run locally, full dev app **(recommended)** — see [Running the Plugin Locally](#running-the-plugin-locally) |
| `yarn start-app` / `yarn start-backend` | Run just the frontend or backend half of `yarn start`                                                       |
| `yarn test` / `yarn test:all`           | Unit tests / with coverage                                                                                  |
| `yarn lint` / `yarn lint:all`           | Lint changed files / everything                                                                             |
| `yarn tsc`                              | Type-check                                                                                                  |
| `yarn build:all`                        | Build everything in this workspace                                                                          |
| `yarn changeset`                        | Create a changeset for your PR ([CONTRIBUTING.md](../../../CONTRIBUTING.md#creating-changesets))            |

---

## Troubleshooting

- **Node version error on `yarn start`** — check `node -v` against `engines.node` (`22 || 24`); use `nvm use`.
- **Sidebar doesn't show "Cost Management"** — you're probably on `yarn start:dev`, which doesn't render the real sidebar. Use `yarn start`.
- **401/403 or no data on OpenShift/Optimizations pages** — `costManagement.clientId`/`clientSecret` in `app-config.local.yaml` are missing/invalid, or the service account lacks `Cost OpenShift Viewer`.
- **Permission always `DENY` despite a correct-looking CSV rule** — check `policy.local.csv` for a duplicate row; a single duplicate anywhere silently rejects the whole file's reload. Run `sort policy.local.csv | uniq -d` to check.

---

## File Reference

| File                                 | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `app-config.yaml`                    | Base Backstage config (committed)                 |
| `app-config.local.yaml`              | Personal local overrides + secrets (git-ignored)  |
| `policy.local.csv`                   | Local RBAC policy rules                           |
| `packages/app/`, `packages/backend/` | Throwaway dev shell (not shipped)                 |
| `plugins/cost-management*/`          | Published plugin code (frontend, backend, common) |
| `docs/rbac.md`                       | Full RBAC permission and policy reference         |
| `docs/dynamic-plugin.md`             | Installing the plugin as an RHDH dynamic plugin   |
