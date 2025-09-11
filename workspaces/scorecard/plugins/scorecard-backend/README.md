# Scorecard backend plugin

Provides customizable metrics and scoring capabilities from various data sources for software components in the Backstage catalog.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-scorecard-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);
```

## RBAC permissions

Scorecard plugin provides the following permissions:

| Name                  | Resource Type    | Policy | Description                               | Requirements        |
| --------------------- | ---------------- | ------ | ----------------------------------------- | ------------------- |
| scorecard.metric.read | scorecard-metric | read   | Allows the user to read scorecard metrics | catalog.entity.read |

### `scorecard.metric.read`

- **Description**: Allows the user to read scorecard metrics
- **Resource Type**: `scorecard-metric`
- **Action**: `read`

This permission controls access to viewing scorecard metrics for entities.

#### Condition `HAS_METRIC_ID`

- Optionally allow access to only specific metrics by their identifiers.

**Example RBAC policies file configuration:**

```csv rbac-policy.csv
g, user:default/<YOUR_USERNAME>, role:default/scorecard-viewer
p, role:default/scorecard-viewer, scorecard.metric.read, read, allow
```

**Example RBAC conditional policies file configuration:**

```YAML rbac-conditions.yaml
---
result: CONDITIONAL
roleEntityRef: "role:default/scorecard-viewer"
pluginId: scorecard
resourceType: scorecard-metric
permissionMapping:
  - read
conditions:
  rule: HAS_METRIC_ID
  resourceType: scorecard-metric
  params:
    metricIds: ['github.open-prs']
```

This policy would allow users to read only the GitHub Open PRs metric, while restricting access to other available metrics.

## Metric Providers

The Scorecard plugin collects metrics from third-party data sources using metric providers. The Scorecard node plugin provides `scorecardMetricsExtensionPoint` extension point that is used to connect your backend plugin module that exports custom metrics via metric providers to the Scorecard backend plugin. For detailed information on creating metric providers, see [providers.md](./docs/providers.md).

### Available Metric Providers

The following metric providers are available:

| Provider   | Metric ID          | Title            | Description                           | Type   |
| ---------- | ------------------ | ---------------- | ------------------------------------- | ------ |
| **GitHub** | `github.open-prs`  | GitHub open PRs  | Count of open Pull Requests in GitHub | number |
| **Jira**   | `jira.open-issues` | Jira open issues | The number of opened issues in Jira   | number |

To use these providers, install the corresponding backend modules:

- GitHub: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`](../scorecard-backend-module-github/README.md)
- Jira: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira`](../scorecard-backend-module-jira/README.md)

## Thresholds

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). The Scorecard plugin provides multiple ways to configure thresholds:

- **Provider Defaults**: Metric providers define default thresholds
- **App Configuration**: Override defaults through `app-config.yaml`
- **Entity Annotations**: Override specific thresholds per entity using catalog annotations

Thresholds are evaluated in order, and the first matching rule determines the category. The plugin supports various operators for number metrics (`>`, `>=`, `<`, `<=`, `==`, `!=`, `-` (range)) and boolean metrics (`==`, `!=`).

For comprehensive threshold configuration guide, examples, and best practices, see [thresholds.md](./docs/thresholds.md).

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
