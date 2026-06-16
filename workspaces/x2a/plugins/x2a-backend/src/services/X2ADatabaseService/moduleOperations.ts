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
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  Module,
  SourceTechnology,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mapRowToModule } from './mappers';

export class ModuleOperations {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async createModule(module: {
    name: string;
    sourcePath: string;
    projectId: string;
    technology?: SourceTechnology;
  }): Promise<Module> {
    const id = crypto.randomUUID();

    const newModule: Module = {
      id,
      name: module.name,
      sourcePath: module.sourcePath,
      technology: module.technology,
      projectId: module.projectId,
    };

    await this.#dbClient('modules').insert({
      id,
      name: module.name,
      source_path: module.sourcePath,
      technology: module.technology,
      project_id: module.projectId,
    });

    this.#logger.info(`Created new module: ${JSON.stringify(newModule)}`);

    return newModule;
  }

  async getModule({ id }: { id: string }): Promise<Module | undefined> {
    this.#logger.info(`getModule called for id: ${id}`);
    const row = await this.#dbClient('modules').where('id', id).first();
    return row ? mapRowToModule(row as Record<string, unknown>) : undefined;
  }

  async listModules({
    projectId,
    includeRemoved,
  }: {
    projectId: string;
    includeRemoved?: boolean;
  }): Promise<Module[]> {
    this.#logger.info(`listModules called for projectId: ${projectId}`);

    let query = this.#dbClient('modules')
      .where('project_id', projectId)
      .select('*')
      .orderBy('name', 'asc');

    if (!includeRemoved) {
      query = query.whereNull('removed_at');
    }

    const rows = await query;

    const modules: Module[] = rows.map((row: Record<string, unknown>) =>
      mapRowToModule(row),
    );

    this.#logger.debug(
      `Fetched ${modules.length} modules from database for project ${projectId}`,
    );

    return modules;
  }

  async deleteModule({ id }: { id: string }): Promise<number> {
    this.#logger.info(`deleteModule called for id: ${id}`);

    const deletedCount = await this.#dbClient('modules')
      .where('id', id)
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No module found with id: ${id}`);
    } else {
      this.#logger.info(`Deleted module with id: ${id}`);
    }

    return deletedCount;
  }

  async softDeleteModule({ id }: { id: string }): Promise<number> {
    this.#logger.info(`softDeleteModule called for id: ${id}`);

    const updatedCount = await this.#dbClient('modules')
      .where('id', id)
      .whereNull('removed_at')
      .update({ removed_at: new Date() });

    if (updatedCount === 0) {
      this.#logger.warn(
        `No module found with id: ${id} (or already soft-deleted)`,
      );
    } else {
      this.#logger.info(`Soft-deleted module with id: ${id}`);
    }

    return updatedCount;
  }

  async restoreModule({ id }: { id: string }): Promise<number> {
    this.#logger.info(`restoreModule called for id: ${id}`);

    const updatedCount = await this.#dbClient('modules')
      .where('id', id)
      .update({ removed_at: null });

    if (updatedCount === 0) {
      this.#logger.warn(`No module found with id: ${id}`);
    } else {
      this.#logger.info(`Restored module with id: ${id}`);
    }

    return updatedCount;
  }

  async updateModule({
    id,
    sourcePath,
    technology,
  }: {
    id: string;
    sourcePath?: string;
    technology?: SourceTechnology;
  }): Promise<number> {
    const updates: Record<string, string | SourceTechnology | null> = {};
    if (sourcePath !== undefined) {
      updates.source_path = sourcePath;
    }
    if (technology !== undefined) {
      updates.technology = technology;
    }

    if (Object.keys(updates).length === 0) {
      return 0;
    }

    this.#logger.info(
      `updateModule called for id: ${id}, updates: ${JSON.stringify(updates)}`,
    );

    const updatedCount = await this.#dbClient('modules')
      .where('id', id)
      .update(updates);

    if (updatedCount === 0) {
      this.#logger.warn(`No module found with id: ${id}`);
    }

    return updatedCount;
  }
}
