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
  ProjectsGet,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mapRowToProject } from './mappers';
import { filterPermissions, mapSortToDatabaseColumn } from './queryHelpers';
import { getUserRef } from '../../router/common';
import { Project as ProjectVO } from '../Project';

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
      ownedByGroup?: string;
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
    const ownedBy = input.ownedByGroup || getUserRef(options.credentials);
    const createdAt = new Date();
    const dirName = new ProjectVO(id, input.name).dirName;

    const newProject: Project = {
      id,
      name: input.name,
      abbreviation: input.abbreviation,
      description: input.description,
      sourceRepoUrl: input.sourceRepoUrl,
      targetRepoUrl: input.targetRepoUrl,
      sourceRepoBranch: input.sourceRepoBranch,
      targetRepoBranch: input.targetRepoBranch,
      ownedBy,
      createdAt,
      dirName,
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
      owned_by: ownedBy,
      created_at: createdAt,
      dir_name: dirName,
    });

    this.#logger.info(`Created new project: ${JSON.stringify(newProject)}`);

    return newProject;
  }

  async listProjects(
    query: ProjectsGet['query'],
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
      groupsOfUser: string[];
    },
    dbOptions?: { skipPagination?: boolean },
  ): Promise<{ projects: Project[]; totalCount: number }> {
    const calledByUserRef = getUserRef(options.credentials);
    this.#logger.info(`listProjects called by ${calledByUserRef}`);

    const pageSize = query.pageSize || DEFAULT_PAGE_SIZE;

    const rowsQuery = this.#dbClient('projects')
      .select('*')
      .modify(queryBuilder =>
        filterPermissions(
          queryBuilder,
          options.canViewAll,
          calledByUserRef,
          options.groupsOfUser,
        ),
      );

    if (!dbOptions?.skipPagination) {
      rowsQuery
        .orderBy(
          mapSortToDatabaseColumn(query.sort) || DEFAULT_PAGE_SORT,
          query.order || DEFAULT_PAGE_ORDER,
        )
        .limit(pageSize)
        .offset((query.page || 0) * pageSize);
    }

    const rows = await rowsQuery;

    // When pagination is skipped, rows already contains every matching row,
    // so a separate COUNT query would be redundant.
    const totalCount = dbOptions?.skipPagination
      ? rows.length
      : Number.parseInt(
          String(
            (
              (await this.#dbClient('projects')
                .count('*', { as: 'count' })
                .modify(queryBuilder =>
                  filterPermissions(
                    queryBuilder,
                    options.canViewAll,
                    calledByUserRef,
                    options.groupsOfUser,
                  ),
                )
                .first()) as { count: string | number }
            )?.count,
          ),
          10,
        );

    const projects: Project[] = rows.map((row: Record<string, unknown>) =>
      mapRowToProject(row),
    );

    this.#logger.debug(
      `Fetched ${projects.length} out of ${totalCount} projects from database (permissions applied)`,
    );

    return {
      projects,
      totalCount,
    };
  }

  async getProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canViewAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<Project | undefined> {
    const calledByUserRef = getUserRef(options.credentials);
    const groupsOfUser = options.groupsOfUser ?? [];
    this.#logger.info(
      `getProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const row = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        filterPermissions(
          queryBuilder,
          options.canViewAll,
          calledByUserRef,
          groupsOfUser,
        ),
      )
      .first();
    if (!row) {
      return undefined;
    }
    return mapRowToProject(row as Record<string, unknown>);
  }

  async updateProject(
    { projectId }: { projectId: string },
    input: {
      name?: string;
      ownedBy?: string;
      description?: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canWriteAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<Project | undefined> {
    const calledByUserRef = getUserRef(options.credentials);
    const groupsOfUser = options.groupsOfUser ?? [];
    this.#logger.info(
      `updateProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const updateFields: Record<string, string> = {};
    if (input.name !== undefined) updateFields.name = input.name;
    if (input.ownedBy !== undefined) updateFields.owned_by = input.ownedBy;
    if (input.description !== undefined)
      updateFields.description = input.description;

    const updatedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        filterPermissions(
          queryBuilder,
          options.canWriteAll,
          calledByUserRef,
          groupsOfUser,
        ),
      )
      .update(updateFields);

    if (updatedCount === 0) {
      this.#logger.warn(
        `No project found with id: ${projectId} (or insufficient permissions)`,
      );
      return undefined;
    }

    this.#logger.info(`Updated project with id: ${projectId}`);

    // Do not re-check permissions here. It might be the last time the user can see it if permissions do not allow it anymore.
    const row = await this.#dbClient('projects').where('id', projectId).first();
    return row ? mapRowToProject(row as Record<string, unknown>) : undefined;
  }

  async deleteProject(
    { projectId }: { projectId: string },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
      canWriteAll?: boolean;
      groupsOfUser: string[];
    },
  ): Promise<number> {
    const calledByUserRef = getUserRef(options.credentials);
    const groupsOfUser = options.groupsOfUser ?? [];
    this.#logger.info(
      `deleteProject called for projectId: ${projectId} by ${calledByUserRef}`,
    );

    const deletedCount = await this.#dbClient('projects')
      .where('id', projectId)
      .modify(queryBuilder =>
        filterPermissions(
          queryBuilder,
          options.canWriteAll,
          calledByUserRef,
          groupsOfUser,
        ),
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
