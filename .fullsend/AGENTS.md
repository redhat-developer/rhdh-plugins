# Fullsend instructions

Before working under `workspaces/`, invoke the `rhdh-workspace` skill.

Run Jest tests non-interactively with `CI=true yarn test --watchAll=false`.
If Claude auto-backgrounds a verification command, invoke `TaskStop` before
finishing.

When creating a new package under `workspaces/`, run
`yarn backstage-cli repo fix --publish` at the repo root after the package
is set up. This syncs the `pluginPackages` arrays in sibling `package.json`
files and fixes alphabetical ordering. Verify the command succeeds before
committing. Then, in the workspace directory, run `yarn install` followed
by `yarn dedupe` to produce a clean, deduplicated lockfile. Include the
updated `yarn.lock` in your commit.

When rebasing a branch and encountering `yarn.lock` conflicts, do not
attempt incremental conflict resolution. Instead, revert `yarn.lock` to
the base branch version
(`git checkout origin/main -- workspaces/<workspace>/yarn.lock`), then
run `yarn install` followed by `yarn dedupe` in the workspace directory.
This produces a clean lockfile that incorporates both the base branch
dependencies and your changes.

When creating a changeset, select the bump level based on the change
type:

- `patch` for bug fixes, refactors, chores, and internal improvements
  with no user-facing behavior change.
- `minor` for new features or capabilities visible to plugin consumers.
- `major` for breaking API changes (removed exports, changed interfaces,
  dropped support).

Match the bump level to the issue's stated intent (title prefix,
constraints), not the size of the diff.

When performing a Backstage version bump (`yarn backstage-cli
versions:bump`), check whether any `@backstage/*` dependency has a 0.x
version with a minor version increment (e.g., `^0.17.2` → `^0.18.0`).
Under semver 0.x conventions, minor bumps may introduce breaking
changes. If any such packages exist:

1. Check the upstream Backstage changelog or release notes for each
   affected 0.x package.
2. Document the findings in the PR body under a `### 0.x dependency
   changes` section. For each package, list the version change and
   whether breaking changes were identified.
3. If breaking changes are found that affect consuming packages in this
   repo, adjust the changeset bump level from `patch` to `minor` for
   those packages and note the required migration steps.

Example PR body section:

```
### 0.x dependency changes
- @backstage/frontend-plugin-api ^0.17.2 → ^0.18.0: No breaking
  changes affecting this workspace (new optional props added).
- @backstage/repo-tools ^0.17.3 → ^0.19.0: No API changes affecting
  this workspace (internal dependency removed upstream).
```
