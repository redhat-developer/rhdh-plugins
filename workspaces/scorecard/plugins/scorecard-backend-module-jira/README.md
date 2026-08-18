# Scorecard Backend Module for Jira

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides Jira-specific metrics for software components registered in the Backstage catalog.

## Supported versions

- Supported API version for Jira Cloud is **3**.
- Supported API version for Jira Data Center is **2**.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

This module also requires a Jira integration to be configured in your `app-config.yaml`. This module supports **Direct** OR **Proxy** jira integration. The following example of configuration can help:

## Configuration

### Authentication `token`

- For the `cloud` product:

  - Obtain your personal token from Jira. Please use the following link to create token: [link](https://id.atlassian.com/manage-profile/security/api-tokens).
  - Create a Base64-encoded string from the following plain text format: `your-atlassian-email:your-jira-api-token`:

  ```bash
  // Node
  new Buffer('your-atlassian-email:your-jira-api-token').toString(
    'base64',
  );

  // Browser console
  btoa('your-atlassian-email:your-jira-api-token');

  // Bash
  echo -n 'your-atlassian-email:your-jira-api-token' | base64
  ```

- For the `datacenter` product:
  - Obtain your personal token from Jira. Please use the following link to the Jira documentation for information on how to generate a token: [link](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)
  - Use the Jira token without changing

### Configuration **Direct** Jira integration

Provide the following config to `app-config.yaml` file:

```yaml
jira:
  # Required
  baseUrl: ${JIRA_URL}
  # Required
  token: ${JIRA_TOKEN}
  # Required: Supported products: `cloud` or `datacenter`
  product: cloud
```

### Configuration **Proxy** jira integration

Provide the following config to `app-config.yaml` file:

```yaml
jira:
  # Required
  proxyPath: /jira/api
  # Required: Supported products: `cloud` or `datacenter`
  product: cloud

# This proxy configuration presented only as an example
proxy:
  endpoints:
    '/jira/api':
      target: https://example.atlassian.net
      headers:
        Accept: 'application/json'
        Content-Type: 'application/json'
        X-Atlassian-Token: 'no-check'
        # Required: (For cloud use 'Basic YourCreatedAboveToken', for datacenter use 'Bearer YourJiraToken')
        Authorization: Basic SomeTokenHere
```

### Options Configuration

Options define configuration that affect fetch jira issues global configuration, but all options are optional. This settings are closely related with annotation settings and whole jira issues loading process.

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    jira:
      # Scorecard-owned Jira datasource settings (auth stays under top-level jira:)
      openIssues:
        options:
          # Optional: replaces the default mandatory filter
          # ("type = Bug AND resolution = Unresolved")
          mandatoryFilter: type = Task AND resolution = Resolved
          # Optional: global custom filter. Overridden by entity annotation
          # jira/custom-filter when that annotation is set.
          customFilter: priority in ("Critical", "Blocker")
```

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. However, this configuration can be changed in the `app-config.yaml` file. Here is an example of how to do that:

```yaml
scorecard:
  metricProviders:
    jira:
      openIssues:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). For more details on how to configure schedule, see [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling).

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the Jira module
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira'
  ),
);

backend.start();
```

### Entity Annotations

For the Jira metrics to work, your catalog entities must have the required Jira annotations:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Required: Jira project key
    jira/project-key: PROJECT
    # Optional: Jira component name
    jira/component: Component
    # Optional: Jira label
    jira/label: UI
    # Optional: recommended to use Jira team ID instead of team title
    jira/team: 9d3ea319-fb5b-4621-9dab-05fe502283e
    # Optional: Custom JQL; overrides app-config openIssues.options.customFilter
    jira/custom-filter: 'reporter = "psycon98@yahoo.com" AND resolution is not EMPTY'
spec:
  type: website
  lifecycle: experimental
  owner: guests
  system: examples
  providesApis: [example-grpc-api]
```

## Available Metrics

### Jira Issues (`jira.openIssues`)

This metric counts all jira issues that match the filter condition specified in annotation and app-config.yaml

- **Metric ID**: `jira.openIssues`
- **Type**: `Number`
- **Datasource**: `jira`

## Collectors

This module registers collectors to collect data from Jira to be used by composite metric providers:

- `scorecard-backend-module-dora`:

  - `jira:incidents`

### Collector contracts

Collectors in Scorecard are schema-validated at runtime. Any custom collector replacing a Jira collector must return data that conforms to the same contract expected by consumers.

`jira:incidents`

- **Input schema**
  - `from: string` (ISO datetime)
  - `to: string` (ISO datetime)
  - `issueType?: string` (optional; default `Incident`)
- **Output schema**
  - `incidents: Array<{ id: string; createdAt: string; resolutionAt: string | null }>`
- **Annotation requirements**
  - Uses `jira/incident-project-key` when present
  - Falls back to `jira/project-key` when `jira/incident-project-key` is not set
  - Requires at least one of those `project-key` annotations on the entity
  - Optional incident-only filters (no fallback to open-issues annotations):
    - `jira/incident-component`
    - `jira/incident-label`
    - `jira/incident-team`
    - `jira/incident-issue-type` (overrides app-config `input.issueType` when set)
- **Behavior**
  - Collects Jira issues matching the configured issue type (default `Incident`)
  - Does not apply the open-issues `mandatoryFilter` / global `customFilter` from app-config
  - Client-side fetch cap: at most **1000** incidents are collected per request. Pagination stops once the cap is reached

Example entity annotations for `jira:incidents` collector:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Jira project for incident collection:
    jira/incident-project-key: INCIDENTS
    # Optional fallback when jira/incident-project-key is not set:
    jira/project-key: PROJECT
    # Optional incident-only filters:
    # jira/incident-component: Payments
    # jira/incident-label: sev-1
    # jira/incident-team: team-ops
    # jira/incident-issue-type: Production Incident
spec:
  type: service
  lifecycle: production
  owner: team-a
```

For a complete collector implementation guide, see [collectors.md](../scorecard-backend/docs/collectors.md).

## Default thresholds

Default thresholds for `jira.openIssues`:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    jira:
      openIssues:
        thresholds:
          rules:
            - key: success
              expression: '<10'
            - key: warning
              expression: '10-50'
            - key: error
              expression: '>50'
```

See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom configuration.
