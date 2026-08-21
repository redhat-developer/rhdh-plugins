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

import { type Knex } from 'knex';
import { asDate } from './mappers';

export interface DoraLastSyncStore {
  getLastSyncedAt(
    catalogEntityRef: string,
    collectorId: string,
  ): Promise<Date | undefined>;
  /**
   * Records a successful sync watermark. Only advances when the new value
   * is later than the stored one.
   */
  setLastSyncedAt(
    catalogEntityRef: string,
    collectorId: string,
    lastSyncedAt: Date,
  ): Promise<void>;
}

export class DatabaseDoraLastSync implements DoraLastSyncStore {
  private readonly tableName = 'dora_last_sync';

  constructor(private readonly dbClient: Knex) {}

  async getLastSyncedAt(
    catalogEntityRef: string,
    collectorId: string,
  ): Promise<Date | undefined> {
    const row = await this.dbClient(this.tableName)
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .select('last_synced_at')
      .first();

    if (!row?.last_synced_at) {
      return undefined;
    }

    return asDate(row.last_synced_at);
  }

  async setLastSyncedAt(
    catalogEntityRef: string,
    collectorId: string,
    lastSyncedAt: Date,
  ): Promise<void> {
    // Single-statement upsert: insert when missing, otherwise only advance when
    // the stored watermark is strictly earlier.
    await this.dbClient(this.tableName)
      .insert({
        catalog_entity_ref: catalogEntityRef,
        collector_id: collectorId,
        last_synced_at: lastSyncedAt,
      })
      .onConflict(['catalog_entity_ref', 'collector_id'])
      .merge(['last_synced_at'])
      .where(`${this.tableName}.last_synced_at`, '<', lastSyncedAt);
  }
}
