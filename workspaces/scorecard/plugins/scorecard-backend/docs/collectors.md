# Collectors

Collectors are reusable data-fetching components used by metric providers.

Use collectors when:

- multiple metric providers share datasource logic (including auth/API client setup)
- you are building composite providers that combine data from one or more datasources
- you want to keep providers focused on metric calculation logic

## Core APIs

Collector APIs are provided by `@red-hat-developer-hub/backstage-plugin-scorecard-node`:

- `Collector`
- `CollectorContract`
- `scorecardCollectorsExtensionPoint`
- `ScorecardCollectorsService`
- `scorecardCollectorsServiceRef`

## Collector ID convention

Collector IDs follow the `datasource:name` format (e.g.,`github:deployments`, `github:workflowRuns`).
This distinguishes them visually from metric/provider IDs which use dot notation. Prefer to use `camelCase`
for collector names.

## Create a collector

Implement `Collector` with an input schema, output schema, and collect function:

```ts
import type { Entity } from '@backstage/catalog-model';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';

export class CustomDeploymentsCollector
  implements
    Collector<
      (typeof CustomDeploymentsCollector)['inputSchema'],
      (typeof CustomDeploymentsCollector)['outputSchema']
    >
{
  static readonly inputSchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  });

  static readonly outputSchema = z.object({
    deployments: z.array(
      z.object({
        id: z.number(),
        sha: z.string(),
        createdAt: z.string(),
      }),
    ),
  });

  getCollectorId(): string {
    return 'customDatasource:customDeployments';
  }

  getCollectorDescription(): string {
    return 'Collect deployments in a time window';
  }

  getInputSchema() {
    return CustomDeploymentsCollector.inputSchema;
  }

  getOutputSchema() {
    return CustomDeploymentsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<(typeof CustomDeploymentsCollector)['inputSchema']>;
  }): Promise<z.infer<(typeof CustomDeploymentsCollector)['outputSchema']>> {
    return {
      deployments: [],
    };
  }
}
```

## Register collectors in a backend module

Register collectors through `scorecardCollectorsExtensionPoint`:

```ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { scorecardCollectorsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { CustomDeploymentsCollector } from './collectors/CustomDeploymentsCollector';

export const scorecardModuleCustomDatasource = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'custom-datasource',
  register(reg) {
    reg.registerInit({
      deps: {
        collectors: scorecardCollectorsExtensionPoint,
      },
      async init({ collectors }) {
        collectors.addCollector(new CustomDeploymentsCollector());
      },
    });
  },
});
```

## Use collectors from a metric provider

To read collected values, add `scorecardCollectorsServiceRef` in as a dependency for your backend module, pass it to the provider, and call `collect(...)` inside `calculateMetric`:

```ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  scorecardCollectorsServiceRef,
  scorecardMetricsExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { MyMetricProvider } from './metricProviders/MyMetricProvider';

export const scorecardModuleOtherDatasource = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'other-datasource',
  register(reg) {
    reg.registerInit({
      deps: {
        collectorsService: scorecardCollectorsServiceRef,
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ collectorsService, metrics }) {
        metrics.addMetricProvider(new MyMetricProvider(collectorsService));
      },
    });
  },
});
```

Use `collectorsService.collect(...)` to fetch data from custom datasource. `Collect` validates both sides of the contract (metric provider and collector expected input and output):

```ts
import type { Entity } from '@backstage/catalog-model';
import {
  type ScorecardCollectorsService,
  type MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';

const inputSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

const outputSchema = z.object({
  deployments: z.array(z.object({ id: z.number(), sha: z.string() })),
});

export class MyMetricProvider implements MetricProvider<'number'> {
  constructor(private readonly collectorsService: ScorecardCollectorsService) {}

  // Other MetricProvider methods omitted

  async calculateMetric(entity: Entity): Promise<number> {
    const collected = await this.collectorsService.collect({
      collectorId: 'customDatasource:customDeployments',
      contract: {
        inputSchema,
        outputSchema,
      },
      entity,
      input: {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    });

    return collected.deployments.length;
  }
}
```
