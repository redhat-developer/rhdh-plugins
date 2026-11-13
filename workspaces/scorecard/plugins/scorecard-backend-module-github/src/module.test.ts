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
import { scorecardModuleGithub } from './module';
import request from 'supertest';
import type { Server } from 'http';

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

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
};

describe('scorecard-backend-module-github', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startTestBackend({
      features: [
        scorecardCollectorsServiceFactory,
        scorecardPlugin,
        scorecardModuleGithub,
        githubCollectorProbe,
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

  it('starts the backend with the github module without errors', async () => {
    const res = await request(server).get('/api/scorecard/metrics');
    expect(res.status).toBe(200);
  });

  it('registers the github.openPRs metric provider', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics?datasource=github',
    );

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(1);
    expect(res.body.metrics[0]).toEqual(
      expect.objectContaining({
        id: 'github.openPRs',
        title: 'GitHub open PRs',
        type: 'number',
      }),
    );
  });

  it('returns no collectors for github.openPRs', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/github.openPRs/collectors',
    );

    expect(res.status).toBe(200);
    expect(res.body.collectors).toEqual([]);
  });

  it('registers the three GitHub DORA collectors', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/test.githubCollectors/collectors',
    );

    expect(res.status).toBe(200);
    expect(res.body.collectors).toEqual([
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
