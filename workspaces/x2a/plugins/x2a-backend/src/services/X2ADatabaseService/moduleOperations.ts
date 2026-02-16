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
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

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
  }): Promise<Module> {
    const id = crypto.randomUUID();

    const newModule: Module = {
      id,
      name: module.name,
      sourcePath: module.sourcePath,
      projectId: module.projectId,
    };

    await this.#dbClient('modules').insert({
      id,
      name: module.name,
      source_path: module.sourcePath,
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

  async listModules({ projectId }: { projectId: string }): Promise<Module[]> {
    this.#logger.info(`listModules called for projectId: ${projectId}`);

    const rows = await this.#dbClient('modules')
      .where('project_id', projectId)
      .select('*')
      .orderBy('name', 'asc');

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
}
