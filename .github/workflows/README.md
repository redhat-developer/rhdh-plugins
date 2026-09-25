# CI/CD Workflows

## [ci.yml](./ci.yml)

Triggered on pull requests, this workflow runs tests on the target branch, focusing only on workspaces that have changes. Once all checks pass successfully, the pull request can be merged.

## [release_workspace.yml](./release_workspace.yml)

Handles the release process for a specific workspace from a specified branch (default: `main`). It either creates a "Version Packages" pull request if changesets are present or releases the packages within the workspace if they haven't been published yet. For more details on how changesets work, refer to the [Changesets documentation](https://github.com/changesets/changesets).

## [backport.yml](./backport.yml)

Creates a backport pull request when a pull request merged into `main` has one backport label. Comment exactly one of `/backport release-2.1`, `/backport release-1.10`, or `/backport release-1.9` on the pull request before it is merged. The 2.x label targets the repository-wide branch directly, such as `release-2.1`. The 1.9 and 1.10 labels require exactly one PR `workspace/<name>` label (not a branch) to select a legacy per-workspace branch such as `release-1.10/orchestrator`. The workflow creates the release label when needed, cherry-picks all commits from the source pull request, and opens a pull request for normal review. Missing release branches are reported and skipped; ambiguous release or workspace labels fail explicitly. Resolve cherry-pick conflicts manually on a branch based on the target release branch.

## [release_workspace_version.yml](./release_workspace_version.yml)

Handles prior-version releases. Backport pull requests for legacy 1.10-and-earlier lines target a per-workspace branch such as `release-1.10/orchestrator`. From `release-2.1` onwards, they target a repository-wide `release-x.y` branch such as `release-2.1`. A `workspace/<workspace>` branch is not a valid backport target; neither is `release-2.1/<workspace>`.

The same release process applies to both branch layouts:

1. Cherry-pick the fix onto a branch based on the appropriate release branch, include a changeset for published package changes, and merge the backport pull request after review and CI. Do not bump `package.json` versions manually. This merge does not publish to npm.
2. The workflow opens a separate `Version Packages` pull request for each affected workspace, from `maintenance-changesets-release/release-x.y/<workspace>`. A leftover branch with that name from a previous cycle must be deleted before the workflow can open a new PR. For legacy branches, the workspace comes from the target branch; for repository-wide branches, the workflow detects affected workspaces from the merged PR.
3. Merge the `Version Packages` PR authored by `rhdh-bot` to publish that workspace with the `maintenance` npm dist-tag and create its Git tag. Closing it without merging does not publish.

For `yarn.lock`-only fixes without plugin code changes, no changeset or npm release is needed; update the corresponding overlays `source.json` `repo-ref` instead. See [Backporting patches](../../CONTRIBUTING.md#backporting-patches-prior-release-lines) for the full procedure, including the follow-up `CHANGELOG` PR to `main`.

## [release.yml](./release.yml)

Responsible for releasing all workspaces in parallel by invoking the `release_workspace.yml` workflow for each workspace. It runs on the main branch whenever new changes are pushed. The workflow relies on `release_workspace.yml` to determine if a workspace requires publishing.

## [version_bump.yml](./version_bump.yml)

Handles version bumping for specific workspaces. It creates a new branch for the version bump, updates the necessary files, commits the changes, and creates a pull request to merge the updates into the main branch.
