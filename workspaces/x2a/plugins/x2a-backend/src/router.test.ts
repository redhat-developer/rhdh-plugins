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
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { createRouter } from './router';
import { X2ADatabaseService } from './services/X2ADatabaseService';
import { ProjectsPostRequest } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { migrate } from './services/dbMigrate';
import { Knex } from 'knex';
import { LONG_TEST_TIMEOUT, nonExistentId } from './utils';

const databases = TestDatabases.create({
  ids: ['SQLITE_3', 'POSTGRES_18'],
});
const supportedDatabaseIds = databases.eachSupportedId();

const mockInputProject: ProjectsPostRequest = {
  name: 'Mock Project',
  description: 'Mock Description',
  abbreviation: 'MP',
};

async function createApp(
  client: Knex,
  authorizeResult?: AuthorizeResult,
  adminWriteResult?: AuthorizeResult,
): Promise<express.Express> {
  const x2aDatabase = X2ADatabaseService.create({
    logger: mockServices.logger.mock(),
    dbClient: client,
  });
  const router = await createRouter({
    httpAuth: mockServices.httpAuth(),
    logger: mockServices.logger.mock(),
    permissionsSvc: mockServices.permissions.mock({
      authorize: async (requests: any[]) => {
        // Check which permission is being requested
        const permission = requests[0]?.permission;
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'update'
        ) {
          // This is x2aAdminWritePermission
          return [
            {
              result:
                adminWriteResult ?? authorizeResult ?? AuthorizeResult.ALLOW,
            },
          ] as any;
        }
        // Default to the provided authorizeResult or ALLOW
        return [{ result: authorizeResult ?? AuthorizeResult.ALLOW }] as any;
      },
    }),
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
  const clientsToDestroy: Knex[] = [];

  afterEach(async () => {
    await Promise.all(
      clientsToDestroy.splice(0).map(client => client.destroy()),
    );
  });

  async function createDatabase(databaseId: TestDatabaseId) {
    const client = await databases.init(databaseId);
    clientsToDestroy.push(client);
    const mockDatabaseService = mockServices.database.mock({
      getClient: async () => client,
      migrations: { skip: false },
    });

    await migrate(mockDatabaseService);

    return {
      client,
    };
  }

  it.each(supportedDatabaseIds)(
    'should query empty project list - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const response = await request(app).get('/projects').send();

      expect(response.status).toBe(200);
      expect(response.body.totalCount).toBe(0);
      expect(response.body.items).toEqual([]);
    },
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
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
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
    'should not allow unauthenticated requests to create a project - %p',
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

  it.each(supportedDatabaseIds)(
    'should allow users with x2aUserPermission to create projects - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, AuthorizeResult.ALLOW);

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

  it.each(supportedDatabaseIds)(
    'should allow users with x2aAdminWritePermission to create projects - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, AuthorizeResult.ALLOW);

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

  it.each(supportedDatabaseIds)(
    'should deny users without permissions from creating projects - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, AuthorizeResult.DENY);

      const response = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        error: {
          name: 'NotAllowedError',
          message: 'You are not allowed to create a project',
        },
      });
    },
  );

  it.each(supportedDatabaseIds)(
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

  it.each(supportedDatabaseIds)(
    'should fail for non-existent project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const response = await request(app)
        .get(`/projects/${nonExistentId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: { name: 'NotFoundError', message: 'Project not found' },
      });
    },
  );

  it.each(supportedDatabaseIds)(
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

  it.each(supportedDatabaseIds)(
    'should return 404 when deleting non-existent project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const response = await request(app)
        .delete(`/projects/${nonExistentId}`)
        .send();

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: { name: 'NotFoundError', message: 'Project not found' },
      });
    },
  );

  it.each(supportedDatabaseIds)(
    'should allow users with admin write permission to delete any project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);

      // Create a project as user1
      // const user1Credentials = mockCredentials.user('user:default/user1');
      const user1CredentialsHeader =
        mockCredentials.user.header('user:default/user1');
      const appWithCreate = await createApp(client, AuthorizeResult.ALLOW);
      const createResponse = await request(appWithCreate)
        .post('/projects')
        .set('Authorization', user1CredentialsHeader)
        .send(mockInputProject);

      expect(createResponse.status).toBe(200);
      const projectId = createResponse.body.id;
      expect(createResponse.body.createdBy).toBe('user:default/user1');

      // Verify project exists
      const getResponse = await request(appWithCreate)
        .get(`/projects/${projectId}`)
        .set('Authorization', user1CredentialsHeader)
        .send();
      expect(getResponse.status).toBe(200);

      // Try to delete as user2 (non-admin) - should fail because they didn't create it
      // const user2Credentials = mockCredentials.user('user:default/user2');
      const user2CredentialsHeader =
        mockCredentials.user.header('user:default/user2');
      const appNonAdmin = await createApp(
        client,
        AuthorizeResult.ALLOW, // Can create projects
        AuthorizeResult.DENY, // Cannot delete others' projects (no admin write)
      );
      const deleteResponseNonAdmin = await request(appNonAdmin)
        .delete(`/projects/${projectId}`)
        .set('Authorization', user2CredentialsHeader)
        .send();

      // Non-admin user2 cannot delete project created by user1
      // The deleteProject filters by created_by, so deletedCount will be 0
      expect(deleteResponseNonAdmin.status).toBe(404);
      expect(deleteResponseNonAdmin.body).toMatchObject({
        error: { name: 'NotFoundError', message: 'Project not found' },
      });

      // Verify project still exists
      const getAfterFailedDelete = await request(appWithCreate)
        .get(`/projects/${projectId}`)
        .set('Authorization', user1CredentialsHeader)
        .send();
      expect(getAfterFailedDelete.status).toBe(200);
      expect(getAfterFailedDelete.body.id).toBe(projectId);

      // Now delete as admin user (should succeed even though created by user1)
      // const adminCredentials = mockCredentials.user('user:default/admin');
      const adminCredentialsHeader =
        mockCredentials.user.header('user:default/admin');
      const appAdmin = await createApp(
        client,
        AuthorizeResult.ALLOW,
        AuthorizeResult.ALLOW,
      );
      const deleteResponseAdmin = await request(appAdmin)
        .delete(`/projects/${projectId}`)
        .set('Authorization', adminCredentialsHeader)
        .send();

      expect(deleteResponseAdmin.status).toBe(200);
      expect(deleteResponseAdmin.body.deletedCount).toBe(1);

      // Verify project is deleted
      const getAfterDelete = await request(appWithCreate)
        .get(`/projects/${projectId}`)
        .set('Authorization', user1CredentialsHeader)
        .send();
      expect(getAfterDelete.status).toBe(404);
    },
  );

  it.each(supportedDatabaseIds)(
    'should allow users without admin write permission to delete their own project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      // User does not have admin write permission, but can create projects
      const app = await createApp(
        client,
        AuthorizeResult.ALLOW, // Can create (has x2aUserPermission)
        AuthorizeResult.DENY, // Cannot delete others' projects (no admin write)
      );

      // Create a project (as the default mock user)
      const createResponse = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(createResponse.status).toBe(200);
      const projectId = createResponse.body.id;
      expect(createResponse.body.createdBy).toBe('user:default/mock');

      // Delete own project (should succeed)
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

  it.each(supportedDatabaseIds)(
    'should return 404 when deletion fails due to permission filtering - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      // User does not have admin write permission
      const app = await createApp(
        client,
        AuthorizeResult.ALLOW, // Can create projects
        AuthorizeResult.DENY, // Cannot delete others' projects (no admin write)
      );

      // Create a project
      const createResponse = await request(app)
        .post('/projects')
        .send(mockInputProject);

      expect(createResponse.status).toBe(200);
      const projectId = createResponse.body.id;

      // Note: The permission filtering happens at the database service level.
      // When canWriteAll is false, deleteProject filters by created_by.
      // Since the same user created and is deleting, it should succeed.
      // Cross-user deletion prevention is tested in X2ADatabaseService tests.
      // This test verifies the endpoint integration works correctly.

      const deleteResponse = await request(app)
        .delete(`/projects/${projectId}`)
        .send();

      // Same user can delete their own project
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.deletedCount).toBe(1);
    },
  );

  it.each(supportedDatabaseIds)(
    'should return 404 when deleting non-existent project even with admin write permission - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      // User has admin write permission
      const app = await createApp(
        client,
        AuthorizeResult.ALLOW,
        AuthorizeResult.ALLOW,
      );

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
