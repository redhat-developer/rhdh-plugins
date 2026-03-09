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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class MyMetricProvider implements MetricProvider<'number'> {
  // The datasource identifier for this provider
  getProviderDatasourceId(): string {
    return 'my_datasource';
  }

  // The unique provider ID that combines datasource and metric name
  getProviderId(): string {
    return 'my_datasource.example_metric';
  }

  // Returns the metric type
  getMetricType(): 'number' {
    return 'number';
  }

  // Returns the metric definition
  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Example Metric',
      type: this.getMetricType(),
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

  // Returns a catalog filter that specifies which entities this metric provider can process.
  // Use CATALOG_FILTER_EXISTS to check for the presence of specific annotations or fields.
  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.my_datasource/project': CATALOG_FILTER_EXISTS,
    };
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
- The metric type returned by `getMetricType()` must match the `type` property in the metric returned by `getMetric()`
- In `getMetric()`, always use `type: this.getMetricType()` instead of hardcoding the type value
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
curl -X GET "{{url}}/api/scorecard/metrics?datasource=my_datasource" -H "Content-Type: application/json" -H "Authorization: Bearer $token"
```

## Metric Collection Scheduling

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers. Each metric provider runs on its own schedule to collect and store metric values in the database.

You can customize the schedule for any metric provider by adding a `schedule` configuration in your `app-config.yaml`, under path `scorecard.plugins.{datasourceId}.{metricName}`:

```yaml
scorecard:
  plugins:
    my_datasource:
      example_metric:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157).

Make sure the configured schedule stays within provider API rate limits.

If no schedule is configured, metric providers use the following default schedule:

```yaml
schedule:
  frequency: { hours: 1 }
  timeout: { minutes: 15 }
  initialDelay: { minutes: 1 }
```

## Example Metric Providers

The following are examples of existing metric providers that you can reference:

- **GitHub Datasource**: [GithubOpenPRsProvider](../../scorecard-backend-module-github/src/metricProviders/GithubOpenPRsProvider.ts)
- **Jira Datasource**: [JiraOpenIssuesProvider](../../scorecard-backend-module-jira/src/metricProviders/JiraOpenIssuesProvider.ts)
- **OpenSSF Datasource**: [DefaultOpenSSFMetricProvider](../../scorecard-backend-module-openssf/src/metricProviders/DefaultOpenSSFMetricProvider.ts)
