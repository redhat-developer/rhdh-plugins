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

// The DORA test script sets --experimental-vm-modules. Importing the GitHub
// module then loads ESM-only Octokit and the suite fails before any test.
// These stand-ins let the real collectors register without executing that entry.
jest.mock('@octokit/graphql', () => ({
  graphql: jest.fn(),
}));
jest.mock('@octokit/rest', () => ({
  Octokit: class Octokit {},
}));

import {
  coreServices,
  createServiceFactory,
  type SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  scorecardCollectorsServiceFactory,
  scorecardPlugin,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import scorecardModuleGithub from '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github';
import { knex as createKnex, type Knex } from 'knex';
import request from 'supertest';
import type { Server } from 'http';
import { DORA_CLEANUP_EXPIRED_DATA_TASK_ID } from './constants';
import { scorecardModuleDora } from './module';

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
};

const DORA_METRIC_IDS = [
  'dora.deploymentFrequency',
  'dora.medianLeadTimeForChanges',
  'dora.medianTimeToRestore',
  'dora.changeFailureRate',
];

function createTestKnex(): Knex {
  return createKnex({
    client: 'better-sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
  });
}

async function startDoraBackend(options?: {
  dataRetentionDays?: number;
  knex?: Knex;
  scheduledTaskIds?: string[];
}) {
  const knex = options?.knex ?? createTestKnex();
  const scheduledTaskIds = options?.scheduledTaskIds ?? [];
  const scheduler = mockServices.scheduler.mock();
  scheduler.createScheduledTaskRunner.mockReturnValue({
    run: async ({ id }: { id: string }) => {
      scheduledTaskIds.push(id);
    },
  } as SchedulerServiceTaskRunner);

  const started = await startTestBackend({
    features: [
      scorecardCollectorsServiceFactory,
      scorecardPlugin,
      scorecardModuleGithub,
      scorecardModuleDora,
      mockServices.rootConfig.factory({
        data: {
          ...BASE_CONFIG,
          ...(options?.dataRetentionDays === undefined
            ? {}
            : {
                scorecard: {
                  plugins: {
                    dora: { dataRetentionDays: options.dataRetentionDays },
                  },
                },
              }),
        },
      }),
      mockServices.database.factory({ knex }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory(),
      catalogServiceMock.factory({ entities: [] }),
      createServiceFactory({
        service: coreServices.scheduler,
        deps: {},
        factory: async () => scheduler,
      }),
    ],
  });

  return {
    server: started.server,
    stop: () => started.stop(),
    knex,
    scheduledTaskIds,
  };
}

describe('scorecard-backend-module-dora', () => {
  let server: Server;
  let stop: () => Promise<void>;
  let knex: Knex;
  const scheduledTaskIds: string[] = [];

  beforeAll(async () => {
    knex = createTestKnex();
    ({ server, stop } = await startDoraBackend({ knex, scheduledTaskIds }));
  }, 60_000);

  afterAll(async () => {
    server?.close();
    await stop?.();
    await knex?.destroy();
  });

  it('starts the backend with the dora module without errors', async () => {
    const res = await request(server).get('/api/scorecard/metrics');
    expect(res.status).toBe(200);
  });

  it('registers all 4 DORA metric providers', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics?datasource=dora',
    );

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(4);

    const ids = res.body.metrics.map((metric: { id: string }) => metric.id);
    expect(ids).toEqual(expect.arrayContaining(DORA_METRIC_IDS));
  });

  it('registers GitHub open PRs alongside the DORA metrics', async () => {
    const res = await request(server).get('/api/scorecard/metrics');

    expect(res.status).toBe(200);
    const ids = res.body.metrics.map((metric: { id: string }) => metric.id);
    expect(ids).toEqual(
      expect.arrayContaining([...DORA_METRIC_IDS, 'github.openPRs']),
    );
  });

  it('migrates the DORA tables during init', async () => {
    await expect(knex.schema.hasTable('dora_deployments')).resolves.toBe(true);
    await expect(knex.schema.hasTable('dora_incidents')).resolves.toBe(true);
    await expect(knex.schema.hasTable('dora_pull_requests')).resolves.toBe(
      true,
    );
    await expect(knex.schema.hasTable('dora_last_sync')).resolves.toBe(true);
    await expect(knex.schema.hasTable('dora_knex_migrations')).resolves.toBe(
      true,
    );
  });

  it('schedules cleanup of expired DORA data', () => {
    expect(scheduledTaskIds).toContain(DORA_CLEANUP_EXPIRED_DATA_TASK_ID);
  });

  it('returns the deployments collector for deployment frequency', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/dora.deploymentFrequency/collectors',
    );

    expect(res.status).toBe(200);
    expect(
      res.body.collectors.map((collector: { id: string }) => collector.id),
    ).toEqual(['github:doraDeployments']);
  });

  it('returns deployment and pull request collectors for lead time', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics/dora.medianLeadTimeForChanges/collectors',
    );

    expect(res.status).toBe(200);
    expect(
      res.body.collectors.map((collector: { id: string }) => collector.id),
    ).toEqual(['github:doraDeployments', 'github:doraDeploymentPullRequests']);
  });

  it.each(['dora.medianTimeToRestore', 'dora.changeFailureRate'])(
    'fails %s collectors when the Jira incidents collector is absent',
    async metricId => {
      const res = await request(server).get(
        `/api/scorecard/metrics/${metricId}/collectors`,
      );

      expect(res.status).toBe(500);
      expect(res.body.error.message).toContain('jira:doraIncidents');
    },
  );

  it('rejects dataRetentionDays below 30 during init', async () => {
    const retentionKnex = createTestKnex();

    try {
      await expect(
        startDoraBackend({ dataRetentionDays: 1, knex: retentionKnex }),
      ).rejects.toThrow(
        'scorecard.plugins.dora.dataRetentionDays must be greater than or equal to 30',
      );
    } finally {
      await retentionKnex.destroy();
    }
  }, 60_000);
});
