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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  scorecardCollectorsServiceFactory,
  scorecardPlugin,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import { scorecardModuleGitlab } from './module';
import request from 'supertest';
import type { Server } from 'http';

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
};

describe('scorecard-backend-module-gitlab', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startTestBackend({
      features: [
        scorecardCollectorsServiceFactory,
        scorecardPlugin,
        scorecardModuleGitlab,
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

  it('starts the backend with the gitlab module without errors', async () => {
    const res = await request(server).get('/api/scorecard/metrics');
    expect(res.status).toBe(200);
  });

  it('registers all 16 gitlab metrics', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics?datasource=gitlab',
    );

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(16);

    expect(res.body.metrics).toEqual(
      expect.arrayContaining(
        [
          'gitlab.openIssues',
          'gitlab.openedIssues7d',
          'gitlab.closedIssues7d',
          'gitlab.openMergeRequests',
          'gitlab.openedMergeRequests7d',
          'gitlab.closedMergeRequests7d',
          'gitlab.startedPipelines7d',
          'gitlab.successfulPipelines7d',
          'gitlab.failedPipelines7d',
          'gitlab.pipelineSuccessRatio7d',
          'gitlab.pipelineSuccessRatio24h',
          'gitlab.startedJobs7d',
          'gitlab.successfulJobs7d',
          'gitlab.failedJobs7d',
          'gitlab.jobSuccessRatio7d',
          'gitlab.jobSuccessRatio24h',
        ].map(id => expect.objectContaining({ id, type: 'number' })),
      ),
    );
  });
});
