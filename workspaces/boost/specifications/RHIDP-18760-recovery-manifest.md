# RHIDP-18760 SDK recovery manifest

## Purpose and release boundary

[RHIDP-18760](https://redhat.atlassian.net/browse/RHIDP-18760), under
[RHIDP-18759](https://redhat.atlassian.net/browse/RHIDP-18759), authorizes
mechanical recovery of reusable SDK code and documentation for RHDH 2.2
reconciliation. The story explicitly references the earlier
[2.1 pruning PR #4935](https://github.com/redhat-developer/rhdh-plugins/pull/4935).
That pruning limited the 2.1 public surface to annotation constants and version
normalization. Recovery on main does not change that historical release scope.

The recovered interfaces, validators, and delta helpers are not registered with
live providers by this work. Annotation policy, minimum categories, per-kind SDK
design, connector adoption, registry selection, and incremental-ingestion design
remain follow-on work. Restored code and historical specifications do not imply
that those decisions are settled.

The additive public exports have a minor changeset. Package publication remains
part of the separate repository release workflow.

### Publication prerequisite for the expanded SDK surface

Do not publish this recovery's expanded SDK surface until RHIDP-18761 and
RHIDP-18762 are complete and the restored public contracts are settled. The
maintainer must check this prerequisite before merging a Version Packages PR
that releases these exports. This is a maintainer release prerequisite; this
recovery does not add an automated publication block.

Root-entry-point exports remain `@public` because the workspace's API-report
release-tag validation requires that tag for the main entry point. Changing
only the tags to `@alpha` or `@beta` would fail that check. If experimental APIs
are needed before reconciliation is complete, define a separate experimental
entry point and its package wiring in follow-on work. Breaking public contract
changes after publication require the corresponding semver treatment.

## Source-to-destination inventory

All paths below are relative to `workspaces/boost/`. The archive root is
`RHDH-2-1-Legacy-Content/Pre-RHDHPLAN-15xx-Content/`. For each row, the source
was the archive root plus the destination path. PR #5449 moves these nine files;
their recreated archive copies were removed in commit `547dda1679`.

| Original relative path / active destination                                | Recovery status                                                                                                                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugins/ai-catalog-entity-provider-sdk/src/AIAssetEntityProvider.ts`      | Moved; provider contract retained for reconciliation.                                                                                                              |
| `plugins/ai-catalog-entity-provider-sdk/src/AIAssetValidator.ts`           | Moved; processor methods made public so generated declarations satisfy `CatalogProcessor`. Rejected-category diagnostics escaped. No processor registration added. |
| `plugins/ai-catalog-entity-provider-sdk/src/AIAssetValidator.test.ts`      | Moved; missing-category assertions strengthened and control-character diagnostic cases added.                                                                      |
| `plugins/ai-catalog-entity-provider-sdk/src/DeltaSyncManager.ts`           | Moved; cursor-store parameters clarified as `locationKey`. Synchronization behavior preserved.                                                                     |
| `plugins/ai-catalog-entity-provider-sdk/src/DeltaSyncManager.test.ts`      | Moved; cursor-key test description clarified.                                                                                                                      |
| `plugins/ai-catalog-entity-provider-sdk/src/validateAIAssetEntity.ts`      | Moved; missing-category diagnostics include the same allowed-values hint as the processor. Rejected-category diagnostics escaped.                                  |
| `plugins/ai-catalog-entity-provider-sdk/src/validateAIAssetEntity.test.ts` | Moved; missing-category assertions strengthened and control-character diagnostic cases added.                                                                      |
| `specifications/ai-asset-upstream-migration-design.md`                     | Moved; relative links and Decision 1 anchors corrected. Remains a follow-on planning pointer.                                                                      |
| `specifications/annotation-specification.md`                               | Moved; relative links and Decision 1 anchors corrected. Historical mappings await reconciliation.                                                                  |

Historical source delivery is traceable through
[PR #4212](https://github.com/redhat-developer/rhdh-plugins/pull/4212),
[PR #4417](https://github.com/redhat-developer/rhdh-plugins/pull/4417),
[PR #4221](https://github.com/redhat-developer/rhdh-plugins/pull/4221), and
[PR #4498](https://github.com/redhat-developer/rhdh-plugins/pull/4498).
PR #4498 supplied the annotation document under the separate 1513 track; its
recovery here does not transfer ownership of the migration-readiness CLI.

## Already-active SDK artifacts

The following files already existed under
`plugins/ai-catalog-entity-provider-sdk/`. They were not moved from the archive
or replaced wholesale with archived versions.

| File                                  | Disposition                                                                                                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/annotations.ts`                  | Merged the category schema/type/list needed by the restored validators. Existing annotation constants retained. Zod schema stays internal. RHIDP-18762 subsequently reconciled the historical seven-category vocabulary to six supported values, removing `skill-bundle`. |
| `src/normalizeAIAssetVersion.ts`      | Active implementation preserved unchanged.                                                                                                                                                                                                                                |
| `src/normalizeAIAssetVersion.test.ts` | Active tests preserved unchanged.                                                                                                                                                                                                                                         |
| `src/index.ts`                        | Merged the restored public exports. Excluded graph/bundle modules and the internal Zod schema are not exported.                                                                                                                                                           |
| `README.md`                           | Updated for the recovered API surface and its follow-on status.                                                                                                                                                                                                           |
| `package.json`                        | Active name, version, build scripts, and publishing metadata retained. Added only the Backstage catalog and Zod dependencies required by restored modules, and updated the description.                                                                                   |
| `report.api.md`                       | Regenerated for the public exports and processor methods.                                                                                                                                                                                                                 |
| `CHANGELOG.md`                        | Preserved unchanged as historical release evidence, including the 2.1 pruning decision.                                                                                                                                                                                   |
| `.eslintrc.js`                        | Preserved unchanged.                                                                                                                                                                                                                                                      |

Supporting changes update `yarn.lock`, the package description in `AGENTS.md`,
the minor changeset, and `specifications/CURRENT.md`. The latter retains the
2.1 dependency boundary and separately identifies this 2.2 recovery and its
planning references.

The new internal helper
`plugins/ai-catalog-entity-provider-sdk/src/escapeDiagnosticValue.ts` shares
diagnostic escaping between both validators. It escapes Unicode control
characters and line/paragraph separators for display. Both validators continue
to validate the original input. This file was added during review, not recovered
from the archive, and is not exported from the package entry point.

## Already-active OpenSpec artifacts

These files already existed under
`openspec/changes/ai-catalog-entity-model/`; none was recovered from the archive:

```text
proposal.md
design.md
audit.md
tasks.md
specs/annotation-scheme/spec.md
specs/entity-provider-sdk/spec.md
specs/delta-sync-framework/spec.md
specs/migration-readiness/spec.md
specs/migration-readiness/migration-plan.md
specs/performance-resilience/spec.md
specs/air-gapped-deployment/spec.md
```

The recovery preserves these planning artifacts for reconciliation. Review
follow-up edits correct a cursor-store example from `providerId` to
`locationKey` and update the annotation-scheme and entity-provider-sdk specs for
the allowed-values diagnostic hint and escaped rejected-category diagnostics.
`audit.md` records these terminology and diagnostic corrections.
The conceptual `DeltaSyncCursor.providerId` design remains unchanged. Existing
graph, bundle, air-gap, performance, and mapping statements in these historical
plans do not become minimum-scope commitments through recovery.

The migration pointer continues to target the canonical
[migration plan](../openspec/changes/ai-catalog-entity-model/specs/migration-readiness/migration-plan.md).

## Exclusions and follow-on ownership

- Do not recover `Neo4jSyncAdapter.ts`, `SkillBundleMetadata.ts`, generated
  distribution output, the 1513 migration-readiness CLI, or the older
  agent-lifecycle/chat/provider application.
- No new `packages/` destination, live provider registration, validator
  activation, or connector synchronization strategy is introduced.
- [RHIDP-18761](https://redhat.atlassian.net/browse/RHIDP-18761) owns OpenSpec
  minimum-scope reconciliation.
- [RHIDP-18762](https://redhat.atlassian.net/browse/RHIDP-18762) owns SDK exports,
  validation tests, and documentation reconciliation.
- Broader SDK design, supported OCI registry selection, and evaluation of
  Backstage incremental entity providers remain subsequent planning work.

## Verification

Pre-submit checks run from the workspace root, except package tests/builds:

- Immutable dependency installation with lifecycle scripts disabled.
- `yarn tsc:full`, then `yarn build:api-reports:only --ci` after regeneration.
- Workspace lint and formatting checks, OpenSpec validation, and lockfile
  deduplication check.
- SDK and OGX package tests.
- SDK package build followed by a TypeScript consumer check against its
  generated declarations: an `AIAssetValidator` must be assignable to
  `CatalogProcessor`, and both processor methods must remain accessible.
- Recovery paths, relative documentation links and section anchors, preserved
  artifacts, excluded modules, and absence of live activation checked against
  the restoration diff.

Source-level tests alone cannot detect methods removed by `stripInternal`.
The declaration-consumer check covers that public package boundary separately.
