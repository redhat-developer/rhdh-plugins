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
  mockServices,
  startTestBackend,
  TestDatabases,
} from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import request from 'supertest';

import { bulkImportPlugin } from './plugin';

const databases = TestDatabases.create({
  ids: ['SQLITE_3'],
});

describe('bulkImportPlugin integration', () => {
  it('registers the router, allows unauthenticated /ping, and runs DB migrations', async () => {
    const knex = await databases.init('SQLITE_3');

    const { server } = await startTestBackend({
      features: [
        bulkImportPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({
          data: {
            app: {
              baseUrl: 'https://my-backstage-app.example.com',
            },
            integrations: {
              github: [
                {
                  host: 'github.com',
                  apiBaseUrl: 'https://api.github.com',
                  token: 'test-token', // notsecret
                },
              ],
            },
          },
        }),
        mockServices.cache.factory(),
        catalogServiceMock.factory({ entities: [] }),
        mockServices.database.factory({
          knex,
          migrations: { skip: false },
        }),
        mockServices.permissions.mock({
          authorize: async () => [{ result: AuthorizeResult.ALLOW }],
        }).factory,
      ],
    });

    const ping = await request(server).get('/api/bulk-import/ping');
    expect(ping.status).toBe(200);
    expect(ping.body).toEqual({ status: 'ok' });

    // Outcome of createRouter → migrate() on plugin init (not a migrate spy).
    expect(await knex.schema.hasTable('repositories')).toBe(true);
    expect(await knex.schema.hasTable('scaffolder_tasks')).toBe(true);
    expect(await knex.schema.hasTable('task_locations')).toBe(true);
    expect(await knex.schema.hasTable('orchestrator_repositories')).toBe(true);
    expect(await knex.schema.hasTable('orchestrator_workflows')).toBe(true);
  });
});
