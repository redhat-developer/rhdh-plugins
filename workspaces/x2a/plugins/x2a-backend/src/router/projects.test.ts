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

import { RELATION_MEMBER_OF } from '@backstage/catalog-model';
import { mockCredentials } from '@backstage/backend-test-utils';
import request from 'supertest';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import {
  createApp,
  createDatabase,
  createService,
  createTestJob,
  LONG_TEST_TIMEOUT,
  mockInputProject,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';

describe('createRouter – projects', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('projects endpoints', () => {
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
          ownedBy: 'user:default/mock',
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should create a project with ownedByGroup and set ownedBy to the group when user is member - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const catalogGetEntityByRef = jest.fn().mockResolvedValue({
          kind: 'User',
          metadata: { name: 'mock' },
          relations: [
            {
              type: RELATION_MEMBER_OF,
              targetRef: 'group:default/team-a',
            },
          ],
        });
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        const response = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Group-owned Project',
            abbreviation: 'GOP',
            ownedByGroup: 'group:default/team-a',
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          name: 'Group-owned Project',
          abbreviation: 'GOP',
          ownedBy: 'group:default/team-a',
        });

        const row = await client('projects')
          .where('id', response.body.id)
          .first();
        expect(row.owned_by).toBe('group:default/team-a');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should deny creating project for ownedByGroup when user is not a member - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        // Catalog returns user with no groups (or different groups)
        const catalogGetEntityByRef = jest.fn().mockResolvedValue({
          kind: 'User',
          metadata: { name: 'mock' },
          relations: [
            {
              type: RELATION_MEMBER_OF,
              targetRef: 'group:default/other-team',
            },
          ],
        });
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        const response = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Group-owned Project',
            abbreviation: 'GOP',
            ownedByGroup: 'group:default/team-a',
          });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message:
              'You are not allowed to create a project for the given group',
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should deny creating project for ownedByGroup when user has no catalog relations - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        // Catalog returns user with no groups (null or empty relations)
        const catalogGetEntityByRef = jest.fn().mockResolvedValue(null);
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        const response = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Group-owned Project',
            abbreviation: 'GOP',
            ownedByGroup: 'group:default/team-a',
          });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message:
              'You are not allowed to create a project for the given group',
          },
        });
      },
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
          ownedBy: 'user:default/mock',
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
          ownedBy: 'user:default/mock',
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
        const response = await request(app)
          .get(`/projects/${projectId}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          ...mockInputProject,
          id: projectId,
          ownedBy: 'user:default/mock',
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
          error: {
            name: 'NotFoundError',
            message: 'Project not found for the "user:default/mock" user.',
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should return projects owned by user or their groups when catalog returns user with memberOf - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const catalogGetEntityByRef = jest.fn().mockResolvedValue({
          kind: 'User',
          metadata: { name: 'mock' },
          relations: [
            {
              type: RELATION_MEMBER_OF,
              targetRef: 'group:default/team-a',
            },
          ],
        });
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        // Project created by user (via API)
        const createRes = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createRes.status).toBe(200);

        // Project "owned" by group (insert directly)
        const groupProjectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
        await client('projects').insert({
          id: groupProjectId,
          name: 'Group Project',
          abbreviation: 'GP',
          description: 'From group',
          source_repo_url: mockInputProject.sourceRepoUrl,
          target_repo_url: mockInputProject.targetRepoUrl,
          source_repo_branch: mockInputProject.sourceRepoBranch,
          target_repo_branch: mockInputProject.targetRepoBranch,
          owned_by: 'group:default/team-a',
          created_at: new Date(),
          dir_name: 'group-project-aaaaaaaa',
        });
        const response = await request(app).get('/projects').send();

        expect(response.status).toBe(200);
        expect(response.body.totalCount).toBe(2);
        expect(response.body.items).toHaveLength(2);

        const names = response.body.items.map((p: { name: string }) => p.name);
        expect(names).toContain(mockInputProject.name);
        expect(names).toContain('Group Project');

        const groupProject = response.body.items.find(
          (p: { ownedBy: string }) => p.ownedBy === 'group:default/team-a',
        );
        expect(groupProject).toBeDefined();
        expect(groupProject.name).toBe('Group Project');

        expect(catalogGetEntityByRef).toHaveBeenCalledWith(
          'user:default/mock',
          expect.objectContaining({ credentials: expect.anything() }),
        );
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return group-owned project by id when catalog returns user with memberOf - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const catalogGetEntityByRef = jest.fn().mockResolvedValue({
          kind: 'User',
          metadata: { name: 'mock' },
          relations: [
            {
              type: RELATION_MEMBER_OF,
              targetRef: 'group:default/team-a',
            },
          ],
        });
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        const groupProjectId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
        await client('projects').insert({
          id: groupProjectId,
          name: 'Group Owned Project',
          abbreviation: 'GOP',
          description: 'Group owned',
          source_repo_url: mockInputProject.sourceRepoUrl,
          target_repo_url: mockInputProject.targetRepoUrl,
          source_repo_branch: mockInputProject.sourceRepoBranch,
          target_repo_branch: mockInputProject.targetRepoBranch,
          owned_by: 'group:default/team-a',
          created_at: new Date(),
          dir_name: 'group-owned-project-bbbbbbbb',
        });

        const response = await request(app)
          .get(`/projects/${groupProjectId}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: groupProjectId,
          name: 'Group Owned Project',
          abbreviation: 'GOP',
          ownedBy: 'group:default/team-a',
        });
        expect(catalogGetEntityByRef).toHaveBeenCalledWith(
          'user:default/mock',
          expect.objectContaining({ credentials: expect.anything() }),
        );
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should allow user to delete group-owned project when catalog returns user with memberOf - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);

        const catalogGetEntityByRef = jest.fn().mockResolvedValue({
          kind: 'User',
          metadata: { name: 'mock' },
          relations: [
            {
              type: RELATION_MEMBER_OF,
              targetRef: 'group:default/team-a',
            },
          ],
        });
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          { getEntityByRef: catalogGetEntityByRef },
        );

        const groupProjectId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
        await client('projects').insert({
          id: groupProjectId,
          name: 'Group Project To Delete',
          abbreviation: 'GPTD',
          description: 'Will be deleted by group member',
          source_repo_url: mockInputProject.sourceRepoUrl,
          target_repo_url: mockInputProject.targetRepoUrl,
          source_repo_branch: mockInputProject.sourceRepoBranch,
          target_repo_branch: mockInputProject.targetRepoBranch,
          owned_by: 'group:default/team-a',
          created_at: new Date(),
          dir_name: 'group-project-to-delete-cccccccc',
        });

        const deleteResponse = await request(app)
          .delete(`/projects/${groupProjectId}`)
          .send();

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.deletedCount).toBe(1);

        const getAfterDelete = await request(app)
          .get(`/projects/${groupProjectId}`)
          .send();
        expect(getAfterDelete.status).toBe(404);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should sort projects by status with correct pagination - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);
        const x2aDatabase = createService(client);

        // Create 3 projects that will get different calculated statuses
        const projectA = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Project Alpha',
            abbreviation: 'PA',
          });
        expect(projectA.status).toBe(200);

        const projectB = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Project Beta',
            abbreviation: 'PB',
          });
        expect(projectB.status).toBe(200);

        const projectC = await request(app)
          .post('/projects')
          .send({
            ...mockInputProject,
            name: 'Project Charlie',
            abbreviation: 'PC',
          });
        expect(projectC.status).toBe(200);

        // Project Alpha: no init job → status.state = 'created'
        // Project Beta: init job success → status.state = 'initialized'
        // Project Charlie: init job error → status.state = 'failed'
        await createTestJob(x2aDatabase, {
          projectId: projectB.body.id,
          moduleId: null,
          phase: 'init',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: projectC.body.id,
          moduleId: null,
          phase: 'init',
          status: 'error',
        });

        // Semantic ascending: created(0) < initialized(2) < failed(4)
        const responseAsc = await request(app)
          .get('/projects?sort=status&order=asc')
          .send();

        expect(responseAsc.status).toBe(200);
        expect(responseAsc.body.totalCount).toBe(3);
        const statesAsc = responseAsc.body.items.map(
          (p: { status?: { state: string } }) => p.status?.state,
        );
        expect(statesAsc).toEqual(['created', 'initialized', 'failed']);

        // Semantic descending: failed(4) > initialized(2) > created(0)
        const responseDesc = await request(app)
          .get('/projects?sort=status&order=desc')
          .send();

        expect(responseDesc.status).toBe(200);
        const statesDesc = responseDesc.body.items.map(
          (p: { status?: { state: string } }) => p.status?.state,
        );
        expect(statesDesc).toEqual(['failed', 'initialized', 'created']);

        // Pagination: page 0 with pageSize 2
        const page0 = await request(app)
          .get('/projects?sort=status&order=asc&pageSize=2&page=0')
          .send();

        expect(page0.status).toBe(200);
        expect(page0.body.totalCount).toBe(3);
        expect(page0.body.items).toHaveLength(2);
        expect(
          page0.body.items.map(
            (p: { status?: { state: string } }) => p.status?.state,
          ),
        ).toEqual(['created', 'initialized']);

        // Pagination: page 1 with pageSize 2
        const page1 = await request(app)
          .get('/projects?sort=status&order=asc&pageSize=2&page=1')
          .send();

        expect(page1.status).toBe(200);
        expect(page1.body.totalCount).toBe(3);
        expect(page1.body.items).toHaveLength(1);
        expect(
          page1.body.items.map(
            (p: { status?: { state: string } }) => p.status?.state,
          ),
        ).toEqual(['failed']);
      },
      LONG_TEST_TIMEOUT,
    );

    describe('GET /projects and GET /projects/:projectId – x2a.user or x2a admin required', () => {
      it.each(supportedDatabaseIds)(
        'should deny GET /projects when user has neither x2a.user nor x2a admin view - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            AuthorizeResult.DENY,
          );

          const response = await request(app).get('/projects').send();

          expect(response.status).toBe(403);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotAllowedError',
              message: 'The user is not allowed to read projects.',
            },
          });
        },
      );

      it.each(supportedDatabaseIds)(
        'should deny GET /projects/:projectId when user has neither x2a.user nor x2a admin view - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            AuthorizeResult.DENY,
          );

          const response = await request(app)
            .get(`/projects/${nonExistentId}`)
            .send();

          expect(response.status).toBe(403);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotAllowedError',
              message: 'The user is not allowed to read projects.',
            },
          });
        },
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects when user has x2a.user (no admin view) - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.ALLOW,
            undefined,
            undefined,
            AuthorizeResult.DENY,
          );

          const response = await request(app).get('/projects').send();

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('items');
          expect(response.body).toHaveProperty('totalCount');
        },
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects/:projectId when user has x2a.user - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.ALLOW,
            undefined,
            undefined,
            AuthorizeResult.DENY,
          );

          const createResponse = await request(app)
            .post('/projects')
            .send(mockInputProject);
          expect(createResponse.status).toBe(200);
          const projectId = createResponse.body.id;

          const response = await request(app)
            .get(`/projects/${projectId}`)
            .send();

          expect(response.status).toBe(200);
          expect(response.body).toMatchObject({
            id: projectId,
            ...mockInputProject,
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects when user has x2a admin view (no x2a.user) - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            AuthorizeResult.ALLOW,
          );

          const response = await request(app).get('/projects').send();

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('items');
          expect(response.body).toHaveProperty('totalCount');
        },
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects/:projectId when user has x2a admin view - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const appWithUser = await createApp(client);
          const createResponse = await request(appWithUser)
            .post('/projects')
            .send(mockInputProject);
          expect(createResponse.status).toBe(200);
          const projectId = createResponse.body.id;

          const appAdminOnly = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            AuthorizeResult.ALLOW,
          );
          const response = await request(appAdminOnly)
            .get(`/projects/${projectId}`)
            .send();

          expect(response.status).toBe(200);
          expect(response.body).toMatchObject({
            id: projectId,
            ...mockInputProject,
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects when user has x2a admin write only (no user, no admin read) - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            AuthorizeResult.ALLOW,
            undefined,
            AuthorizeResult.DENY,
          );

          const response = await request(app).get('/projects').send();

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('items');
          expect(response.body).toHaveProperty('totalCount');
        },
      );

      it.each(supportedDatabaseIds)(
        'should allow GET /projects/:projectId when user has x2a admin write only - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const appWithUser = await createApp(client);
          const createResponse = await request(appWithUser)
            .post('/projects')
            .send(mockInputProject);
          expect(createResponse.status).toBe(200);
          const projectId = createResponse.body.id;

          const appAdminWriteOnly = await createApp(
            client,
            AuthorizeResult.DENY,
            AuthorizeResult.ALLOW,
            undefined,
            AuthorizeResult.DENY,
          );
          const response = await request(appAdminWriteOnly)
            .get(`/projects/${projectId}`)
            .send();

          expect(response.status).toBe(200);
          expect(response.body).toMatchObject({
            id: projectId,
            ...mockInputProject,
          });
        },
        LONG_TEST_TIMEOUT,
      );
    });
  });
});
