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
  AgentRecord,
  LifecycleStage,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

const TABLE_NAME = 'boost_agents';

/**
 * A single row in the `boost_agents` table.
 *
 * @internal
 */
interface AgentRow {
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
 * Options for creating an {@link AgentLifecycleStore}.
 *
 * @public
 */
export interface AgentLifecycleStoreOptions {
  /** The Backstage database service. */
  database: DatabaseService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Database-backed store for agent lifecycle governance records.
 *
 * Each agent is registered with an owner (`createdBy`) and enters
 * the `draft` lifecycle stage. The store supports lifecycle transitions
 * and cascading deletes.
 *
 * @public
 */
export class AgentLifecycleStore {
  private readonly logger: LoggerService;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: AgentLifecycleStoreOptions) {
    this.logger = options.logger.child({ service: 'AgentLifecycleStore' });
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
   * Ensure the agents table exists.
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
   * Convert a database row to an `AgentRecord`.
   */
  private rowToRecord(row: AgentRow): AgentRecord {
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
   * List all agent records.
   *
   * @returns All registered agents.
   */
  async list(): Promise<AgentRecord[]> {
    const knex = await this.getDb();
    const rows = await knex<AgentRow>(TABLE_NAME)
      .select()
      .orderBy('created_at', 'desc');
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * Get a single agent record by ID.
   *
   * @param id - The agent ID.
   * @returns The agent record, or `undefined` if not found.
   */
  async get(id: string): Promise<AgentRecord | undefined> {
    const knex = await this.getDb();
    const row = await knex<AgentRow>(TABLE_NAME).where({ id }).first();
    return row ? this.rowToRecord(row) : undefined;
  }

  /**
   * Register a new agent for governance. Enters the `draft` stage.
   *
   * @param agent - The agent to register.
   * @returns The created agent record.
   */
  async register(agent: {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<AgentRecord> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;
    try {
      await knex<AgentRow>(TABLE_NAME).insert({
        id: agent.id,
        name: agent.name,
        description: agent.description ?? null,
        lifecycle_stage: 'draft',
        created_by: agent.createdBy,
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
        throw new ConflictError(`Agent "${agent.id}" is already registered`);
      }
      throw err;
    }
    this.logger.info(`Agent registered: ${agent.id} by ${agent.createdBy}`);
    const record = await this.get(agent.id);
    return record!;
  }

  /**
   * Update the lifecycle stage of an agent.
   *
   * @param id - The agent ID.
   * @param stage - The new lifecycle stage.
   * @returns The updated agent record, or `undefined` if not found.
   */
  async updateStage(
    id: string,
    stage: LifecycleStage,
  ): Promise<AgentRecord | undefined> {
    const knex = await this.getDb();
    const updated = await knex<AgentRow>(TABLE_NAME)
      .where({ id })
      .update({
        lifecycle_stage: stage,
        updated_at: knex.fn.now() as unknown as string,
      });
    if (updated === 0) {
      return undefined;
    }
    this.logger.info(`Agent ${id} transitioned to ${stage}`);
    return this.get(id);
  }

  /**
   * Delete an agent record.
   *
   * Cascading delete behavior: the store removes the governance record.
   * Source-specific cleanup (kagenti, orchestration, workflow) is the
   * responsibility of the caller or a higher-level service that detects
   * the agent's source before invoking this method.
   *
   * @param id - The agent ID to delete.
   * @returns `true` if the agent was deleted, `false` if not found.
   */
  async delete(id: string): Promise<boolean> {
    const knex = await this.getDb();
    const deleted = await knex<AgentRow>(TABLE_NAME).where({ id }).delete();
    if (deleted > 0) {
      this.logger.info(`Agent deleted: ${id}`);
      return true;
    }
    return false;
  }
}
