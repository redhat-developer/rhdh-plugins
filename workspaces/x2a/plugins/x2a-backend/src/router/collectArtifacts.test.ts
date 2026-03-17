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
import { SignatureValidator } from './utils/SignatureValidator';

describe('collectArtifacts routes', () => {
  let app: express.Express;
  let mockDeps: MockRouterDeps;
  let signatureValidator: SignatureValidator;

  const projectId = randomUUID();
  const jobId = randomUUID();
  const moduleId = randomUUID();
  const k8sJobName = 'test-k8s-job-123';
  const callbackToken = randomUUID();

  // Helper to sign request body
  function signRequestBody(body: object, secret: string): string {
    const bodyJson = JSON.stringify(body);
    const bodyBuffer = Buffer.from(bodyJson, 'utf-8');
    return signatureValidator.generateSignature(secret, bodyBuffer);
  }

  beforeEach(() => {
    mockDeps = createMockRouterDeps();
    signatureValidator = new SignatureValidator();
    app = express();
    // Don't use express.json() - the route uses express.raw() instead
    const router = express.Router();
    registerCollectArtifactsRoutes(router, mockDeps as any);
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('validation', () => {
    it('should return error when jobId is missing', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'success', artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('jobId');
    });

    it('should return error when jobId is not a valid UUID', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .send({ status: 'success', jobId: 'not-a-uuid', artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('UUID');
    });

    it('should return error when moduleId is provided for init phase', async () => {
      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=init&moduleId=${moduleId}`,
        )
        .send({ status: 'success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId must not be provided');
    });

    it('should return error when moduleId is missing for analyze phase', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=analyze`)
        .send({ status: 'success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId is required');
    });

    it('should return error when moduleId is missing for migrate phase', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=migrate`)
        .send({ status: 'success', jobId, artifacts: [] });

      expect(res.status).toBe(400);
      expect(res.text).toContain('moduleId is required');
    });

    it('should return error when status is Error but errorDetails is missing', async () => {
      const requestBody = { status: 'error', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(400);
      expect(res.text).toContain('errorDetails field is required');
    });

    it('should return error when job does not exist', async () => {
      mockDeps.x2aDatabase.getJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(404);
      expect(res.text).toContain('not found');
    });

    it('should return error when job belongs to different project', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId: randomUUID(),
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
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

      expect(res.status).toBe(404);
      expect(res.text).toContain('does not belong to project');
    });

    it('should return error when job phase does not match request phase', async () => {
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
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(400);
      expect(res.text).toContain('phase mismatch');
    });

    it('should return error when job moduleId does not match request moduleId', async () => {
      const job: Job & { callbackToken?: string } = {
        id: jobId,
        projectId,
        moduleId: randomUUID(),
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
        callbackToken,
      };
      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);

      const requestBody = { status: 'success', jobId, artifacts: [] };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(
          `/projects/${projectId}/collectArtifacts?phase=analyze&moduleId=${moduleId}`,
        )
        .set('X-Callback-Signature', signature)
        .send(requestBody);

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

      const logs = 'Init job logs from kubernetes';

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue(logs);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = { status: 'success', jobId, artifacts };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

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

      const logs = 'Error logs from kubernetes';

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue(logs);
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = {
        status: 'error',
        errorDetails: 'Failed to initialize project',
        jobId,
        artifacts: [],
      };
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
      mockDeps.kubeService.getJobLogs.mockResolvedValue('Analyze logs');
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
      expect(res.body).toEqual({
        message: 'Artifacts collected successfully',
      });
      expect(mockDeps.x2aDatabase.getJob).toHaveBeenCalledWith({ id: jobId });
    });

    it('should handle omitted artifacts field', async () => {
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

      const requestBody = { status: 'success', jobId };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          artifacts: [],
        }),
      );
    });

    it('should handle empty artifacts correctly', async () => {
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
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          artifacts: [],
        }),
      );
    });

    it('should persist telemetry with inputTokens and outputTokens', async () => {
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

      const telemetry = {
        summary: 'Init phase completed',
        phase: 'init',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        agents: {
          'agent-1': {
            name: 'agent-1',
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
            durationSeconds: 10.5,
            inputTokens: 1500,
            outputTokens: 800,
            metrics: { key: 'value' },
            toolCalls: { read: 5 },
          },
        },
      };

      mockDeps.x2aDatabase.getJob.mockResolvedValue(job);
      mockDeps.kubeService.getJobLogs.mockResolvedValue('logs');
      mockDeps.x2aDatabase.updateJob.mockResolvedValue(undefined);

      const requestBody = {
        status: 'success',
        jobId,
        artifacts: [],
        telemetry,
      };
      const signature = signRequestBody(requestBody, callbackToken);

      const res = await request(app)
        .post(`/projects/${projectId}/collectArtifacts?phase=init`)
        .set('X-Callback-Signature', signature)
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockDeps.x2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          telemetry: expect.objectContaining({
            summary: 'Init phase completed',
            agents: expect.objectContaining({
              'agent-1': expect.objectContaining({
                inputTokens: 1500,
                outputTokens: 800,
              }),
            }),
          }),
        }),
      );
    });
  });
});
