# CI/CD Workflows

## [ci.yml](./ci.yml)

Triggered on pull requests, this workflow runs tests on the target branch, focusing only on workspaces that have changes. Once all checks pass successfully, the pull request can be merged.

## [release_workspace.yml](./release_workspace.yml)

Handles the release process for a specific workspace from a specified branch (default: `main`). It either creates a "Version Packages" pull request if changesets are present or releases the packages within the workspace if they haven't been published yet. For more details on how changesets work, refer to the [Changesets documentation](https://github.com/changesets/changesets).

## [remind-unvalidated-release.yml](./remind-unvalidated-release.yml)

On bot-authored `Version Packages (<workspace>)` PRs from this repository, checks only public packages whose `package.json` version changes in the PR (including newly added packages). It compares npm registry publication times with successful publish jobs from the corresponding workflow and target branch, using the version at the merged release commit. A main release cannot validate a prior-version release. It comments once with any packages lacking a matching publish and asks the reviewer to ping `@rhdh-cope` in `#rhdh-plugins-ecosystem` on Slack. The cutoff is supplied as an RFC 3339 UTC timestamp per base branch in the repository Actions variable `TRUSTED_PUBLISHING_CUTOVERS`, for example `{"main":"2026-11-26T12:00:00Z","release-2.1":"2026-11-27T09:00:00Z"}`. Set each entry to the time the token-free workflow reached that branch; omit branches that have not migrated yet. A branch without an entry is skipped with a notice. The workflow sparsely checks out only its helper from the trusted base commit with shallow history and reads PR manifests as data via GitHub API; it never executes PR code. It skips Actions queries when npm shows no post-cutover publish and stops paging runs as soon as all affected packages have been validated. This check assumes the token-free workflows are the only publish paths after the cutover.

The `Trusted publishing validation` job fails while a versioned package has no post-cutover npm publish through the matching release workflow. **Do not add it as a required check**: the first Version Packages PR may need to merge despite this failure to produce the first token-free release. Reviewers should make that decision explicitly. After the initial release, rerun the check on any still-open Version Packages PRs to refresh the result. Verify the first token-free publish and its package output before closing the rollout.

## [release.yml](./release.yml)

Responsible for releasing all workspaces in parallel by invoking the `release_workspace.yml` workflow for each workspace. It runs on the main branch whenever new changes are pushed. The workflow relies on `release_workspace.yml` to determine if a workspace requires publishing.

## [version_bump.yml](./version_bump.yml)

Handles version bumping for specific workspaces. It creates a new branch for the version bump, updates the necessary files, commits the changes, and creates a pull request to merge the updates into the main branch.
