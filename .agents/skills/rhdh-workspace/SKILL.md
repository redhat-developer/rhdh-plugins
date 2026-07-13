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

Use the shared `$rhdh` skill for broader RHDH guidance.
