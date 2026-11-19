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

- Provider prefix is lowercase: `github`, `jira`, `sonarqube`, `dependabot`, `openssf`, `filecheck`, `dora`
- Metric name is lowerCamelCase: `openPRs`, `qualityGate`, `ciiBestPractices`
- Full ID examples: `github.openPRs`, `sonarqube.qualityGate`, `openssf.ciiBestPractices`, `dora.deploymentFrequency`

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

### DORA (4 metrics)

| Metric ID                       | Type   | Unit    | Source                                    |
| ------------------------------- | ------ | ------- | ----------------------------------------- |
| `dora.deploymentFrequency`      | number | `/week` | `DoraDeploymentFrequencyProvider.ts`      |
| `dora.medianLeadTimeForChanges` | number | `h`     | `DoraMedianLeadTimeForChangesProvider.ts` |
| `dora.medianTimeToRestore`      | number | `h`     | `DoraMedianTimeToRestoreProvider.ts`      |
| `dora.changeFailureRate`        | number | `%`     | `DoraChangeFailureRateProvider.ts`        |

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
  `title`, `description`, `type` (`"number"` or `"boolean"`), a
  `thresholds` field providing the default `ThresholdConfig`, and an
  optional `unit` display suffix (e.g. `"h"`, `"%"`, `"/week"`).
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

1. **Entity annotations** (highest priority, when allowed) — per-entity
   overrides set via catalog annotations with the prefix
   `scorecard.io/<metricId>.thresholds.rules.<key>` (full metric ID).
   Merged on top of resolved thresholds by
   `mergeEntityAndMetricThresholds()`. Applied only when
   `areThresholdAnnotationOverridesAllowed()` returns true for the
   metric ID (`scorecard.entityAnnotations.enabled` and
   `scorecard.entityAnnotations.thresholds.enabled` / `except`);
   otherwise this tier is skipped.
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

| File                                | Package                               | Role                                                              |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `ThresholdResolver.ts`              | `scorecard-backend`                   | Resolves thresholds using the three-tier chain                    |
| `Metric.ts`                         | `scorecard-common`                    | Defines `Metric`, `MetricType`, and `MetricValue` types           |
| `MetricProvider.ts`                 | `scorecard-node`                      | Defines the `MetricProvider<T>` interface                         |
| `mergeEntityAndMetricThresholds.ts` | `scorecard-backend`                   | Merges entity annotation overrides with metric thresholds         |
| `getThresholdsFromConfig.ts`        | `scorecard-node`                      | Reads and validates threshold config from `app-config.yaml`       |
| `DependabotConfig.ts`               | `scorecard-backend-module-dependabot` | Dependabot provider metric and threshold definitions              |
| `SonarQubeConfig.ts`                | `scorecard-backend-module-sonarqube`  | SonarQube provider metric and threshold definitions               |
| `OpenSSFConfig.ts`                  | `scorecard-backend-module-openssf`    | OpenSSF provider metric and threshold definitions                 |
| `FilecheckConfig.ts`                | `scorecard-backend-module-filecheck`  | Filecheck provider metric and threshold definitions               |
| `DoraConfig.ts`                     | `scorecard-backend-module-dora`       | DORA provider config, collector wiring, and threshold definitions |

## DORA Collector Pipeline

### Data flow overview

DORA metrics are computed via a three-stage pipeline: **collect →
store → calculate**. Each metric provider drives all three stages
when `calculateMetrics(entity)` is called.

```
MetricProvider.calculateMetrics(entity)
  │
  ├─ Compute 30-day window (from = now − 30 d, to = now)
  │
  ├─ DoraSyncService.syncDeployments / syncIncidents
  │    ├─ Skip if lastSync < staleAfterMs (default 60 s)
  │    ├─ Compute data boundary via collectorDataBoundary()
  │    ├─ ScorecardCollectorsService.collect()
  │    │    ├─ Validate input against contract + collector schemas
  │    │    ├─ Collector.collect()  →  external API calls
  │    │    └─ Validate output against collector + contract schemas
  │    ├─ Upsert rows into DB (deployments: success-only; incidents: all)
  │    └─ Update sync watermark
  │
  ├─ [Lead-time only] syncPullRequestsForDeployment per adjacent pair
  │    └─ getCommitShasBetween + getCommitsPullRequests → store PRs
  │
  ├─ DoraDataService.readDeployments / readIncidents / readPullRequests
  │    └─ DB reads filtered to [windowFrom, windowTo]
  │
  ├─ Filter deployments by production environment
  │
  └─ Calculate metric value → Map<metricId, number>
```

