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
import { PostgresAdapter } from './adapters/PostgresAdapter';
import { EventDatabase } from './event-database';
import { SqliteAdapter } from './adapters/SqliteAdapter';
import { LoggerService } from '@backstage/backend-plugin-api';

export class DatabaseFactory {
  static getDatabase(db: Knex, logger: LoggerService): EventDatabase {
    const dbType = db.client.config.client;

    switch (dbType) {
      case 'pg':
        return new PostgresAdapter(db, logger);
      case 'better-sqlite3':
        return new SqliteAdapter(db, logger);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }
}
