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
import type {
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';

import gitUrlParse from 'git-url-parse';

import type { Components } from '../../generated/openapi';

export class ScaffolderTaskDao {
  constructor(
    private readonly logger: LoggerService,
    private readonly database: DatabaseService,
  ) {}

  async findAllRepositories(): Promise<Components.Schemas.Repository[]> {
    this.logger.debug('Getting all repositories from database..');

    try {
      const knex = await this.database.getClient();
      const tasks = await knex('scaffolder_tasks').select(
        'repoUrl',
        'createdAt',
      );

      if (!tasks || tasks.length === 0) {
        return [];
      }

      const repoList: Components.Schemas.Repository[] = tasks
        .map(task => {
          try {
            const gitUrl = gitUrlParse(task.repoUrl);
            return {
              id: `${gitUrl.organization}/${gitUrl.name}`,
              name: gitUrl.name,
              organization: gitUrl.organization,
              url: task.repoUrl,
              lastUpdate: task.createdAt,
            };
          } catch (e: any) {
            this.logger.warn(`Failed to parse repoUrl: ${task.repoUrl}`, e);
            return null;
          }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      return repoList;
    } catch (error: any) {
      this.logger.error('Failed to get repositories from database', error);
      throw new Error('Failed to get repositories from database');
    }
  }

  async insertTask(taskId: string, repoUrl: string): Promise<void> {
    this.logger.debug(
      `Saving task ${taskId} for repo ${repoUrl} to database..`,
    );
    try {
      const knex = await this.database.getClient();
      await knex('scaffolder_tasks').insert({ taskId, repoUrl });
    } catch (error: any) {
      this.logger.error(
        `Failed to save task for repo ${repoUrl} to database`,
        error,
      );
      throw new Error(`Failed to save task for repo ${repoUrl} to database`);
    }
  }
}
