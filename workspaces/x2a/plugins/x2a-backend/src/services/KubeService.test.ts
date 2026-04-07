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
import { X2AConfig } from '../../config';
import { KubeService } from './KubeService';

// Mock the Kubernetes client
const mockCoreV1Api = {
  createNamespacedSecret: jest.fn(),
  readNamespacedSecret: jest.fn(),
  deleteNamespacedSecret: jest.fn(),
  listNamespacedPod: jest.fn(),
  readNamespacedPodLog: jest.fn(),
};

const mockBatchV1Api = {
  createNamespacedJob: jest.fn(),
  readNamespacedJob: jest.fn(),
  deleteNamespacedJob: jest.fn(),
  listNamespacedJob: jest.fn(),
};

jest.mock('./makeK8sClient', () => ({
  makeK8sClient: jest.fn(() => ({
    coreV1Api: mockCoreV1Api,
    batchV1Api: mockBatchV1Api,
  })),
}));

describe('KubeService', () => {
  let kubeService: KubeService;
  let mockConfig: X2AConfig;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfig = {
      kubernetes: {
        namespace: 'test-namespace',
        image: 'quay.io/x2ansible/x2a-convertor',
        imageTag: 'latest',
        ttlSecondsAfterFinished: 86400,
        resources: {
          requests: { cpu: '500m', memory: '1Gi' },
          limits: { cpu: '2000m', memory: '4Gi' },
        },
      },
      credentials: {
        llm: {
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'AKIA_TEST',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key', // NOSONAR
        },
        aap: {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          oauthToken: 'test-oauth-token', // NOSONAR
        },
      },
    };

    kubeService = await KubeService.create({
      logger: mockServices.logger.mock(),
      config: mockConfig,
    });
  });

  describe('createProjectSecret', () => {
    const projectId = 'proj-123';

    it('should create project secret with LLM and AAP credentials from config', async () => {
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      await kubeService.createProjectSecret(projectId, undefined);

      expect(mockCoreV1Api.createNamespacedSecret).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        body: expect.objectContaining({
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: expect.objectContaining({
            name: `x2a-project-secret-${projectId}`,
            labels: expect.objectContaining({
              'x2a.redhat.com/project-id': projectId,
            }),
          }),
          type: 'Opaque',
          stringData: expect.objectContaining({
            LLM_MODEL: 'anthropic.claude-v2',
            AWS_REGION: 'us-east-1',
            AWS_ACCESS_KEY_ID: 'AKIA_TEST',
            AWS_SECRET_ACCESS_KEY: 'test-secret-key', // NOSONAR
            AAP_CONTROLLER_URL: 'https://aap.example.com',
            AAP_ORG_NAME: 'TestOrg',
            AAP_OAUTH_TOKEN: 'test-oauth-token', // NOSONAR
          }),
        }),
      });

      // Verify Git credentials are NOT in project secret
      const call = mockCoreV1Api.createNamespacedSecret.mock.calls[0][0];
      expect(call.body.stringData.SOURCE_REPO_URL).toBeUndefined();
      expect(call.body.stringData.TARGET_REPO_URL).toBeUndefined();
    });

    it('should use user-provided AAP credentials over config', async () => {
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      const userAapCreds = {
        url: 'https://user-aap.example.com',
        orgName: 'UserOrg',
        username: 'user',
        password: 'pass', // NOSONAR
      };

      await kubeService.createProjectSecret(projectId, userAapCreds);

      const call = mockCoreV1Api.createNamespacedSecret.mock.calls[0][0];
      expect(call.body.stringData).toMatchObject({
        AAP_CONTROLLER_URL: 'https://user-aap.example.com',
        AAP_ORG_NAME: 'UserOrg',
        AAP_USERNAME: 'user',
        AAP_PASSWORD: 'pass', // NOSONAR
      });
      expect(call.body.stringData.AAP_OAUTH_TOKEN).toBeUndefined();
    });

    it('should handle secret already exists error gracefully', async () => {
      mockCoreV1Api.createNamespacedSecret.mockRejectedValue({
        statusCode: 409,
        message: 'Secret already exists',
      });

      await expect(
        kubeService.createProjectSecret(projectId, undefined),
      ).resolves.not.toThrow();
    });

    it('should throw on other errors', async () => {
      const mockError = new Error('Internal server error');
      (mockError as any).statusCode = 500;
      mockCoreV1Api.createNamespacedSecret.mockRejectedValue(mockError);

      await expect(
        kubeService.createProjectSecret(projectId, undefined),
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('getProjectSecret', () => {
    const projectId = 'proj-123';

    it('should retrieve existing secret', async () => {
      const mockSecret = { metadata: { name: 'x2a-project-secret-proj-123' } };
      mockCoreV1Api.readNamespacedSecret.mockResolvedValue(mockSecret);

      const result = await kubeService.getProjectSecret(projectId);

      expect(mockCoreV1Api.readNamespacedSecret).toHaveBeenCalledWith({
        name: `x2a-project-secret-${projectId}`,
        namespace: 'test-namespace',
      });
      expect(result).toEqual(mockSecret);
    });

    it('should return null for non-existent secret', async () => {
      mockCoreV1Api.readNamespacedSecret.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      const result = await kubeService.getProjectSecret(projectId);

      expect(result).toBeNull();
    });

    it('should throw on other errors', async () => {
      const mockError = new Error('Internal server error');
      (mockError as any).statusCode = 500;
      mockCoreV1Api.readNamespacedSecret.mockRejectedValue(mockError);

      await expect(kubeService.getProjectSecret(projectId)).rejects.toThrow(
        'Internal server error',
      );
    });
  });

  describe('deleteProjectSecret', () => {
    const projectId = 'proj-123';

    it('should delete secret successfully', async () => {
      mockCoreV1Api.deleteNamespacedSecret.mockResolvedValue({});

      await kubeService.deleteProjectSecret(projectId);

      expect(mockCoreV1Api.deleteNamespacedSecret).toHaveBeenCalledWith({
        name: `x2a-project-secret-${projectId}`,
        namespace: 'test-namespace',
      });
    });

    it('should handle secret not found gracefully', async () => {
      mockCoreV1Api.deleteNamespacedSecret.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      await expect(
        kubeService.deleteProjectSecret(projectId),
      ).resolves.not.toThrow();
    });
  });

  describe('createJob', () => {
    const params = {
      jobId: 'job-123',
      projectId: 'proj-123',
      projectName: 'Test Project',
      projectAbbrev: 'TP',
      phase: 'init' as const,
      user: 'user:default/test',
      callbackToken: 'callback-token-123', // NOSONAR
      callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
      sourceRepo: {
        url: 'https://github.com/org/source',
        token: 'source-token', // NOSONAR
        branch: 'main',
      },
      targetRepo: {
        url: 'https://github.com/org/target',
        token: 'target-token', // NOSONAR
        branch: 'main',
      },
    };

    beforeEach(() => {
      // Mock createProjectSecret and createJobSecret to succeed
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});
    });

    it('should create project secret before job, and job secret after job with ownerReference', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123', uid: 'uid-123' },
      });

      await kubeService.createJob(params);

      // Should create project secret (LLM + AAP)
      expect(mockCoreV1Api.createNamespacedSecret).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'test-namespace',
          body: expect.objectContaining({
            metadata: expect.objectContaining({
              name: 'x2a-project-secret-proj-123',
            }),
          }),
        }),
      );

      // Should create job secret (Git credentials) with ownerReference to the job
      expect(mockCoreV1Api.createNamespacedSecret).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'test-namespace',
          body: expect.objectContaining({
            metadata: expect.objectContaining({
              name: 'x2a-job-secret-init-job-123',
              ownerReferences: [
                expect.objectContaining({
                  apiVersion: 'batch/v1',
                  kind: 'Job',
                  name: expect.stringMatching(/^job-x2a-init-/),
                  uid: 'uid-123',
                  blockOwnerDeletion: true,
                }),
              ],
            }),
            stringData: expect.objectContaining({
              SOURCE_REPO_URL: 'https://github.com/org/source',
              TARGET_REPO_URL: 'https://github.com/org/target',
            }),
          }),
        }),
      );
    });

    it('should create job with correct structure and mount both secrets', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123', uid: 'uid-123' },
      });

      const result = await kubeService.createJob(params);

      expect(mockBatchV1Api.createNamespacedJob).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        body: expect.objectContaining({
          apiVersion: 'batch/v1',
          kind: 'Job',
          metadata: expect.objectContaining({
            labels: expect.objectContaining({
              'x2a.redhat.com/project-id': 'proj-123',
              'x2a.redhat.com/phase': 'init',
              'x2a.redhat.com/job-id': 'job-123',
            }),
          }),
          spec: expect.objectContaining({
            ttlSecondsAfterFinished: 86400,
            backoffLimit: 3,
            template: expect.objectContaining({
              spec: expect.objectContaining({
                restartPolicy: 'Never',
                containers: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'x2a',
                    envFrom: [
                      { secretRef: { name: 'x2a-project-secret-proj-123' } },
                      { secretRef: { name: 'x2a-job-secret-init-job-123' } },
                    ],
                  }),
                ]),
              }),
            }),
          }),
        }),
      });
      expect(result.k8sJobName).toBeDefined();
    });

    it('should create job secret with ownerReference containing job uid', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123', uid: 'uid-456' },
      });

      await kubeService.createJob(params);

      // Job secret should be the second createNamespacedSecret call (after project secret)
      const calls = mockCoreV1Api.createNamespacedSecret.mock.calls;
      const jobSecretCall = calls.find(
        (c: any) => c[0].body.metadata?.name === 'x2a-job-secret-init-job-123',
      );
      expect(jobSecretCall).toBeDefined();

      const ownerRefs = jobSecretCall![0].body.metadata.ownerReferences;
      expect(ownerRefs).toHaveLength(1);
      expect(ownerRefs[0]).toEqual({
        apiVersion: 'batch/v1',
        kind: 'Job',
        name: expect.stringMatching(/^job-x2a-init-/),
        uid: 'uid-456',
        blockOwnerDeletion: true,
      });
    });

    it('should delete job and throw if job secret creation fails', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123', uid: 'uid-456' },
      });
      mockBatchV1Api.deleteNamespacedJob.mockResolvedValue({});
      // First call succeeds (project secret), second fails (job secret)
      mockCoreV1Api.createNamespacedSecret
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Secret creation failed'));

      await expect(kubeService.createJob(params)).rejects.toThrow(
        'Secret creation failed',
      );

      // Should clean up the orphaned job
      expect(mockBatchV1Api.deleteNamespacedJob).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'test-namespace',
        }),
      );
    });

    it('should delete job and throw if created job has no UID', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
      });
      mockBatchV1Api.deleteNamespacedJob.mockResolvedValue({});

      await expect(kubeService.createJob(params)).rejects.toThrow(
        /created without UID/,
      );

      // Should clean up the orphaned job
      expect(mockBatchV1Api.deleteNamespacedJob).toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    const jobName = 'job-x2a-init-abc123';

    it('should return pending for new job', async () => {
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: {},
      });

      const result = await kubeService.getJobStatus(jobName);

      expect(result).toEqual({
        status: 'pending',
        message: 'Job is pending',
      });
    });

    it('should return running for active job', async () => {
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { active: 1 },
      });

      const result = await kubeService.getJobStatus(jobName);

      expect(result).toEqual({
        status: 'running',
        message: 'Job is running',
      });
    });

    it('should return success for completed job', async () => {
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { succeeded: 1 },
      });

      const result = await kubeService.getJobStatus(jobName);

      expect(result).toEqual({
        status: 'success',
        message: 'Job completed successfully',
      });
    });

    it('should return error for failed job', async () => {
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { failed: 1 },
      });

      const result = await kubeService.getJobStatus(jobName);

      expect(result).toEqual({
        status: 'error',
        message: 'Job failed',
      });
    });

    it('should handle job not found', async () => {
      mockBatchV1Api.readNamespacedJob.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      const result = await kubeService.getJobStatus(jobName);

      expect(result).toEqual({
        status: 'error',
        message: 'Job not found',
      });
    });
  });

  describe('getJobLogs', () => {
    const jobName = 'job-x2a-init-abc123';

    it('should retrieve logs from pod', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'job-x2a-init-abc123-pod' } }],
      });
      mockCoreV1Api.readNamespacedPodLog.mockResolvedValue('Job log output');

      const result = await kubeService.getJobLogs(jobName);

      expect(mockCoreV1Api.listNamespacedPod).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        labelSelector: `job-name=${jobName}`,
      });
      expect(mockCoreV1Api.readNamespacedPodLog).toHaveBeenCalledWith({
        name: 'job-x2a-init-abc123-pod',
        namespace: 'test-namespace',
        follow: false,
      });
      expect(result).toBe('Job log output');
    });

    it('should handle no pods found', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [],
      });

      const result = await kubeService.getJobLogs(jobName);

      expect(result).toBe('');
    });

    it('should support streaming logs', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'job-x2a-init-abc123-pod' } }],
      });
      mockCoreV1Api.readNamespacedPodLog.mockResolvedValue('Streaming logs');

      await kubeService.getJobLogs(jobName, true);

      expect(mockCoreV1Api.readNamespacedPodLog).toHaveBeenCalledWith(
        expect.objectContaining({
          follow: true,
        }),
      );
    });

    it('should return empty string when pod has no name', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: {} }],
      });

      const result = await kubeService.getJobLogs(jobName);

      expect(result).toBe('');
      expect(mockCoreV1Api.readNamespacedPodLog).not.toHaveBeenCalled();
    });

    it('should return empty string when pod phase is Pending', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [
          {
            metadata: { name: 'job-x2a-init-abc123-pod' },
            status: { phase: 'Pending' },
          },
        ],
      });

      const result = await kubeService.getJobLogs(jobName);

      expect(result).toBe('');
      expect(mockCoreV1Api.readNamespacedPodLog).not.toHaveBeenCalled();
    });

    it('should throw on K8s API errors (e.g. pod not ready, network failure)', async () => {
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'job-x2a-init-abc123-pod' } }],
      });
      const apiError = new Error('AnError');
      mockCoreV1Api.readNamespacedPodLog.mockRejectedValue(apiError);

      await expect(kubeService.getJobLogs(jobName)).rejects.toThrow(apiError);
    });

    it('should throw when listNamespacedPod fails', async () => {
      const listError = new Error('Forbidden');
      mockCoreV1Api.listNamespacedPod.mockRejectedValue(listError);

      await expect(kubeService.getJobLogs(jobName)).rejects.toThrow(listError);
    });
  });

  describe('deleteJob', () => {
    const jobName = 'job-x2a-init-abc123';

    it('should delete job with propagation policy', async () => {
      mockBatchV1Api.deleteNamespacedJob.mockResolvedValue({});

      await kubeService.deleteJob(jobName);

      expect(mockBatchV1Api.deleteNamespacedJob).toHaveBeenCalledWith({
        name: jobName,
        namespace: 'test-namespace',
        propagationPolicy: 'Background',
      });
    });

    it('should handle job not found gracefully', async () => {
      mockBatchV1Api.deleteNamespacedJob.mockRejectedValue({
        statusCode: 404,
        message: 'Not found',
      });

      await expect(kubeService.deleteJob(jobName)).resolves.not.toThrow();
    });
  });

  describe('listJobsForProject', () => {
    const projectId = 'proj-123';

    it('should list jobs with correct label selector', async () => {
      mockBatchV1Api.listNamespacedJob.mockResolvedValue({
        items: [
          { metadata: { name: 'job-x2a-init-abc' } },
          { metadata: { name: 'job-x2a-analyze-def' } },
        ],
      });

      const result = await kubeService.listJobsForProject(projectId);

      expect(mockBatchV1Api.listNamespacedJob).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        labelSelector: `x2a.redhat.com/project-id=${projectId}`,
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no jobs found', async () => {
      mockBatchV1Api.listNamespacedJob.mockResolvedValue({
        items: [],
      });

      const result = await kubeService.listJobsForProject(projectId);

      expect(result).toEqual([]);
    });
  });

  describe('namespace resolution', () => {
    it('should use configured namespace when provided', () => {
      // Import here to ensure fresh module
      const { resolveNamespace } = require('./KubeService');

      const result = resolveNamespace('configured-namespace', 'default');

      expect(result).toEqual({
        namespace: 'configured-namespace',
        source: 'config',
      });
    });

    it('should use in-cluster namespace when config not provided and file exists', () => {
      // Mock fs module
      const fsMock = {
        existsSync: jest.fn().mockReturnValue(true),
        readFileSync: jest.fn().mockReturnValue('in-cluster-namespace\n'),
      };
      jest.doMock('node:fs', () => fsMock);

      // Clear module cache and re-import
      jest.resetModules();
      const { resolveNamespace } = require('./KubeService');

      const result = resolveNamespace(undefined, 'default');

      expect(result).toEqual({
        namespace: 'in-cluster-namespace',
        source: 'in-cluster',
      });

      // Clean up
      jest.dontMock('node:fs');
      jest.resetModules();
    });

    it('should use default namespace when in-cluster file does not exist', () => {
      // Mock fs module
      const fsMock = {
        existsSync: jest.fn().mockReturnValue(false),
        readFileSync: jest.fn(),
      };
      jest.doMock('node:fs', () => fsMock);

      // Clear module cache and re-import
      jest.resetModules();
      const { resolveNamespace } = require('./KubeService');

      const result = resolveNamespace(undefined, 'default');

      expect(result).toEqual({
        namespace: 'default',
        source: 'default',
      });

      // Clean up
      jest.dontMock('node:fs');
      jest.resetModules();
    });
  });
});
