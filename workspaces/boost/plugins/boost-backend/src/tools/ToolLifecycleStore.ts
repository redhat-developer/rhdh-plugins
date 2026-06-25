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
import { ConflictError } from '@backstage/errors';
import type { Knex } from 'knex';
import type {
  ToolRecord,
  LifecycleStage,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

const TABLE_NAME = 'boost_tools';

/**
 * A single row in the `boost_tools` table.
 *
 * @internal
 */
interface ToolRow {
  id: string;
  name: string;
  description: string | null;
  lifecycle_stage: LifecycleStage;
  created_by: string;
  governance_registered: number; // SQLite boolean
  created_at: string;
  updated_at: string;
}

/**
 * Options for creating a {@link ToolLifecycleStore}.
 *
 * @public
 */
export interface ToolLifecycleStoreOptions {
  /** The Backstage database service. */
  database: DatabaseService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Database-backed store for Kagenti tool lifecycle governance records.
 *
 * Each tool is registered with an owner (`createdBy`) and enters
 * the `draft` lifecycle stage. The store supports lifecycle transitions
 * and cascading deletes.
 *
 * @public
 */
export class ToolLifecycleStore {
  private readonly logger: LoggerService;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: ToolLifecycleStoreOptions) {
    this.logger = options.logger.child({ service: 'ToolLifecycleStore' });
    this.database = options.database;
  }

  /**
   * Get the Knex instance, creating the table on first access.
   */
  private async getDb(): Promise<Knex> {
    if (!this.knexPromise) {
      this.knexPromise = (async () => {
        const knex = await this.database.getClient();
        await this.ensureTable(knex);
        return knex;
      })().catch(err => {
        this.knexPromise = undefined;
        throw err;
      });
    }
    return this.knexPromise;
  }

  /**
   * Ensure the tools table exists.
   */
  private async ensureTable(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable(TABLE_NAME);
    if (!exists) {
      await knex.schema.createTable(TABLE_NAME, table => {
        table.string('id').primary().notNullable();
        table.string('name').notNullable();
        table.text('description').nullable();
        table.string('lifecycle_stage').notNullable().defaultTo('draft');
        table.string('created_by').notNullable();
        table.boolean('governance_registered').notNullable().defaultTo(true);
        table
          .timestamp('created_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
        table
          .timestamp('updated_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
      });
      this.logger.info(`Created ${TABLE_NAME} table`);
    }
  }

  /**
   * Convert a database row to a `ToolRecord`.
   */
  private rowToRecord(row: ToolRow): ToolRecord {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      lifecycleStage: row.lifecycle_stage,
      createdBy: row.created_by,
      governanceRegistered: Boolean(row.governance_registered),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List all tool records.
   *
   * @returns All registered tools.
   */
  async list(): Promise<ToolRecord[]> {
    const knex = await this.getDb();
    const rows = await knex<ToolRow>(TABLE_NAME)
      .select()
      .orderBy('created_at', 'desc');
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * Get a single tool record by ID.
   *
   * @param id - The tool ID.
   * @returns The tool record, or `undefined` if not found.
   */
  async get(id: string): Promise<ToolRecord | undefined> {
    const knex = await this.getDb();
    const row = await knex<ToolRow>(TABLE_NAME).where({ id }).first();
    return row ? this.rowToRecord(row) : undefined;
  }

  /**
   * Register a new tool for governance. Enters the `draft` stage.
   *
   * @param tool - The tool to register.
   * @returns The created tool record.
   */
  async register(tool: {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<ToolRecord> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;
    try {
      await knex<ToolRow>(TABLE_NAME).insert({
        id: tool.id,
        name: tool.name,
        description: tool.description ?? null,
        lifecycle_stage: 'draft',
        created_by: tool.createdBy,
        governance_registered: 1,
        created_at: now,
        updated_at: now,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('UNIQUE') ||
        message.includes('duplicate') ||
        message.includes('conflict')
      ) {
        throw new ConflictError(`Tool "${tool.id}" is already registered`);
      }
      throw err;
    }
    this.logger.info(`Tool registered: ${tool.id} by ${tool.createdBy}`);
    const record = await this.get(tool.id);
    return record!;
  }

  /**
   * Update the lifecycle stage of a tool.
   *
   * @param id - The tool ID.
   * @param stage - The new lifecycle stage.
   * @returns The updated tool record, or `undefined` if not found.
   */
  async updateStage(
    id: string,
    stage: LifecycleStage,
  ): Promise<ToolRecord | undefined> {
    const knex = await this.getDb();
    const updated = await knex<ToolRow>(TABLE_NAME)
      .where({ id })
      .update({
        lifecycle_stage: stage,
        updated_at: knex.fn.now() as unknown as string,
      });
    if (updated === 0) {
      return undefined;
    }
    this.logger.info(`Tool ${id} transitioned to ${stage}`);
    return this.get(id);
  }

  /**
   * Delete a tool record.
   *
   * @param id - The tool ID to delete.
   * @returns `true` if the tool was deleted, `false` if not found.
   */
  async delete(id: string): Promise<boolean> {
    const knex = await this.getDb();
    const deleted = await knex<ToolRow>(TABLE_NAME).where({ id }).delete();
    if (deleted > 0) {
      this.logger.info(`Tool deleted: ${id}`);
      return true;
    }
    return false;
  }
}
