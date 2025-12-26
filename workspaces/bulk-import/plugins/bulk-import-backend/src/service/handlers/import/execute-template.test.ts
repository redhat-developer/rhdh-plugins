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

import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import { Config } from '@backstage/config';

import {
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from '../../../database/repositoryDao';
import { Components } from '../../../generated/openapi';
import { GithubApiService } from '../../../github';
import { createTaskImportJobs, processTaskEvents } from './execute-template';

// Mock fetch globally
global.fetch = jest.fn();

// Mock createEventSource
const mockCreateEventSource = jest.fn();
jest.mock('eventsource-client', () => ({
  createEventSource: jest.fn((...args: any[]) =>
    mockCreateEventSource(...args),
  ),
}));

// Mock getCatalogFilename
jest.mock('../../../catalog/catalogUtils', () => ({
  getCatalogFilename: jest.fn(() => 'catalog-info.yaml'),
}));

describe('execute-template', () => {
  let mockRepositoryDao: jest.Mocked<RepositoryDao<'repositories'>>;
  let mockTaskDao: jest.Mocked<ScaffolderTaskDao>;
  let mockTaskLocationsDao: jest.Mocked<TaskLocationsDao>;
  let mockDiscovery: DiscoveryService;
  let mockAuth: AuthService;
  let mockConfig: Config;
  let mockGithubApiService: GithubApiService;
  let logger: LoggerService;

  beforeEach(() => {
    mockRepositoryDao = {
      insertRepository: jest.fn(),
      findRepositoryByUrl: jest.fn(),
      findRepositories: jest.fn(),
      deleteRepository: jest.fn(),
    } as unknown as jest.Mocked<RepositoryDao<'repositories'>>;

    mockTaskDao = {
      insertTask: jest.fn(),
      findTaskById: jest.fn(),
      findTasksByRepositoryId: jest.fn(),
      updateTaskExecutedAt: jest.fn(),
    } as unknown as jest.Mocked<ScaffolderTaskDao>;

    mockTaskLocationsDao = {
      addTaskLocation: jest.fn(),
      findLocationsByTaskId: jest.fn(),
      deleteLocationsByTaskId: jest.fn(),
    } as unknown as jest.Mocked<TaskLocationsDao>;

    logger = mockServices.logger.mock();

    mockDiscovery = {
      getBaseUrl: jest.fn().mockResolvedValue('https://scaffolder.example.com'),
    } as unknown as DiscoveryService;

    mockAuth = {
      getPluginRequestToken: jest.fn().mockResolvedValue({
        token: 'scaffolder-token',
      }),
      getOwnServiceCredentials: jest.fn().mockResolvedValue({}),
    } as unknown as AuthService;

    mockConfig = {
      getOptionalString: jest.fn(),
    } as unknown as Config;

    mockGithubApiService = {
      updatePullRequest: jest.fn(),
      getPullRequest: jest.fn(),
      createOrUpdateFileInBranch: jest.fn(),
    } as unknown as GithubApiService;

    jest.clearAllMocks();
    mockCreateEventSource.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockCreateEventSource.mockClear();
  });

  describe('createTaskImportJobs', () => {
    it('should return 400 if importRequests is empty', async () => {
      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        [],
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(400);
      expect(result.responseBody).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(
        'Missing import requests from request body',
      );
    });

    it('should handle pull request update when PR URL is provided', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
          github: {
            pullRequest: {
              url: 'https://github.com/test-org/test-repo/pull/123',
              number: 123,
              title: 'Test PR',
              body: 'PR Body',
            },
          },
        },
      ];

      (mockGithubApiService.updatePullRequest as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockGithubApiService.getPullRequest as jest.Mock).mockResolvedValue({
        prBranch: 'bulk-import-branch',
      });

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].status).toBe('WAIT_PR_APPROVAL');
      expect(responseBody[0].github?.pullRequest?.number).toBe(123);
      expect(mockGithubApiService.updatePullRequest).toHaveBeenCalledWith(
        'https://github.com/test-org/test-repo',
        123,
        'Test PR',
        'PR Body',
      );
    });

    it('should create new scaffolder task when no PR URL is provided', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
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

      const mockTaskId = 'task-123';
      const mockTaskStatus = 'processing';
      const mockCreatedAt = '2024-01-01T00:00:00Z';
      const mockRepositoryId = 123;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: mockTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            id: mockTaskId,
            status: mockTaskStatus,
            createdAt: mockCreatedAt,
          }),
        });

      (mockRepositoryDao.insertRepository as jest.Mock).mockResolvedValue(
        mockRepositoryId,
      );

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].task?.taskId).toBe(mockTaskId);
      expect(responseBody[0].status).toBe('TASK_PROCESSING');
      expect(responseBody[0].lastUpdate).toBe(mockCreatedAt);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://scaffolder.example.com/v2/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer scaffolder-token',
          }),
          body: expect.stringContaining('template-ref'),
        }),
      );

      expect(mockRepositoryDao.insertRepository).toHaveBeenCalledWith(
        'https://github.com/test-org/test-repo',
        mockTaskId,
        'GIT',
      );
      expect(mockTaskDao.insertTask).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryId: mockRepositoryId,
          taskId: mockTaskId,
          scaffolderOptions: expect.any(Object),
          executedAt: expect.any(Date),
        }),
      );
    });

    it('should handle task creation errors', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
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

      const errorMessage = 'Failed to start scaffolder task';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(
        responseBody[0].errors?.some(err => err.includes(errorMessage)),
      ).toBe(true);
    });

    it('should handle PR update errors', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
          github: {
            pullRequest: {
              url: 'https://github.com/test-org/test-repo/pull/123',
              number: 123,
              title: 'Test PR',
              body: 'PR Body',
            },
          },
        },
      ];

      const errorMessage = 'Failed to update PR';
      (mockGithubApiService.updatePullRequest as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(1);
      expect(responseBody[0].errors).toBeDefined();
      expect(responseBody[0].errors?.length).toBeGreaterThan(0);
      expect(
        responseBody[0].errors?.some(err => err.includes(errorMessage)),
      ).toBe(true);
    });

    it('should use default approvalTool GIT if not provided', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
        },
      ];

      const mockTaskId = 'task-123';
      const mockRepositoryId = 123;

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: mockTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            id: mockTaskId,
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        });

      (mockRepositoryDao.insertRepository as jest.Mock).mockResolvedValue(
        mockRepositoryId,
      );

      await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(mockRepositoryDao.insertRepository).toHaveBeenCalledWith(
        'https://github.com/test-org/test-repo',
        expect.any(String),
        'GIT',
      );
    });

    it('should create catalog info file in PR branch when catalogInfoContent is provided', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/test-repo',
            name: 'test-repo',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
          github: {
            pullRequest: {
              url: 'https://github.com/test-org/test-repo/pull/123',
              number: 123,
              title: 'Test PR',
              body: 'PR Body',
            },
          },
          catalogInfoContent:
            'apiVersion: backstage.io/v1alpha1\nkind: Component',
        },
      ];

      (mockGithubApiService.updatePullRequest as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockGithubApiService.getPullRequest as jest.Mock).mockResolvedValue({
        prBranch: 'bulk-import-branch',
      });
      (
        mockGithubApiService.createOrUpdateFileInBranch as jest.Mock
      ).mockResolvedValue(undefined);

      await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(
        mockGithubApiService.createOrUpdateFileInBranch,
      ).toHaveBeenCalledWith(
        'test-org',
        'test-repo',
        'bulk-import-branch',
        'catalog-info.yaml',
        'apiVersion: backstage.io/v1alpha1\nkind: Component',
      );
    });

    it('should return errors array if any task fails', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
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

      const mockTaskId = 'task-123';
      const errorMessage = 'Failed to start scaffolder task';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: mockTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            id: mockTaskId,
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        });

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(2);
      const errorImport = responseBody.find(imp => imp.errors?.length);
      expect(errorImport).toBeDefined();
      expect(errorImport?.errors?.some(err => err.includes(errorMessage))).toBe(
        true,
      );
    });

    it('should process multiple repositories correctly', async () => {
      const importRequests: Components.Schemas.ImportRequest[] = [
        {
          repository: {
            url: 'https://github.com/test-org/repo-1',
            name: 'repo-1',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
        {
          repository: {
            url: 'https://github.com/test-org/repo-2',
            name: 'repo-2',
            organization: 'test-org',
            defaultBranch: 'main',
          },
          approvalTool: 'GIT',
        },
      ];

      const mockTaskId1 = 'task-1';
      const mockTaskId2 = 'task-2';

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: mockTaskId1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            id: mockTaskId1,
            status: 'processing',
            createdAt: '2024-01-01T00:00:00Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ id: mockTaskId2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            id: mockTaskId2,
            status: 'completed',
            createdAt: '2024-01-02T00:00:00Z',
          }),
        });

      const result = await createTaskImportJobs(
        'template-ref',
        mockDiscovery,
        logger,
        mockAuth,
        mockConfig,
        mockRepositoryDao,
        mockTaskDao,
        mockTaskLocationsDao,
        importRequests,
        mockGithubApiService,
      );

      expect(result.statusCode).toBe(202);
      const responseBody = result.responseBody as Components.Schemas.Import[];
      expect(responseBody).toHaveLength(2);
      expect(responseBody[0].task?.taskId).toBe(mockTaskId1);
      expect(responseBody[1].task?.taskId).toBe(mockTaskId2);
    });
  });

  describe('processTaskEvents', () => {
    it('should process events and save locations to database', async () => {
      const events = [
        {
          data: JSON.stringify({
            id: 1,
            taskId: 'task-123',
            type: 'log',
            body: {
              message:
                'Registering component:default/my-component in the catalog',
            },
          }),
        },
        {
          data: JSON.stringify({
            id: 2,
            taskId: 'task-123',
            type: 'completion',
            body: { message: 'Task completed' },
          }),
        },
      ];

      const mockEventSource = {
        [Symbol.asyncIterator]: async function* () {
          for (const event of events) {
            yield event;
          }
        },
        close: jest.fn(),
      };

      mockCreateEventSource.mockReturnValue(mockEventSource);

      await processTaskEvents(
        'task-123',
        'https://scaffolder.example.com',
        'token',
        logger,
        mockTaskLocationsDao,
      );

      expect(mockCreateEventSource).toHaveBeenCalledWith({
        url: 'https://scaffolder.example.com/v2/tasks/task-123/eventstream',
        headers: {
          Authorization: 'Bearer token',
        },
      });

      expect(mockTaskLocationsDao.addTaskLocation).toHaveBeenCalledWith(
        'task-123',
        'component:default/my-component',
      );
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should handle events without location registration', async () => {
      const asyncGenerator = async function* () {
        yield {
          data: JSON.stringify({
            id: 1,
            taskId: 'task-123',
            type: 'log',
            body: {
              message: 'Some other log message',
            },
          }),
        };
        yield {
          data: JSON.stringify({
            id: 2,
            taskId: 'task-123',
            type: 'completion',
            body: { message: 'Task completed' },
          }),
        };
      };
      const mockEventSource = {
        [Symbol.asyncIterator]: asyncGenerator,
        close: jest.fn(),
      };

      mockCreateEventSource.mockReturnValue(mockEventSource);

      await processTaskEvents(
        'task-123',
        'https://scaffolder.example.com',
        'token',
        logger,
        mockTaskLocationsDao,
      );

      expect(mockTaskLocationsDao.addTaskLocation).not.toHaveBeenCalled();
    });

    it('should handle parse errors gracefully', async () => {
      const asyncGenerator = async function* () {
        yield {
          data: 'invalid json',
        };
        yield {
          data: JSON.stringify({
            id: 2,
            taskId: 'task-123',
            type: 'completion',
            body: { message: 'Task completed' },
          }),
        };
      };
      const mockEventSource = {
        [Symbol.asyncIterator]: asyncGenerator,
        close: jest.fn(),
      };

      mockCreateEventSource.mockReturnValue(mockEventSource);

      await processTaskEvents(
        'task-123',
        'https://scaffolder.example.com',
        'token',
        logger,
        mockTaskLocationsDao,
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to parse SSE event',
        expect.any(Error),
      );
    });

    it('should handle SSE errors gracefully', async () => {
      const asyncGenerator = async function* () {
        yield undefined;
        throw new Error('SSE connection error');
      };
      const mockEventSource = {
        [Symbol.asyncIterator]: asyncGenerator,
        close: jest.fn(),
      };

      mockCreateEventSource.mockReturnValue(mockEventSource);

      await processTaskEvents(
        'task-123',
        'https://scaffolder.example.com',
        'token',
        logger,
        mockTaskLocationsDao,
      );

      expect(logger.error).toHaveBeenCalledWith('SSE error', expect.any(Error));
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
});
