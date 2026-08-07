# Scorecard Workspace

## Build & Test Commands

- Install: `yarn install`
- Build: `yarn build:all`
- Test all: `CI=true yarn test --watchAll=false`
- Test single package: `CI=true yarn test --watchAll=false -- --testPathPattern=<package-name>`
- Lint: `yarn lint:all`
- Type check: `yarn tsc`

## Metric ID Naming Convention

All metric IDs use `lowerCamelCase` with a `<provider>.<metricName>` format:

- Provider prefix is lowercase: `github`, `jira`, `sonarqube`, `dependabot`, `openssf`, `filecheck`
- Metric name is lowerCamelCase: `openPRs`, `qualityGate`, `ciiBestPractices`
- Full ID examples: `github.openPRs`, `sonarqube.qualityGate`, `openssf.ciiBestPractices`

Never use snake_case for metric IDs. SonarQube API keys (e.g.,
`security_rating`, `code_smells`) are external API field names and remain
snake_case in the API layer only -- they are not metric IDs.

## Complete Metric ID Reference

### GitHub (1 metric)

| Metric ID        | Type   | Source                     |
| ---------------- | ------ | -------------------------- |
| `github.openPRs` | number | `GithubOpenPRsProvider.ts` |

### Jira (1 metric)

| Metric ID         | Type   | Source                      |
| ----------------- | ------ | --------------------------- |
| `jira.openIssues` | number | `JiraOpenIssuesProvider.ts` |

### Dependabot (4 metrics)

| Metric ID                   | Type   | Source                |
| --------------------------- | ------ | --------------------- |
| `dependabot.alertsCritical` | number | `DependabotConfig.ts` |
| `dependabot.alertsHigh`     | number | `DependabotConfig.ts` |
| `dependabot.alertsMedium`   | number | `DependabotConfig.ts` |
| `dependabot.alertsLow`      | number | `DependabotConfig.ts` |

### SonarQube (12 metrics)

| Metric ID                         | Type    | SonarQube API Key          | Source               |
| --------------------------------- | ------- | -------------------------- | -------------------- |
| `sonarqube.qualityGate`           | boolean | _(quality gate API)_       | `SonarQubeConfig.ts` |
| `sonarqube.openIssues`            | number  | _(open issues API)_        | `SonarQubeConfig.ts` |
| `sonarqube.securityRating`        | number  | `security_rating`          | `SonarQubeConfig.ts` |
| `sonarqube.securityIssues`        | number  | `vulnerabilities`          | `SonarQubeConfig.ts` |
| `sonarqube.securityReviewRating`  | number  | `security_review_rating`   | `SonarQubeConfig.ts` |
| `sonarqube.securityHotspots`      | number  | `security_hotspots`        | `SonarQubeConfig.ts` |
| `sonarqube.reliabilityRating`     | number  | `reliability_rating`       | `SonarQubeConfig.ts` |
| `sonarqube.reliabilityIssues`     | number  | `bugs`                     | `SonarQubeConfig.ts` |
| `sonarqube.maintainabilityRating` | number  | `sqale_rating`             | `SonarQubeConfig.ts` |
| `sonarqube.maintainabilityIssues` | number  | `code_smells`              | `SonarQubeConfig.ts` |
| `sonarqube.codeCoverage`          | number  | `coverage`                 | `SonarQubeConfig.ts` |
| `sonarqube.codeDuplications`      | number  | `duplicated_lines_density` | `SonarQubeConfig.ts` |

### OpenSSF (18 metrics)

The OpenSSF provider generates metric IDs dynamically from check names
using `getProviderId()` in `OpenSSFMetricProvider.ts`. The conversion
lowercases the check name and then applies lowerCamelCase:
`name.toLowerCase().replace(/-([a-z])/g, (_, c) => c.toUpperCase())`.

Several OpenSSF check names contain consecutive uppercase characters or
all-caps acronyms (CII-Best-Practices, CI-Tests, SAST). Because the
conversion lowercases first, these become `cii`, `ci`, and `sast` --
not `cII`, `cI`, or `SAST`. Any change to the ID generation regex
must be verified against this full table.

| Check Name               | Metric ID                      | Edge Case?                            |
| ------------------------ | ------------------------------ | ------------------------------------- |
| `Binary-Artifacts`       | `openssf.binaryArtifacts`      |                                       |
| `Branch-Protection`      | `openssf.branchProtection`     |                                       |
| `CII-Best-Practices`     | `openssf.ciiBestPractices`     | Yes -- `CII` becomes `cii`            |
| `CI-Tests`               | `openssf.ciTests`              | Yes -- `CI` becomes `ci`              |
| `Code-Review`            | `openssf.codeReview`           |                                       |
| `Contributors`           | `openssf.contributors`         |                                       |
| `Dangerous-Workflow`     | `openssf.dangerousWorkflow`    |                                       |
| `Dependency-Update-Tool` | `openssf.dependencyUpdateTool` |                                       |
| `Fuzzing`                | `openssf.fuzzing`              |                                       |
| `License`                | `openssf.license`              |                                       |
| `Maintained`             | `openssf.maintained`           |                                       |
| `Packaging`              | `openssf.packaging`            |                                       |
| `Pinned-Dependencies`    | `openssf.pinnedDependencies`   |                                       |
| `SAST`                   | `openssf.sast`                 | Yes -- all-caps becomes all-lowercase |
| `Security-Policy`        | `openssf.securityPolicy`       |                                       |
| `Signed-Releases`        | `openssf.signedReleases`       |                                       |
| `Token-Permissions`      | `openssf.tokenPermissions`     |                                       |
| `Vulnerabilities`        | `openssf.vulnerabilities`      |                                       |

