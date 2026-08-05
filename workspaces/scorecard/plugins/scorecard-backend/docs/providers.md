# Metric Providers

The Scorecard plugin collects metrics from third-party data sources using metric providers. The Scorecard node plugin provides `scorecardMetricsExtensionPoint` extension point that is used to connect your backend plugin module that exports custom metrics via metric providers to the Scorecard backend plugin. In this documentation, we will discuss how to create a simple metric provider backend module that will be used to collect and calculate metrics.

For provider data-fetching reuse across datasources, Scorecard provides collector contracts:

- `scorecardCollectorsExtensionPoint` extension point to register collectors
- `scorecardCollectorsServiceRef` service to call `collect(...)` and read collector output with dual validation:
  - provider expected input/output schemas
  - collector declared input/output schemas

For details and examples, see [collectors.md](./collectors.md).

## Getting started

First step is to create a metric provider backend module using the following command:

```bash
yarn new
```

This will start an interactive setup to create a new plugin. The following are what will need to be selected to create the new plugin module:

```
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
import type { Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class MyMetricProvider implements MetricProvider<'number'> {
  getProviderDatasourceId(): string {
    return 'myDatasource';
  }

  // Unique provider ID: <datasource>.<providerName>
  getProviderId(): string {
    return 'myDatasource.exampleMetric';
  }

  // One or more metrics this provider exposes
  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: 'myDatasource.exampleMetric',
        title: 'Example Metric',
        description: 'Example metric description.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
    ];
  }

  // Entities this provider can process
  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.myDatasource/project': CATALOG_FILTER_EXISTS,
    };
  }

  // Map of metric ID -> value. Keys must match getMetrics()[].id
  async calculateMetrics(_entity: Entity): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    // TODO: Implement your metric calculation logic here
    results.set('myDatasource.exampleMetric', 42);
    return results;
  }
}
```

**Important:** Metric providers must follow certain conventions:

- Provider ID format: `<datasourceId>.<providerName>` (from `getProviderId()`). `datasourceId` must match `getProviderDatasourceId()`
- Metric ID format: `<datasourceId>.<metricName>` (from each entry in `getMetrics()`)
- Use `lowerCamelCase` for datasource, provider, and metric names (e.g. `jira.openIssues`, `openssf.ciiBestPractices`)
- For single-metric providers, provider ID and metric ID are often the same; batch providers (e.g. filecheck) use one provider ID and multiple metric IDs
- `calculateMetrics()` must return an entry for every metric ID from `getMetrics()`, keyed by **metric ID**
- Each metric carries its own `type` and `thresholds`
- Configuration for metric providers follows the schema in [`config.d.ts`](../config.d.ts) under `scorecard.metricProviders.<datasource>.<providerName>` (e.g., for schedule and threshold configurations)

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
curl -X GET "{{url}}/api/scorecard/metrics?datasource=myDatasource" -H "Content-Type: application/json" -H "Authorization: Bearer $token"
```

## Metric Collection Scheduling

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers. Each metric provider runs on its own schedule to collect and store metric values in the database.

You can customize the schedule for any metric provider by adding a `schedule` configuration in your `app-config.yaml`, under path `scorecard.metricProviders.<datasource>.<providerName>`:

```yaml
scorecard:
  metricProviders:
    myDatasource:
      exampleProvider:
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
- **OpenSSF Datasource**: [OpenSSFMetricProvider](../../scorecard-backend-module-openssf/src/metricProviders/OpenSSFMetricProvider.ts)
- **Filecheck Datasource** (batch / multi-metric): [FilecheckMetricProvider](../../scorecard-backend-module-filecheck/src/metricProviders/FilecheckMetricProvider.ts)
