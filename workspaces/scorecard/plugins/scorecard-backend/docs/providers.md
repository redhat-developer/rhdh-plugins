# Metric Providers

The Scorecard plugin collects metrics from third-party data sources using metric providers. The Scorecard node plugin provides `scorecardMetricsExtensionPoint` extension point that is used to connect your backend plugin module that exports custom metrics via metric providers to the Scorecard backend plugin. In this documentation, we will discuss how to create a simple metric provider backend module that will be used to collect and calculate metrics.

## Getting started

First step is to create a metric provider backend module using the following command:

```bash
yarn new
```

This will start an interactive setup to create a new plugin. The following are what will need to be selected to create the new plugin module:

```markdown:workspaces/scorecard/plugins/scorecard-backend/docs/providers.md
<code_block_to_apply_changes_from>
? What do you want to create? backend-module - A new backend module
? Enter the ID of the plugin [required] scorecard
? Enter the ID of the module [required] my-datasource
? Enter an owner to add to CODEOWNERS [optional]
```

This will then create a simple backend plugin module that is ready to be updated based on your needs.

## Creating the Metric Provider

Add the dependencies `@red-hat-developer-hub/backstage-plugin-scorecard-node` and `@red-hat-developer-hub/backstage-plugin-scorecard-common` to your newly created backend module using:

```bash
yarn --cwd plugins/scorecard-backend-module-my-datasource add @red-hat-developer-hub/backstage-plugin-scorecard-node @red-hat-developer-hub/backstage-plugin-scorecard-common
```

Create the metric provider in the newly created plugin module `/plugins/scorecard-backend-module-my-datasource/src/metricProviders/MyMetricProvider.ts` and populate it with the following:

```typescript
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class MyMetricProvider implements MetricProvider<'number'> {
  // The datasource identifier for this provider
  getProviderDatasourceId(): string {
    return 'my-datasource';
  }

  // The unique provider ID that combines datasource and metric name
  getProviderId(): string {
    return 'my-datasource.example-metric';
  }

  // Returns the metric definition
  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Example Metric',
      type: 'number',
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return {
      rules: [
        { key: 'error', expression: '>50' },
        { key: 'warning', expression: '10-50' },
        { key: 'success', expression: '<10' },
      ],
    };
  }

  // Determines whether this metric can be calculated for a specific entity (e.g., based on annotations)
  supportsEntity(_: Entity): boolean {
    return true;
  }

  // Calculates and returns the metric value
  async calculateMetric(): Promise<number> {
    // TODO: Implement your metric calculation logic here
    // This could involve API calls to your data source
    return 42;
  }
}
```

**Important:** Metric providers must follow certain conventions:

- The provider ID (from `getProviderId()`) and metric ID (from `getMetric().id`) must be identical
- Both IDs must follow the format `<datasourceId>.<metricName>` where:
  - `datasourceId` matches the value returned by `getProviderDatasourceId()`
  - `metricName` is a non-empty identifier for the specific metric
- Configuration for metric provider must follow the schema defined in [`config.d.ts`](../config.d.ts).

## Updating the Module

Update the module registration in `module.ts` to register your metric provider:

```typescript
import { createBackendModule } from '@backstage/backend-plugin-api';
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { MyMetricProvider } from './metricProviders/MyMetricProvider';

export const scorecardModuleMyDatasource = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'my-datasource',
  register(reg) {
    reg.registerInit({
      deps: {
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ metrics }) {
        metrics.addMetricProvider(new MyMetricProvider());
      },
    });
  },
});
```

Your backend module can register multiple metric providers.

## Testing your newly created backend module

Install the provider and add it to `packages/backend/src/index.ts`:

```bash
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-my-datasource
```

```typescript
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-my-datasource'
  ),
);
```

Your metric provider will now be automatically registered and available through the Scorecard API endpoints. To confirm, try running `metrics` endpoint which should return your defined metrics:

```bash
curl -X GET "{{url}}/api/scorecard/metrics?datasource=my-datasource" -H "Content-Type: application/json" -H "Authorization: Bearer $token"
```

## Example Metric Providers

The following are examples of existing metric providers that you can reference:

- **GitHub Datasource**: [GithubOpenPRsProvider](../../scorecard-backend-module-github/src/metricProviders/GithubOpenPRsProvider.ts)
- **Jira Datasource**: [JiraOpenIssuesProvider](../../scorecard-backend-module-jira/src/metricProviders/JiraOpenIssuesProvider.ts)
