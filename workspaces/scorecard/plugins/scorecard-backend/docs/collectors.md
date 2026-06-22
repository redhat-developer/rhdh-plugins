# Collectors

Collectors are reusable data-fetching components used by metric providers.

Use collectors when:

- multiple metric providers share datasource logic (including auth/API client setup)
- you are building composite providers that combine data from one or more datasources
- you want to keep providers focused on metric calculation logic

## Core APIs

Collector APIs are provided by `@red-hat-developer-hub/backstage-plugin-scorecard-node`:

- `Collector`
- `CollectorRegistry`
- `CollectorContract`
- `collectWithContract`
- `scorecardCollectorsExtensionPoint`

## Collector ID convention

Use `source:name` for collector IDs (for example `github:deployments`, `github:commit-pulls`).

This keeps collector IDs visually distinct from metric/provider IDs that use dot notation.

## Create a collector

Implement `Collector` with an input schema, output schema, and collect function:

```ts
import type { Entity } from '@backstage/catalog-model';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';

export class MyDeploymentsCollector
  implements
    Collector<
      (typeof MyDeploymentsCollector)['inputSchema'],
      (typeof MyDeploymentsCollector)['outputSchema']
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
    return 'my-source:deployments';
  }

  getCollectorDescription(): string {
    return 'Collect deployments in a time window';
  }

  getInputSchema() {
    return MyDeploymentsCollector.inputSchema;
  }

  getOutputSchema() {
    return MyDeploymentsCollector.outputSchema;
  }

  async collect(options: {
    entity: Entity;
    input: z.infer<(typeof MyDeploymentsCollector)['inputSchema']>;
  }): Promise<z.infer<(typeof MyDeploymentsCollector)['outputSchema']>> {
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
import { MyDeploymentsCollector } from './collectors/MyDeploymentsCollector';

export const scorecardModuleMySource = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'my-source',
  register(reg) {
    reg.registerInit({
      deps: {
        collectors: scorecardCollectorsExtensionPoint,
      },
      async init({ collectors }) {
        collectors.addCollector(new MyDeploymentsCollector());
      },
    });
  },
});
```

## Use collectors from a metric provider

Use `collectWithContract` to validate both sides of the contract (provider and collector expected input and output):

```ts
import type { Entity } from '@backstage/catalog-model';
import {
  collectWithContract,
  type CollectorRegistry,
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
  constructor(private readonly collectorRegistry: CollectorRegistry) {}

  // Other MetricProvider methods omitted

  async calculateMetric(entity: Entity): Promise<number> {
    const collected = await collectWithContract({
      collectorRegistry: this.collectorRegistry,
      collectorId: 'my-source:deployments',
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
