---
name: rhdh-workspace
description: >-
  Route work in the rhdh-plugins monorepo to the affected workspace and package.
  Use before doing any work under workspaces/, including documentation-only
  changes.
---

# RHDH Workspace

Identify the affected `workspaces/<name>` from changed files or its
`workspace/<name>` issue label. Change to that workspace and read its
`AGENTS.md`, if present — it contains coding conventions, documentation
conventions, and testing requirements that apply to all changes in the
workspace.

Before running Yarn commands, install dependencies from the workspace root with
`YARN_ENABLE_SCRIPTS=false yarn install --immutable`.

Run build, lint, fix, API-report, and dedupe commands from the workspace root.
Run tests from the affected package directory or with an explicit package
filter. Do not run unfiltered workspace-wide tests; they exceed the Fullsend
sandbox timeout.

## Before finishing

These CI gates apply across workspaces. Run them from the workspace root and
commit any generated files.

- **API reports** — if public exports or function signatures changed, run
  `yarn build:api-reports:only --ci` (and `yarn fix` if package metadata
  moved).
- **Type check** — if TypeScript files were added or modified, run `yarn tsc`
  in the workspace root. CI runs `yarn tsc:full` (non-incremental) and will
  reject type errors that unit tests miss (JavaScript ignores argument count
  mismatches that TypeScript catches).
- **Prettier** — run `yarn prettier:check` (or `yarn prettier:fix` when that
  script exists).
- **Dedupe** — if the lockfile changed, run `yarn dedupe`.
- **Changesets** — for user-facing changes to published packages, add a
  `.changeset/` entry. Check the workspace `AGENTS.md` for when a changeset
  is required vs skippable.
