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
import { InputError } from '@backstage/errors';
import type { Knex } from 'knex';
import {
  boostConfigFields,
  BOOST_CONFIG_SCHEMA_VERSION,
  isDbWritable,
  isSensitiveField,
  validateConfigValue,
  type BoostConfigKey,
} from './schemas';
import { encryptValue, decryptValue } from './encryption';

const TABLE_NAME = 'boost_admin_config';

/**
 * A single row in the `boost_admin_config` table.
 *
 * @internal
 */
interface AdminConfigRow {
  key: string;
  value: string;
  schema_version: number;
  updated_at: string;
}

/**
 * Options for creating an {@link AdminConfigService}.
 *
 * @public
 */
export interface AdminConfigServiceOptions {
  database: DatabaseService;
  logger: LoggerService;
  /**
   * Secret used for encrypting sensitive config values.
   * @internal
   */
  encryptionSecret?: string;
}

/**
 * Service for reading and writing admin config overrides stored in
 * the `boost_admin_config` database table. All writes are validated
 * against Zod schemas and scope-checked before persistence.
 *
 * @public
 */
export class AdminConfigService {
  private readonly logger: LoggerService;
  private readonly encryptionSecret?: string;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: AdminConfigServiceOptions) {
    this.logger = options.logger.child({ service: 'AdminConfigService' });
    this.encryptionSecret = options.encryptionSecret;
    this.database = options.database;
  }

  /**
   * Get the Knex instance, running migrations on first access.
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
   * Ensure the admin config table exists.
   */
  private async ensureTable(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable(TABLE_NAME);
    if (!exists) {
      await knex.schema.createTable(TABLE_NAME, table => {
        table.string('key').primary().notNullable();
        table.text('value').notNullable();
        table.integer('schema_version').notNullable();
        table
          .timestamp('updated_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
      });
      this.logger.info(`Created ${TABLE_NAME} table`);
    }
  }

  /**
   * Read a single config override from the database.
   *
   * @param key - The config field key.
   * @returns The stored value, or `undefined` if no override exists.
   */
  async getOverride(key: BoostConfigKey): Promise<unknown | undefined> {
    const knex = await this.getDb();
    const row = await knex<AdminConfigRow>(TABLE_NAME).where({ key }).first();

    if (!row) {
      return undefined;
    }

    let rawValue: unknown;
    try {
      rawValue = JSON.parse(row.value);
    } catch {
      this.logger.error(
        `Corrupt value for config key "${key}" — removing (invalid JSON)`,
      );
      await knex<AdminConfigRow>(TABLE_NAME).where({ key }).delete();
      return undefined;
    }

    // Decrypt sensitive fields
    if (isSensitiveField(key) && typeof rawValue === 'string') {
      if (!this.encryptionSecret) {
        this.logger.warn(
          `Cannot decrypt sensitive field "${key}" — no encryption secret configured`,
        );
        return undefined;
      }
      try {
        rawValue = decryptValue(rawValue, this.encryptionSecret);
      } catch {
        this.logger.error(
          `Failed to decrypt sensitive field "${key}" — secret may have been rotated`,
        );
        return undefined;
      }
    }

    return rawValue;
  }

  /**
   * Read all config overrides from the database.
   *
   * @returns A map of key → parsed value for all stored overrides.
   */
  async getAllOverrides(): Promise<Map<string, unknown>> {
    const knex = await this.getDb();
    const rows = await knex<AdminConfigRow>(TABLE_NAME).select();
    const result = new Map<string, unknown>();

    for (const row of rows) {
      let rawValue: unknown;
      try {
        rawValue = JSON.parse(row.value);
      } catch {
        this.logger.error(
          `Corrupt value for config key "${row.key}" — skipping (invalid JSON)`,
        );
        continue;
      }

      // Decrypt sensitive fields
      const key = row.key as BoostConfigKey;
      if (
        key in boostConfigFields &&
        isSensitiveField(key) &&
        typeof rawValue === 'string'
      ) {
        if (!this.encryptionSecret) {
          this.logger.warn(
            `Cannot decrypt sensitive field "${key}" — no encryption secret configured`,
          );
          continue;
        }
        try {
          rawValue = decryptValue(rawValue, this.encryptionSecret);
        } catch {
          this.logger.error(
            `Failed to decrypt sensitive field "${key}" — secret may have been rotated`,
          );
          continue;
        }
      }

      result.set(row.key, rawValue);
    }

    return result;
  }

  /**
   * Write a config override to the database. The value is validated
   * against the Zod schema and scope-checked before persistence.
   *
   * @param key - The config field key.
   * @param value - The value to store.
   * @throws InputError if the key is yaml-only or validation fails.
   */
  async setOverride(key: BoostConfigKey, value: unknown): Promise<void> {
    // Scope check: reject yaml-only fields
    if (!isDbWritable(key)) {
      throw new InputError(
        `Config field "${key}" has scope "${boostConfigFields[key].configScope}" and cannot be set via the admin panel`,
      );
    }

    // Validate against Zod schema
    const validated = validateConfigValue(key, value);

    // Encrypt sensitive values
    let serialized: string;
    if (isSensitiveField(key) && typeof validated === 'string') {
      if (!this.encryptionSecret) {
        throw new InputError(
          `Cannot store sensitive field "${key}" without an encryption secret configured`,
        );
      }
      serialized = JSON.stringify(
        encryptValue(validated, this.encryptionSecret),
      );
    } else {
      serialized = JSON.stringify(validated);
    }

    const knex = await this.getDb();

    await knex<AdminConfigRow>(TABLE_NAME)
      .insert({
        key,
        value: serialized,
        schema_version: BOOST_CONFIG_SCHEMA_VERSION,
        updated_at: knex.fn.now() as unknown as string,
      })
      .onConflict('key')
      .merge({
        value: serialized,
        schema_version: BOOST_CONFIG_SCHEMA_VERSION,
        updated_at: knex.fn.now() as unknown as string,
      });

    this.logger.info(`Config override set: ${key}`);
  }

  /**
   * Remove a config override, restoring the YAML baseline for that field.
   *
   * @param key - The config field key to remove.
   */
  async removeOverride(key: BoostConfigKey): Promise<void> {
    const knex = await this.getDb();
    await knex<AdminConfigRow>(TABLE_NAME).where({ key }).delete();
    this.logger.info(`Config override removed: ${key}`);
  }

  /**
   * Re-validate all stored DB values against the current Zod schemas.
   * Values that fail validation are removed, restoring YAML baseline.
   *
   * Called on startup to handle schema evolution.
   *
   * @returns List of keys that were removed due to validation failure.
   */
  async validateStoredValues(): Promise<string[]> {
    const knex = await this.getDb();
    const rows = await knex<AdminConfigRow>(TABLE_NAME).select();
    const removedKeys: string[] = [];

    for (const row of rows) {
      const key = row.key as BoostConfigKey;

      // If the field no longer exists in the schema, remove it
      if (!(key in boostConfigFields)) {
        this.logger.warn(
          `Removing unknown config override "${key}" — field no longer exists in schema`,
        );
        await knex<AdminConfigRow>(TABLE_NAME).where({ key }).delete();
        removedKeys.push(key);
        continue;
      }

      // Warn at startup if sensitive fields exist but cannot be decrypted
      if (isSensitiveField(key) && !this.encryptionSecret) {
        this.logger.warn(
          `Sensitive config override "${key}" exists in DB but no encryption secret is configured — ` +
            `this field will be unreadable at runtime. Set boost.encryptionSecret to restore access.`,
        );
      }

      // Decrypt sensitive fields before validation
      let rawValue: unknown;
      try {
        rawValue = JSON.parse(row.value);
      } catch {
        this.logger.warn(
          `Removing config override "${key}" — corrupt JSON (schema version ${row.schema_version})`,
        );
        await knex<AdminConfigRow>(TABLE_NAME).where({ key }).delete();
        removedKeys.push(key);
        continue;
      }

      if (
        isSensitiveField(key) &&
        typeof rawValue === 'string' &&
        this.encryptionSecret
      ) {
        try {
          rawValue = decryptValue(rawValue, this.encryptionSecret);
        } catch {
          this.logger.warn(
            `Cannot validate sensitive field "${key}" — decryption failed (secret may have been rotated). Keeping row intact.`,
          );
          continue;
        }
      }

      // Re-validate the decrypted value against the Zod schema
      try {
        validateConfigValue(key, rawValue);
      } catch (error) {
        this.logger.warn(
          `Removing invalid config override "${key}" (schema version ${row.schema_version}): ${error}`,
        );
        await knex<AdminConfigRow>(TABLE_NAME).where({ key }).delete();
        removedKeys.push(key);
      }
    }

    if (removedKeys.length > 0) {
      this.logger.info(
        `Schema validation removed ${removedKeys.length} invalid override(s): ${removedKeys.join(', ')}`,
      );
    } else {
      this.logger.info('All stored config overrides passed schema validation');
    }

    return removedKeys;
  }
}
