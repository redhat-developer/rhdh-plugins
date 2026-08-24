/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { scorecardPlugin } from './plugin';
import {
  MockNumberProvider,
  MockBooleanProvider,
} from '../__fixtures__/mockProviders';
import request from 'supertest';
import type { Server } from 'http';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import { knex as createKnex, type Knex } from 'knex';
import { toMetricValueRow } from './database/utils/mapMetricValueRow';

/**
 * Backend module that registers mock metric providers via the extension point,
 * mirroring how real modules (e.g. scorecard-backend-module-github) work.
 */
const testMetricsModule = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'test-metrics',
  register(reg) {
    reg.registerInit({
      deps: { metrics: scorecardMetricsExtensionPoint },
      async init({ metrics }) {
        metrics.addMetricProvider(
          new MockNumberProvider('github.openPRs', 'github', 'GitHub Open PRs'),
          new MockNumberProvider(
            'github.openIssues',
            'github',
            'GitHub Open Issues',
          ),
          new MockBooleanProvider('sonar.quality', 'sonar', 'Code Quality'),
        );
      },
    });
  },
});

const BASE_CONFIG = {
  backend: {
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
};

function startScorecardBackend(options?: {
  config?: object;
  entities?: Entity[];
  knex?: Knex;
}) {
  return startTestBackend({
    features: [
      scorecardPlugin,
      testMetricsModule,
      mockServices.rootConfig.factory({ data: options?.config ?? BASE_CONFIG }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      catalogServiceMock.factory({ entities: options?.entities ?? [] }),
      ...(options?.knex
        ? [mockServices.database.factory({ knex: options.knex })]
        : []),
    ],
  });
}

const TEST_ENTITIES: Entity[] = [
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: { name: 'test', namespace: 'default' },
    spec: { profile: {}, memberOf: [] },
    relations: [],
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      namespace: 'default',
      annotations: { 'mock/key': 'true' },
    },
    spec: { type: 'service', owner: 'user:default/test' },
    relations: [{ type: 'ownedBy', targetRef: 'user:default/test' }],
  },
  {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service2',
      namespace: 'default',
    },
    spec: { type: 'service', owner: 'user:default/test' },
    relations: [{ type: 'ownedBy', targetRef: 'user:default/test' }],
  },
];

describe('scorecard plugin (startTestBackend)', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startScorecardBackend({ entities: TEST_ENTITIES }));
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/scorecard/metrics', () => {
    it('returns all registered metrics', async () => {
      const res = await request(server).get('/api/scorecard/metrics');

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(3);

      const ids = res.body.metrics.map((m: { id: string }) => m.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          'github.openPRs',
          'github.openIssues',
          'sonar.quality',
        ]),
      );
    });

    it('filters metrics by metricIds', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics?metricIds=github.openPRs',
      );

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(1);
      expect(res.body.metrics[0].id).toBe('github.openPRs');
    });

    it('filters metrics by datasource', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics?datasource=github',
      );

      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(2);

      const ids = res.body.metrics.map((m: { id: string }) => m.id);
      expect(ids).toEqual(
        expect.arrayContaining(['github.openPRs', 'github.openIssues']),
      );
    });

    it('rejects request with both metricIds and datasource', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics?metricIds=sonar.quality&datasource=github',
      );

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe(
        'Cannot filter by both metricIds and datasource',
      );
    });
  });

  describe('GET /api/scorecard/aggregations/:aggregationId/metadata', () => {
    it('returns metadata for a registered metric', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/github.openPRs/metadata',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          title: 'GitHub Open PRs',
          type: 'number',
          aggregationType: 'statusGrouped',
        }),
      );
    });

    it('returns 404 for non-existent aggregation', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/non.existent/metadata',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/scorecard/metrics/catalog/:kind/:namespace/:name', () => {
    it('returns metrics for an existing entity', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics/catalog/component/default/my-service',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('filters entity metrics by metricIds', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics/catalog/component/default/my-service?metricIds=github.openPRs',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 404 when entity does not exist in the catalog', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics/catalog/component/default/non-existent',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/scorecard/metrics/catalog/:kind/:namespace/:name/time-series', () => {
    it('returns an empty time series for an existing entity with no stored samples', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics/catalog/component/default/my-service/time-series?metricId=github.openPRs&from=2024-01-01T00:00:00.000Z&to=2024-01-31T23:59:59.000Z',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          metricId: 'github.openPRs',
          entityRef: 'component:default/my-service',
          points: [],
          metadata: expect.objectContaining({
            title: 'GitHub Open PRs',
            type: 'number',
          }),
        }),
      );
    });

    it('returns 404 when entity does not exist in the catalog', async () => {
      const res = await request(server).get(
        '/api/scorecard/metrics/catalog/component/default/non-existent/time-series?metricId=github.openPRs&from=2024-01-01T00:00:00.000Z&to=2024-01-31T23:59:59.000Z',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/scorecard/aggregations/:aggregationId', () => {
    it('returns aggregated metrics for an authenticated user with owned entities', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/github.openPRs',
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          id: 'github.openPRs',
          status: 'success',
          metadata: expect.objectContaining({
            aggregationType: 'statusGrouped',
            title: 'GitHub Open PRs',
            type: 'number',
          }),
          result: expect.objectContaining({
            total: 0,
            entitiesConsidered: 0,
            calculationErrorCount: 0,
            values: [
              { count: 0, name: 'error' },
              { count: 0, name: 'warning' },
              { count: 0, name: 'success' },
            ],
          }),
        }),
      );
    });

    it('returns 401 when request has no user credentials', async () => {
      const res = await request(server)
        .get('/api/scorecard/aggregations/github.openPRs')
        .set('Authorization', mockCredentials.none.header());

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent aggregation', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/non.existent',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/scorecard/aggregations/:aggregationId/time-series', () => {
    it('returns 400 for statusGrouped default (metric id without KPI)', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/github.openPRs/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
      );

      expect(res.status).toBe(400);
      expect(res.body.error.name).toBe('InputError');
      expect(res.body.error.message).toMatch(/does not support time-series/);
    });

    it('returns 401 when request has no user credentials', async () => {
      const res = await request(server)
        .get(
          '/api/scorecard/aggregations/github.openPRs/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
        )
        .set('Authorization', mockCredentials.none.header());

      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent aggregation', async () => {
      const res = await request(server).get(
        '/api/scorecard/aggregations/non.existent/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
      );

      expect(res.status).toBe(404);
    });
  });
});

