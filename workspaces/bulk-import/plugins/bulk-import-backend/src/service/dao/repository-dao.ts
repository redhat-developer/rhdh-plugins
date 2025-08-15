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

export interface ScaffolderTask {
  taskId: string;
  scaffolderOptions: any;
  repositoryId: number;
}

export interface Repository {
  url: string;
  tasks: ScaffolderTask[];
}

export class RepositoryDao {
  constructor(
    private readonly knex: Knex<any, any[]>,
    private readonly logger: LoggerService,
  ) {}

  async findAllRepositories(): Promise<Repository[]> {
    this.logger.debug('Fetching all repositories with their tasks...');
    const repositories = await this.knex('repositories').select('id', 'url');
    const tasks = await this.knex('scaffolder_tasks').select(
      'taskId',
      'repositoryId',
      'scaffolderOptions',
    );

    return repositories.map((repo: { id: number; url: string }) => {
      const repoTasks = tasks
        .filter(
          (task: { repositoryId: number }) => task.repositoryId === repo.id,
        )
        .map((task: { taskId: string; scaffolderOptions: string }) => ({
          taskId: task.taskId,
          scaffolderOptions: task.scaffolderOptions,
          repositoryId: repo.id,
        }));
      return {
        url: repo.url,
        tasks: repoTasks,
      };
    });
  }

  async saveRepositoryAndTask(
    repoUrl: string,
    taskId: string,
    templateParams: any,
  ): Promise<void> {
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

    await this.knex('scaffolder_tasks').insert({
      taskId,
      repositoryId,
      scaffolderOptions: JSON.stringify(templateParams),
    });
  }
  async findRepositoryByUrl(url: string): Promise<Repository | undefined> {
    this.logger.debug(`Fetching repository from database by url ${url}...`);
    const repository = await this.knex('repositories')
      .where({ url: url })
      .first();

    if (!repository) {
      return undefined;
    }

    const tasks = await this.knex('scaffolder_tasks')
      .where({ repositoryId: repository.id })
      .select('taskId', 'repositoryId', 'scaffolderOptions');

    const repoTasks = tasks.map(
      (task: { taskId: string; scaffolderOptions: string }) => ({
        taskId: task.taskId,
        scaffolderOptions: task.scaffolderOptions,
        repositoryId: repository.id,
      }),
    );

    return {
      url: repository.url,
      tasks: repoTasks,
    };
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
