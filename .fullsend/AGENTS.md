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
