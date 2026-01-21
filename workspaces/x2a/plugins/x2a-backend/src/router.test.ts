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
  mockErrorHandler,
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { X2ADatabaseService } from './services/X2ADatabaseService';
import { ProjectsPostRequest } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { migrate } from './services/dbMigrate';
import { Knex } from 'knex';

const databases = TestDatabases.create({
  ids: ['SQLITE_3', 'POSTGRES_15'],
});

const mockInputProject: ProjectsPostRequest = {
  name: 'Mock Project',
  description: 'Mock Description',
  abbreviation: 'MP',
};

describe('createRouter', () => {
  // let app: express.Express;

  async function createDatabase(databaseId: TestDatabaseId) {
    const client = await databases.init(databaseId);
    const mockDatabaseService = mockServices.database.mock({
      getClient: async () => client,
      migrations: { skip: false },
    });

    await migrate(mockDatabaseService);

    return {
      client,
      // db: new DatabaseMetricValues(client),
    };
  }

  async function createApp(client: Knex): Promise<express.Express> {
    const x2aDatabase = X2ADatabaseService.create({
      logger: mockServices.logger.mock(),
      dbClient: client,
    });
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      logger: mockServices.logger.mock(),
      x2aDatabase,
    });

    const app = express();
    app.use(router);
    app.use(mockErrorHandler());

    return app;
  }

  it.each(databases.eachSupportedId())(
    'should query empty project list - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const response = await request(app).get('/projects').send();

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(0);
      expect(response.body.items).toEqual([]);
    },
  );

  it.each(databases.eachSupportedId())(
    'should create a project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const response = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...mockInputProject,
        createdBy: 'user:default/mock',
      });
    },
  );

  it.each(databases.eachSupportedId())(
    'should not allow unauthenticated requests to create a migration - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      // The HttpAuth mock service considers all requests to be authenticated as a
      // mock user by default. In order to test other cases we need to explicitly
      // pass an authorization header with mock credentials.

      const response = await request(app)
        .post('/projects')
        .set('Authorization', mockCredentials.none.header())
        .send(mockInputProject);

      expect(response.status).toBe(401);
    },
  );
});
