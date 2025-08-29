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

export interface Repository {
  id: number;
  url: string;
}

export interface ScaffolderTask {
  taskId: string;
  scaffolderOptions: any;
  repositoryId: number;
  location?: string;
}

export class RepositoryDao {
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: LoggerService,
  ) {}

  async findAllRepositories(): Promise<Repository[]> {
    this.logger.debug('Fetching all repositories with their tasks...');
    return await this.knex('repositories').select<Repository[]>('id', 'url');
  }

  async saveRepositoryAndTask(repoUrl: string, taskId: string): Promise<void> {
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
        .insert({ url: repoUrl })
        .returning('id');
      repositoryId = newRepository.id;
    }
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

export class ScaffolderTaskDao {
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: LoggerService,
  ) {}

  async findAllTasks(): Promise<ScaffolderTask[]> {
    return await this.knex('scaffolder_tasks').select<ScaffolderTask[]>(
      'taskId',
      'repositoryId',
      'scaffolderOptions',
      'location',
    );
  }

  async insertTask(task: ScaffolderTask): Promise<string> {
    const result = await this.knex('scaffolder_tasks')
      .insert<ScaffolderTask>({
        taskId: task.taskId,
        repositoryId: task.repositoryId,
        scaffolderOptions: JSON.stringify(task.scaffolderOptions),
      })
      .returning<{ taskId: string }[]>('taskId');

    return result[0].taskId;
  }

  async updateTaskLocation(taskId: string, location: string): Promise<void> {
    this.logger.debug(
      `Updating task ${taskId} with location ${location} in database..`,
    );
    await this.knex('scaffolder_tasks').where({ taskId }).update({ location });
  }

  async findTasksByRepositoryId(
    repositoryId: number,
  ): Promise<ScaffolderTask[]> {
    return await this.knex('scaffolder_tasks')
      .where({ repositoryId })
      .select<
        ScaffolderTask[]
      >('taskId', 'repositoryId', 'scaffolderOptions', 'location');
  }
}
