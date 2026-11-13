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

import { createBackendModule } from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  scorecardCollectorsServiceFactory,
  scorecardPlugin,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { scorecardModuleJira } from './module';
import request from 'supertest';
import type { Server } from 'http';

const jiraCollectorProbe = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'jira-collector-probe',
  register(reg) {
    reg.registerInit({
      deps: { metrics: scorecardMetricsExtensionPoint },
      async init({ metrics }) {
        metrics.addMetricProvider({
          getProviderDatasourceId: () => 'test',
          getProviderId: () => 'test.jiraCollectors',
          getMetrics: () => [
            {
              id: 'test.jiraCollectors',
              title: 'Probe',
              description: 'Reads Jira collector registration.',
              type: 'number',
              thresholds: { rules: [] },
              collectorIds: ['jira:doraIncidents'],
            },
          ],
          getCatalogFilter: () => ({}),
          calculateMetrics: async () => new Map(),
        });
      },
    });
  },
});

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
  jira: {
    baseUrl: 'https://jira.example.com',
    token: 'dummy-token',
    product: 'cloud',
  },
};

describe('scorecard-backend-module-jira', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startTestBackend({
      features: [
        scorecardCollectorsServiceFactory,
        scorecardPlugin,
        scorecardModuleJira,
        jiraCollectorProbe,
        mockServices.rootConfig.factory({ data: BASE_CONFIG }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory(),
        catalogServiceMock.factory({ entities: [] }),
      ],
    }));
  });

  afterAll(() => {
    server?.close();
  });

  it('starts the backend with the jira module without errors', async () => {
    const res = await request(server).get('/api/scorecard/metrics');
    expect(res.status).toBe(200);
  });

  it('registers the jira.openIssues metric provider', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics?datasource=jira',
    );

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(1);
    expect(res.body.metrics[0]).toEqual(
      expect.objectContaining({
        id: 'jira.openIssues',
        title: 'Jira open blocking tickets',
        type: 'number',
      }),
    );
  });

  it('returns no collectors for jira.openIssues', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/jira.openIssues/collectors',
    );

    expect(res.status).toBe(200);
    expect(res.body.collectors).toEqual([]);
  });

  it('registers the Jira incidents collector', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/test.jiraCollectors/collectors',
    );

    expect(res.status).toBe(200);
    expect(res.body.collectors).toEqual([
      {
        id: 'jira:doraIncidents',
        description: 'Collects Jira incidents.',
      },
    ]);
  });

  it('rejects init when the jira config key is missing', async () => {
    const configWithoutJira = {
      backend: {
        database: { client: 'better-sqlite3', connection: ':memory:' },
      },
    };

    await expect(
      startTestBackend({
        features: [
          scorecardCollectorsServiceFactory,
          scorecardPlugin,
          scorecardModuleJira,
          mockServices.rootConfig.factory({ data: configWithoutJira }),
          mockServices.auth.factory(),
          mockServices.httpAuth.factory(),
          catalogServiceMock.factory({ entities: [] }),
        ],
      }),
    ).rejects.toThrow("Missing required config value at 'jira'");
  }, 60_000);
});
