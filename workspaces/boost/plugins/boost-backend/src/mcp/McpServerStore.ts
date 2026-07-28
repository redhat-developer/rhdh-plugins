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
  McpServerRecord,
  McpTransport,
  McpAuthType,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

const TABLE_NAME = 'boost_mcp_servers';

/**
 * A single row in the `boost_mcp_servers` table.
 *
 * @internal
 */
interface McpServerRow {
  id: string;
  name: string;
  url: string;
  transport: McpTransport;
  auth_type: McpAuthType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Options for creating an {@link McpServerStore}.
 *
 * @public
 */
export interface McpServerStoreOptions {
  /** The Backstage database service. */
  database: DatabaseService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Database-backed store for MCP server registrations.
 *
 * MCP servers are registered endpoints — they do not have lifecycle
 * governance like Kagenti tools. This store supports CRUD operations
 * for MCP server registration.
 *
 * @public
 */
export class McpServerStore {
  private readonly logger: LoggerService;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: McpServerStoreOptions) {
    this.logger = options.logger.child({ service: 'McpServerStore' });
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
   * Ensure the MCP servers table exists.
   */
  private async ensureTable(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable(TABLE_NAME);
    if (!exists) {
      await knex.schema.createTable(TABLE_NAME, table => {
        table.string('id').primary().notNullable();
        table.string('name').notNullable();
        table.string('url').notNullable();
        table.string('transport').notNullable();
        table.string('auth_type').notNullable().defaultTo('none');
        table.text('description').nullable();
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
   * Convert a database row to an `McpServerRecord`.
   */
  private rowToRecord(row: McpServerRow): McpServerRecord {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      transport: row.transport,
      authType: row.auth_type,
      description: row.description ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List all MCP server registrations.
   *
   * @returns All registered MCP servers.
   */
  async list(): Promise<McpServerRecord[]> {
    const knex = await this.getDb();
    const rows = await knex<McpServerRow>(TABLE_NAME)
      .select()
      .orderBy('created_at', 'desc');
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * Get a single MCP server registration by ID.
   *
   * @param id - The MCP server ID.
   * @returns The MCP server record, or `undefined` if not found.
   */
  async get(id: string): Promise<McpServerRecord | undefined> {
    const knex = await this.getDb();
    const row = await knex<McpServerRow>(TABLE_NAME).where({ id }).first();
    return row ? this.rowToRecord(row) : undefined;
  }

  /**
   * Register a new MCP server.
   *
   * @param server - The MCP server to register.
   * @returns The created MCP server record.
   */
  async create(server: {
    id: string;
    name: string;
    url: string;
    transport: McpTransport;
    authType: McpAuthType;
    description?: string;
  }): Promise<McpServerRecord> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;
    try {
      await knex<McpServerRow>(TABLE_NAME).insert({
        id: server.id,
        name: server.name,
        url: server.url,
        transport: server.transport,
        auth_type: server.authType,
        description: server.description ?? null,
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
        throw new ConflictError(
          `MCP server "${server.id}" is already registered`,
        );
      }
      throw err;
    }
    this.logger.info(`MCP server registered: ${server.id}`);
    const record = await this.get(server.id);
    return record!;
  }

  /**
   * Update an MCP server registration.
   *
   * @param id - The MCP server ID to update.
   * @param fields - The fields to update.
   * @returns The updated record, or `undefined` if not found.
   */
  async update(
    id: string,
    fields: {
      name?: string;
      url?: string;
      transport?: McpTransport;
      authType?: McpAuthType;
      description?: string;
    },
  ): Promise<McpServerRecord | undefined> {
    const knex = await this.getDb();
    const updateData: Partial<McpServerRow> = {
      updated_at: knex.fn.now() as unknown as string,
    };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.url !== undefined) updateData.url = fields.url;
    if (fields.transport !== undefined) updateData.transport = fields.transport;
    if (fields.authType !== undefined) updateData.auth_type = fields.authType;
    if (fields.description !== undefined)
      updateData.description = fields.description;

    const updated = await knex<McpServerRow>(TABLE_NAME)
      .where({ id })
      .update(updateData);
    if (updated === 0) {
      return undefined;
    }
    this.logger.info(`MCP server updated: ${id}`);
    return this.get(id);
  }

  /**
   * Delete an MCP server registration.
   *
   * @param id - The MCP server ID to delete.
   * @returns `true` if the server was deleted, `false` if not found.
   */
  async delete(id: string): Promise<boolean> {
    const knex = await this.getDb();
    const deleted = await knex<McpServerRow>(TABLE_NAME).where({ id }).delete();
    if (deleted > 0) {
      this.logger.info(`MCP server deleted: ${id}`);
      return true;
    }
    return false;
  }
}
