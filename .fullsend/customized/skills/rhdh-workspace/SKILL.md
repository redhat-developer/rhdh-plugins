---
name: rhdh-workspace
description: >-
  Navigate to the correct workspace in the rhdh-plugins monorepo, install
  dependencies, and scope all commands (test, build, lint) to the target
  workspace. Prevents workspace-wide operations that exceed sandbox timeouts.
---

# RHDH Workspace

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

## Step 5: Synchronize Backstage metadata and generated files

After installing dependencies, run Backstage maintenance commands to ensure
all generated files and metadata are in sync. These commands fix CI gates
that check for committed artifacts.

```bash
# Sync package.json metadata (publishConfig, role fields)
yarn fix

# Generate API report files for packages with public exports
yarn build:api-reports

# Deduplicate lockfile entries
yarn dedupe
```

If any of these commands modify files, the changes MUST be included in your
commit. These are not optional — CI will reject the PR if these artifacts
are out of sync.

## Test scoping

Run tests ONLY for the affected package, from within the package directory:

```bash
cd plugins/<plugin-name>/
yarn test
```

Or equivalently from the workspace root:

```bash
yarn backstage-cli package test --filter <package-name>
```

**NEVER run workspace-wide or monorepo-wide test sweeps.** Commands like
`yarn backstage-cli package test` without a filter, or `yarn test` from the
workspace root, execute tests for every package in the workspace. This exceeds
the sandbox timeout and will kill your run — losing all uncommitted work.
## Rules

- ALL build, test, lint, and validation commands must run from the workspace root
  or the specific package directory — never from the monorepo root
- Do not run `yarn install` from the monorepo root for workspace-specific work
- Do not mix changes across multiple workspaces in a single commit
- Each workspace is independent — do not assume shared dependencies
- After a test/build/lint failure, read the full error output and fix the code
  before retrying. Never retry the same command without changing code first
- After 2 consecutive test failures, re-read every file you edited and diff your
  changes against the original before running tests again
