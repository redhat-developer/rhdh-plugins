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
import { scorecardModuleGithub } from './module';

type ListeningServer = {
  port: () => number;
  close: () => void;
};

type JsonBody = {
  metrics?: { id: string; title?: string; type?: string }[];
  collectors?: { id: string; description?: string }[];
};

const githubCollectorProbe = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'github-collector-probe',
  register(reg) {
    reg.registerInit({
      deps: { metrics: scorecardMetricsExtensionPoint },
      async init({ metrics }) {
        metrics.addMetricProvider({
          getProviderDatasourceId: () => 'test',
          getProviderId: () => 'test.githubCollectors',
          getMetrics: () => [
            {
              id: 'test.githubCollectors',
              title: 'Probe',
              description: 'Reads GitHub collector registration.',
              type: 'number',
              thresholds: { rules: [] },
              collectorIds: [
                'github:doraDeployments',
                'github:doraDeploymentWorkflowRuns',
                'github:doraDeploymentPullRequests',
              ],
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

async function startGithubBackend() {
  const started = await startTestBackend({
    features: [
      scorecardCollectorsServiceFactory,
      scorecardPlugin,
      scorecardModuleGithub,
      githubCollectorProbe,
      mockServices.rootConfig.factory({
        data: {
          backend: {
            database: { client: 'better-sqlite3', connection: ':memory:' },
          },
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

describe('scorecard github module', () => {
  let server: ListeningServer;
  let stop: () => Promise<void>;

  beforeAll(async () => {
    ({ server, stop } = await startGithubBackend());
  }, 60_000);

  afterAll(async () => {
    server.close();
    await stop();
  });

  it('registers github.openPRs without a GitHub integration', async () => {
    const response = await getJson(server, '/api/scorecard/metrics');

    expect(response.status).toBe(200);
    expect(response.body.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'github.openPRs',
          title: 'GitHub open PRs',
          type: 'number',
        }),
      ]),
    );
  });

  it('returns no collectors for github.openPRs', async () => {
    const response = await getJson(
      server,
      '/api/scorecard/metrics/github.openPRs/collectors',
    );

    expect(response.status).toBe(200);
    expect(response.body.collectors).toEqual([]);
  });

  it('registers the three GitHub DORA collectors', async () => {
    const response = await getJson(
      server,
      '/api/scorecard/metrics/test.githubCollectors/collectors',
    );

    expect(response.status).toBe(200);
    expect(response.body.collectors).toEqual([
      {
        id: 'github:doraDeployments',
        description: 'Collects GitHub deployments.',
      },
      {
        id: 'github:doraDeploymentWorkflowRuns',
        description: 'Collects deployments from GitHub Actions.',
      },
      {
        id: 'github:doraDeploymentPullRequests',
        description: 'Collects pull requests linked to deployments.',
      },
    ]);
  });
});
