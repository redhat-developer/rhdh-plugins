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

import { randomUUID } from 'node:crypto';
import request from 'supertest';
import express from 'express';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  CollectArtifactsTestApp,
  MockRouterDeps,
  setupCollectArtifactsApp,
} from '../__testUtils__';

describe('collectArtifacts routes (actions & signatures)', () => {
  // sharing similar boilerplate with the collectArtifacts.test.ts, splitted for better parallelization of execution
  let app: express.Express;
  let mockDeps: MockRouterDeps;
  let signRequestBody: CollectArtifactsTestApp['signRequestBody'];

  const projectId = randomUUID();
  const jobId = randomUUID();
  const moduleId = randomUUID();
  const k8sJobName = 'test-k8s-job-123';
  const callbackToken = randomUUID();

  beforeEach(() => {
    ({ app, mockDeps, signRequestBody } = setupCollectArtifactsApp());
  });

  describe('phase actions', () => {
    it('should create modules from project_metadata artifact on init success', async () => {
      const metadataModules = [
        {
          name: 'module-a',
          path: '/cookbooks/a',
          description: 'A',
          technology: 'chef',
        },
        {
          name: 'module-b',
          path: '/cookbooks/b',
          description: 'B',
          technology: 'chef',
        },
      ];
      const artifacts = [
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ];

      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);
      mockDeps.x2aDatabase.listModules.mockResolvedValue([]);
      mockDeps.x2aDatabase.createModule.mockResolvedValue({ id: randomUUID() });

      const requestBody = { status: 'success', jobId, artifacts };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.createModule).toHaveBeenCalledTimes(2);
      expect(mockDeps.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'module-a',
        sourcePath: '/cookbooks/a',
        projectId,
      });
      expect(mockDeps.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'module-b',
        sourcePath: '/cookbooks/b',
        projectId,
      });
    });

    it('should sync modules: create new, delete removed, preserve existing', async () => {
      const metadataModules = [
        { name: 'kept-module', path: '/cookbooks/kept' },
        { name: 'new-module', path: '/cookbooks/new' },
      ];
      const artifacts = [
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify(metadataModules),
        },
      ];

      const existingModules = [
        {
          id: 'existing-1',
          name: 'kept-module',
          sourcePath: '/cookbooks/kept',
          projectId,
        },
        {
          id: 'existing-2',
          name: 'removed-module',
          sourcePath: '/cookbooks/removed',
          projectId,
        },
      ];

      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);
      mockDeps.x2aDatabase.listModules.mockResolvedValue(existingModules);
      mockDeps.x2aDatabase.createModule.mockResolvedValue({ id: randomUUID() });
      mockDeps.x2aDatabase.deleteModule.mockResolvedValue(1);

      const requestBody = { status: 'success', jobId, artifacts };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.createModule).toHaveBeenCalledTimes(1);
      expect(mockDeps.x2aDatabase.createModule).toHaveBeenCalledWith({
        name: 'new-module',
        sourcePath: '/cookbooks/new',
        projectId,
      });
      expect(mockDeps.x2aDatabase.deleteModule).toHaveBeenCalledTimes(1);
      expect(mockDeps.x2aDatabase.deleteModule).toHaveBeenCalledWith({
        id: 'existing-2',
      });
    });

    it('should not trigger phase actions when no project_metadata artifact', async () => {
      const artifacts = [
        {
          id: randomUUID(),
          type: 'migration_plan',
          value: 'https://repo.example.com/plan.md',
        },
      ];

      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(mockDeps.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should not trigger phase actions on error status', async () => {
      const artifacts = [
        {
          id: randomUUID(),
          type: 'project_metadata',
          value: JSON.stringify([{ name: 'mod', path: '/p' }]),
        },
      ];

      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = {
        status: 'error',
        errorDetails: 'Init failed',
        jobId,
        artifacts,
      };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(mockDeps.x2aDatabase.createModule).not.toHaveBeenCalled();
    });

    it('should not trigger module creation for non-init phases', async () => {
      const artifacts = [
        {
          id: randomUUID(),
          type: 'module_migration_plan',
          value: 'https://repo.example.com/module-plan.md',
        },
      ];

      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId,
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.listModules).not.toHaveBeenCalled();
      expect(mockDeps.x2aDatabase.createModule).not.toHaveBeenCalled();
    });
  });

  describe('graceful failure', () => {
    it('should continue when k8s log retrieval fails', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockRejectedValue(
        new Error('K8s API error'),
      );
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          log: null,
        }),
      );
    });

    it('should skip log fetch when k8sJobName is null', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName: null as any,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.kubeService.getJobLogs).not.toHaveBeenCalled();
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          log: null,
        }),
      );
    });

    it('should throw if database update fails', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockRejectedValue(
        new Error('Database error'),
      );

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(500);
    });
  });

  describe('signature validation', () => {
    it('should return 401 when X-Callback-Signature header is missing', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 401 when signature is invalid', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const invalidSignature = 'invalid-signature-12345';

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', invalidSignature)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 200 when signature is valid', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const validSignature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', validSignature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
    });

    it('should return 401 when signature is empty string', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', '')
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 401 when request body is tampered after signing', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const timestamp = new Date().toISOString();
      const originalBody = {
        status: 'success',
        jobId,
        artifacts: [],
        timestamp,
      };
      const tamperedBody = {
        status: 'success',
        jobId,
        artifacts: [
          { id: randomUUID(), type: 'migration_plan', value: 'malicious' },
        ],
        timestamp,
      };

      const signature = signRequestBody(originalBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(tamperedBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 401 when job does not have callback token', async () => {
      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, 'some-token');

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 401 when job is older than max age window (replay attack)', async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: fourHoursAgo,
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should return 401 when job has no startedAt (replay attack)', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: undefined as any,
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).toContain('Authentication failed');
    });

    it('should not leak callback token in error messages', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const invalidSignature = 'wrong-signature';

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', invalidSignature)
        .send(requestBody);

      expect(res.status).toBe(401);
      expect(res.text).not.toContain(callbackToken);
      expect(res.text).toContain('Authentication failed');
    });
  });
});
