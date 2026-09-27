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
import scorecardPlugin from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import { scorecardModuleSonarqube } from './module';
import request from 'supertest';
import type { Server } from 'http';

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
};

describe('scorecard-backend-module-sonarqube', () => {
  let server: Server;

  beforeAll(async () => {
    ({ server } = await startTestBackend({
      features: [
        scorecardPlugin,
        scorecardModuleSonarqube,
        mockServices.rootConfig.factory({ data: BASE_CONFIG }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory(),
        catalogServiceMock.factory({ entities: [] }),
      ],
    }));
  });

  afterAll(() => {
    server.close();
  });

  it('starts the backend with the sonarqube module without errors', async () => {
    const res = await request(server).get('/api/scorecard/metrics');
    expect(res.status).toBe(200);
  });

  it('registers all 12 sonarqube metric providers', async () => {
    const res = await request(server).get(
      '/api/scorecard/metrics?datasource=sonarqube',
    );

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveLength(12);

    const ids = res.body.metrics.map((m: { id: string }) => m.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'sonarqube.qualityGate',
        'sonarqube.openIssues',
        'sonarqube.securityRating',
        'sonarqube.reliabilityRating',
        'sonarqube.maintainabilityRating',
        'sonarqube.codeCoverage',
      ]),
    );
  });
});
