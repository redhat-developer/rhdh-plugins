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

import type { LoggerService } from '@backstage/backend-plugin-api';

import { Knex } from 'knex';

import { randomUUID } from 'node:crypto';

import { McpServerStatus, McpUserSettingsRow } from './mcp-server-types';
import { TokenEncryptor } from './token-encryption';

const TABLE = 'lightspeed_mcp_user_settings';

/**
 * Stores per-user preferences for admin-configured MCP servers.
 *
 * Each row represents one user's settings for one static MCP server:
 * enabled/disabled toggle, optional personal token override, and
 * cached validation status.
 *
 * Tokens are encrypted/decrypted transparently via the TokenEncryptor.
 */
export class McpUserSettingsStore {
  constructor(
    private readonly db: Knex,
    private readonly encryptor: TokenEncryptor,
    private readonly logger: LoggerService,
  ) {}

  /** List all settings for a specific user. */
  async listByUser(userEntityRef: string): Promise<McpUserSettingsRow[]> {
    const rows = await this.db<McpUserSettingsRow>(TABLE)
      .where({ user_entity_ref: userEntityRef })
      .select('*');
    return Promise.all(rows.map(r => this.decryptRow(r)));
  }

  /** Get settings for a specific server + user combination. */
  async get(
    serverName: string,
    userEntityRef: string,
  ): Promise<McpUserSettingsRow | undefined> {
    const row = await this.db<McpUserSettingsRow>(TABLE)
      .where({ server_name: serverName, user_entity_ref: userEntityRef })
      .first();
    return row ? this.decryptRow(row) : undefined;
  }

  private async decryptRow(
    row: McpUserSettingsRow,
  ): Promise<McpUserSettingsRow> {
    if (!row.token) {
      return row;
    }
    try {
      const result = this.encryptor.decrypt(row.token);
      if (result.needsReEncrypt && result.plaintext) {
        await this.reEncryptToken(
          row.server_name,
          row.user_entity_ref,
          result.plaintext,
        );
      }
      return { ...row, token: result.plaintext };
    } catch (err) {
      this.logger.error(
        `Failed to decrypt token for ${row.server_name}/${row.user_entity_ref} — treating as missing`,
        err instanceof Error ? err : undefined,
      );
      return { ...row, token: null };
    }
  }

  private async reEncryptToken(
    serverName: string,
    userEntityRef: string,
    plaintext: string,
  ): Promise<void> {
    try {
      const encrypted = this.encryptor.encrypt(plaintext);
      await this.db(TABLE)
        .where({ server_name: serverName, user_entity_ref: userEntityRef })
        .update({ token: encrypted, updated_at: new Date().toISOString() });
      this.logger.info(
        `Re-encrypted token for ${serverName} with the current primary key`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to re-encrypt token for ${serverName} — will retry on next read`,
        err instanceof Error ? err : undefined,
      );
    }
  }

  /** Create or update user settings for a server (atomic). */
  async upsert(
    serverName: string,
    userEntityRef: string,
    updates: { enabled?: boolean; token?: string | null },
  ): Promise<McpUserSettingsRow> {
    const now = new Date().toISOString();
    const encryptedToken = updates.token
      ? this.encryptor.encrypt(updates.token)
      : (updates.token ?? null);

    const row: McpUserSettingsRow = {
      id: randomUUID(),
      server_name: serverName,
      user_entity_ref: userEntityRef,
      enabled: updates.enabled ?? true,
      token: encryptedToken,
      status: 'unknown',
      tool_count: 0,
      created_at: now,
      updated_at: now,
    };

    const mergeFields: Partial<McpUserSettingsRow> = { updated_at: now };
    if (updates.enabled !== undefined) mergeFields.enabled = updates.enabled;
    if (updates.token !== undefined) {
      mergeFields.token = encryptedToken;
      mergeFields.status = 'unknown';
      mergeFields.tool_count = 0;
    }

    await this.db(TABLE)
      .insert(row)
      .onConflict(['server_name', 'user_entity_ref'])
      .merge(mergeFields);

    const result = await this.get(serverName, userEntityRef);
    if (!result) {
      throw new Error(
        `Failed to upsert settings for ${serverName}/${userEntityRef}`,
      );
    }
    return result;
  }

  /** Update cached validation status for a user's server setting (atomic). */
  async updateStatus(
    serverName: string,
    userEntityRef: string,
    status: McpServerStatus,
    toolCount: number,
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.db(TABLE)
      .insert({
        id: randomUUID(),
        server_name: serverName,
        user_entity_ref: userEntityRef,
        enabled: true,
        token: null,
        status,
        tool_count: toolCount,
        created_at: now,
        updated_at: now,
      })
      .onConflict(['server_name', 'user_entity_ref'])
      .merge({ status, tool_count: toolCount, updated_at: now });
  }
}
