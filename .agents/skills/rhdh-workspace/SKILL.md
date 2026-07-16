---
name: rhdh-workspace
description: >-
  Route work in the rhdh-plugins monorepo to the affected workspace and package.
  Use before installing dependencies or running build, test, lint, fix,
  API-report, or dedupe commands under workspaces/.
---

# RHDH Workspace

Identify the affected `workspaces/<name>` from changed files or its
`workspace/<name>` issue label. Change to that workspace and read its
`AGENTS.md`, if present, before running Yarn commands.

Install dependencies from the workspace root with
`YARN_ENABLE_SCRIPTS=false yarn install --immutable`.

Run build, lint, fix, API-report, and dedupe commands from the workspace root.
Run tests from the affected package directory or with an explicit package
filter. Do not run unfiltered workspace-wide tests; they exceed the Fullsend
sandbox timeout.

## Before finishing

These CI gates apply across workspaces. Run them from the workspace root and
commit any generated files.

- **API reports** — if public exports or function signatures changed, run
  `yarn build:api-reports` (and `yarn fix` if package metadata moved).
- **Changesets** — for user-facing changes to published packages, add a
  `.changeset/` entry. Check the workspace `AGENTS.md` for when a changeset
  is required vs skippable.
