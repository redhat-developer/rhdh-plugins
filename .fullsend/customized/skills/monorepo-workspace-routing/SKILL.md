---
name: monorepo-workspace-routing
description: >-
  Navigate to the correct workspace in a monorepo before starting work.
  Identifies the target workspace from issue/PR context and changes directory
  so that CWD-bound tools (openspec, backstage-cli) work correctly.
---

# Monorepo Workspace Routing

This repository is a monorepo. Independent Backstage plugin workspaces live
under `workspaces/<name>/`. Each workspace has its own `package.json`,
dependencies, build scripts, and agent configuration (`AGENTS.md`).

You MUST route to the correct workspace before doing any other work.

## Step 1: Identify the target workspace

Determine which workspace the task targets from the issue or PR context:

1. **Issue labels** — look for `workspace/<name>` labels (e.g., `workspace/boost`)
2. **Issue title or body** — look for workspace or plugin names (e.g., "boost", "cost-management", "lightspeed")
3. **PR changed files** — if files are under `workspaces/<name>/`, that is the target
4. **Plugin package names** — map `@red-hat-developer-hub/plugin-<name>` to its workspace

If you cannot identify the workspace, check the repository structure:

```bash
ls workspaces/
```

If the workspace is still ambiguous, stop and report that you cannot determine the target workspace.

## Step 2: Change directory

```bash
cd workspaces/<name>/
```

Verify the directory exists and contains a `package.json`:

```bash
test -f package.json && echo "workspace found" || echo "ERROR: not a valid workspace"
```

## Step 3: Read workspace-level instructions

After changing directory, read the workspace's agent configuration:

```bash
test -f AGENTS.md && cat AGENTS.md
test -f CLAUDE.md && cat CLAUDE.md
```

These contain workspace-specific architecture rules, conventions, and constraints
that override or supplement the root-level project instructions.

## Step 4: Install dependencies

The sandbox image has yarn pre-installed. Install dependencies with lifecycle
scripts disabled to avoid postinstall recursion.

```bash
YARN_ENABLE_SCRIPTS=false yarn install --immutable
```

After install, workspace-specific tools become available (e.g., `yarn openspec:validate`).

## Step 5: Synchronize package metadata

After installing dependencies, synchronize package metadata to match
Backstage role definitions. This prevents CI failures on the
`yarn fix --check` gate.

```bash
yarn fix
```

This runs `backstage-cli repo fix`, which updates `publishConfig`,
`main`/`module`/`types` fields, and other role-derived metadata in
all workspace `package.json` files. Any changes produced by this command
should be included in your commit.

## Rules

- ALL build, test, lint, and validation commands must run from the workspace root
- Do not run `yarn install` from the monorepo root for workspace-specific work
- Do not mix changes across multiple workspaces in a single commit
- Each workspace is independent — do not assume shared dependencies
