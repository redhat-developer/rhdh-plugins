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
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  scorecardCollectorsServiceFactory,
  scorecardPlugin,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { scorecardModuleJira } from './module';

type ListeningServer = {
  port: () => number;
  close: () => void;
};

type JsonBody = {
  metrics?: { id: string; title?: string; type?: string }[];
  collectors?: { id: string; description?: string }[];
  error?: { message?: string };
};

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

async function getJson(
  server: ListeningServer,
  path: string,
): Promise<{ status: number; body: JsonBody }> {
  const response = await fetch(`http://127.0.0.1:${server.port()}${path}`);
  return { status: response.status, body: (await response.json()) as JsonBody };
}

async function startJiraBackend(options?: { jira?: false }) {
  const started = await startTestBackend({
    features: [
      scorecardCollectorsServiceFactory,
      scorecardPlugin,
      scorecardModuleJira,
      jiraCollectorProbe,
      mockServices.rootConfig.factory({
        data: {
          backend: {
            database: { client: 'better-sqlite3', connection: ':memory:' },
          },
          ...(options?.jira === false
            ? {}
            : {
                jira: {
                  baseUrl: 'http://jira.example.com',
                  token: 'test-token',
                  product: 'cloud',
                },
              }),
        },
      }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      catalogServiceMock.factory({ entities: [] }),
    ],
  });

  return {
    server: started.server,
    stop: () => started.stop(),
  };
}

describe('scorecard jira module', () => {
  let server: ListeningServer;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    ({ server, stop } = await startJiraBackend());
  }, 60_000);

  afterAll(async () => {
    server.close();
    await stop();
  });

  it('registers jira.openIssues with placeholder cloud config', async () => {
    const response = await getJson(server, '/api/scorecard/metrics');

    expect(response.status).toBe(200);
    expect(response.body.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'jira.openIssues',
          title: 'Jira open blocking tickets',
          type: 'number',
        }),
      ]),
    );
  });

  it('returns no collectors for jira.openIssues', async () => {
    const response = await getJson(
      server,
      '/api/scorecard/metrics/jira.openIssues/collectors',
    );

    expect(response.status).toBe(200);
    expect(response.body.collectors).toEqual([]);
  });

  it('registers the Jira incidents collector', async () => {
    const response = await getJson(
      server,
      '/api/scorecard/metrics/test.jiraCollectors/collectors',
    );

    expect(response.status).toBe(200);
    expect(response.body.collectors).toEqual([
      {
        id: 'jira:doraIncidents',
        description: 'Collects Jira incidents.',
      },
    ]);
  });

  it('rejects init when the jira config key is missing', async () => {
    await expect(startJiraBackend({ jira: false })).rejects.toThrow(
      "Missing required config value at 'jira'",
    );
  }, 60_000);
});