### Filecheck (dynamic)

Filecheck metric IDs follow the pattern `filecheck.<id>` where `<id>`
comes from the `scorecard.metricProviders.filecheck.fileExistence.options.files` configuration in
`app-config.yaml`. IDs are user-defined, not hardcoded. Example:
`filecheck.license`.

## Changing Metric IDs

Any change to metric ID generation or metric ID constants must:

1. Update the ID in the provider source and its corresponding config
   (e.g., `DependabotConfig.ts`, `SonarQubeConfig.ts`, `OpenSSFConfig.ts`)
2. Update the translation keys in `ref.ts` and all locale files
   (`de.ts`, `es.ts`, `fr.ts`, `it.ts`, `ja.ts`)
3. Update the config schema in `config.d.ts`
4. Update `app-config.yaml` and `app-config.production.yaml`
5. Update all test fixtures and assertions that reference the old ID
6. Verify the generated ID against the full table above with hardcoded
   test assertions -- do not rely solely on regex logic

The OpenSSF check name list is sourced from the
[OpenSSF Scorecard project](https://github.com/ossf/scorecard). If new
checks are added upstream, add them to `OPENSSF_METRICS` in
`OpenSSFConfig.ts` and extend the table above.

## MetricProvider Architecture

### MetricProvider interface

Every data source implements `MetricProvider<T extends MetricType>` from
`scorecard-node`. The interface requires:

- `getProviderId()` — unique string identifying the provider (e.g.,
  `"sonarqube"`, `"dependabot"`). Used as the config key in
  `app-config.yaml` under `scorecard.metricProviders.<providerId>`.
- `getProviderDatasourceId()` — identifies the external data source.
- `getMetrics()` — returns `Metric<T>[]`. Each `Metric` has an `id`,
  `title`, `description`, `type` (`"number"` or `"boolean"`), and a
  `thresholds` field providing the default `ThresholdConfig`.
- `calculateMetrics(entity)` — computes metric values for a catalog
  entity. Returns `Map<string, MetricValue<T>>` keyed by metric ID.
- `getCatalogFilter()` — returns the catalog entity filter that
  determines which entities this provider applies to.

The generic constraint `<T extends MetricType>` enforces that all
metrics within a single provider share the same type (all `"number"`
or all `"boolean"`).

### Threshold resolution priority

`ThresholdResolver` (in `scorecard-backend`) resolves thresholds for
each metric, stored per **metric ID** in `ThresholdResolver.configuredThresholds`.
Higher tiers override lower tiers:

1. **Entity annotations** (highest priority) — per-entity overrides set
   via catalog annotations with the prefix
   `scorecard.io/<metricId>.thresholds.rules.<key>` (full metric ID).
   Merged on top of resolved thresholds by
   `mergeEntityAndMetricThresholds()`.
2. **`app-config.yaml` overrides** (middle priority) — administrator
   overrides by configuration, most specific level wins
   (metric > provider), complete replace of metric defaults.
   - metric:
     `metricProviders.<datasource>.<providerName>.metrics.<metricName>.thresholds`
   - provider: `metricProviders.<datasource>.<providerName>.thresholds`
     Config keys are local names (no datasource prefix).
3. **Metric defaults** (lowest priority) — the `thresholds` field on
   each `Metric` object returned by `getMetrics()`. Used when no config
   or entity override exists.

Provider IDs are either `datasource` (batch providers such as filecheck)
or `datasource.<providerName>`. Metric IDs must always be
`datasource.<metricName>`.

### Review guidance for threshold changes

When reviewing changes to `ThresholdResolver`, the `Metric` type,
`mergeEntityAndMetricThresholds`, or `getThresholdsFromConfig`:

- **Flag changes that affect threshold granularity as high severity.**
  Any change to how thresholds are keyed or how overrides are resolved
  directly impacts how cluster administrators configure the scorecard
  in `app-config.yaml`.
- **Verify all three resolution tiers.** A change that fixes one tier
  (e.g., improving config overrides) can break another (e.g.,
  entity annotation merging) if the data structures change.
- **Check config path strings.** Threshold paths are built via
  `getMetricThresholdsConfigPath()`. Changes to provider/metric IDs or
  config schema must update both path helpers and `config.d.ts`.

### Key files

| File                                | Package                               | Role                                                        |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `ThresholdResolver.ts`              | `scorecard-backend`                   | Resolves thresholds using the three-tier chain              |
| `Metric.ts`                         | `scorecard-common`                    | Defines `Metric`, `MetricType`, and `MetricValue` types     |
| `MetricProvider.ts`                 | `scorecard-node`                      | Defines the `MetricProvider<T>` interface                   |
| `mergeEntityAndMetricThresholds.ts` | `scorecard-backend`                   | Merges entity annotation overrides with metric thresholds   |
| `getThresholdsFromConfig.ts`        | `scorecard-node`                      | Reads and validates threshold config from `app-config.yaml` |
| `DependabotConfig.ts`               | `scorecard-backend-module-dependabot` | Dependabot provider metric and threshold definitions        |
| `SonarQubeConfig.ts`                | `scorecard-backend-module-sonarqube`  | SonarQube provider metric and threshold definitions         |
| `OpenSSFConfig.ts`                  | `scorecard-backend-module-openssf`    | OpenSSF provider metric and threshold definitions           |
| `FilecheckConfig.ts`                | `scorecard-backend-module-filecheck`  | Filecheck provider metric and threshold definitions         |
