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

import { Knex } from 'knex';

import { Components } from '../generated/openapi';

export interface Repository {
  id: number;
  url: string;
  approvalTool: Components.Schemas.ApprovalTool;
}

export interface ScaffolderTask {
  taskId: string;
  scaffolderOptions: any;
  repositoryId: number;
  executedAt?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export async function paginateQuery<T>(
  queryBuilder: Knex.QueryBuilder<any, T[]>,
  page: number = 1,
  size: number = 10,
  search?: { column: string; term?: string },
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * size;

  let baseQuery = queryBuilder.clone();

  if (search?.term) {
    if (queryBuilder.client.dialect === 'postgres') {
      baseQuery = baseQuery.whereILike(search.column, `%${search.term}%`);
    } else {
      baseQuery = baseQuery.whereLike(search.column, `%${search.term}%`);
    }
  }

  const countQuery = baseQuery
    .clone()
    .clearSelect()
    .clearOrder()
    .count<{ count: string }[]>('* as count');

  const [rows, [{ count }]] = await Promise.all([
    baseQuery.clone().limit(size).offset(offset),
    countQuery,
  ]);

  const total = Number(count);

  return {
    data: rows as T[],
    page,
    size,
    total,
    totalPages: Math.ceil(total / size),
  };
}

// @internal
export class RepositoryDao {
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: LoggerService,
  ) {}

  async findRepositories(
    page: number = 1,
    size: number = 10,
    search?: string,
  ): Promise<PaginatedResult<Repository>> {
    this.logger.debug(
      `Fetching repositories page=${page}, size=${size}, search=${search}`,
    );
    const query = this.knex('repositories').select('id', 'url', 'approvalTool');
    const searchParam = { column: 'url', term: search };
    return paginateQuery<Repository>(query, page, size, searchParam);
  }

  async insertRepository(
    repoUrl: string,
    taskId: string,
    approvalTool: string,
  ): Promise<number> {
    this.logger.debug(
      `Saving task ${taskId} for repo ${repoUrl} to database..`,
    );
    const repository = await this.knex('repositories')
      .where({ url: repoUrl })
      .first();

    let repositoryId;
    if (repository) {
      repositoryId = repository.id;
    } else {
      const [newRepository] = await this.knex('repositories')
        .insert({ url: repoUrl, approvalTool: approvalTool })
        .returning('id');
      repositoryId = newRepository.id;
    }
    return repositoryId;
  }

  async findRepositoryByUrl(url: string): Promise<Repository | undefined> {
    this.logger.debug(`Fetching repository from database by url ${url}...`);
    return await this.knex('repositories').where({ url: url }).first();
  }

  async deleteRepository(url: string): Promise<void> {
    this.logger.debug(`Deleting repository from database by url ${url}...`);
    const repository = await this.knex('repositories')
      .where({ url: url })
      .first();

    if (repository) {
      await this.knex('repositories').where({ id: repository.id }).del();
    }
  }
}

// @internal
export class ScaffolderTaskDao {
  constructor(private readonly knex: Knex<any, any[]>) {}

  async findAllTasks(): Promise<ScaffolderTask[]> {
    return await this.knex('scaffolder_tasks').select<ScaffolderTask[]>(
      'taskId',
      'repositoryId',
      'scaffolderOptions',
    );
  }

  async insertTask(task: ScaffolderTask): Promise<string> {
    const result = await this.knex('scaffolder_tasks')
      .insert<ScaffolderTask>({
        taskId: task.taskId,
        repositoryId: task.repositoryId,
        scaffolderOptions: JSON.stringify(task.scaffolderOptions),
        executedAt: task.executedAt,
      })
      .returning<{ taskId: string }[]>('taskId');

    return result[0].taskId;
  }

  async findTasksByRepositoryId(
    repositoryId: number,
  ): Promise<ScaffolderTask[]> {
    return await this.knex('scaffolder_tasks')
      .where({ repositoryId })
      .select<
        ScaffolderTask[]
      >('taskId', 'repositoryId', 'scaffolderOptions', 'executedAt');
  }

  async lastExecutedTaskByRepoId(
    repositoryId: number,
  ): Promise<ScaffolderTask | undefined> {
    return await this.knex('scaffolder_tasks')
      .where({ repositoryId })
      .orderBy('executedAt', 'desc')
      .first<ScaffolderTask>();
  }
}

export interface TaskLocation {
  id: number;
  taskId: string;
  location: string;
  type: string;
}

// @internal
export class TaskLocationsDao {
  constructor(private readonly knex: Knex<any, any[]>) {}

  async addTaskLocation(
    taskId: string,
    location: string,
    type: string = 'component',
  ): Promise<void> {
    await this.knex('task_locations').insert({ taskId, location, type });
  }

  async findLocationsByTaskId(taskId: string): Promise<TaskLocation[]> {
    return await this.knex('task_locations')
      .where({ taskId })
      .select<TaskLocation[]>('id', 'taskId', 'location', 'type');
  }

  async findAllLocations(): Promise<TaskLocation[]> {
    return await this.knex('task_locations').select<TaskLocation[]>(
      'id',
      'taskId',
      'location',
      'type',
    );
  }
}
