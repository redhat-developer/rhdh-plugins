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

import { McpUserSettingsStore } from './mcp-server-store';
import { McpUserSettingsRow } from './mcp-server-types';
import { TokenEncryptor } from './token-encryption';

const SERVER = 'github';
const USER = 'user:default/jane';

function storedRow(
  overrides: Partial<McpUserSettingsRow> = {},
): McpUserSettingsRow {
  return {
    id: 'row-1',
    server_name: SERVER,
    user_entity_ref: USER,
    enabled: true,
    token: 'enc:old',
    status: 'connected',
    tool_count: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createDb(row: McpUserSettingsRow) {
  const update = jest.fn().mockResolvedValue(1);
  const where = jest.fn().mockReturnValue({
    first: jest.fn().mockResolvedValue(row),
    update,
  });
  const db = jest.fn().mockReturnValue({ where }) as unknown as Knex;
  return { db, update };
}

describe('McpUserSettingsStore token re-encryption', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(),
  } as unknown as LoggerService;

  const encryptor: TokenEncryptor = {
    enabled: true,
    encrypt: jest.fn().mockReturnValue('enc:rotated'),
    decrypt: jest.fn().mockReturnValue({
      plaintext: 'pat-123',
      needsReEncrypt: true,
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists a token decrypted with a previous key under the current key', async () => {
    const { db, update } = createDb(storedRow());
    const store = new McpUserSettingsStore(db, encryptor, logger);

    await expect(store.get(SERVER, USER)).resolves.toMatchObject({
      token: 'pat-123',
    });

    expect(encryptor.encrypt).toHaveBeenCalledWith('pat-123');
    expect(update).toHaveBeenCalledWith({
      token: 'enc:rotated',
      updated_at: expect.any(String),
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Re-encrypted token for github with the current primary key',
    );
  });

  it('still returns the plaintext when re-encryption fails', async () => {
    const { db, update } = createDb(storedRow());
    update.mockRejectedValue(new Error('db down'));
    const store = new McpUserSettingsStore(db, encryptor, logger);

    await expect(store.get(SERVER, USER)).resolves.toMatchObject({
      token: 'pat-123',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to re-encrypt token for github — will retry on next read',
      expect.any(Error),
    );
  });
});
