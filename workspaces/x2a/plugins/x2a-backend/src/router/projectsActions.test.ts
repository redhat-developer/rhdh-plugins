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

import { mockCredentials } from '@backstage/backend-test-utils';
import request from 'supertest';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import {
  createApp,
  createDatabase,
  createDatabaseAndService,
  createTestProject,
  LONG_TEST_TIMEOUT,
  mockInputProject,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';

describe('createRouter – projects (actions)', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

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
      expect(response.body.error.name).toBe('NotFoundError');
      expect(response.body.error.message).toMatch(/Project not found/);
    },
  );

  it.each(supportedDatabaseIds)(
    'should allow users with admin write permission to delete any project - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);

      // Create a project as user1
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
      // useEnforceProjectPermissions throws when getProject returns null (no access)
      expect(deleteResponseNonAdmin.status).toBe(404);
      expect(deleteResponseNonAdmin.body.error.name).toBe('NotFoundError');
      expect(deleteResponseNonAdmin.body.error.message).toMatch(
        /Project not found/,
      );

      // Verify project still exists
      const getAfterFailedDelete = await request(appWithCreate)
        .get(`/projects/${projectId}`)
        .set('Authorization', user1CredentialsHeader)
        .send();
      expect(getAfterFailedDelete.status).toBe(200);
      expect(getAfterFailedDelete.body.id).toBe(projectId);

      // Now delete as admin user (should succeed even though created by user1)
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
      expect(response.body.error.name).toBe('NotFoundError');
      expect(response.body.error.message).toMatch(/Project not found/);
    },
  );

  describe('PATCH /projects/:projectId', () => {
    it.each(supportedDatabaseIds)(
      'should update project name - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({ name: 'Updated Name' });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body.name).toBe('Updated Name');
        expect(patchResponse.body.description).toBe(
          mockInputProject.description,
        );
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should update project description - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({ description: 'New description' });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body.description).toBe('New description');
        expect(patchResponse.body.name).toBe(mockInputProject.name);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should update project createdBy - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({ createdBy: 'group:default/team-b' });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body.createdBy).toBe('group:default/team-b');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should update multiple fields at once - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({
            name: 'New Name',
            description: 'New Desc',
            createdBy: 'user:default/other',
          });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body.name).toBe('New Name');
        expect(patchResponse.body.description).toBe('New Desc');
        expect(patchResponse.body.createdBy).toBe('user:default/other');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when updating non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .patch(`/projects/${nonExistentId}`)
          .send({ name: 'Does not matter' });

        expect(response.status).toBe(404);
        expect(response.body.error.name).toBe('NotFoundError');
        expect(response.body.error.message).toMatch(/Project not found/);
      },
    );

    it.each(supportedDatabaseIds)(
      'should allow admin to update another user project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const user1Header = mockCredentials.user.header('user:default/user1');
        const appCreate = await createApp(client, AuthorizeResult.ALLOW);
        const createResponse = await request(appCreate)
          .post('/projects')
          .set('Authorization', user1Header)
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const adminHeader = mockCredentials.user.header('user:default/admin');
        const appAdmin = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.ALLOW,
        );
        const patchResponse = await request(appAdmin)
          .patch(`/projects/${projectId}`)
          .set('Authorization', adminHeader)
          .send({ name: 'Admin Updated' });

        expect(patchResponse.status).toBe(200);
        expect(patchResponse.body.name).toBe('Admin Updated');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should deny non-admin from updating another user project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const user1Header = mockCredentials.user.header('user:default/user1');
        const appCreate = await createApp(client, AuthorizeResult.ALLOW);
        const createResponse = await request(appCreate)
          .post('/projects')
          .set('Authorization', user1Header)
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const user2Header = mockCredentials.user.header('user:default/user2');
        const appNonAdmin = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );
        const patchResponse = await request(appNonAdmin)
          .patch(`/projects/${projectId}`)
          .set('Authorization', user2Header)
          .send({ name: 'Should Fail' });

        expect(patchResponse.status).toBe(404);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when body is empty - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({});

        expect(patchResponse.status).toBe(400);
        expect(patchResponse.body.error.message).toMatch(
          /at least one field|must NOT have fewer than 1 properties/i,
        );
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when createdBy has invalid format - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const patchResponse = await request(app)
          .patch(`/projects/${projectId}`)
          .send({ createdBy: 'not-a-valid-ref' });

        expect(patchResponse.status).toBe(400);
      },
    );
  });

  describe('POST /projects/:projectId/run', () => {
    const runBody = {
      sourceRepoAuth: { token: 'source-token' },
      targetRepoAuth: { token: 'target-token' },
    };

    it.each(supportedDatabaseIds)(
      'should start init job when project exists and tokens provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const response = await request(app)
          .post(`/projects/${projectId}/run`)
          .send(runBody);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'pending',
          jobId: expect.any(String),
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post(`/projects/${nonExistentId}/run`)
          .send(runBody);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: expect.stringContaining('not found'),
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 409 when init job is already running - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const first = await request(app)
          .post(`/projects/${projectId}/run`)
          .send(runBody);
        expect(first.status).toBe(200);

        const second = await request(app)
          .post(`/projects/${projectId}/run`)
          .send(runBody);
        expect(second.status).toBe(409);
        expect(second.body).toMatchObject({
          error: 'JobAlreadyRunning',
          message: expect.stringContaining('init job is already running'),
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when source or target token is missing - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const noSource = await request(app)
          .post(`/projects/${projectId}/run`)
          .send({ targetRepoAuth: { token: 'target-token' } });
        expect(noSource.status).toBe(400);
        expect(noSource.body.error.message).toMatch(
          /sourceRepoAuth|Source repository token/i,
        );

        const noTarget = await request(app)
          .post(`/projects/${projectId}/run`)
          .send({ sourceRepoAuth: { token: 'source-token' } });
        expect(noTarget.status).toBe(400);
        expect(noTarget.body.error.message).toMatch(
          /targetRepoAuth|Target repository token/i,
        );
      },
    );

    it.each(supportedDatabaseIds)(
      'should forward projectDirName from DB to kubeService.createJob - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const project = await createTestProject(x2aDatabase);

        const mockCreateJob = jest
          .fn()
          .mockResolvedValue({ k8sJobName: 'k8s-job' });
        const appWithMock = await createApp(client, undefined, undefined, {
          createJob: mockCreateJob,
        });

        const response = await request(appWithMock)
          .post(`/projects/${project.id}/run`)
          .send(runBody);

        expect(response.status).toBe(200);
        expect(mockCreateJob).toHaveBeenCalledTimes(1);
        expect(mockCreateJob).toHaveBeenCalledWith(
          expect.objectContaining({
            projectDirName: project.dirName,
          }),
        );
      },
      LONG_TEST_TIMEOUT,
    );
  });
});
