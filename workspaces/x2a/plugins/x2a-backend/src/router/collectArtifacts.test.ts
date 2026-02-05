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
import { mockErrorHandler } from '@backstage/backend-test-utils';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { registerCollectArtifactsRoutes } from './collectArtifacts';
import {
  createMockRouterDeps,
  MockRouterDeps,
} from './__testUtils__/routerTestHelpers';

describe('collectArtifacts routes', () => {
  let app: express.Express;
  let mockDeps: MockRouterDeps;

  const projectId = randomUUID();
  const jobId = randomUUID();
  const moduleId = randomUUID();
  const k8sJobName = 'test-k8s-job-123';

  beforeEach(() => {
    mockDeps = createMockRouterDeps();
    app = express();
    app.use(express.json());
    const router = express.Router();
    registerCollectArtifactsRoutes(router, mockDeps as any);
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('validation', () => {
    it('should return error when jobId is missing', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('jobId');
    });

    it('should return error when jobId is not a valid UUID', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId: 'not-a-uuid', artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('UUID');
    });

    it('should return error when moduleId is provided for init phase', async () => {
      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=init&moduleId=${moduleId}`,
        )
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId must not be provided');
    });

    it('should return error when moduleId is missing for analyze phase', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=analyze`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId is required');
    });

    it('should return error when moduleId is missing for migrate phase', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=migrate`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId is required');
    });

    it('should return error when status is Error but errorDetails is missing', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Error', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('errorDetails field is required');
    });

    it('should return error when job does not exist', async () => {
      mockDeps.x2aDatabase.getJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(404);
      expect(res.text).toContain('not found');
    });

    it('should return error when job belongs to different project', async () => {
      const job: Job = {
        id: jobId,
        projectId: randomUUID(),
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };
      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(404);
      expect(res.text).toContain('does not belong to project');
    });

    it('should return error when job phase does not match request phase', async () => {
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

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('phase mismatch');
    });

    it('should return error when job moduleId does not match request moduleId', async () => {
      const job: Job = {
        id: jobId,
        projectId,
        moduleId: randomUUID(),
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };
      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId mismatch');
    });
  });

  describe('success scenarios', () => {
    it('should collect artifacts for init job with Success status', async () => {
      const artifacts = [
        {
          id: randomUUID(),
          type: 'migration_plan',
          value: 'https://repo.example.com/plan.md',
        },
      ];

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      const logs = 'Init job logs from kubernetes';

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue(logs);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.x2aDatabase.getJob).toHaveBeenCalledWith({ id: jobId });
      expect(mockDeps.kubeService.getJobLogs).toHaveBeenCalledWith(
        k8sJobName,
        false,
      );
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          status: 'success',
          log: logs,
          artifacts,
        }),
      );
    });

    it('should collect artifacts for init job with Error status', async () => {
      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      const logs = 'Error logs from kubernetes';

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue(logs);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({
          status: 'Error',
          errorDetails: 'Failed to initialize project',
          jobId,
          artifacts: [],
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          status: 'error',
          errorDetails: 'Failed to initialize project',
          log: logs,
        }),
      );
    });

    it('should collect artifacts for analyze job with moduleId', async () => {
      const artifacts = [
        {
          id: randomUUID(),
          type: 'module_migration_plan',
          value: 'https://repo.example.com/module-plan.md',
        },
      ];

      const job: Job = {
        id: jobId,
        projectId,
        moduleId,
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('Analyze logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .send({ status: 'Success', jobId, artifacts });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.x2aDatabase.getJob).toHaveBeenCalledWith({ id: jobId });
    });

    it('should handle empty artifacts correctly', async () => {
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
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          artifacts: [],
        }),
      );
    });
  });

  describe('graceful failure', () => {
    it('should continue when k8s log retrieval fails', async () => {
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
      mockDeps.kubeService.getJobLogs.mockRejectedValue(
        new Error('K8s API error'),
      );
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

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
      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName: null as any,
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

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
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockRejectedValue(
        new Error('Database error'),
      );

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'Success', jobId, artifacts: [] });

      expect(res.status).toBe(500);
    });
  });
});
