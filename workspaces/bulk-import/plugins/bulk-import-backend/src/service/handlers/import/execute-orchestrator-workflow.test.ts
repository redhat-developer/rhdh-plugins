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

import { DiscoveryApi } from '@backstage/plugin-permission-common';

import { DefaultApi } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  OrchestratorWorkflowDao,
  RepositoryDao,
} from '../../../database/repositoryDao';
import { Components, ImportRequest } from '../../../generated/openapi';
import { GithubApiService } from '../../../github';
import { GitlabApiService } from '../../../gitlab';
import { createWorkflowImportJobs } from './execute-orchestrator-workflow';

jest.mock('@red-hat-developer-hub/backstage-plugin-orchestrator-common', () => {
  return {
    ...jest.requireActual(
      '@red-hat-developer-hub/backstage-plugin-orchestrator-common',
    ),
    DefaultApi: jest.fn(),
  };
});

describe('execute-orchestrator-workflow', () => {
  let mockOrchestratorWorkflowDao: jest.Mocked<OrchestratorWorkflowDao>;
  let mockOrchestratorRepositoryDao: jest.Mocked<
    RepositoryDao<'orchestrator_repositories'>
  >;
  let mockDiscovery: DiscoveryApi;
  let mockGithubApiService: GithubApiService;
  let mockGitlabApiService: GitlabApiService;
  let mockOrchestratorApi: jest.Mocked<DefaultApi>;

  beforeEach(() => {
    mockOrchestratorWorkflowDao = {
      insertWorkflow: jest.fn(),
      findWorkflowByRepoId: jest.fn(),
      findWorkflowsByRepositoryId: jest.fn(),
    } as unknown as jest.Mocked<OrchestratorWorkflowDao>;

    mockOrchestratorRepositoryDao = {
      insertRepository: jest.fn(),
      findRepositoryByUrl: jest.fn(),
      findRepositories: jest.fn(),
      deleteRepository: jest.fn(),
    } as unknown as jest.Mocked<RepositoryDao<'orchestrator_repositories'>>;

    mockDiscovery = {
      getBaseUrl: jest
        .fn()
        .mockResolvedValue('https://orchestrator.example.com'),
    } as unknown as DiscoveryApi;

    mockGithubApiService = {
      getCredentials: jest.fn(),
    } as unknown as GithubApiService;

    mockGitlabApiService = {
      getCredentials: jest.fn(),
    } as unknown as GitlabApiService;

    mockOrchestratorApi = {
      executeWorkflow: jest.fn(),
      getInstanceById: jest.fn(),
    } as unknown as jest.Mocked<DefaultApi>;

    (DefaultApi as jest.Mock).mockImplementation(() => mockOrchestratorApi);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflowImportJobs', () => {
    it('should return 400 if requestBody is empty', async () => {
      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        requestBody: [],
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(400);
      expect(result.responseBody).toEqual([]);
    });

    it('should skip repositories without url', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
        } as ImportRequest,
      ];

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      expect(result.responseBody).toEqual([]);
    });

    it('should execute workflow for GitHub repository', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
      ];

      const mockWorkflowId = 'workflow-instance-123';
      const mockToken = 'github-token-123';

      (mockGithubApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: mockToken,
      });

      mockOrchestratorApi.executeWorkflow.mockResolvedValue({
        data: { id: mockWorkflowId },
      } as any);

      mockOrchestratorApi.getInstanceById.mockResolvedValue({
        data: { state: 'active' },
      } as any);

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      expect(mockGithubApiService.getCredentials).toHaveBeenCalledWith(
        'https://github.com/test-org/test-repo',
      );
      expect(mockOrchestratorApi.executeWorkflow).toHaveBeenCalledWith(
        'test-workflow-id',
        expect.objectContaining({
          inputData: {
            owner: 'test-org',
            repo: 'test-repo',
            baseBranch: 'main',
            targetBranch: 'bulk-import-orchestrator',
            approvalTool: 'GIT',
          },
          authTokens: [{ token: mockToken, provider: 'github' }],
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(mockOrchestratorApi.getInstanceById).toHaveBeenCalledWith(
        mockWorkflowId,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer auth-token',
            'Content-Type': 'application/json',
          }),
        }),
      );

      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].repository).toEqual(requestBody[0].repository);
      expect(responseBody[0].workflow?.workflowId).toBe(mockWorkflowId);
      expect(responseBody[0].status).toBe('WORKFLOW_ACTIVE');
    });

    it('should execute workflow for GitLab repository', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://gitlab.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GITLAB',
        },
      ];

      const mockWorkflowId = 'workflow-instance-456';
      const mockToken = 'gitlab-token-456';

      (mockGitlabApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: mockToken,
      });

      mockOrchestratorApi.executeWorkflow.mockResolvedValue({
        data: { id: mockWorkflowId },
      } as any);

      mockOrchestratorApi.getInstanceById.mockResolvedValue({
        data: { state: 'completed' },
      } as any);

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      expect(mockGitlabApiService.getCredentials).toHaveBeenCalledWith(
        'https://gitlab.com/test-org/test-repo',
      );
      expect(mockOrchestratorApi.executeWorkflow).toHaveBeenCalledWith(
        'test-workflow-id',
        expect.objectContaining({
          authTokens: [{ token: mockToken, provider: 'gitlab' }],
        }),
        expect.any(Object),
      );

      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody[0].status).toBe('WORKFLOW_COMPLETED');
    });

    it('should use default approvalTool GIT if not provided', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
        },
      ];

      const mockWorkflowId = 'workflow-instance-789';
      const mockToken = 'github-token-789';

      (mockGithubApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: mockToken,
      });

      mockOrchestratorApi.executeWorkflow.mockResolvedValue({
        data: { id: mockWorkflowId },
      } as any);

      mockOrchestratorApi.getInstanceById.mockResolvedValue({
        data: { state: 'active' },
      } as any);

      await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(mockGithubApiService.getCredentials).toHaveBeenCalled();
      expect(mockGitlabApiService.getCredentials).not.toHaveBeenCalled();
    });

    it('should save repository and workflow to database', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
      ];

      const mockWorkflowId = 'workflow-instance-123';
      const mockRepositoryId = 123;

      (mockGithubApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: 'github-token',
      });

      mockOrchestratorApi.executeWorkflow.mockResolvedValue({
        data: { id: mockWorkflowId },
      } as any);

      mockOrchestratorApi.getInstanceById.mockResolvedValue({
        data: { state: 'active' },
      } as any);

      (
        mockOrchestratorRepositoryDao.insertRepository as jest.Mock
      ).mockResolvedValue(mockRepositoryId);

      (
        mockOrchestratorWorkflowDao.insertWorkflow as jest.Mock
      ).mockResolvedValue(456);

      await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(
        mockOrchestratorRepositoryDao.insertRepository,
      ).toHaveBeenCalledWith(
        'https://github.com/test-org/test-repo',
        mockWorkflowId,
        'GIT',
      );
      expect(mockOrchestratorWorkflowDao.insertWorkflow).toHaveBeenCalledWith(
        mockWorkflowId,
        mockRepositoryId,
      );
    });

    it('should handle errors and return error status', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
      ];

      const errorMessage = 'Failed to execute workflow';
      mockOrchestratorApi.executeWorkflow.mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].errors).toContain(errorMessage);
    });

    it('should return errors array if any workflow fails', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo-1',
            name: 'test-repo-1',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
        {
          repository: {
            url: 'https://github.com/test-org/test-repo-2',
            name: 'test-repo-2',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
      ];

      const mockWorkflowId = 'workflow-instance-123';
      const errorMessage = 'Failed to execute workflow';

      (mockGithubApiService.getCredentials as jest.Mock)
        .mockResolvedValueOnce({ token: 'token-1' })
        .mockResolvedValueOnce({ token: 'token-2' });

      mockOrchestratorApi.executeWorkflow
        .mockResolvedValueOnce({
          data: { id: mockWorkflowId },
        } as any)
        .mockRejectedValueOnce(new Error(errorMessage));

      mockOrchestratorApi.getInstanceById.mockResolvedValue({
        data: { state: 'active' },
      } as any);

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(2);
      const errorImport = responseBody.find(imp => imp.errors?.length);
      expect(errorImport).toBeDefined();
      expect(errorImport?.errors).toContain(errorMessage);
    });

    it('should handle different workflow states correctly', async () => {
      const testCases = [
        { state: 'active', expectedStatus: 'WORKFLOW_ACTIVE' },
        { state: 'completed', expectedStatus: 'WORKFLOW_COMPLETED' },
        { state: 'error', expectedStatus: 'WORKFLOW_ERROR' },
        { state: 'aborted', expectedStatus: 'WORKFLOW_ABORTED' },
        { state: 'suspended', expectedStatus: 'WORKFLOW_SUSPENDED' },
      ];

      for (const testCase of testCases) {
        const requestBody: ImportRequest[] = [
          {
            repository: {
              url: `https://github.com/test-org/test-repo-${testCase.state}`,
              name: `test-repo-${testCase.state}`,
              organization: 'test-org',
              defaultBranch: 'main',
            },
            approvalTool: 'GIT',
          },
        ];

        const mockWorkflowId = `workflow-instance-${testCase.state}`;

        (mockGithubApiService.getCredentials as jest.Mock).mockResolvedValue({
          token: 'github-token',
        });

        mockOrchestratorApi.executeWorkflow.mockResolvedValue({
          data: { id: mockWorkflowId },
        } as any);

        mockOrchestratorApi.getInstanceById.mockResolvedValue({
          data: { state: testCase.state },
        } as any);

        const result = await createWorkflowImportJobs({
          orchestratorWorkflowId: 'test-workflow-id',
          discovery: mockDiscovery,
          token: 'auth-token',
          requestBody,
          orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
          orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
          githubApiService: mockGithubApiService,
          gitlabApiService: mockGitlabApiService,
        });

        const responseBody = result.responseBody as Components.Schemas.Import[];
        expect(responseBody[0].status).toBe(testCase.expectedStatus);
      }
    });

    it('should handle both GitHub and GitLab repositories in same request', async () => {
      const requestBody: ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/github-repo',
            name: 'github-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
        {
          repository: {
            url: 'https://gitlab.com/test-org/gitlab-repo',
            name: 'gitlab-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GITLAB',
        },
      ];

      const mockWorkflowId1 = 'workflow-instance-1';
      const mockWorkflowId2 = 'workflow-instance-2';

      (mockGithubApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: 'github-token',
      });

      (mockGitlabApiService.getCredentials as jest.Mock).mockResolvedValue({
        token: 'gitlab-token',
      });

      mockOrchestratorApi.executeWorkflow
        .mockResolvedValueOnce({
          data: { id: mockWorkflowId1 },
        } as any)
        .mockResolvedValueOnce({
          data: { id: mockWorkflowId2 },
        } as any);

      mockOrchestratorApi.getInstanceById
        .mockResolvedValueOnce({
          data: { state: 'active' },
        } as any)
        .mockResolvedValueOnce({
          data: { state: 'completed' },
        } as any);

      const result = await createWorkflowImportJobs({
        orchestratorWorkflowId: 'test-workflow-id',
        discovery: mockDiscovery,
        token: 'auth-token',
        requestBody,
        orchestratorWorkflowDao: mockOrchestratorWorkflowDao,
        orchestratorRepositoryDao: mockOrchestratorRepositoryDao,
        githubApiService: mockGithubApiService,
        gitlabApiService: mockGitlabApiService,
      });

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(2);
      expect(responseBody[0].workflow?.workflowId).toBe(mockWorkflowId1);
      expect(responseBody[1].workflow?.workflowId).toBe(mockWorkflowId2);
      expect(mockGithubApiService.getCredentials).toHaveBeenCalledTimes(1);
      expect(mockGitlabApiService.getCredentials).toHaveBeenCalledTimes(1);
    });
  });
});
