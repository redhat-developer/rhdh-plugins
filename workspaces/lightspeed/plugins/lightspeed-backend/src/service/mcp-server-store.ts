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

import { randomUUID } from 'node:crypto';

import { McpServerStatus, McpUserSettingsRow } from './mcp-server-types';

const TABLE = 'lightspeed_mcp_user_settings';

/**
 * Stores per-user preferences for admin-configured MCP servers.
 *
 * Each row represents one user's settings for one static MCP server:
 * enabled/disabled toggle, optional personal token override, and
 * cached validation status.
 */
export class McpUserSettingsStore {
  constructor(private readonly db: Knex) {}

  /** List all settings for a specific user. */
  async listByUser(userEntityRef: string): Promise<McpUserSettingsRow[]> {
    return this.db<McpUserSettingsRow>(TABLE)
      .where({ user_entity_ref: userEntityRef })
      .select('*');
  }

  /** Get settings for a specific server + user combination. */
  async get(
    serverName: string,
    userEntityRef: string,
  ): Promise<McpUserSettingsRow | undefined> {
    return this.db<McpUserSettingsRow>(TABLE)
      .where({ server_name: serverName, user_entity_ref: userEntityRef })
      .first();
  }

  /** Create or update user settings for a server. */
  async upsert(
    serverName: string,
    userEntityRef: string,
    updates: { enabled?: boolean; token?: string | null },
  ): Promise<McpUserSettingsRow> {
    const existing = await this.get(serverName, userEntityRef);
    const now = new Date().toISOString();

    if (existing) {
      const fields: Partial<McpUserSettingsRow> = { updated_at: now };
      if (updates.enabled !== undefined) fields.enabled = updates.enabled;
      if (updates.token !== undefined) {
        fields.token = updates.token;
        if (updates.token) fields.status = 'unknown';
      }

      await this.db(TABLE)
        .where({ server_name: serverName, user_entity_ref: userEntityRef })
        .update(fields);
      return (await this.get(serverName, userEntityRef))!;
    }

    const row: McpUserSettingsRow = {
      id: randomUUID(),
      server_name: serverName,
      user_entity_ref: userEntityRef,
      enabled: updates.enabled ?? true,
      token: updates.token ?? null,
      status: 'unknown',
      tool_count: 0,
      created_at: now,
      updated_at: now,
    };
    await this.db(TABLE).insert(row);
    return row;
  }

  /** Update cached validation status for a user's server setting. */
  async updateStatus(
    serverName: string,
    userEntityRef: string,
    status: McpServerStatus,
    toolCount: number,
  ): Promise<void> {
    const existing = await this.get(serverName, userEntityRef);
    const now = new Date().toISOString();

    if (existing) {
      await this.db(TABLE)
        .where({ server_name: serverName, user_entity_ref: userEntityRef })
        .update({ status, tool_count: toolCount, updated_at: now });
    } else {
      await this.db(TABLE).insert({
        id: randomUUID(),
        server_name: serverName,
        user_entity_ref: userEntityRef,
        enabled: true,
        token: null,
        status,
        tool_count: toolCount,
        created_at: now,
        updated_at: now,
      });
    }
  }
}
