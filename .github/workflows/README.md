# CI/CD Workflows

## [ci.yml](./ci.yml)

Triggered on pull requests, this workflow runs tests on the target branch, focusing only on workspaces that have changes. Once all checks pass successfully, the pull request can be merged.

## [release_workspace.yml](./release_workspace.yml)

Handles the release process for a specific workspace from a specified branch (default: `main`). It either creates a "Version Packages" pull request if changesets are present or releases the packages within the workspace if they haven't been published yet. For more details on how changesets work, refer to the [Changesets documentation](https://github.com/changesets/changesets).

## [release_workspace_version.yml](./release_workspace_version.yml)

Handles prior-version releases. The legacy 1.x flow is triggered by pull requests merged into per-plugin release branches such as `release-1.10/orchestrator`. The old `workspace/<workspace>` backport path is not supported.

From `release-2.1` onwards, the repository-wide 2.x-and-later flow uses a single branch per release line under the `release-*.*` convention, such as `release-2.1`, and is two-step:

1. A merged pull request targeting the configured release branch creates one `Version Packages` pull request per affected workspace.
2. Merging the generated `Version Packages` pull request publishes the workspace with the `maintenance` npm tag.

Future 2.x-and-later release lines follow the same `release-x.y` convention. The workflow classifies 2.x-and-later branches using this convention as repository-wide release branches.

## [release.yml](./release.yml)

Responsible for releasing all workspaces in parallel by invoking the `release_workspace.yml` workflow for each workspace. It runs on the main branch whenever new changes are pushed. The workflow relies on `release_workspace.yml` to determine if a workspace requires publishing.

## [version_bump.yml](./version_bump.yml)

Handles version bumping for specific workspaces. It creates a new branch for the version bump, updates the necessary files, commits the changes, and creates a pull request to merge the updates into the main branch.
