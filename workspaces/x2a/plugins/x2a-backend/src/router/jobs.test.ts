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

import request from 'supertest';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { Knex } from 'knex';
import { Readable } from 'node:stream';

import type { X2ADatabaseService } from '../services/X2ADatabaseService';
import {
  createApp,
  createDatabaseAndService,
  createTestJob,
  createTestProject,
  LONG_TEST_TIMEOUT,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';

describe('createRouter – jobs (log)', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe.each(supportedDatabaseIds)(
    'GET /projects/:projectId/log (init phase) - %p',
    databaseId => {
      let client: Knex;
      let x2aDatabase: X2ADatabaseService;
      let project: { id: string };

      beforeEach(async () => {
        ({ client, x2aDatabase } = await createDatabaseAndService(databaseId));
        project = await createTestProject(x2aDatabase);
      }, LONG_TEST_TIMEOUT);

      it(
        'should return logs from database for finished init job with success status',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'success',
            log: 'Init job logs from database',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Init job logs from database');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return logs from database for finished init job with error status',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'error',
            log: 'Init failed: migration plan error',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Init failed: migration plan error');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return logs from Kubernetes for running init job',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'running',
            k8sJobName: 'init-k8s-job',
          });

          const mockGetJobLogs = jest
            .fn()
            .mockResolvedValue('Init job logs from Kubernetes');
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('Init job logs from Kubernetes');
          expect(mockGetJobLogs).toHaveBeenCalledWith('init-k8s-job', false);
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should call getJobLogs with streaming=true when streaming query param is set',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'running',
            k8sJobName: 'init-k8s-job',
          });

          const mockGetJobLogs = jest
            .fn()
            .mockResolvedValue('Streaming init logs');
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });

          const response = await request(app)
            .get(`/projects/${project.id}/log?streaming=true`)
            .send();

          expect(response.status).toBe(200);
          expect(mockGetJobLogs).toHaveBeenCalledWith('init-k8s-job', true);
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should handle stream error mid-transfer and send error indicator to client',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'running',
            k8sJobName: 'init-k8s-job',
          });

          // Error on second pull so first chunk is delivered before destroy (deterministic)
          let firstChunkSent = false;
          const failingStream = new Readable({
            read() {
              if (firstChunkSent) {
                this.destroy(new Error('Connection interrupted'));
              } else {
                firstChunkSent = true;
                this.push('Log line 1\n');
              }
            },
          });

          const mockGetJobLogs = jest.fn().mockResolvedValue(failingStream);
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });

          const response = await request(app)
            .get(`/projects/${project.id}/log?streaming=true`)
            .send();

          expect(response.status).toBe(200);
          expect(response.text).toContain('Log line 1');
          expect(response.text).toContain(
            '[Log stream error: connection interrupted]',
          );
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return empty logs when init job has no k8sJobName',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'pending',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 200 with empty body when streaming and kube has no log data yet (e.g. no pod or Pending)',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'running',
            k8sJobName: 'init-k8s-job',
          });
          const mockGetJobLogs = jest.fn().mockResolvedValue('');
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });
          const response = await request(app)
            .get(`/projects/${project.id}/log?streaming=true`)
            .send();
          expect(response.status).toBe(200);
          expect(response.type).toBe('text/plain');
          expect(response.text).toBe('');
          expect(mockGetJobLogs).toHaveBeenCalledWith('init-k8s-job', true);
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should not call getJobLogs for streaming when init job has no k8sJobName yet',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'pending',
          });
          const mockGetJobLogs = jest.fn();
          const app = await createApp(client, undefined, undefined, {
            getJobLogs: mockGetJobLogs,
          });
          const response = await request(app)
            .get(`/projects/${project.id}/log?streaming=true`)
            .send();
          expect(response.status).toBe(200);
          expect(response.text).toBe('');
          expect(mockGetJobLogs).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when no init job found for project',
        async () => {
          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotFoundError',
              message: expect.stringContaining('No init job found'),
            },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 404 when project does not exist',
        async () => {
          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${nonExistentId}/log`)
            .send();

          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            error: {
              name: 'NotFoundError',
              message: 'Project not found for the "user:default/mock" user.',
            },
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return latest init job logs when multiple init jobs exist',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'success',
            log: 'Old init logs',
          });

          await new Promise(resolve => setTimeout(resolve, 10));

          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'success',
            log: 'New init logs',
          });

          const app = await createApp(client);

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
            .send();

          expect(response.status).toBe(200);
          expect(response.text).toBe('New init logs');
        },
        LONG_TEST_TIMEOUT,
      );

      it(
        'should return 403 when user has neither x2a.user nor x2a admin permissions',
        async () => {
          await createTestJob(x2aDatabase, {
            projectId: project.id,
            moduleId: null,
            phase: 'init',
            status: 'success',
            log: 'Init logs',
          });

          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            AuthorizeResult.DENY,
          );

          const response = await request(app)
            .get(`/projects/${project.id}/log`)
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
    },
  );
});
