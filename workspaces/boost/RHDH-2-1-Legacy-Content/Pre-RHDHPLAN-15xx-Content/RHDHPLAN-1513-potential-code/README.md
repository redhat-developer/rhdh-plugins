# RHDHPLAN-1513 Potential Reference/Reuse Code

This folder contains **potential reference and reuse material** extracted from
the archived RHDH 2.1 Boost plugin codebase. These files are **not** active
workspace packages, implemented release behavior, or code approved for
restoration. They are preserved as historical reference for future
RHDHPLAN-1513 work.

## Contents

This folder contains 42 files organized into three reuse groups and two
separately marked scope-dependent references.

### Reuse group 1: Ingestion health types and services (10 files)

Outstanding ownership:
[RHIDP-15335](https://redhat.atlassian.net/browse/RHIDP-15335) and
[RHIDP-15337](https://redhat.atlassian.net/browse/RHIDP-15337), under
[RHIDP-15331](https://redhat.atlassian.net/browse/RHIDP-15331).

Original delivery:
[PR #4250](https://github.com/redhat-developer/rhdh-plugins/pull/4250),
[issue #4043](https://github.com/redhat-developer/rhdh-plugins/issues/4043).

| Path                                                        | Description                    |
| ----------------------------------------------------------- | ------------------------------ |
| `ai-catalog-common/src/ingestion-health.ts`                 | Health status type definitions |
| `boost-backend/src/ingestion/ConnectorConfigReader.test.ts` | Tests                          |
| `boost-backend/src/ingestion/ConnectorConfigReader.ts`      | Connector config reader        |
| `boost-backend/src/ingestion/ErrorClassifier.test.ts`       | Tests                          |
| `boost-backend/src/ingestion/ErrorClassifier.ts`            | Error classification logic     |
| `boost-backend/src/ingestion/HealthStatusService.test.ts`   | Tests                          |
| `boost-backend/src/ingestion/HealthStatusService.ts`        | Health status service          |
| `boost-backend/src/ingestion/SyncAttemptsStore.test.ts`     | Tests                          |
| `boost-backend/src/ingestion/SyncAttemptsStore.ts`          | Sync attempts store            |
| `boost-backend/src/ingestion/index.ts`                      | Barrel export                  |

### Reuse group 2: Configuration and encryption services (11 files)

Outstanding ownership:
[RHIDP-15340](https://redhat.atlassian.net/browse/RHIDP-15340) and future
hot-reload propagation under
[RHIDP-15332](https://redhat.atlassian.net/browse/RHIDP-15332).

Original delivery:
[PR #4287](https://github.com/redhat-developer/rhdh-plugins/pull/4287),
[issue #4044](https://github.com/redhat-developer/rhdh-plugins/issues/4044),
plus [PR #4314](https://github.com/redhat-developer/rhdh-plugins/pull/4314)
and [PR #4315](https://github.com/redhat-developer/rhdh-plugins/pull/4315).

| Path                                                                             | Description                    |
| -------------------------------------------------------------------------------- | ------------------------------ |
| `boost-backend/config.d.ts`                                                      | TypeScript config declarations |
| `boost-backend/src/config/AdminConfigService.test.ts`                            | Tests                          |
| `boost-backend/src/config/AdminConfigService.ts`                                 | Admin config service           |
| `boost-backend/src/config/RuntimeConfigResolver.migrateConnectorSchemas.test.ts` | Migration tests                |
| `boost-backend/src/config/RuntimeConfigResolver.test.ts`                         | Tests                          |
| `boost-backend/src/config/RuntimeConfigResolver.ts`                              | Runtime config resolver        |
| `boost-backend/src/config/encryption.test.ts`                                    | Tests                          |
| `boost-backend/src/config/encryption.ts`                                         | Encryption utilities           |
| `boost-backend/src/config/index.ts`                                              | Barrel export                  |
| `boost-backend/src/config/schemas.test.ts`                                       | Tests                          |
| `boost-backend/src/config/schemas.ts`                                            | Zod config schemas             |

### Reuse group 3: Migration readiness CLI (19 files)

Outstanding ownership:
[RHIDP-15347](https://redhat.atlassian.net/browse/RHIDP-15347), under
[RHIDP-15334](https://redhat.atlassian.net/browse/RHIDP-15334).

Original delivery:
[PR #4498](https://github.com/redhat-developer/rhdh-plugins/pull/4498),
[issue #4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220).

| Path                                                  | Description                            |
| ----------------------------------------------------- | -------------------------------------- |
| `boost-migration-readiness/.eslintrc.js`              | ESLint config                          |
| `boost-migration-readiness/CHANGELOG.md`              | Changelog                              |
| `boost-migration-readiness/README.md`                 | Package README                         |
| `boost-migration-readiness/package.json`              | Package metadata (historical snapshot) |
| `boost-migration-readiness/report.api.md`             | API report (historical snapshot)       |
| `boost-migration-readiness/scripts/build-cli.js`      | CLI build script                       |
| `boost-migration-readiness/src/analyze.test.ts`       | Tests                                  |
| `boost-migration-readiness/src/analyze.ts`            | Analysis logic                         |
| `boost-migration-readiness/src/catalogClient.test.ts` | Tests                                  |
| `boost-migration-readiness/src/catalogClient.ts`      | Catalog client                         |
| `boost-migration-readiness/src/cli.ts`                | CLI entry point                        |
| `boost-migration-readiness/src/formatters.test.ts`    | Tests                                  |
| `boost-migration-readiness/src/formatters.ts`         | Output formatters                      |
| `boost-migration-readiness/src/index.ts`              | Library entry point                    |
| `boost-migration-readiness/src/mappings.test.ts`      | Tests                                  |
| `boost-migration-readiness/src/mappings.ts`           | Entity kind/type mappings              |
| `boost-migration-readiness/src/parseArgs.test.ts`     | Tests                                  |
| `boost-migration-readiness/src/parseArgs.ts`          | Argument parser                        |
| `boost-migration-readiness/src/types.ts`              | Type definitions                       |

### Scope-dependent references (2 files)

These files are preserved as historical references pending explicit
RHDHPLAN-1513 scope reconciliation. They remain excluded from the agreed
RHDHPLAN-1507 minimum SDK. Their retention does not authorize restoring
Neo4j, SkillBundle, skillcard, or Kagenti functionality.

| Path                                                        | Description                                  |
| ----------------------------------------------------------- | -------------------------------------------- |
| `ai-catalog-entity-provider-sdk/src/Neo4jSyncAdapter.ts`    | Neo4j sync adapter (historical reference)    |
| `ai-catalog-entity-provider-sdk/src/SkillBundleMetadata.ts` | Skill bundle metadata (historical reference) |

## Known reconciliation needs

- **Health and config code** still targets Jira/GitHub/GitLab and historical
  `boost.connectors.*` / `ai-catalog.providers.*` assumptions. These are not
  the final AI connector contracts.
- **Health services** require actual provider wiring and alignment with the
  forthcoming incremental-ingestion lifecycle.
- **Migration readiness CLI** retains `skill-bundle` and historical
  kind/mapping assumptions. Its `analyze.ts` imports `AIAssetCategorySchema`,
  which is not publicly exported by the current SDK. Future reuse must use
  the agreed public SDK contracts rather than re-exporting that internal
  schema to make this archive compile.
- **RHDHPLAN-1513 scope** still needs reconciliation with the curated
  RHDHPLAN-1507 baseline; references to Neo4j, SkillBundle, Kagenti,
  evaluation, or other historical features do not make them minimum-scope
  commitments.

## Package metadata note

Any `package.json`, `report.api.md`, or `CHANGELOG.md` in this folder is a
**historical snapshot**. These packages are not registered in the workspace,
not published, and should not be treated as active Yarn workspace members.

## Related resources

- Active SDK and recovery manifest:
  [specifications/RHIDP-18760-recovery-manifest.md](../../../specifications/RHIDP-18760-recovery-manifest.md)
- Ingestion health dashboard:
  [openspec/changes/ingestion-health-dashboard/](../../../openspec/changes/ingestion-health-dashboard/)
- Connector config hot-reload:
  [openspec/changes/connector-config-hot-reload/](../../../openspec/changes/connector-config-hot-reload/)
- Upstream schema alignment:
  [openspec/changes/upstream-schema-alignment/](../../../openspec/changes/upstream-schema-alignment/)
- [RHDHPLAN-1507](https://redhat.atlassian.net/browse/RHDHPLAN-1507):
  Active SDK baseline reconciled; metadata, incremental sync, and provider
  adoption remain separate follow-on work.
- [RHDHPLAN-1513](https://redhat.atlassian.net/browse/RHDHPLAN-1513):
  Owns the potential health/configuration/readiness reuse retained here.

## What this folder is NOT

Actual restoration, package regrouping, SDK adoption, schema/mapping
modernization, and implementation belong to subsequent reviewed work under
the relevant Jira tickets. This archive is reference material only.
