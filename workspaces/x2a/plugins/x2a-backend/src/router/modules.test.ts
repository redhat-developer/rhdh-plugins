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

import { mockServices } from '@backstage/backend-test-utils';
import request from 'supertest';

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
          status: 'pending',
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
});
