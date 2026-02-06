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
import { mockServices } from '@backstage/backend-test-utils';
import { InputError, NotFoundError } from '@backstage/errors';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  CollectArtifactsHandler,
  CollectArtifactsRequestBody,
} from './collectArtifacts';

describe('CollectArtifactsHandler', () => {
  let handler: CollectArtifactsHandler;
  let mockX2aDatabase: any;
  let mockKubeService: any;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;

  const projectId = randomUUID();
  const jobId = randomUUID();
  const moduleId = randomUUID();
  const k8sJobName = 'test-k8s-job-123';

  beforeEach(() => {
    mockLogger = mockServices.logger.mock();

    // Mock X2ADatabaseService
    mockX2aDatabase = {
      getJob: jest.fn(),
      updateJob: jest.fn(),
    } as any;

    // Mock KubeService
    mockKubeService = {
      getJobLogs: jest.fn(),
    } as any;

    handler = new CollectArtifactsHandler({
      logger: mockLogger,
      x2aDatabase: mockX2aDatabase,
      kubeService: mockKubeService,
    });
  });

  describe('validation tests', () => {
    it('should throw InputError when jobId is missing', async () => {
      const requestBody = {
        status: 'Success',
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('jobId');
    });

    it('should throw InputError when jobId is not a valid UUID', async () => {
      const requestBody = {
        status: 'Success',
        jobId: 'not-a-uuid',
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('UUID');
    });

    it('should throw InputError when moduleId is provided for init phase', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('moduleId must not be provided');
    });

    it('should throw InputError when moduleId is missing for analyze phase', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow('moduleId is required');
    });

    it('should throw InputError when moduleId is missing for migrate phase', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'migrate',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'migrate',
          requestBody,
        ),
      ).rejects.toThrow('moduleId is required');
    });

    it('should throw InputError when status is Error but error field is missing', async () => {
      const requestBody = {
        status: 'Error',
        jobId,
        artifacts: {} as any,
      };

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('error field is required');
    });

    it('should throw NotFoundError when job does not exist', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      mockX2aDatabase.getJob.mockResolvedValue(undefined);

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(NotFoundError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('not found');
    });

    it('should throw NotFoundError when job belongs to different project', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId: randomUUID(), // Different project
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow(NotFoundError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('does not belong to project');
    });

    it('should throw InputError when job phase does not match request phase', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow('phase mismatch');
    });

    it('should throw InputError when job moduleId does not match request moduleId', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: randomUUID(), // Different moduleId
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);

      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow(InputError);
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          moduleId,
          'analyze',
          requestBody,
        ),
      ).rejects.toThrow('moduleId mismatch');
    });
  });

  describe('success scenarios', () => {
    it('should successfully collect artifacts for init job with Success status', async () => {
      const telemetry = {
        summary: 'Init phase completed successfully',
        phase: 'init',
        startedAt: '2026-02-06T10:00:00Z',
        endedAt: '2026-02-06T10:05:00Z',
        agents: {
          'init-agent': {
            name: 'init-agent',
            startedAt: '2026-02-06T10:00:00Z',
            endedAt: '2026-02-06T10:05:00Z',
            durationSeconds: 300,
            toolCalls: { read: 5, write: 3 } as any,
          } as any,
        } as any,
      };

      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {
          telemetry,
        } as any,
      };

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

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue(logs);
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      const result = await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(result).toEqual({ message: 'Artifacts collected successfully' });
      expect(mockX2aDatabase.getJob).toHaveBeenCalledWith({ id: jobId });
      expect(mockKubeService.getJobLogs).toHaveBeenCalledWith(
        k8sJobName,
        false,
      );
      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          status: 'success',
          log: logs,
          artifacts: expect.arrayContaining([
            expect.objectContaining({
              type: 'telemetry',
              value: JSON.stringify(telemetry),
            }),
          ]),
        }),
      );
    });

    it('should successfully collect artifacts for init job with Error status', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Error',
        error: 'Failed to initialize project',
        jobId,
        artifacts: {} as any,
      };

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

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue(logs);
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      const result = await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(result).toEqual({ message: 'Artifacts collected successfully' });
      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          status: 'error',
          errorDetails: 'Failed to initialize project',
          log: logs,
        }),
      );
    });

    it('should successfully collect artifacts for analyze job with moduleId', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {
          telemetry: {
            summary: 'Analyze phase completed',
            phase: 'analyze',
            startedAt: '2026-02-06T11:00:00Z',
            endedAt: '2026-02-06T11:10:00Z',
          } as any,
        } as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId,
        phase: 'analyze',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue('Analyze logs');
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      const result = await handler.handleCollectArtifacts(
        projectId,
        moduleId,
        'analyze',
        requestBody,
      );

      expect(result).toEqual({ message: 'Artifacts collected successfully' });
      expect(mockX2aDatabase.getJob).toHaveBeenCalledWith({ id: jobId });
    });

    it('should serialize telemetry and external links correctly', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {
          telemetry: {
            summary: 'Test summary',
            phase: 'init',
            startedAt: '2026-02-06T10:00:00Z',
          } as any,
          externalLinks: {
            Dashboard: 'https://dashboard.example.com',
            'Metrics Portal': 'https://metrics.example.com',
          } as any,
        } as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue('logs');
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          artifacts: expect.arrayContaining([
            expect.objectContaining({
              type: 'telemetry',
              value: JSON.stringify(requestBody.artifacts.telemetry),
            }),
            expect.objectContaining({
              type: 'externalLink',
              value: JSON.stringify({
                name: 'Dashboard',
                url: 'https://dashboard.example.com',
              }),
            }),
            expect.objectContaining({
              type: 'externalLink',
              value: JSON.stringify({
                name: 'Metrics Portal',
                url: 'https://metrics.example.com',
              }),
            }),
          ]),
        }),
      );
    });

    it('should handle empty artifacts correctly', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue('logs');
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          artifacts: [],
        }),
      );
    });
  });

  describe('graceful failure', () => {
    it('should continue when k8s log retrieval fails', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {
          telemetry: {
            summary: 'Test',
            phase: 'init',
            startedAt: '2026-02-06T10:00:00Z',
          } as any,
        } as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockRejectedValue(new Error('K8s API error'));
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      const result = await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(result).toEqual({ message: 'Artifacts collected successfully' });
      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          id: jobId,
          log: null,
        }),
      );
    });

    it('should skip log fetch when k8sJobName is null', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName: null as any, // Testing null case
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockX2aDatabase.updateJob.mockResolvedValue(undefined);

      const result = await handler.handleCollectArtifacts(
        projectId,
        undefined,
        'init',
        requestBody,
      );

      expect(result).toEqual({ message: 'Artifacts collected successfully' });
      expect(mockKubeService.getJobLogs).not.toHaveBeenCalled();
      expect(mockX2aDatabase.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          log: null,
        }),
      );
    });

    it('should throw if database update fails', async () => {
      const requestBody: CollectArtifactsRequestBody = {
        status: 'Success',
        jobId,
        artifacts: {} as any,
      };

      const job: Job = {
        id: jobId,
        projectId,
        moduleId: undefined,
        phase: 'init',
        status: 'running',
        startedAt: new Date(),
        k8sJobName,
      };

      mockX2aDatabase.getJob.mockResolvedValue(job);
      mockKubeService.getJobLogs.mockResolvedValue('logs');
      mockX2aDatabase.updateJob.mockRejectedValue(new Error('Database error'));

      // Should throw database error (not swallow it)
      await expect(
        handler.handleCollectArtifacts(
          projectId,
          undefined,
          'init',
          requestBody,
        ),
      ).rejects.toThrow('Database error');
    });
  });
});