#### Collector contracts

Each collector type has a **contract schema** defined in
`scorecard-backend-module-dora` (under `src/metricProviders/schemas/`)
and an implementation-side schema in the collector package. The
`DefaultScorecardCollectorsService.collect()` validates input and
output against both schemas, so any schema mismatch is caught at
runtime.

| Collector type           | Contract input fields              | Contract output fields                                                             | Default collector ID                  |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------- |
| Deployments              | `from`, `to` (ISO datetime)       | `deployments[]` with `id`, `commitSha`, `environment?`, `createdAt`, `result`      | `github:doraDeployments`              |
| Incidents                | `from`, `to`, `updatedSince`       | `incidents[]` with `id`, `createdAt`, `updatedAt`, `resolutionAt` (nullable)       | `jira:doraIncidents`                  |
| Deployment pull requests | `baseCommitSha`, `headCommitSha`   | `pullRequests[]` with `id`, `firstCommitAt`                                        | `github:doraDeploymentPullRequests`   |

Contract input schemas use `.passthrough()` so collector
implementations can accept extra fields (e.g., `workflowName` for
`github:doraDeploymentWorkflowRuns`, `issueType` for
`jira:doraIncidents`). Contract output schemas use `.strict()` so
unexpected fields in output are rejected.

Deployments output has a `.superRefine` validator that enforces
ascending `createdAt` order. Change Failure Rate and Median Lead
Time for Changes iterate adjacent deployment pairs chronologically,
so out-of-order rows produce wrong results.

#### Metric calculations

| Metric                        | Inputs                       | Minimum data          | Formula                                                                                                  |
| ----------------------------- | ---------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Deployment Frequency (`/week`)| deployments                  | ≥ 0 deployments       | `(productionDeployments.length / 30) × 7`                                                                |
| Median Lead Time (`h`)        | deployments + pull requests  | ≥ 2 deployments       | Median of `(deployment.createdAt − PR.firstCommitAt)` across all PRs in each deployment interval         |
| Change Failure Rate (`%`)     | deployments + incidents      | ≥ 2 deployments       | `(intervalsWithIncidents / evaluatedIntervals) × 100`                                                    |
| Median Time to Restore (`h`)  | incidents                    | ≥ 1 resolved incident | Median of `(incident.resolutionAt − incident.createdAt)` for resolved incidents                          |

### Time-window invariants

DORA metrics operate over a **30-day sliding window**
(`DORA_TIME_WINDOW_DAYS = 30` in `constants.ts`). Every
`calculateMetrics` call computes `windowFrom = now − 30 d` and
`windowTo = now`.

**Key invariants to verify in reviews:**

1. **Every collector call must bound both `from` and `to`.** The sync
   service passes `from` (or `updatedSince`) computed via
   `collectorDataBoundary()` and `to = windowTo`. An unbounded
   `from` (e.g., epoch) causes the collector to page through the
   entire project history — wasting API quota and potentially hitting
   pagination limits before reaching relevant data.

2. **`collectorDataBoundary()` must never produce a future date.**
   The function clamps a watermark ahead of `now` to `now`, then
   subtracts `lookbackMs`. This prevents the boundary from landing
   in the future, which would cause the collector to fetch nothing.

3. **Deployment lookback (default 48 h) re-fetches recent rows to
   catch late status transitions.** A deployment may be created as
   `failure` and later flip to `success`. The `syncFrom` boundary is
   `max(windowFrom, lastSync − 48 h)`, so the collector re-queries
   the recent overlap. However, `DatabaseDoraDeployments.upsert`
   uses insert-ignore (immutable facts) — stored rows are not
   updated. Only newly-appearing `success` deployments are added.

4. **Incident lookback (default 5 min) re-fetches recently updated
   items via `updatedSince`.** This covers clock skew between the
   DORA backend and the incident source. The incident `from`/`to`
   always span the full 30-day window — `updatedSince` only controls
   which incidents are returned on incremental sync.

