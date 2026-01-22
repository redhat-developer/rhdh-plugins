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

import crypto from 'node:crypto';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import { Project } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { Knex } from 'knex';

export class X2ADatabaseService {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  static create(options: { logger: LoggerService; dbClient: Knex }) {
    return new X2ADatabaseService(options.logger, options.dbClient);
  }

  private constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async createProject(
    input: {
      name: string;
      abbreviation: string;
      description: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<Project> {
    const id = crypto.randomUUID();
    const createdBy = options.credentials.principal.userEntityRef;
    const createdAt = new Date();

    const newProject: Project = {
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      // sourceRepository: 'https://github.com/org/repo',
      createdBy,
      createdAt,
    };

    // Persist in the database
    await this.#dbClient('projects').insert({
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      created_by: createdBy,
      created_at: createdAt,
    });

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(): Promise<{ projects: Project[]; totalCount: number }> {
    this.#logger.info('listProjects called');

    // Fetch all records from the database
    const rows = await this.#dbClient('projects')
      .select('*')
      .orderBy('created_at', 'desc');

    const projects: Project[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      description: row.description,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }));

    const totalCount = projects.length;
    this.#logger.debug(`Fetched ${totalCount} projects from database`);

    return { projects, totalCount };
  }

  async getProject({ projectId }: { projectId: string }): Promise<Project> {
    this.#logger.info(`getProject called for projectId: ${projectId}`);
    const row = await this.#dbClient('projects').where('id', projectId).first();
    return {
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      description: row.description,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }

  async deleteProject({ projectId }: { projectId: string }) {
    this.#logger.info(`deleteProject called for projectId: ${projectId}`);

    // Delete from the database
    const deletedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No project found with id: ${projectId}`);
    } else {
      this.#logger.info(`Deleted project with id: ${projectId}`);
    }
  }
}

export const x2aDatabaseServiceRef = createServiceRef<
  Expand<X2ADatabaseService>
>({
  id: 'x2a-database',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        database: coreServices.database,
      },
      async factory(deps) {
        return X2ADatabaseService.create({
          ...deps,
          dbClient: await deps.database.getClient(),
        });
      },
    }),
});
