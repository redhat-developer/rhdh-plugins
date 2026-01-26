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
import { KubeService } from './KubeService';
import { X2AConfig, ProjectCredentials } from './types';
import * as k8sClientModule from './makeK8sClient';

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

  beforeEach(() => {
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
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          accessKeyId: 'AKIA_TEST',
          secretAccessKey: 'test-secret-key',
        },
        aap: {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          oauthToken: 'test-oauth-token',
        },
      },
    };

    kubeService = KubeService.create({
      logger: mockServices.logger.mock(),
      config: mockConfig,
    });
  });

  describe('createProjectSecret', () => {
    const projectId = 'proj-123';
    const credentials: ProjectCredentials = {
      sourceRepo: {
        url: 'https://github.com/org/source',
        token: 'source-token',
        branch: 'main',
      },
      targetRepo: {
        url: 'https://github.com/org/target',
        token: 'target-token',
        branch: 'main',
      },
    };

    it('should create secret with correct structure', async () => {
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      await kubeService.createProjectSecret(projectId, credentials);

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
            AWS_SECRET_ACCESS_KEY: 'test-secret-key',
            AAP_CONTROLLER_URL: 'https://aap.example.com',
            AAP_ORG_NAME: 'TestOrg',
            AAP_OAUTH_TOKEN: 'test-oauth-token',
            SOURCE_REPO_URL: 'https://github.com/org/source',
            SOURCE_REPO_TOKEN: 'source-token',
            SOURCE_REPO_BRANCH: 'main',
            TARGET_REPO_URL: 'https://github.com/org/target',
            TARGET_REPO_TOKEN: 'target-token',
            TARGET_REPO_BRANCH: 'main',
          }),
        }),
      });
    });

    it('should use user-provided AAP credentials over config', async () => {
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      const credsWithAAP: ProjectCredentials = {
        ...credentials,
        aapCredentials: {
          url: 'https://user-aap.example.com',
          orgName: 'UserOrg',
          username: 'user',
          password: 'pass',
        },
      };

      await kubeService.createProjectSecret(projectId, credsWithAAP);

      const call = mockCoreV1Api.createNamespacedSecret.mock.calls[0][0];
      expect(call.body.stringData).toMatchObject({
        AAP_CONTROLLER_URL: 'https://user-aap.example.com',
        AAP_ORG_NAME: 'UserOrg',
        AAP_USERNAME: 'user',
        AAP_PASSWORD: 'pass',
      });
      expect(call.body.stringData.AAP_OAUTH_TOKEN).toBeUndefined();
    });

    it('should handle secret already exists error gracefully', async () => {
      mockCoreV1Api.createNamespacedSecret.mockRejectedValue({
        statusCode: 409,
        message: 'Secret already exists',
      });

      await expect(
        kubeService.createProjectSecret(projectId, credentials),
      ).resolves.not.toThrow();
    });

    it('should throw on other errors', async () => {
      mockCoreV1Api.createNamespacedSecret.mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      });

      await expect(
        kubeService.createProjectSecret(projectId, credentials),
      ).rejects.toThrow();
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
      mockCoreV1Api.readNamespacedSecret.mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      });

      await expect(kubeService.getProjectSecret(projectId)).rejects.toThrow();
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
      phase: 'init' as const,
      user: 'user:default/test',
      callbackToken: 'callback-token-123',
      callbackUrl: 'http://backstage:7007/api/x2a/callback',
    };

    it('should create job with correct structure', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
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
                initContainers: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'git-clone',
                  }),
                ]),
                containers: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'x2a-convertor',
                  }),
                ]),
                volumes: expect.arrayContaining([
                  expect.objectContaining({
                    name: 'workspace',
                  }),
                ]),
              }),
            }),
          }),
        }),
      });
      expect(result.k8sJobName).toBeDefined();
    });

    it('should include init container for git clone', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
      });

      await kubeService.createJob(params);

      const call = mockBatchV1Api.createNamespacedJob.mock.calls[0][0];
      const initContainers = call.body.spec.template.spec.initContainers;

      expect(initContainers).toHaveLength(1);
      expect(initContainers[0]).toMatchObject({
        name: 'git-clone',
        image: 'alpine/git:latest',
      });
      expect(initContainers[0].args[0]).toContain('git clone');
    });

    it('should mount workspace volume correctly', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
      });

      await kubeService.createJob(params);

      const call = mockBatchV1Api.createNamespacedJob.mock.calls[0][0];
      const spec = call.body.spec.template.spec;

      // Check init container has volume mount
      expect(spec.initContainers[0].volumeMounts).toContainEqual({
        name: 'workspace',
        mountPath: '/workspace',
      });

      // Check main container has volume mount
      expect(spec.containers[0].volumeMounts).toContainEqual({
        name: 'workspace',
        mountPath: '/workspace',
      });

      // Check volume is defined
      expect(spec.volumes).toContainEqual({
        name: 'workspace',
        emptyDir: {},
      });
    });

    it('should set correct environment variables', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
      });

      await kubeService.createJob(params);

      const call = mockBatchV1Api.createNamespacedJob.mock.calls[0][0];
      const container = call.body.spec.template.spec.containers[0];

      expect(container.env).toEqual(
        expect.arrayContaining([
          { name: 'PHASE', value: 'init' },
          { name: 'PROJECT_ID', value: 'proj-123' },
          { name: 'CALLBACK_TOKEN', value: 'callback-token-123' },
          {
            name: 'CALLBACK_URL',
            value: 'http://backstage:7007/api/x2a/callback',
          },
        ]),
      );
    });

    it('should include module info for non-init phases', async () => {
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-analyze-abc123' },
      });

      await kubeService.createJob({
        ...params,
        phase: 'analyze',
        moduleId: 'module-123',
        moduleName: 'nginx-cookbook',
      });

      const call = mockBatchV1Api.createNamespacedJob.mock.calls[0][0];
      const container = call.body.spec.template.spec.containers[0];

      expect(container.env).toEqual(
        expect.arrayContaining([
          { name: 'MODULE_ID', value: 'module-123' },
          { name: 'MODULE_NAME', value: 'nginx-cookbook' },
        ]),
      );
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
});
