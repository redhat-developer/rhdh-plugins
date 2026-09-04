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
import { randomUUID } from 'node:crypto';
import {
  fromDoraDeploymentRow,
  toDoraDeploymentRow,
  type DbDoraDeploymentRow,
} from './mappers';
import type { DbDoraDeployment, DbDoraDeploymentCreate } from './types';

export interface DoraDeploymentsStore {
  upsert(deployments: DbDoraDeploymentCreate[]): Promise<void>;
  readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    from: Date,
    to: Date,
  ): Promise<DbDoraDeployment[]>;
  markPullRequestsSynced(deploymentId: string, syncedAt: Date): Promise<void>;
  deleteOlderThan(olderThan: Date): Promise<number>;
}

export class DatabaseDoraDeployments implements DoraDeploymentsStore {
  private readonly tableName = 'dora_deployments';

  constructor(private readonly dbClient: Knex) {}

  async upsert(deployments: DbDoraDeploymentCreate[]): Promise<void> {
    if (deployments.length === 0) {
      return;
    }

    await this.dbClient(this.tableName)
      .insert(
        deployments.map(deployment => ({
          ...toDoraDeploymentRow(deployment),
          id: randomUUID(),
        })),
      )
      .onConflict([
        'catalog_entity_ref',
        'collector_id',
        'collector_input_hash',
        'original_deployment_id',
      ])
      // All columns are immutable historical facts for a given deployment
      // created_at: we keep attributed to when the deployment first succeeded
      .ignore();
  }

  async readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    from: Date,
    to: Date,
  ): Promise<DbDoraDeployment[]> {
    const rows = await this.dbClient<DbDoraDeploymentRow>(this.tableName)
      .select('*')
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .andWhere('collector_input_hash', collectorInputHash)
      .andWhere('created_at', '>=', from)
      .andWhere('created_at', '<=', to)
      .orderBy('created_at', 'asc');

    return rows.map(fromDoraDeploymentRow);
  }

  async markPullRequestsSynced(
    deploymentId: string,
    syncedAt: Date,
  ): Promise<void> {
    await this.dbClient(this.tableName)
      .where('id', deploymentId)
      .update({ pull_requests_synced_at: syncedAt });
  }

  async deleteOlderThan(olderThan: Date): Promise<number> {
    return await this.dbClient(this.tableName)
      .where('created_at', '<', olderThan)
      .del();
  }
}
