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
import { Knex } from 'knex';

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

describe('createRouter – jobs (log)', () => {
  afterEach(async () => {
    await tearDownRouters();
  });

  describe.each(supportedDatabaseIds)(
    'GET /projects/:projectId/modules/:moduleId/log - %p',
    databaseId => {
      let client: Knex;
      let x2aDatabase: X2ADatabaseService;
      let project: { id: string };
      let module: { id: string };

      beforeEach(async () => {
        const dbSetup = await createDatabase(databaseId);
        client = dbSetup.client;
        x2aDatabase = X2ADatabaseService.create({
          logger: mockServices.logger.mock(),
          dbClient: client,
        });

        project = await createTestProject(x2aDatabase);
        module = await createTestModule(x2aDatabase, project.id);
      });

      it(
        'should return logs from database for finished job with success status',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'success',
            log: 'Test log output from database',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Test log output from database');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return logs from database for finished job with error status',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'migrate',
            status: 'error',
            log: 'Error: Migration failed',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=migrate`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Error: Migration failed');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return logs from Kubernetes for running job',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'publish',
            status: 'running',
            k8sJobName: 'test-k8s-job',
          });

          const mockGetJobLogs = jest
            .fn()
            .mockResolvedValue('Kubernetes logs output');
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=publish`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Kubernetes logs output');
          expect(mockGetJobLogs).toHaveBeenCalledWith('test-k8s-job', false);
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should call getJobLogs with correct job name for running job',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'running',
            k8sJobName: 'test-k8s-job',
          });

          const mockGetJobLogs = jest
            .fn()
            .mockResolvedValue('Streaming logs content');
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=analyze&streaming=true`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(mockGetJobLogs).toHaveBeenCalledWith(
            'test-k8s-job',
            expect.any(Boolean),
          );
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return empty logs when job has no k8sJobName',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'pending',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 400 when phase parameter is missing',
        async () => {
          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/modules/${module.id}/log`)
            .send();

          expect(response.status).toBe(400);
          expect(response.body.error.name).toBe('InputError');
          expect(response.body.error.message).toContain('phase');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when project does not exist',
        async () => {
          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${nonExistentId}/modules/module-id/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: { name: 'NotFoundError', message: 'Project not found' },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when module does not exist',
        async () => {
          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${nonExistentId}/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: { name: 'NotFoundError', message: 'Module not found' },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when module does not belong to project',
        async () => {
          const project2 = await createTestProject(x2aDatabase, mockProject2);
          const module2 = await createTestModule(x2aDatabase, project2.id);

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module2.id}/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotFoundError',
              message: 'Module does not belong to project',
            },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when no jobs found for module with given phase',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'success',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=migrate`,
            )
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotFoundError',
              message: "No jobs found for module with phase 'migrate'",
            },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return latest job logs when multiple jobs exist for same phase',
        async () => {
          // Create first job (older)
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'success',
            log: 'Old job logs',
          });

          // Wait to ensure different timestamps
          await new Promise(resolve => setTimeout(resolve, 10));

          // Create second job (newer)
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: module.id,
            phase: 'analyze',
            status: 'success',
            log: 'New job logs',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(
              `/projects/${project.id}/modules/${module.id}/log?phase=analyze`,
            )
            .send();

          expect(response.status).toBe(200);
          expect(response.text).toBe('New job logs');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should deny access for users without permission to view project',
        async () => {
          // Create project as user1
          const user1Project = await createTestProject(
            x2aDatabase,
            mockInputProject,
            'user:default/user1',
          );
          const user1Module = await createTestModule(
            x2aDatabase,
            user1Project.id,
          );
          await createTestJob(x2aDatabase, {
            projectId: user1Project.id,
            moduleId: user1Module.id,
            phase: 'analyze',
            status: 'success',
            log: 'Test logs',
          });

          // Try to access logs as user2 without admin view permission
          const user2CredentialsHeader =
            mockCredentials.user.header('user:default/user2');
          const appNoPermission = await createApp(
            client,
            AuthorizeResult.ALLOW, // Can create projects
            AuthorizeResult.DENY, // No admin write permission
            undefined, // No kube service overrides
            AuthorizeResult.DENY, // No admin view permission
          );

          const response = await request(appNoPermission)
            .get(
              `/projects/${user1Project.id}/modules/${user1Module.id}/log?phase=analyze`,
            )
            .set('Authorization', user2CredentialsHeader)
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: { name: 'NotFoundError', message: 'Project not found' },
          });
        },
        LONG_TEST_TIMEOUT,
      );
    },
  );
});
