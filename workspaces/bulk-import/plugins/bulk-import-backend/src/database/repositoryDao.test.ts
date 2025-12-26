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

import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  mockServices,
  TestDatabases,
  type TestDatabaseId,
} from '@backstage/backend-test-utils';

import { Knex } from 'knex';

import { migrate } from './migration';
import {
  OrchestratorWorkflowDao,
  paginateQuery,
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from './repositoryDao';

const databases = TestDatabases.create({
  ids: ['POSTGRES_15', 'SQLITE_3'],
});

async function createDatabase(databaseId: TestDatabaseId) {
  const knex = await databases.init(databaseId);
  const mockDatabaseService = mockServices.database.mock({
    getClient: async () => knex,
    migrations: { skip: false },
  });
  await migrate(mockDatabaseService);
  return knex;
}

describe('repositoryDao', () => {
  describe('paginateQuery', () => {
    let mockQueryBuilder: jest.Mocked<Knex.QueryBuilder<any, any[]>>;
    let mockClone: jest.MockedFunction<any>;
    let mockWhereILike: jest.MockedFunction<any>;
    let mockWhereLike: jest.MockedFunction<any>;
    let mockClearSelect: jest.MockedFunction<any>;
    let mockClearOrder: jest.MockedFunction<any>;
    let mockCount: jest.MockedFunction<any>;
    let mockLimit: jest.MockedFunction<any>;
    let mockOffset: jest.MockedFunction<any>;

    beforeEach(() => {
      mockClone = jest.fn();
      mockWhereILike = jest.fn();
      mockWhereLike = jest.fn();
      mockClearSelect = jest.fn();
      mockClearOrder = jest.fn();
      mockCount = jest.fn();
      mockLimit = jest.fn();
      mockOffset = jest.fn();

      mockQueryBuilder = {
        clone: mockClone,
        whereILike: mockWhereILike,
        whereLike: mockWhereLike,
        clearSelect: mockClearSelect,
        clearOrder: mockClearOrder,
        count: mockCount,
        limit: mockLimit,
        offset: mockOffset,
        client: {
          dialect: 'postgres',
        },
      } as unknown as jest.Mocked<Knex.QueryBuilder<any, any[]>>;

      mockClone.mockReturnValue(mockQueryBuilder);
      mockWhereILike.mockReturnValue(mockQueryBuilder);
      mockWhereLike.mockReturnValue(mockQueryBuilder);
      mockClearSelect.mockReturnValue(mockQueryBuilder);
      mockClearOrder.mockReturnValue(mockQueryBuilder);
      mockLimit.mockReturnValue(mockQueryBuilder);
      mockOffset.mockReturnValue(mockQueryBuilder);
    });

    it('should paginate query with default parameters', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      const mockCountResult = [{ count: '10' }];

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(mockQueryBuilder);

      expect(result).toEqual({
        data: mockRows,
        page: 1,
        size: 10,
        total: 10,
        totalPages: 1,
      });
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
    });

    it('should paginate query with custom page and size', async () => {
      const mockRows = [{ id: 2, name: 'test2' }];
      const mockCountResult = [{ count: '25' }];

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(mockQueryBuilder, 2, 5);

      expect(result).toEqual({
        data: mockRows,
        page: 2,
        size: 5,
        total: 25,
        totalPages: 5,
      });
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(mockOffset).toHaveBeenCalledWith(5);
    });

    it('should apply search filter for postgres with whereILike', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      const mockCountResult = [{ count: '10' }];

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(mockQueryBuilder, 1, 10, {
        column: 'url',
        term: 'search',
      });

      expect(result).toEqual({
        data: mockRows,
        page: 1,
        size: 10,
        total: 10,
        totalPages: 1,
      });
      expect(mockWhereILike).toHaveBeenCalledWith('url', '%search%');
      expect(mockWhereLike).not.toHaveBeenCalled();
    });

    it('should apply search filter for non-postgres with whereLike', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      const mockCountResult = [{ count: '10' }];
      const nonPostgresQueryBuilder = {
        ...mockQueryBuilder,
        client: { dialect: 'sqlite3' },
      } as unknown as jest.Mocked<Knex.QueryBuilder<any, any[]>>;

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(nonPostgresQueryBuilder, 1, 10, {
        column: 'url',
        term: 'search',
      });

      expect(result).toEqual({
        data: mockRows,
        page: 1,
        size: 10,
        total: 10,
        totalPages: 1,
      });
      expect(mockWhereLike).toHaveBeenCalledWith('url', '%search%');
    });

    it('should not apply search filter when term is empty', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      const mockCountResult = [{ count: '10' }];

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(mockQueryBuilder, 1, 10, {
        column: 'url',
        term: '',
      });

      expect(result).toEqual({
        data: mockRows,
        page: 1,
        size: 10,
        total: 10,
        totalPages: 1,
      });
      expect(mockWhereILike).not.toHaveBeenCalled();
      expect(mockWhereLike).not.toHaveBeenCalled();
    });

    it('should calculate totalPages correctly', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      const mockCountResult = [{ count: '23' }];

      mockCount.mockResolvedValue(mockCountResult);
      mockOffset.mockResolvedValue(mockRows);

      const result = await paginateQuery(mockQueryBuilder, 1, 10);

      expect(result).toEqual({
        data: mockRows,
        page: 1,
        size: 10,
        total: 23,
        totalPages: 3,
      });
    });
  });

  describe('RepositoryDao', () => {
    let knex: Knex;
    let mockLogger: LoggerService;
    let repositoryDao: RepositoryDao<'repositories'>;

    beforeEach(async () => {
      knex = await createDatabase('SQLITE_3');
      mockLogger = mockServices.logger.mock();
      repositoryDao = new RepositoryDao(knex, mockLogger, 'repositories');
    });

    afterEach(async () => {
      await knex.destroy();
    });

    describe('findRepositories', () => {
      it('should find repositories with pagination', async () => {
        await knex('repositories').insert([
          { url: 'https://github.com/test/repo1', approvalTool: 'github' },
          { url: 'https://github.com/test/repo2', approvalTool: 'gitlab' },
        ]);

        const result = await repositoryDao.findRepositories(1, 10);

        expect(result.data).toHaveLength(2);
        expect(result.page).toBe(1);
        expect(result.size).toBe(10);
        expect(result.total).toBe(2);
        expect(result.totalPages).toBe(1);
        expect(result.data[0]).toMatchObject({
          url: 'https://github.com/test/repo1',
          approvalTool: 'github',
        });
        expect(result.data[1]).toMatchObject({
          url: 'https://github.com/test/repo2',
          approvalTool: 'gitlab',
        });
      });

      it('should find repositories with search term', async () => {
        await knex('repositories').insert([
          { url: 'https://github.com/test/repo1', approvalTool: 'github' },
          { url: 'https://github.com/test/repo2', approvalTool: 'gitlab' },
        ]);

        const result = await repositoryDao.findRepositories(1, 10, 'repo1');

        expect(result.data).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.data[0].url).toContain('repo1');
      });

      it('should log debug message when finding repositories', async () => {
        await repositoryDao.findRepositories(2, 5, 'search');

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Fetching repositories page=2, size=5, search=search',
        );
      });

      it('should handle pagination correctly', async () => {
        await knex('repositories').insert([
          { url: 'https://github.com/test/repo1', approvalTool: 'github' },
          { url: 'https://github.com/test/repo2', approvalTool: 'gitlab' },
          { url: 'https://github.com/test/repo3', approvalTool: 'github' },
        ]);

        const result = await repositoryDao.findRepositories(1, 2);

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(3);
        expect(result.totalPages).toBe(2);
      });
    });

    describe('insertRepository', () => {
      it('should return existing repository id if repository exists', async () => {
        const [insertedRepo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const result = await repositoryDao.insertRepository(
          'https://github.com/test/repo',
          'task-123',
          'github',
        );

        expect(result).toBe(insertedRepo.id);
        const count = await knex('repositories')
          .where({ url: 'https://github.com/test/repo' })
          .count('* as count');
        expect(Number(count[0].count)).toBe(1);
      });

      it('should insert new repository if it does not exist', async () => {
        const result = await repositoryDao.insertRepository(
          'https://github.com/test/new-repo',
          'task-123',
          'gitlab',
        );

        expect(result).toBeGreaterThan(0);
        const repo = await knex('repositories')
          .where({ url: 'https://github.com/test/new-repo' })
          .first();
        expect(repo).toBeDefined();
        expect(repo?.approvalTool).toBe('gitlab');
      });

      it('should log debug message when inserting repository', async () => {
        await repositoryDao.insertRepository(
          'https://github.com/test/repo',
          'task-123',
          'github',
        );

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Saving repository https://github.com/test/repo for task/workflow task-123 to database..',
        );
      });
    });

    describe('findRepositoryByUrl', () => {
      it('should find repository by url', async () => {
        await knex('repositories').insert({
          url: 'https://github.com/test/repo',
          approvalTool: 'github',
        });

        const result = await repositoryDao.findRepositoryByUrl(
          'https://github.com/test/repo',
        );

        expect(result).toBeDefined();
        expect(result?.url).toBe('https://github.com/test/repo');
        expect(result?.approvalTool).toBe('github');
      });

      it('should return undefined if repository not found', async () => {
        const result = await repositoryDao.findRepositoryByUrl(
          'https://github.com/test/repo',
        );

        expect(result).toBeUndefined();
      });

      it('should log debug message when finding repository by url', async () => {
        await repositoryDao.findRepositoryByUrl('https://github.com/test/repo');

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Fetching repository from database by url https://github.com/test/repo...',
        );
      });
    });

    describe('deleteRepository', () => {
      it('should delete repository if it exists', async () => {
        await knex('repositories').insert({
          url: 'https://github.com/test/repo',
          approvalTool: 'github',
        });

        await repositoryDao.deleteRepository('https://github.com/test/repo');

        const repo = await knex('repositories')
          .where({ url: 'https://github.com/test/repo' })
          .first();
        expect(repo).toBeUndefined();
      });

      it('should not delete if repository does not exist', async () => {
        await repositoryDao.deleteRepository('https://github.com/test/repo');

        const count = await knex('repositories').count('* as count');
        expect(Number(count[0].count)).toBe(0);
      });

      it('should log debug message when deleting repository', async () => {
        await knex('repositories').insert({
          url: 'https://github.com/test/repo',
          approvalTool: 'github',
        });

        await repositoryDao.deleteRepository('https://github.com/test/repo');

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Deleting repository from database by url https://github.com/test/repo...',
        );
      });
    });
  });

  describe('ScaffolderTaskDao', () => {
    let knex: Knex;
    let scaffolderTaskDao: ScaffolderTaskDao;

    beforeEach(async () => {
      knex = await createDatabase('SQLITE_3');
      scaffolderTaskDao = new ScaffolderTaskDao(knex);
    });

    afterEach(async () => {
      await knex.destroy();
    });

    describe('findAllTasks', () => {
      it('should find all tasks', async () => {
        const [repo1] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo1',
            approvalTool: 'github',
          })
          .returning('id');
        const [repo2] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo2',
            approvalTool: 'gitlab',
          })
          .returning('id');

        await knex('scaffolder_tasks').insert([
          {
            taskId: 'task-1',
            repositoryId: repo1.id,
            scaffolderOptions: JSON.stringify({ template: 'test' }),
          },
          {
            taskId: 'task-2',
            repositoryId: repo2.id,
            scaffolderOptions: JSON.stringify({ template: 'test2' }),
          },
        ]);

        const result = await scaffolderTaskDao.findAllTasks();

        expect(result).toHaveLength(2);
        expect(result[0].taskId).toBe('task-1');
        expect(result[1].taskId).toBe('task-2');
      });
    });

    describe('insertTask', () => {
      it('should insert a new task', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const task = {
          taskId: 'task-123',
          repositoryId: repo.id,
          scaffolderOptions: { template: 'test' },
          executedAt: new Date('2024-01-01'),
        };

        const result = await scaffolderTaskDao.insertTask(task);

        expect(result).toBe('task-123');
        const insertedTask = await knex('scaffolder_tasks')
          .where({ taskId: 'task-123' })
          .first();
        expect(insertedTask).toBeDefined();
        expect(JSON.parse(insertedTask.scaffolderOptions)).toEqual({
          template: 'test',
        });
      });

      it('should insert task without executedAt', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const task = {
          taskId: 'task-123',
          repositoryId: repo.id,
          scaffolderOptions: { template: 'test' },
        };

        const result = await scaffolderTaskDao.insertTask(task);

        expect(result).toBe('task-123');
        const insertedTask = await knex('scaffolder_tasks')
          .where({ taskId: 'task-123' })
          .first();
        expect(insertedTask.executedAt).toBeNull();
      });
    });

    describe('findTasksByRepositoryId', () => {
      it('should find tasks by repository id', async () => {
        const [repo1] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo1',
            approvalTool: 'github',
          })
          .returning('id');
        const [repo2] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo2',
            approvalTool: 'gitlab',
          })
          .returning('id');

        await knex('scaffolder_tasks').insert([
          {
            taskId: 'task-1',
            repositoryId: repo1.id,
            scaffolderOptions: JSON.stringify({ template: 'test' }),
            executedAt: new Date('2024-01-01'),
          },
          {
            taskId: 'task-2',
            repositoryId: repo2.id,
            scaffolderOptions: JSON.stringify({ template: 'test2' }),
          },
        ]);

        const result = await scaffolderTaskDao.findTasksByRepositoryId(
          repo1.id,
        );

        expect(result).toHaveLength(1);
        expect(result[0].taskId).toBe('task-1');
        expect(result[0].repositoryId).toBe(repo1.id);
      });
    });

    describe('lastExecutedTaskByRepoId', () => {
      it('should find last executed task by repository id', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        await knex('scaffolder_tasks').insert([
          {
            taskId: 'task-1',
            repositoryId: repo.id,
            scaffolderOptions: JSON.stringify({ template: 'test' }),
            executedAt: new Date('2024-01-01'),
          },
          {
            taskId: 'task-2',
            repositoryId: repo.id,
            scaffolderOptions: JSON.stringify({ template: 'test2' }),
            executedAt: new Date('2024-01-02'),
          },
        ]);

        const result = await scaffolderTaskDao.lastExecutedTaskByRepoId(
          repo.id,
        );

        expect(result).toBeDefined();
        expect(result?.taskId).toBe('task-2');
      });

      it('should return undefined if no task found', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const result = await scaffolderTaskDao.lastExecutedTaskByRepoId(
          repo.id,
        );

        expect(result).toBeUndefined();
      });
    });
  });

  describe('TaskLocationsDao', () => {
    let knex: Knex;
    let taskLocationsDao: TaskLocationsDao;

    beforeEach(async () => {
      knex = await createDatabase('SQLITE_3');
      taskLocationsDao = new TaskLocationsDao(knex);
    });

    afterEach(async () => {
      await knex.destroy();
    });

    describe('addTaskLocation', () => {
      it('should add task location with default type', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');
        await knex('scaffolder_tasks').insert({
          taskId: 'task-123',
          repositoryId: repo.id,
          scaffolderOptions: JSON.stringify({ template: 'test' }),
        });

        await taskLocationsDao.addTaskLocation(
          'task-123',
          'location/component',
        );

        const location = await knex('task_locations')
          .where({ taskId: 'task-123', location: 'location/component' })
          .first();
        expect(location).toBeDefined();
        expect(location?.type).toBe('component');
      });

      it('should add task location with custom type', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');
        await knex('scaffolder_tasks').insert({
          taskId: 'task-123',
          repositoryId: repo.id,
          scaffolderOptions: JSON.stringify({ template: 'test' }),
        });

        await taskLocationsDao.addTaskLocation(
          'task-123',
          'location/api',
          'api',
        );

        const location = await knex('task_locations')
          .where({ taskId: 'task-123', location: 'location/api' })
          .first();
        expect(location).toBeDefined();
        expect(location?.type).toBe('api');
      });
    });

    describe('findLocationsByTaskId', () => {
      it('should find locations by task id', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');
        await knex('scaffolder_tasks').insert({
          taskId: 'task-123',
          repositoryId: repo.id,
          scaffolderOptions: JSON.stringify({ template: 'test' }),
        });
        await knex('task_locations').insert([
          {
            taskId: 'task-123',
            location: 'location/component',
            type: 'component',
          },
          { taskId: 'task-123', location: 'location/api', type: 'api' },
        ]);

        const result = await taskLocationsDao.findLocationsByTaskId('task-123');

        expect(result).toHaveLength(2);
        expect(result[0].location).toBe('location/component');
        expect(result[1].location).toBe('location/api');
      });
    });

    describe('findAllLocations', () => {
      it('should find all locations', async () => {
        const [repo] = await knex('repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');
        await knex('scaffolder_tasks').insert([
          {
            taskId: 'task-123',
            repositoryId: repo.id,
            scaffolderOptions: JSON.stringify({ template: 'test' }),
          },
          {
            taskId: 'task-456',
            repositoryId: repo.id,
            scaffolderOptions: JSON.stringify({ template: 'test2' }),
          },
        ]);
        await knex('task_locations').insert([
          {
            taskId: 'task-123',
            location: 'location/component',
            type: 'component',
          },
          { taskId: 'task-456', location: 'location/api', type: 'api' },
        ]);

        const result = await taskLocationsDao.findAllLocations();

        expect(result).toHaveLength(2);
        expect(result[0].taskId).toBe('task-123');
        expect(result[1].taskId).toBe('task-456');
      });
    });
  });

  describe('OrchestratorWorkflowDao', () => {
    let knex: Knex;
    let orchestratorWorkflowDao: OrchestratorWorkflowDao;

    beforeEach(async () => {
      knex = await createDatabase('SQLITE_3');
      orchestratorWorkflowDao = new OrchestratorWorkflowDao(knex);
    });

    afterEach(async () => {
      await knex.destroy();
    });

    describe('insertWorkflow', () => {
      it('should insert a new workflow', async () => {
        const [repo] = await knex('orchestrator_repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const result = await orchestratorWorkflowDao.insertWorkflow(
          'instance-123',
          repo.id,
        );

        expect(result).toBeGreaterThan(0);
        const workflow = await knex('orchestrator_workflows')
          .where({ instance_id: 'instance-123' })
          .first();
        expect(workflow).toBeDefined();
        expect(workflow?.repositoryId).toBe(repo.id);
      });
    });

    describe('findWorkflowByRepoId', () => {
      it('should find workflow by repository id', async () => {
        const [repo] = await knex('orchestrator_repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        await knex('orchestrator_workflows').insert([
          {
            instance_id: 'instance-123',
            repositoryId: repo.id,
            created_at: new Date('2024-01-01'),
          },
          {
            instance_id: 'instance-456',
            repositoryId: repo.id,
            created_at: new Date('2024-01-02'),
          },
        ]);

        const result =
          await orchestratorWorkflowDao.lastExecutedWorkflowByRepoId(repo.id);

        expect(result).toBeDefined();
        expect(result?.instanceId).toBe('instance-456');
        expect(result?.repositoryId).toBe(repo.id);
      });

      it('should return undefined if workflow not found', async () => {
        const [repo] = await knex('orchestrator_repositories')
          .insert({
            url: 'https://github.com/test/repo',
            approvalTool: 'github',
          })
          .returning('id');

        const result =
          await orchestratorWorkflowDao.lastExecutedWorkflowByRepoId(repo.id);

        expect(result).toBeUndefined();
      });
    });

    describe('findWorkflowsByRepositoryId', () => {
      it('should find all workflows by repository id', async () => {
        const [repo1] = await knex('orchestrator_repositories')
          .insert({
            url: 'https://github.com/test/repo1',
            approvalTool: 'github',
          })
          .returning('id');
        const [repo2] = await knex('orchestrator_repositories')
          .insert({
            url: 'https://github.com/test/repo2',
            approvalTool: 'gitlab',
          })
          .returning('id');

        await knex('orchestrator_workflows').insert([
          {
            instance_id: 'instance-123',
            repositoryId: repo1.id,
            created_at: new Date('2024-01-01'),
          },
          {
            instance_id: 'instance-456',
            repositoryId: repo1.id,
            created_at: new Date('2024-01-02'),
          },
          {
            instance_id: 'instance-789',
            repositoryId: repo2.id,
            created_at: new Date('2024-01-03'),
          },
        ]);

        const result =
          await orchestratorWorkflowDao.findWorkflowsByRepositoryId(repo1.id);

        expect(result).toHaveLength(2);
        expect(result[0].repositoryId).toBe(repo1.id);
        expect(result[1].repositoryId).toBe(repo1.id);
      });
    });
  });
});
