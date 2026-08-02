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
import {
  asDate,
  fromDoraIncidentRow,
  toDoraIncidentRow,
  type DbDoraIncidentRow,
} from './mappers';
import { DbDoraIncident, DbDoraIncidentCreate } from './types';

export interface DoraIncidentsStore {
  upsert(incidents: DbDoraIncidentCreate[]): Promise<void>;
  getLatestUpdatedAt(
    catalogEntityRef: string,
    collectorId: string,
  ): Promise<Date | undefined>;
  readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    from: Date,
    to: Date,
  ): Promise<DbDoraIncident[]>;
}

export class DatabaseDoraIncidents implements DoraIncidentsStore {
  private readonly tableName = 'dora_incidents';

  constructor(private readonly dbClient: Knex) {}

  async upsert(incidents: DbDoraIncidentCreate[]): Promise<void> {
    if (incidents.length === 0) {
      return;
    }

    await this.dbClient(this.tableName)
      .insert(
        incidents.map(incident => ({
          ...toDoraIncidentRow(incident),
          id: randomUUID(),
        })),
      )
      .onConflict([
        'catalog_entity_ref',
        'collector_id',
        'original_incident_id',
      ])
      .merge(['created_at', 'updated_at', 'resolution_at']);
  }

  async getLatestUpdatedAt(
    catalogEntityRef: string,
    collectorId: string,
  ): Promise<Date | undefined> {
    const row = await this.dbClient(this.tableName)
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .max('updated_at as latest')
      .first();

    if (!row?.latest) {
      return undefined;
    }

    return asDate(row.latest);
  }

  async readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    from: Date,
    to: Date,
  ): Promise<DbDoraIncident[]> {
    const rows = await this.dbClient<DbDoraIncidentRow>(this.tableName)
      .select('*')
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .andWhere('created_at', '>=', from)
      .andWhere('created_at', '<=', to)
      .orderBy('created_at', 'asc');

    return rows.map(fromDoraIncidentRow);
  }
}
