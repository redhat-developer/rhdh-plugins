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

### Threshold Configuration

Thresholds define conditions that determine which category a metric value belongs to ( `error`, `warning`, or `success`). You can configure custom thresholds for the Jira metrics. Check out detailed explanation of [threshold configuration](../scorecard-backend/docs/thresholds.md).

### Options Configuration

Options define configuration that affect fetch jira issues global configuration, but all options are optional. This settings are closely related with annotation settings and whole jira issues loading process.

```yaml
# app-config.yaml
scorecard:
  plugins:
    jira:
      open_issues:
        options:
          # Optional: use mandatoryFilter filter if need to replaces default which is "type = Bug AND resolution = Unresolved"
          mandatoryFilter: Type = Task AND Resolution = Resolved
          # Optional: use to specify global customFilter, however the annotation `jira/custom-filter` will replaces them
          customFilter: priority in ("Critical", "Blocker")
```

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers.

```yaml
scorecard:
  plugins:
    jira:
      open_issues:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157).

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
    # Optional: Custom filters for loading data request. This filter replaces customFilters form app-config.yaml
    jira/custom-filter: 'reporter = "psycon98@yahoo.com" AND resolution is not EMPTY'
spec:
  type: website
  lifecycle: experimental
  owner: guests
  system: examples
  providesApis: [example-grpc-api]
```

## Available Metrics

### Jira Issues (`jira.open_issues`)

This metric counts all jira issues that match the filter condition specified in annotation and app-config.yaml

- **Metric ID**: `jira.open_issues`
- **Type**: `Number`
- **Datasource**: `jira`
- **Default thresholds**:

```yaml
# app-config.yaml
scorecard:
  plugins:
    jira:
      open_issues:
        thresholds:
          rules:
            - key: success
              expression: '<=50'
            - key: warning
              expression: '>50'
            - key: error
              expression: '>100'
```
