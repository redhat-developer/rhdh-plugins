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

import { Knex } from 'knex';
import crypto from 'node:crypto';
import {
  LoggerService,
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import {
  Project,
  DEFAULT_PAGE_ORDER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SORT,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { ProjectsGet } from '../../schema/openapi';

import { mapRowToProject } from './mappers';
import { filterPermissions, mapSortToDatabaseColumn } from './queryHelpers';

export class ProjectOperations {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async createProject(
    input: {
      name: string;
      abbreviation: string;
      description: string;
      sourceRepoUrl: string;
      targetRepoUrl: string;
      sourceRepoBranch: string;
      targetRepoBranch: string;
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
      sourceRepoUrl: input.sourceRepoUrl,
      targetRepoUrl: input.targetRepoUrl,
      sourceRepoBranch: input.sourceRepoBranch,
      targetRepoBranch: input.targetRepoBranch,
      createdBy,
      createdAt,
    };

    await this.#dbClient('projects').insert({
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      source_repo_url: input.sourceRepoUrl,
      target_repo_url: input.targetRepoUrl,
      source_repo_branch: input.sourceRepoBranch,
      target_repo_branch: input.targetRepoBranch,
      created_by: createdBy,
      created_at: createdAt,
    });

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(`listProjects called by ${calledByUserRef}`);

    const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;

    const rows = await this.#dbClient('projects')
      .limit(pageSize)
      .offset((query.page || 0) * pageSize)
      .select('*')
      .modify(queryBuilder =>
        filterPermissions(queryBuilder, options.canViewAll, calledByUserRef),
      )
      .orderBy(
        mapSortToDatabaseColumn(query.sort) || DEFAULT_PAGE_SORT,
        query.order || DEFAULT_PAGE_ORDER,
      );

    const totalCount = (await this.#dbClient('projects')
      .count('*', { as: 'count' })
      .modify(queryBuilder =>
        filterPermissions(queryBuilder, options.canViewAll, calledByUserRef),
      )
      .first()) as { count: string | number };

    const projects: Project[] = rows.map((row: Record<string, unknown>) =>
      mapRowToProject(row),
    );

    this.#logger.debug(
      `Fetched ${projects.length} out of ${totalCount.count} projects from database (permissions applied)`,
    );

    return {
      projects,
      totalCount: Number.parseInt(String(totalCount.count), 10),
    };
  }

  async getProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
    },
  ): Promise<Project | undefined> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(
      `getProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const row = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        filterPermissions(queryBuilder, options.canViewAll, calledByUserRef),
      )
      .first();
    if (!row) {
      return undefined;
    }
    return mapRowToProject(row as Record<string, unknown>);
  }

  async deleteProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canWriteAll?: boolean;
    },
  ): Promise<number> {
    const calledByUserRef = options.credentials.principal.userEntityRef;
    this.#logger.info(
      `deleteProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const deletedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        filterPermissions(queryBuilder, options.canWriteAll, calledByUserRef),
      )
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No project found with id: ${projectId}`);
    } else {
      this.#logger.info(`Deleted project with id: ${projectId}`);
    }

    return deletedCount;
  }
}
