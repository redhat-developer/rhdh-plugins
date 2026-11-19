# Boost package releases

The [Changesets configuration](config.json) controls package version grouping.
`fixed` lists groups whose members must be versioned and published together.
It is not a list of packages eligible for release. Packages outside `fixed`
and `linked` still use normal Changesets versioning and dependency updates.
Single-package fixed groups add no version coordination.

All package names below use the prefix
`@red-hat-developer-hub/backstage-plugin-`.

| Packages                                          | Version policy                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| `ai-catalog-common`, `ai-catalog-connector-utils` | One fixed group; releasing either releases both at the same version. |
| `ai-catalog-entity-provider-sdk`                  | Independently versioned.                                             |
| `ai-catalog`                                      | Independently versioned.                                             |
| `ogx-entity-provider`                             | Independently versioned.                                             |

The SDK, frontend, and OGX provider have no fixed or linked version coupling.
Their declared dependencies still apply: the frontend depends on common,
and OGX depends on the SDK and connector utilities.

## Compatibility and the shared release batch

Keep `updateInternalDependencies: "patch"` and the existing dependency ranges.
A compatible SDK minor release can leave OGX unchanged. An SDK major release
outside OGX's existing supported range requires an OGX release and dependency
update. With `workspace:^`, the source manifest retains that notation; Yarn
packs it as a caret range against the workspace dependency's new version.

Version grouping does not verify API compatibility. Review public API changes,
choose the appropriate semantic-version bump, and test affected consumers.
An automatically updated consumer dependency does not prove its code supports
a breaking API change.

Keep the shared `Version Packages (boost)` PR and
[workspace release workflow](../../../.github/workflows/release_workspace.yml).
That workflow runs `yarn changeset version` for the workspace and can publish
multiple packages in one batch. Independent versions do not create separate
publication pipelines or hold a package out of that batch.

Before merging the version PR, review every package in its release plan.
Confirm the restored SDK's minimum-baseline specification and public-contract
reconciliation, including RHIDP-18762, before publishing that surface.
Splitting the version group does not establish SDK release readiness.

## Checking grouping and dependency propagation

Run the release-plan scenarios below after changing the grouping. Use a fresh
temporary fixture for each scenario so unrelated pending changesets do not
affect the result. Copy the Boost root and package manifests, lockfile, and
Changesets configuration. Preserve the package graph and dependency ranges,
then create a temporary Git baseline and one synthetic changeset.

Use the installed Boost Changesets CLI rather than downloading another version.
Run `status` from the fixture root to inspect the planned releases. For major
dependency scenarios, also run `version` there and inspect the resulting
consumer manifest.

```bash
# Capture this path from the real Boost workspace root.
changeset_cli="$PWD/node_modules/@changesets/cli/bin.js"

# Run these commands from a disposable fixture root.
node "$changeset_cli" status --output=release-plan.json
node "$changeset_cli" version # Major dependency scenarios only.
```

Check both native `workspace:^` dependencies and an equivalent explicit
published range. For the native case, inspect a packed consumer manifest too.
Metadata-only pack checks can omit build hooks in the disposable fixture;
they do not replace package build or consumer regression tests.

Keep synthetic changesets, release-plan JSON, archives, and generated version
edits out of the delivered diff. Record the tooling versions and observed
results when changing the grouping.

## RHIDP-18801 verification

Verified on 2026-11-11 at configuration revision
`38049265b2eb819c804ad07f98e48745d6155207`, using Node 22.22.1,
Changesets CLI 2.31.0, release-plan assembler 6.0.10, and Yarn 4.18.1.
Each fixture copied the seven active Boost package manifests. All five
published packages started at 1.2.0; no existing workspace changesets entered
the fixtures.

| Synthetic change                             | Observed result                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Common minor                                 | Common and connector utilities both become 1.3.0; no other release.                                        |
| Connector utilities minor                    | Connector utilities and common both become 1.3.0; no other release.                                        |
| SDK minor                                    | Only SDK becomes 1.3.0; OGX remains 1.2.0.                                                                 |
| Frontend minor                               | Only frontend becomes 1.3.0.                                                                               |
| OGX minor                                    | Only OGX becomes 1.3.0.                                                                                    |
| SDK major, native `workspace:^`              | SDK becomes 2.0.0; OGX becomes 1.2.1 and retains `workspace:^` in source. No other release.                |
| SDK major, explicit `^1.2.0`                 | SDK becomes 2.0.0; OGX becomes 1.2.1 and its SDK range becomes `^2.0.0`. No other release.                 |
| Pack OGX after the native SDK-major scenario | Yarn packs OGX 1.2.1 with SDK dependency `^2.0.0`. Build hooks were omitted only in this metadata fixture. |

All seven release-plan checks and the metadata pack check passed. The real
workspace's package manifests, lockfile, and Changesets configuration were
unchanged by the checks. No package was published.
