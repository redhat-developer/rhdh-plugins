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
import { JobResourceBuilder } from './JobResourceBuilder';
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

describe('Integration Tests', () => {
  let kubeService: KubeService;
  let mockConfig: X2AConfig;
  let projectCredentials: ProjectCredentials;

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

    projectCredentials = {
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

    kubeService = KubeService.create({
      logger: mockServices.logger.mock(),
      config: mockConfig,
    });
  });

  describe('Full job lifecycle', () => {
    it('should complete full init job lifecycle: create secret -> create job -> check status -> delete job -> delete secret', async () => {
      const projectId = 'proj-123';
      const jobParams = {
        jobId: 'job-123',
        projectId,
        projectName: 'Test Project',
        phase: 'init' as const,
        user: 'user:default/test',
        callbackToken: 'callback-token-123',
        callbackUrl: 'http://backstage:7007/api/x2a/callback',
      };

      // Step 1: Create project secret
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      await kubeService.createProjectSecret(projectId, projectCredentials);

      expect(mockCoreV1Api.createNamespacedSecret).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        body: expect.objectContaining({
          kind: 'Secret',
          metadata: expect.objectContaining({
            name: `x2a-project-secret-${projectId}`,
          }),
        }),
      });

      // Step 2: Create Kubernetes job
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-abc123' },
      });

      const jobResult = await kubeService.createJob(jobParams);

      expect(jobResult.k8sJobName).toBe('job-x2a-init-abc123');
      expect(mockBatchV1Api.createNamespacedJob).toHaveBeenCalledWith({
        namespace: 'test-namespace',
        body: expect.objectContaining({
          kind: 'Job',
          spec: expect.objectContaining({
            template: expect.objectContaining({
              spec: expect.objectContaining({
                initContainers: expect.arrayContaining([
                  expect.objectContaining({ name: 'git-clone' }),
                ]),
                containers: expect.arrayContaining([
                  expect.objectContaining({ name: 'x2a-convertor' }),
                ]),
              }),
            }),
          }),
        }),
      });

      // Step 3: Check job status (running)
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { active: 1 },
      });

      const runningStatus = await kubeService.getJobStatus(
        jobResult.k8sJobName,
      );

      expect(runningStatus.status).toBe('running');

      // Step 4: Check job status (completed)
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { succeeded: 1 },
      });

      const completedStatus = await kubeService.getJobStatus(
        jobResult.k8sJobName,
      );

      expect(completedStatus.status).toBe('success');

      // Step 5: Get job logs
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'job-x2a-init-abc123-pod' } }],
      });
      mockCoreV1Api.readNamespacedPodLog.mockResolvedValue(
        'Migration completed successfully',
      );

      const logs = await kubeService.getJobLogs(jobResult.k8sJobName);

      expect(logs).toBe('Migration completed successfully');

      // Step 6: Delete the job
      mockBatchV1Api.deleteNamespacedJob.mockResolvedValue({});

      await kubeService.deleteJob(jobResult.k8sJobName);

      expect(mockBatchV1Api.deleteNamespacedJob).toHaveBeenCalledWith({
        name: jobResult.k8sJobName,
        namespace: 'test-namespace',
        propagationPolicy: 'Background',
      });

      // Step 7: Delete the project secret
      mockCoreV1Api.deleteNamespacedSecret.mockResolvedValue({});

      await kubeService.deleteProjectSecret(projectId);

      expect(mockCoreV1Api.deleteNamespacedSecret).toHaveBeenCalledWith({
        name: `x2a-project-secret-${projectId}`,
        namespace: 'test-namespace',
      });
    });

    it('should handle multiple jobs for the same project using the same secret', async () => {
      const projectId = 'proj-456';

      // Create project secret once
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});
      await kubeService.createProjectSecret(projectId, projectCredentials);

      // Create init job
      mockBatchV1Api.createNamespacedJob.mockResolvedValueOnce({
        metadata: { name: 'job-x2a-init-abc123' },
      });

      const initJob = await kubeService.createJob({
        jobId: 'job-init-1',
        projectId,
        projectName: 'Multi-Job Project',
        phase: 'init',
        user: 'user:default/test',
        callbackToken: 'token-init',
        callbackUrl: 'http://backstage:7007/callback',
      });

      // Wait for init to complete
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { succeeded: 1 },
      });

      const initStatus = await kubeService.getJobStatus(initJob.k8sJobName);
      expect(initStatus.status).toBe('success');

      // Create analyze job for a module (using same secret)
      mockBatchV1Api.createNamespacedJob.mockResolvedValueOnce({
        metadata: { name: 'job-x2a-analyze-def456' },
      });

      const analyzeJob = await kubeService.createJob({
        jobId: 'job-analyze-1',
        projectId,
        projectName: 'Multi-Job Project',
        phase: 'analyze',
        user: 'user:default/test',
        callbackToken: 'token-analyze',
        callbackUrl: 'http://backstage:7007/callback',
        moduleId: 'module-1',
        moduleName: 'nginx-cookbook',
      });

      // Create migrate job for the same module (using same secret)
      mockBatchV1Api.createNamespacedJob.mockResolvedValueOnce({
        metadata: { name: 'job-x2a-migrate-ghi789' },
      });

      const migrateJob = await kubeService.createJob({
        jobId: 'job-migrate-1',
        projectId,
        projectName: 'Multi-Job Project',
        phase: 'migrate',
        user: 'user:default/test',
        callbackToken: 'token-migrate',
        callbackUrl: 'http://backstage:7007/callback',
        moduleId: 'module-1',
        moduleName: 'nginx-cookbook',
      });

      // Create publish job (using same secret)
      mockBatchV1Api.createNamespacedJob.mockResolvedValueOnce({
        metadata: { name: 'job-x2a-publish-jkl012' },
      });

      const publishJob = await kubeService.createJob({
        jobId: 'job-publish-1',
        projectId,
        projectName: 'Multi-Job Project',
        phase: 'publish',
        user: 'user:default/test',
        callbackToken: 'token-publish',
        callbackUrl: 'http://backstage:7007/callback',
        moduleId: 'module-1',
        moduleName: 'nginx-cookbook',
      });

      // Verify all jobs were created
      expect(initJob.k8sJobName).toBeDefined();
      expect(analyzeJob.k8sJobName).toBeDefined();
      expect(migrateJob.k8sJobName).toBeDefined();
      expect(publishJob.k8sJobName).toBeDefined();

      // Verify secret was only created once
      expect(mockCoreV1Api.createNamespacedSecret).toHaveBeenCalledTimes(1);

      // Verify all 4 jobs were created
      expect(mockBatchV1Api.createNamespacedJob).toHaveBeenCalledTimes(4);

      // List all jobs for the project
      mockBatchV1Api.listNamespacedJob.mockResolvedValue({
        items: [
          { metadata: { name: initJob.k8sJobName } },
          { metadata: { name: analyzeJob.k8sJobName } },
          { metadata: { name: migrateJob.k8sJobName } },
          { metadata: { name: publishJob.k8sJobName } },
        ],
      });

      const jobs = await kubeService.listJobsForProject(projectId);
      expect(jobs).toHaveLength(4);
    });
  });

  describe('Error handling in integrated flow', () => {
    it('should handle secret creation failure gracefully', async () => {
      const projectId = 'proj-error-1';

      mockCoreV1Api.createNamespacedSecret.mockRejectedValue({
        statusCode: 500,
        message: 'Internal server error',
      });

      await expect(
        kubeService.createProjectSecret(projectId, projectCredentials),
      ).rejects.toThrow();

      // Job creation should not be attempted
      expect(mockBatchV1Api.createNamespacedJob).not.toHaveBeenCalled();
    });

    it('should handle job creation failure after successful secret creation', async () => {
      const projectId = 'proj-error-2';

      // Secret creation succeeds
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});
      await kubeService.createProjectSecret(projectId, projectCredentials);

      // Job creation fails
      mockBatchV1Api.createNamespacedJob.mockRejectedValue({
        statusCode: 500,
        message: 'Failed to create job',
      });

      await expect(
        kubeService.createJob({
          jobId: 'job-error-1',
          projectId,
          projectName: 'Error Project',
          phase: 'init',
          user: 'user:default/test',
          callbackToken: 'token-123',
          callbackUrl: 'http://backstage:7007/callback',
        }),
      ).rejects.toThrow();

      // Secret should still exist and can be retrieved
      mockCoreV1Api.readNamespacedSecret.mockResolvedValue({
        metadata: { name: `x2a-project-secret-${projectId}` },
      });

      const secret = await kubeService.getProjectSecret(projectId);
      expect(secret).toBeDefined();
    });

    it('should handle job failure scenario', async () => {
      const projectId = 'proj-error-3';
      const jobParams = {
        jobId: 'job-error-2',
        projectId,
        projectName: 'Failed Job Project',
        phase: 'init' as const,
        user: 'user:default/test',
        callbackToken: 'token-456',
        callbackUrl: 'http://backstage:7007/callback',
      };

      // Create secret and job
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-failed' },
      });

      await kubeService.createProjectSecret(projectId, projectCredentials);
      const job = await kubeService.createJob(jobParams);

      // Job fails
      mockBatchV1Api.readNamespacedJob.mockResolvedValue({
        status: { failed: 1 },
      });

      const status = await kubeService.getJobStatus(job.k8sJobName);
      expect(status.status).toBe('error');
      expect(status.message).toBe('Job failed');

      // Get error logs
      mockCoreV1Api.listNamespacedPod.mockResolvedValue({
        items: [{ metadata: { name: 'job-x2a-init-failed-pod' } }],
      });
      mockCoreV1Api.readNamespacedPodLog.mockResolvedValue(
        'Error: LLM service unavailable',
      );

      const logs = await kubeService.getJobLogs(job.k8sJobName);
      expect(logs).toContain('LLM service unavailable');
    });
  });

  describe('User-provided AAP credentials integration', () => {
    it('should create secret with user-provided AAP credentials instead of config', async () => {
      const projectId = 'proj-user-aap-1';
      const credsWithUserAAP: ProjectCredentials = {
        ...projectCredentials,
        aapCredentials: {
          url: 'https://user-aap.example.com',
          orgName: 'UserOrganization',
          username: 'user-admin',
          password: 'user-password',
        },
      };

      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});

      await kubeService.createProjectSecret(projectId, credsWithUserAAP);

      const secretCall = mockCoreV1Api.createNamespacedSecret.mock.calls[0][0];
      expect(secretCall.body.stringData.AAP_CONTROLLER_URL).toBe(
        'https://user-aap.example.com',
      );
      expect(secretCall.body.stringData.AAP_ORG_NAME).toBe('UserOrganization');
      expect(secretCall.body.stringData.AAP_USERNAME).toBe('user-admin');
      expect(secretCall.body.stringData.AAP_PASSWORD).toBe('user-password');
      expect(secretCall.body.stringData.AAP_OAUTH_TOKEN).toBeUndefined();

      // Verify annotation indicates user-provided AAP
      expect(secretCall.body.metadata.annotations).toMatchObject({
        'x2a.redhat.com/aap-source': 'user-provided',
      });

      // Job can now be created and will use the user-provided AAP credentials
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-user-aap' },
      });

      const job = await kubeService.createJob({
        jobId: 'job-user-aap-1',
        projectId,
        projectName: 'User AAP Project',
        phase: 'init',
        user: 'user:default/test',
        callbackToken: 'token-789',
        callbackUrl: 'http://backstage:7007/callback',
      });

      expect(job.k8sJobName).toBe('job-x2a-init-user-aap');

      // Job spec should reference the same secret
      const jobCall = mockBatchV1Api.createNamespacedJob.mock.calls[0][0];
      expect(
        jobCall.body.spec.template.spec.containers[0].envFrom,
      ).toContainEqual({
        secretRef: { name: `x2a-project-secret-${projectId}` },
      });
    });
  });

  describe('JobResourceBuilder integration', () => {
    it('should build secret that KubeService can use', () => {
      const projectId = 'proj-builder-1';

      const secret = JobResourceBuilder.buildProjectSecret(
        projectId,
        projectCredentials,
        mockConfig,
      );

      // Verify secret structure is correct
      expect(secret.metadata?.name).toBe(`x2a-project-secret-${projectId}`);
      expect(secret.stringData).toHaveProperty('LLM_MODEL');
      expect(secret.stringData).toHaveProperty('AWS_REGION');
      expect(secret.stringData).toHaveProperty('SOURCE_REPO_URL');
      expect(secret.stringData).toHaveProperty('TARGET_REPO_URL');
      expect(secret.stringData).toHaveProperty('AAP_CONTROLLER_URL');
    });

    it('should build job spec that KubeService can use', () => {
      const jobSpec = JobResourceBuilder.buildJobSpec(
        {
          jobId: 'job-builder-1',
          projectId: 'proj-builder-1',
          projectName: 'Builder Test',
          phase: 'init',
          user: 'user:default/test',
          callbackToken: 'token-builder',
          callbackUrl: 'http://backstage:7007/callback',
        },
        mockConfig,
      );

      // Verify job structure is correct
      expect(jobSpec.metadata?.name).toMatch(/^job-x2a-init-[a-f0-9]{8}$/);
      expect(jobSpec.spec?.template.spec?.initContainers).toHaveLength(1);
      expect(jobSpec.spec?.template.spec?.containers).toHaveLength(1);
      expect(jobSpec.spec?.template.spec?.volumes).toHaveLength(1);
    });

    it('should create job with all phases using JobResourceBuilder', () => {
      const phases: Array<'init' | 'analyze' | 'migrate' | 'publish'> = [
        'init',
        'analyze',
        'migrate',
        'publish',
      ];

      phases.forEach(phase => {
        const jobSpec = JobResourceBuilder.buildJobSpec(
          {
            jobId: `job-${phase}-1`,
            projectId: 'proj-phases-1',
            projectName: 'Phases Test',
            phase,
            user: 'user:default/test',
            callbackToken: `token-${phase}`,
            callbackUrl: 'http://backstage:7007/callback',
            ...(phase !== 'init' && {
              moduleId: 'module-1',
              moduleName: 'test-module',
            }),
          },
          mockConfig,
        );

        expect(jobSpec.metadata?.labels?.['x2a.redhat.com/phase']).toBe(phase);
        expect(jobSpec.spec?.template.spec?.containers[0].env).toContainEqual({
          name: 'PHASE',
          value: phase,
        });
      });
    });
  });

  describe('Resource cleanup', () => {
    it('should cleanup all resources for a project', async () => {
      const projectId = 'proj-cleanup-1';

      // Create secret
      mockCoreV1Api.createNamespacedSecret.mockResolvedValue({});
      await kubeService.createProjectSecret(projectId, projectCredentials);

      // Create multiple jobs
      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-init-cleanup1' },
      });
      const job1 = await kubeService.createJob({
        jobId: 'job-cleanup-1',
        projectId,
        projectName: 'Cleanup Test',
        phase: 'init',
        user: 'user:default/test',
        callbackToken: 'token-1',
        callbackUrl: 'http://backstage:7007/callback',
      });

      mockBatchV1Api.createNamespacedJob.mockResolvedValue({
        metadata: { name: 'job-x2a-analyze-cleanup2' },
      });
      const job2 = await kubeService.createJob({
        jobId: 'job-cleanup-2',
        projectId,
        projectName: 'Cleanup Test',
        phase: 'analyze',
        user: 'user:default/test',
        callbackToken: 'token-2',
        callbackUrl: 'http://backstage:7007/callback',
        moduleId: 'module-1',
        moduleName: 'test-module',
      });

      // Cleanup: delete all jobs
      mockBatchV1Api.deleteNamespacedJob.mockResolvedValue({});
      await kubeService.deleteJob(job1.k8sJobName);
      await kubeService.deleteJob(job2.k8sJobName);

      // Cleanup: delete secret
      mockCoreV1Api.deleteNamespacedSecret.mockResolvedValue({});
      await kubeService.deleteProjectSecret(projectId);

      // Verify all cleanup calls were made
      expect(mockBatchV1Api.deleteNamespacedJob).toHaveBeenCalledTimes(2);
      expect(mockCoreV1Api.deleteNamespacedSecret).toHaveBeenCalledTimes(1);
    });
  });
});
