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
