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
  // TODO: Reenable for 'POSTGRES_18'
  ids: ['SQLITE_3'],
});

const mockInputProject: ProjectsPostRequest = {
  name: 'Mock Project',
  description: 'Mock Description',
  abbreviation: 'MP',
};

async function createApp(client: Knex): Promise<express.Express> {
  const x2aDatabase = X2ADatabaseService.create({
    logger: mockServices.logger.mock(),
    dbClient: client,
  });
  const router = await createRouter({
    httpAuth: mockServices.httpAuth(),
    logger: mockServices.logger.mock(),
    x2aDatabase,
    kubeService: {
      getPods: jest.fn().mockResolvedValue({ items: [] }),
    },
  });

  const app = express();
  app.use(router);
  app.use(mockErrorHandler());

  return app;
}

describe('createRouter', () => {
  async function createDatabase(databaseId: TestDatabaseId) {
    const client = await databases.init(databaseId);
    const mockDatabaseService = mockServices.database.mock({
      getClient: async () => client,
      migrations: { skip: false },
    });

    await migrate(mockDatabaseService);

    return {
      client,
    };
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

  it.each(databases.eachSupportedId())(
    'should get a project by id - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      // First create a project
      const createResponse = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(createResponse.status).toBe(200);
      const projectId = createResponse.body.id;

      // Then get the project by id
      const response = await request(app).get(`/projects/${projectId}`).send();

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ...mockInputProject,
        id: projectId,
        createdBy: 'user:default/mock',
      });
      expect(response.body.createdAt).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should fail for non-existent project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/projects/${nonExistentId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: { name: 'NotFoundError', message: 'Project not found' },
      });
    },
  );

  it.each(databases.eachSupportedId())(
    'should delete a project by id - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      // First create a project
      const createResponse = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(createResponse.status).toBe(200);
      const projectId = createResponse.body.id;

      // Verify project exists
      const getResponse = await request(app)
        .get(`/projects/${projectId}`)
        .send();
      expect(getResponse.status).toBe(200);

      // Delete the project
      const deleteResponse = await request(app)
        .delete(`/projects/${projectId}`)
        .send();

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.deletedCount).toBe(1);

      // Verify project is deleted
      const getAfterDeleteResponse = await request(app)
        .get(`/projects/${projectId}`)
        .send();
      expect(getAfterDeleteResponse.status).toBe(404);
    },
  );

  it.each(databases.eachSupportedId())(
    'should return 404 when deleting non-existent project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/projects/${nonExistentId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: { name: 'NotFoundError', message: 'Project not found' },
      });
    },
  );
});