describe('scorecard plugin with aggregationKPIs config', () => {
  let server: Server;

  const KPI_CONFIG = {
    ...BASE_CONFIG,
    scorecard: {
      aggregationKPIs: {
        myCustomKpi: {
          title: 'Custom KPI',
          description: 'A custom KPI based on open PRs',
          type: 'weightedStatusScore',
          metricId: 'github.openPRs',
          options: {
            statusScores: {
              error: 0,
              warning: 50,
              success: 100,
            },
          },
        },
      },
    },
  };

  beforeAll(async () => {
    ({ server } = await startScorecardBackend({
      config: KPI_CONFIG,
      entities: TEST_ENTITIES,
    }));
  });

  afterAll(() => {
    server.close();
  });

  it('resolves KPI metadata from config', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/myCustomKpi/metadata',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        title: 'Custom KPI',
        description: 'A custom KPI based on open PRs',
        aggregationType: 'weightedStatusScore',
      }),
    );
  });

  it('still serves metric-based aggregation metadata', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/github.openPRs/metadata',
    );

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('GitHub Open PRs');
  });

  it('returns 400 for time-series of weightedStatusScore KPIs', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/myCustomKpi/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
    );

    expect(res.status).toBe(400);
    expect(res.body.error.name).toBe('InputError');
  });
});

describe('scorecard plugin with scalar aggregationKPI', () => {
  let server: Server;
  let knex: Knex;

  const KPI_CONFIG = {
    ...BASE_CONFIG,
    scorecard: {
      aggregationKPIs: {
        totalOpenPrs: {
          title: 'Total Open PRs',
          description: 'Sum of open PRs',
          type: 'sum',
          metricId: 'github.openPRs',
        },
      },
    },
  };

  beforeAll(async () => {
    knex = createKnex({
      client: 'better-sqlite3',
      connection: ':memory:',
      useNullAsDefault: true,
    });

    ({ server } = await startScorecardBackend({
      config: KPI_CONFIG,
      entities: TEST_ENTITIES,
      knex,
    }));

    await knex('metric_values').insert(
      [
        {
          catalogEntityRef: stringifyEntityRef(TEST_ENTITIES[1]),
          metricId: 'github.openPRs',
          value: 5,
          timestamp: new Date('2024-01-01T12:00:00.000Z'),
          status: 'success',
        },
        {
          catalogEntityRef: stringifyEntityRef(TEST_ENTITIES[1]),
          metricId: 'github.openPRs',
          value: 12,
          timestamp: new Date('2024-01-02T12:00:00.000Z'),
          status: 'success',
        },
        {
          catalogEntityRef: stringifyEntityRef(TEST_ENTITIES[2]),
          metricId: 'github.openPRs',
          value: 4,
          timestamp: new Date('2024-01-02T12:10:00.000Z'),
          status: 'success',
        },
      ].map(toMetricValueRow),
    );
  });

  afterAll(async () => {
    server.close();
    await knex.destroy();
  });

  it('returns empty scalar time-series when there is no metric data in range', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/totalOpenPrs/time-series?from=2023-01-01T00:00:00.000Z&to=2023-01-31T00:00:00.000Z',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'totalOpenPrs',
        metricId: 'github.openPRs',
        points: [],
        aggregationChartDisplayColor: null,
        metadata: expect.objectContaining({
          aggregationType: 'sum',
        }),
      }),
    );
    expect(res.body.thresholds.rules).toEqual(expect.any(Array));
  });

  it('returns scalar time-series points for owned entities', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/totalOpenPrs/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'totalOpenPrs',
        metricId: 'github.openPRs',
        metadata: expect.objectContaining({
          aggregationType: 'sum',
          title: 'Total Open PRs',
        }),
        points: [
          {
            value: 5,
            total: 1,
            timestamp: '2024-01-01T00:00:00.000Z',
          },
          {
            value: 16,
            total: 2,
            timestamp: '2024-01-02T00:00:00.000Z',
          },
        ],
        aggregationChartDisplayColor: 'warning.main',
      }),
    );
  });

  it('returns 401 when request has no user credentials', async () => {
    const res = await request(server)
      .get(
        '/api/scorecard/aggregations/totalOpenPrs/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
      )
      .set('Authorization', mockCredentials.none.header());

    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent aggregation', async () => {
    const res = await request(server).get(
      '/api/scorecard/aggregations/non.existent/time-series?from=2024-01-01T00:00:00.000Z&to=2024-01-31T00:00:00.000Z',
    );

    expect(res.status).toBe(404);
  });
});
