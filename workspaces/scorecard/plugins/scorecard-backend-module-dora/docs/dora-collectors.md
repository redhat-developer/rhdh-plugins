# DORA collectors

DORA plugin uses [**collectors**](../../scorecard-backend/docs/collectors.md) to gather necessary data for metrics calculation from various sources.
Plugin is pre-configured to use following **default collectors**:

- `jira:incidents`: to gather incident data
- `github:deployments`: to gather deployment data
- `github:deploymentPullRequests`: to gather pull request data linked to deployment data

To use the DORA plugin with its default configuration, install the following backend modules:

- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`
- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira`

You can replace the default collectors with custom collectors tailored to your specific setup as long as they follow the required contracts, see:

- [How to create a custom collector](../../scorecard-backend/docs/collectors.md#create-a-collector)
- [Deployments collector contract](#deployments-collector-contract)
- [Deployment pull requests collector contract](#deployment-pull-requests-collector-contract)
- [Incidents collector contract](#incidents-collector-contract)

Your custom collectors can require or optional extra collector-specific input fields (like `workflowName` with `github:deploymentWorkflowRuns` collector), as long as required DORA contract fields are still supported.

## Deployments collector

Collects deployments created in time window (`from` - `to`).

Available collectors:

- `github:deployments` (default)
- `github:deploymentWorkflowRuns`

See [scorecard-backend-module-github README](../../scorecard-backend-module-github/README.md).

### Deployments collector contract

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)

Required output:

- `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`
  - `deployments` must be in ascending `createdAt` order (oldest to newest), because Change Failure Rate and Median Lead Time for Changes metrics process adjacent deployment pairs chronologically.
  - Only deployments with `result: 'success'` are included in metric calculations.

### Collector `github:deployments`

Required entity annotations:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

App configuration (default):

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        deployments:
          id: github:deployments
```

### Collector `github:deploymentWorkflowRuns`

Required entity annotations:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

When using `github:deploymentWorkflowRuns`, provide `workflowName` as extra collector input:

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        deployments:
          id: github:deploymentWorkflowRuns
          input:
            workflowName: Custom deployment
```

Updating `workflowName` creates a new data identity and triggers a full 30-day data refresh.

### Custom deployments collector

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        deployments:
          id: customDatasource:deployments
          input:
            # optional collector-specific extra input
```

## Incidents collector

Collects incidents created in time window (`from` - `to`) that were updated since `updatedSince`.

Available collectors:

- `jira:incidents` (default)

See [scorecard-backend-module-jira README](../../scorecard-backend-module-jira/README.md).

### Incidents collector contract

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)
- `updatedSince: string` (ISO datetime)

Required output:

- `incidents: Array<{ id: string; createdAt: string; updatedAt: string; resolutionAt: string | null }>`
  - `createdAt` and `updatedAt` must be valid ISO datetimes.
  - `resolutionAt` must be `null` for unresolved incidents or a valid ISO datetime for resolved incidents.

### Collector `jira:incidents`

Required entity annotations:

- `jira/incident-project-key` (preferred), or
- `jira/project-key` (fallback when `jira/incident-project-key` is not set)

Optional incident-only filters:

- `jira/incident-component`
- `jira/incident-label`
- `jira/incident-team`
- `jira/incident-issue-type` (overrides app-config `scorecard.plugins.dora.collectors.incidents.input.issueType`; default issue type is `Incident`)

App configuration (default):

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        incidents:
          id: github:incidents
```

Override Jira issue type:

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        incidents:
          id: jira:incidents
          input:
            issueType: CustomIncident
```

Updating `issueType` creates a new data identity and triggers a full 30-day data refresh.

### Custom incidents collector

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        incidents:
          id: customDatasource:incidents
          input:
            # optional collector-specific extra input
```

## Pull requests collector

Collects pull requests included in the commit range between two deployments (`baseCommitSha` -> `headCommitSha`) and provides their first commit timestamps for lead-time calculation.

Available collectors:

- `github:deploymentPullRequests` (default)

See [scorecard-backend-module-github README](../../scorecard-backend-module-github/README.md).

### Deployment pull requests collector contract

Required input:

- `baseCommitSha: string` (non-empty)
- `headCommitSha: string` (non-empty)

Required output:

- `pullRequests: Array<{ id: string; firstCommitAt: string }>`
  - `firstCommitAt` must be a valid ISO datetime for lead-time calculation.

### Collector `github:deploymentPullRequests`

Required entity annotations for the default pull requests collector:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

App configuration (default):

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        deploymentPullRequests:
          id: github:deploymentPullRequests
```

### Custom deployment pull requests collector

```yaml
scorecard:
  plugins:
    dora:
      collectors:
        deploymentPullRequests:
          id: customDatasource:deploymentPullRequests
          input:
            # optional collector-specific extra input
```