5. **DB reads are bounded to `[windowFrom, windowTo]`.** The data
   service queries `created_at >= from AND created_at <= to`, so
   rows outside the 30-day window never enter metric calculations
   even if they exist in the database. Any change that merges
   additional rows (e.g., pre-window deployments for lead-time
   baseline) must ensure the merged array is filtered to the
   expected range before calculation.

6. **Staleness check (`isWithinStaleWindow`) can skip sync
   entirely.** If `lastSyncedAt` is within `staleAfterMs` (default
   60 s), the sync service returns without calling the collector.
   A change that reduces `staleAfterMs` increases API load; a
   change that increases it widens the data-freshness gap.

### Pagination boundaries

Collector implementations enforce client-side item limits to prevent
runaway API usage. The limits control **total rows returned**, not
total API requests — a single fetch may make many paginated requests
before reaching the limit.

#### GitHub pagination

Defined in `scorecard-backend-module-github`. Default limit:
`DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT = 1000`, page size:
`GITHUB_BATCH_SIZE = 100`.

**`getDeployments()` (GraphQL, cursor-based):**

- Queries deployments `ORDER BY CREATED_AT DESC` (newest first)
- **Stops when any of:**
  1. `deployments.length >= fetchItemsLimit` — client-side cap
     reached; logs a warning
  2. `reachedOlderThanWindow` — a deployment's `createdAt < from`;
     since results are DESC, all subsequent are older, so early exit
  3. `!githubHasNextPage` — GitHub reports no more pages
- Deployments outside `[from, to]` are filtered out during iteration
  (rows newer than `to` are skipped without incrementing
  `deployments.length`)
- Results are reversed to ascending `createdAt` order before return

**`getWorkflowRuns()` (REST, Octokit paginate):**

- Uses GitHub's `created` query filter bounded to `[from, to]`
- Stops at `fetchItemsLimit`; calls `done()` in paginate callback
- Results reversed to ascending order

**`getCommitShasBetween()` (REST):**

- Fetches commit range via `compareCommitsWithBasehead`
- Applies `fetchItemsLimit` via `appendCommits()` which slices at
  remaining capacity
- Deduplicates via `Set`

**`getCommitsPullRequests()` (GraphQL, batched):**

- Batches commit SHAs in groups of `GITHUB_BATCH_SIZE` (100)
- Each commit gets `associatedPullRequests(first: 10)`
- Deduplicates PRs by PR number

#### Jira pagination

Defined in `scorecard-backend-module-jira`. Default limit:
`DEFAULT_PAGINATED_FETCH_ITEMS_LIMIT = 1000`.

**Cloud (`JiraCloudClientStrategy`):** Token-based pagination using
`nextPageToken` and `isLast`. Stops at `fetchItemsLimit`, at
`isLast === true`, or when no `nextPageToken` is returned. Logs a
warning when the limit is reached with more pages available.

**Data Center (`JiraDataCenterClientStrategy`):** Offset-based
pagination (`startAt + maxResults`). Same `fetchItemsLimit` cap.
Stops when `nextStartAt >= total` or `maxResults === 0`.

**JQL construction (`buildIncidentJql`):**

- Uses epoch-millis comparisons: `created >= <from>`,
  `created <= <to>`, `updated >= <updatedSince>`
- Orders `DESC` by `created` so the newest incidents survive when
  `fetchItemsLimit` truncates results
- Entity annotations can override `issueType` (default `Incident`)

**High-risk patterns:** Any query that sets `from` to epoch (or
omits it) risks paging through the entire project history. With
`fetchItemsLimit = 1000` and `ORDER BY created DESC`, truncation
silently drops the oldest incidents — the caller receives a full
page of results with no indication that data was lost. This can
cause CFR to under-count incidents for the early part of the window.

### Sync watermark and data identity

Each collector invocation is associated with a **data identity**:
`(collectorId, collectorInputHash)` where `collectorInputHash` is
the SHA-256 of the canonicalized collector input JSON. Changing any
input field (e.g., `workflowName`, `issueType`) produces a new hash,
which:

- Starts a new watermark (no prior `lastSyncedAt`), triggering a
  full 30-day window fetch
- Creates new DB rows under the new identity (old rows remain until
  cleanup)

