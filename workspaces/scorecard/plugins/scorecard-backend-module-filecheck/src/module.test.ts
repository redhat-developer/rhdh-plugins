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
import { scorecardModuleFilecheck } from './module';
import request from 'supertest';
import type { Server } from 'http';

const BASE_CONFIG = {
  backend: {
    database: { client: 'better-sqlite3', connection: ':memory:' },
  },
};

describe('scorecard-backend-module-filecheck', () => {
  describe('without filecheck config', () => {
    let server: Server;

    beforeAll(async () => {
      ({ server } = await startTestBackend({
        features: [
          scorecardPlugin,
          scorecardModuleFilecheck,
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

    it('starts the backend without errors when no filecheck config is provided', async () => {
      const res = await request(server).get('/api/scorecard/metrics');
      expect(res.status).toBe(200);
      expect(res.body.metrics).toHaveLength(0);
    });
  });

  describe('with filecheck config', () => {
    let server: Server;

    const CONFIG_WITH_FILECHECK = {
      ...BASE_CONFIG,
      scorecard: {
        metricProviders: {
          filecheck: {
            fileExistence: {
              options: {
                files: {
                  license: 'LICENSE',
                  readme: 'README.md',
                },
              },
            },
          },
        },
      },
    };

    beforeAll(async () => {
      ({ server } = await startTestBackend({
        features: [
          scorecardPlugin,
          scorecardModuleFilecheck,
          mockServices.rootConfig.factory({ data: CONFIG_WITH_FILECHECK }),
          mockServices.auth.factory(),
          mockServices.httpAuth.factory(),
          catalogServiceMock.factory({ entities: [] }),
        ],
      }));
    });

    afterAll(() => {
      server.close();
    });

    it('registers the filecheck metric providers from config', async () => {
      const res = await request(server).get('/api/scorecard/metrics');

      expect(res.status).toBe(200);
      expect(res.body.metrics.length).toBeGreaterThanOrEqual(2);

      const ids = res.body.metrics.map((m: { id: string }) => m.id);
      expect(ids).toContain('filecheck.license');
      expect(ids).toContain('filecheck.readme');
    });
  });
});
