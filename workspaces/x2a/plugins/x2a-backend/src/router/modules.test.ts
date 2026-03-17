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

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import request from 'supertest';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { X2ADatabaseService } from '../services/X2ADatabaseService';
import {
  createApp,
  createDatabase,
  createTestJob,
  createTestModule,
  createTestProject,
  mockInputProject,
  mockProject2,
  supportedDatabaseIds,
  tearDownRouters,
} from './__testUtils__/routerTestHelpers';
import { LONG_TEST_TIMEOUT, nonExistentId } from '../utils';

describe('createRouter – modules', () => {
  afterEach(async () => {
    await tearDownRouters();
  });

  describe('GET /projects/:projectId/modules', () => {
    it.each(supportedDatabaseIds)(
      'should return 200 and empty array when project has no modules - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createResponse = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createResponse.status).toBe(200);
        const projectId = createResponse.body.id;

        const response = await request(app)
          .get(`/projects/${projectId}/modules`)
          .send();

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return each module with status field from service enrichment - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        await createTestModule(x2aDatabase, project.id, {
          name: 'Module A',
          sourcePath: '/a',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('status');
        expect(response.body[0].status).toBe('pending');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .get(`/projects/${nonExistentId}/modules`)
          .send();

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
      'should include last analyze/migrate/publish job per module when jobs exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);

        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id, {
          name: 'Analyzed Module',
          sourcePath: '/analyzed',
        });

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
          status: 'running',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        const mod = response.body[0];
        expect(mod.name).toBe('Analyzed Module');
        expect(mod.analyze).toBeDefined();
        expect(mod.analyze.status).toBe('success');
        expect(mod.migrate).toBeDefined();
        expect(mod.migrate.status).toBe('running');
        expect(mod.publish).toBeUndefined();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should never return callbackToken in analyze, migrate or publish jobs - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);

        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id, {
          name: 'Module With Jobs',
          sourcePath: '/with-jobs',
        });

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
          status: 'running',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'publish',
          status: 'pending',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        const mod = response.body[0];

        expect(mod.analyze).toBeDefined();
        expect(mod.analyze).not.toHaveProperty('callbackToken');

        expect(mod.migrate).toBeDefined();
        expect(mod.migrate).not.toHaveProperty('callbackToken');

        expect(mod.publish).toBeDefined();
        expect(mod.publish).not.toHaveProperty('callbackToken');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has neither x2a.user nor x2a admin permissions - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        await createTestModule(x2aDatabase, project.id);

        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .get(`/projects/${project.id}/modules`)
          .send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'The user is not allowed to read projects.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when user without admin view accesses another user project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const user1Project = await createTestProject(
          x2aDatabase,
          mockInputProject,
          'user:default/user1',
        );
        await createTestModule(x2aDatabase, user1Project.id);

        const user2CredentialsHeader =
          mockCredentials.user.header('user:default/user2');
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .get(`/projects/${user1Project.id}/modules`)
          .set('Authorization', user2CredentialsHeader)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Project not found for the "user:default/user2" user.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('GET /projects/:projectId/modules/:moduleId', () => {
    it.each(supportedDatabaseIds)(
      'should return 200 and module when project and module exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id, {
          name: 'Single Module',
          sourcePath: '/single',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: module.id,
          name: 'Single Module',
          sourcePath: '/single',
          projectId: project.id,
        });
        expect(response.body.analyze).toBeUndefined();
        expect(response.body.migrate).toBeUndefined();
        expect(response.body.publish).toBeUndefined();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should include last analyze/migrate/publish jobs when jobs exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id, {
          name: 'Module With Jobs',
          sourcePath: '/with-jobs',
        });

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
          status: 'running',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'publish',
          status: 'pending',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Module With Jobs');
        expect(response.body.analyze).toBeDefined();
        expect(response.body.analyze.status).toBe('success');
        expect(response.body.migrate).toBeDefined();
        expect(response.body.migrate.status).toBe('running');
        expect(response.body.publish).toBeDefined();
        expect(response.body.publish.status).toBe('pending');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should never return callbackToken in analyze, migrate or publish jobs - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
          status: 'success',
        });
        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'publish',
          status: 'success',
        });

        const response = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body.analyze).toBeDefined();
        expect(response.body.analyze).not.toHaveProperty('callbackToken');
        expect(response.body.migrate).toBeDefined();
        expect(response.body.migrate).not.toHaveProperty('callbackToken');
        expect(response.body.publish).toBeDefined();
        expect(response.body.publish).not.toHaveProperty('callbackToken');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const response = await request(app)
          .get(`/projects/${nonExistentId}/modules/${module.id}`)
          .send();

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
      'should return 404 when module does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);

        const response = await request(app)
          .get(`/projects/${project.id}/modules/${nonExistentId}`)
          .send();

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
      'should return 404 when module belongs to different project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project1 = await createTestProject(x2aDatabase);
        const project2 = await createTestProject(x2aDatabase, mockProject2);
        const moduleOfProject2 = await createTestModule(
          x2aDatabase,
          project2.id,
          { name: 'Other Project Module', sourcePath: '/other' },
        );

        const response = await request(app)
          .get(`/projects/${project1.id}/modules/${moduleOfProject2.id}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: expect.stringMatching(
              /does not belong to project|not found/,
            ),
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has neither x2a.user nor x2a admin permissions - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'The user is not allowed to read projects.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when user without admin view accesses another user project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const user1Project = await createTestProject(
          x2aDatabase,
          mockInputProject,
          'user:default/user1',
        );
        const user1Module = await createTestModule(
          x2aDatabase,
          user1Project.id,
        );

        const user2CredentialsHeader =
          mockCredentials.user.header('user:default/user2');
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .get(`/projects/${user1Project.id}/modules/${user1Module.id}`)
          .set('Authorization', user2CredentialsHeader)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Project not found for the "user:default/user2" user.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('POST /projects/:projectId/modules', () => {
    it.each(supportedDatabaseIds)(
      'should create a module and return 201 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createProjectRes = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createProjectRes.status).toBe(200);
        const projectId = createProjectRes.body.id;

        const response = await request(app)
          .post(`/projects/${projectId}/modules`)
          .send({ name: 'New Module', sourcePath: '/src/module' });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          name: 'New Module',
          sourcePath: '/src/module',
          projectId,
        });
        expect(response.body.id).toBeDefined();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post(`/projects/${nonExistentId}/modules`)
          .send({ name: 'Module', sourcePath: '/path' });

        expect(response.status).toBe(404);
        expect(response.body.error.message).toContain('not found');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when body is invalid - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const createProjectRes = await request(app)
          .post('/projects')
          .send(mockInputProject);
        expect(createProjectRes.status).toBe(200);
        const projectId = createProjectRes.body.id;

        const response = await request(app)
          .post(`/projects/${projectId}/modules`)
          .send({ name: 'Only name' });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
    );
  });

  describe('POST /projects/:projectId/modules/:moduleId/run', () => {
    const runBody = {
      phase: 'analyze' as const,
      sourceRepoAuth: { token: 'source-token' },
      targetRepoAuth: { token: 'target-token' },
    };

    it.each(supportedDatabaseIds)(
      'should start module job when project and module exist and tokens provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const response = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          status: 'running',
          jobId: expect.any(String),
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project or module does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const resNoProject = await request(app)
          .post(`/projects/${nonExistentId}/modules/${module.id}/run`)
          .send(runBody);
        expect(resNoProject.status).toBe(404);

        const resNoModule = await request(app)
          .post(`/projects/${project.id}/modules/${nonExistentId}/run`)
          .send(runBody);
        expect(resNoModule.status).toBe(404);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has neither x2a.user nor x2a admin permissions - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'The user is not allowed to write projects.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when user without admin write accesses another user project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const user1Project = await createTestProject(
          x2aDatabase,
          mockInputProject,
          'user:default/user1',
        );
        const user1Module = await createTestModule(
          x2aDatabase,
          user1Project.id,
        );

        const user2CredentialsHeader =
          mockCredentials.user.header('user:default/user2');
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .post(`/projects/${user1Project.id}/modules/${user1Module.id}/run`)
          .set('Authorization', user2CredentialsHeader)
          .send(runBody);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Project not found for the "user:default/user2" user.',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 409 when a job is already running for the module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const first = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);
        expect(first.status).toBe(200);

        const second = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);
        expect(second.status).toBe(409);
        expect(second.body).toMatchObject({
          error: 'JobAlreadyRunning',
          message: expect.stringContaining('already running'),
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when phase is invalid or tokens missing - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const badPhase = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({ ...runBody, phase: 'init' });
        expect(badPhase.status).toBe(400);

        const noTokens = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({ phase: 'analyze' });
        expect(noTokens.status).toBe(400);
        expect(noTokens.body.error.message).toMatch(
          /sourceRepoAuth|targetRepoAuth|token/i,
        );
      },
    );

    it.each(supportedDatabaseIds)(
      'should allow running a new job after a previous one was cancelled - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const first = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);
        expect(first.status).toBe(200);

        const cancel = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });
        expect(cancel.status).toBe(200);

        const second = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send(runBody);
        expect(second.status).toBe(200);
        expect(second.body.jobId).toBeDefined();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 409 and clean up K8s job when job is cancelled during K8s creation window - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const mockDeleteJob = jest.fn().mockResolvedValue(undefined);
        const mockCreateJob = jest
          .fn()
          .mockImplementation(async (params: { jobId: string }) => {
            // Simulate a concurrent cancel arriving while K8s job is being created
            await x2aDatabase.updateJob({
              id: params.jobId,
              status: 'cancelled',
              finishedAt: new Date(),
            });
            return { k8sJobName: 'orphan-k8s-job' };
          });

        const app = await createApp(client, undefined, undefined, {
          createJob: mockCreateJob,
          deleteJob: mockDeleteJob,
        });

        const response = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            phase: 'analyze',
            sourceRepoAuth: { token: 'source-token' },
            targetRepoAuth: { token: 'target-token' },
          });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('JobCancelledDuringCreation');

        // The orphaned K8s job must be cleaned up
        expect(mockDeleteJob).toHaveBeenCalledWith('orphan-k8s-job');

        // The DB job must remain cancelled, not overwritten to running
        const jobs = await x2aDatabase.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          lastJobOnly: true,
        });
        expect(jobs[0].status).toBe('cancelled');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should accept optional aapCredentials and pass them to kubeService.createJob - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const mockCreateJob = jest
          .fn()
          .mockResolvedValue({ k8sJobName: 'k8s-job' });
        const appWithMock = await createApp(client, undefined, undefined, {
          createJob: mockCreateJob,
        });

        const aapCredentials = {
          url: 'https://aap.example.com',
          orgName: 'Default',
          oauthToken: 'oauth-token',
        };
        const response = await request(appWithMock)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            ...runBody,
            aapCredentials,
          });

        expect(response.status).toBe(200);
        expect(mockCreateJob).toHaveBeenCalledTimes(1);
        expect(mockCreateJob).toHaveBeenCalledWith(
          expect.objectContaining({
            aapCredentials,
            phase: 'analyze',
            moduleId: module.id,
            moduleName: module.name,
          }),
        );
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('POST /projects/:projectId/modules/:moduleId/cancel', () => {
    it.each(supportedDatabaseIds)(
      'should cancel a running job and return 200 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const runResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            phase: 'analyze',
            sourceRepoAuth: { token: 'source-token' },
            targetRepoAuth: { token: 'target-token' },
          });
        expect(runResponse.status).toBe(200);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body.message).toMatch(/cancelled/i);

        const moduleResponse = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();
        expect(moduleResponse.status).toBe(200);
        expect(moduleResponse.body.analyze.status).toBe('cancelled');
        expect(moduleResponse.body.status).toBe('cancelled');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should cancel a pending job (no k8sJobName) and return 200 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
          status: 'pending',
        });

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'migrate' });

        expect(cancelResponse.status).toBe(200);

        const moduleResponse = await request(app)
          .get(`/projects/${project.id}/modules/${module.id}`)
          .send();
        expect(moduleResponse.status).toBe(200);
        expect(moduleResponse.body.migrate.status).toBe('cancelled');
        expect(moduleResponse.body.status).toBe('cancelled');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 409 when job is already finished (success) - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(409);
        expect(cancelResponse.body.error).toBe('JobNotCancellable');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 409 when job is already cancelled - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        await createTestJob(x2aDatabase, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'cancelled',
        });

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(409);
        expect(cancelResponse.body.error).toBe('JobNotCancellable');
        expect(cancelResponse.body.message).toContain('cancelled');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when no job exists for the phase - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(404);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when project does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const cancelResponse = await request(app)
          .post(`/projects/${nonExistentId}/modules/${nonExistentId}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(404);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when module does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${nonExistentId}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(404);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when module belongs to a different project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project1 = await createTestProject(x2aDatabase);
        const project2 = await createTestProject(x2aDatabase, mockProject2);
        const moduleOfProject2 = await createTestModule(
          x2aDatabase,
          project2.id,
        );

        await createTestJob(x2aDatabase, {
          projectId: project2.id,
          moduleId: moduleOfProject2.id,
          phase: 'analyze',
          status: 'running',
        });

        const cancelResponse = await request(app)
          .post(
            `/projects/${project1.id}/modules/${moduleOfProject2.id}/cancel`,
          )
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(404);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when phase is invalid - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'init' });

        expect(cancelResponse.status).toBe(400);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when phase is missing - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const app = await createApp(client);
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({});

        expect(cancelResponse.status).toBe(400);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has neither x2a.user nor x2a admin permissions - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });
        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(403);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should store logs from k8s when cancelling a running job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });

        const mockGetJobLogs = jest
          .fn()
          .mockResolvedValue('partial job output before cancel');
        const mockDeleteJob = jest.fn().mockResolvedValue(undefined);
        const app = await createApp(client, undefined, undefined, {
          getJobLogs: mockGetJobLogs,
          deleteJob: mockDeleteJob,
        });

        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const runResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            phase: 'analyze',
            sourceRepoAuth: { token: 'source-token' },
            targetRepoAuth: { token: 'target-token' },
          });
        expect(runResponse.status).toBe(200);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });
        expect(cancelResponse.status).toBe(200);

        expect(mockGetJobLogs).toHaveBeenCalled();
        expect(mockDeleteJob).toHaveBeenCalled();

        const log = await x2aDatabase.getJobLogs({
          jobId: runResponse.body.jobId,
        });
        expect(log).toBe('partial job output before cancel');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 500 and keep job as running when K8s deletion fails - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });

        const mockDeleteJob = jest
          .fn()
          .mockRejectedValue(new Error('K8s API unavailable'));
        const app = await createApp(client, undefined, undefined, {
          deleteJob: mockDeleteJob,
        });

        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const runResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            phase: 'analyze',
            sourceRepoAuth: { token: 'source-token' },
            targetRepoAuth: { token: 'target-token' },
          });
        expect(runResponse.status).toBe(200);

        const cancelResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });

        expect(cancelResponse.status).toBe(500);
        expect(cancelResponse.body.error).toBe('K8sDeletionFailed');

        // Job must remain running so reconciliation can still track it
        const jobs = await x2aDatabase.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          lastJobOnly: true,
        });
        expect(jobs[0].status).toBe('running');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should handle concurrent cancel gracefully (second cancel sees already-cancelled job) - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });

        // Slow deleteJob so the first cancel is still in-flight when the second arrives
        const mockDeleteJob = jest.fn().mockResolvedValue(undefined);
        const app = await createApp(client, undefined, undefined, {
          deleteJob: mockDeleteJob,
        });

        const project = await createTestProject(x2aDatabase);
        const module = await createTestModule(x2aDatabase, project.id);

        const runResponse = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/run`)
          .send({
            phase: 'analyze',
            sourceRepoAuth: { token: 'source-token' },
            targetRepoAuth: { token: 'target-token' },
          });
        expect(runResponse.status).toBe(200);

        // First cancel succeeds
        const cancel1 = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });
        expect(cancel1.status).toBe(200);

        // Second cancel sees the job is already cancelled → 409
        const cancel2 = await request(app)
          .post(`/projects/${project.id}/modules/${module.id}/cancel`)
          .send({ phase: 'analyze' });
        expect(cancel2.status).toBe(409);
        expect(cancel2.body.error).toBe('JobNotCancellable');

        // Job remains cancelled, deleteJob was called only once
        const jobs = await x2aDatabase.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          lastJobOnly: true,
        });
        expect(jobs[0].status).toBe('cancelled');
        expect(mockDeleteJob).toHaveBeenCalledTimes(1);
      },
      LONG_TEST_TIMEOUT,
    );
  });
});