The sync watermark (`DatabaseDoraLastSync`) tracks when each
`(entityRef, collectorId, collectorInputHash)` was last synced.
`DoraSyncService` updates this to `windowTo` after a successful
collect. Reviews should verify that watermark updates happen only
after successful upserts — updating the watermark before storing
data would cause the next sync to skip the un-stored range.

### Review checklist for DORA collector and provider changes

When reviewing changes to DORA providers, collectors, or sync
logic, verify:

- [ ] **Bounded time ranges.** Every collector call passes both
  `from`/`to` (or `updatedSince` for incidents) derived from the
  30-day window. Flag any query where `from` is epoch, unbounded,
  or not derived from `collectorDataBoundary()`.
- [ ] **Pagination limits match intended scope.** If the change
  modifies `fetchItemsLimit` or adds a new paginated query, confirm
  the limit is appropriate for the data volume. A limit too low
  silently truncates; too high wastes API quota.
- [ ] **Filtered data before calculation.** If the change merges
  deployment arrays (e.g., in-window + pre-window for lead-time
  baseline), verify the merged array is filtered to the expected
  time range before metric calculation. Unfiltered merges can
  introduce out-of-range rows that skew results.
- [ ] **Ascending `createdAt` order preserved.** Deployments must
  be in ascending `createdAt` order for adjacent-pair iteration
  (CFR, lead time). The contract schema enforces this via
  `.superRefine`, but custom collectors or data merges could break
  the invariant after validation.
- [ ] **Error handling distinguishes collection failures from
  data-insufficiency.** A collector that returns zero rows is not
  the same as a collector that fails. Providers return `undefined`
  (no value) when minimum data thresholds are not met (e.g., fewer
  than 2 deployments for CFR); collection failures should propagate
  as errors.
- [ ] **Watermark updated only after successful upsert.** If the
  change modifies sync logic, confirm `setLastSyncedAt` is called
  only after `deploymentsDb.upsert` / `incidentsDb.upsert`
  succeeds.
- [ ] **Production environment filter applied.** Deployment
  Frequency, Lead Time, and CFR filter deployments by production
  environment (`isProductionEnvironment`). Verify the filter is not
  bypassed and handles `null`/empty environment correctly (treated
  as production by default).
- [ ] **Metric documentation matches calculation window.** If the
  change alters `DORA_TIME_WINDOW_DAYS`, default thresholds, or
  unit labels, verify that user-facing documentation, translation
  keys, and config schema are updated to match.

### Key files

| File                          | Package                             | Role                                                                     |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `constants.ts`                | `scorecard-backend-module-dora`     | `DORA_TIME_WINDOW_DAYS`, default collector IDs, lookback/stale defaults  |
| `DoraSyncService.ts`          | `scorecard-backend-module-dora`     | Write-side orchestrator: sync, upsert, watermark updates                 |
| `DoraDataService.ts`          | `scorecard-backend-module-dora`     | Read-side: DB queries bounded to `[windowFrom, windowTo]`                |
| `syncUtils.ts`                | `scorecard-backend-module-dora`     | `collectorDataBoundary`, `isWithinStaleWindow`, `coalesceInFlight`       |
| `deploymentSchemas.ts`        | `scorecard-backend-module-dora`     | Deployment contract schemas (input `.passthrough()`, output `.strict()`) |
| `incidentSchemas.ts`          | `scorecard-backend-module-dora`     | Incident contract schemas                                                |
| `pullRequestSchemas.ts`       | `scorecard-backend-module-dora`     | Pull request contract schemas                                            |
| `deploymentFilterUtils.ts`    | `scorecard-backend-module-dora`     | `isProductionEnvironment` — production environment matching              |
| `GithubClient.ts`             | `scorecard-backend-module-github`   | GitHub GraphQL/REST calls with pagination and `fetchItemsLimit`          |
| `incidentJql.ts`              | `scorecard-backend-module-jira`     | JQL builder for incident queries with epoch-millis time bounds           |
| `JiraCloudClientStrategy.ts`  | `scorecard-backend-module-jira`     | Jira Cloud token-based pagination with `fetchItemsLimit`                 |
| `JiraDataCenterClientStrategy.ts` | `scorecard-backend-module-jira` | Jira Data Center offset-based pagination with `fetchItemsLimit`          |
| `DefaultScorecardCollectorsService.ts` | `scorecard-node`             | Double-validates input/output against contract + collector schemas       |
