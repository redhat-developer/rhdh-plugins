# Fullsend instructions

Before working under `workspaces/`, invoke the `rhdh-workspace` skill.

Run Jest tests non-interactively with `CI=true yarn test --watchAll=false`.
If Claude auto-backgrounds a verification command, invoke `TaskStop` before
finishing.

When creating a new package under `workspaces/`, run
`yarn backstage-cli repo fix --publish` at the repo root after the package
is set up. This syncs the `pluginPackages` arrays in sibling `package.json`
files and fixes alphabetical ordering. Verify the command succeeds before
committing.
