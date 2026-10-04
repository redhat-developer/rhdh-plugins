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
import { DORA_UPSERT_BATCH_SIZE } from './constants';
import {
  fromDoraDeploymentRow,
  toDoraDeploymentCreateRow,
  type DbDoraDeploymentRow,
} from './mappers';
import type {
  DbDoraDeployment,
  DbDoraDeploymentCreate,
  DoraDbWriteOptions,
} from './types';

/**
 * Restricts the query to production-like environments: null/empty environment
 * (treated as production) or a case-insensitive match against `productionEnvironments`.
 *
 * If `productionEnvironments` is empty the filter is skipped entirely, which has
 * the same effect as passing `undefined` to the caller (all rows are returned).
 *
 * **SQLite limitation:** `LOWER()` in SQLite only folds ASCII characters (A-Z → a-z).
 * Non-ASCII environment names (e.g. `PRÖD`) will not match a configured value that
 * differs only in Unicode case (`pröd`) when running on SQLite. This is not a concern
 * in practice because deployment environment names are virtually always ASCII, and
 * SQLite is only used for local development; PostgreSQL (the production database)
 * handles Unicode `LOWER()` correctly.
 */
function applyProductionEnvironmentFilter(
  query: Knex.QueryBuilder,
  productionEnvironments: string[],
): void {
  if (productionEnvironments.length === 0) {
    return;
  }
  const lowered = productionEnvironments.map(name => name.toLowerCase());
  query.andWhere(builder => {
    builder.whereNull('environment').orWhere('environment', '');
    builder.orWhereRaw(`LOWER(??) IN (${lowered.map(() => '?').join(', ')})`, [
      'environment',
      ...lowered,
    ]);
  });
}

export interface DoraDeploymentsStore {
  upsert(deployments: DbDoraDeploymentCreate[]): Promise<void>;
  /**
   * When `productionEnvironments` is provided, only rows whose environment is
   * null, empty, or case-insensitively matches one of the names are returned.
   */
  readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    from: Date,
    to: Date,
    productionEnvironments?: string[],
  ): Promise<DbDoraDeployment[]>;
  /**
   * Newest row with `created_at` strictly before `before` for the entity and
   * collector identity. When `productionEnvironments` is non-empty, only
   * production-like environments are considered (same rules as
   * {@link DoraDeploymentsStore.readByEntityCollectorAndWindow}).
   */
  readLatestByEntityCollectorBefore(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    before: Date,
    productionEnvironments: string[],
  ): Promise<DbDoraDeployment | undefined>;
  markPullRequestsSynced(
    deploymentId: string,
    pullRequestsSync: {
      collectorId: string;
      collectorInputHash: string;
    },
    options?: DoraDbWriteOptions,
  ): Promise<void>;
  deleteOlderThan(olderThan: Date): Promise<number>;
}

export class DatabaseDoraDeployments implements DoraDeploymentsStore {
  private readonly tableName = 'dora_deployments';

  constructor(private readonly dbClient: Knex) {}

  async upsert(deployments: DbDoraDeploymentCreate[]): Promise<void> {
    if (deployments.length === 0) {
      return;
    }

    await this.dbClient.transaction(async trx => {
      for (
        let offset = 0;
        offset < deployments.length;
        offset += DORA_UPSERT_BATCH_SIZE
      ) {
        const batch = deployments
          .slice(offset, offset + DORA_UPSERT_BATCH_SIZE)
          .map(deployment => ({
            ...toDoraDeploymentCreateRow(deployment),
            id: randomUUID(),
          }));

        await trx(this.tableName)
          .insert(batch)
          .onConflict([
            'catalog_entity_ref',
            'collector_id',
            'collector_input_hash',
            'original_deployment_id',
          ])
          // Immutable historical facts: keep the first stored row.
          // `deploymentLookbackMs` re-queries recent `created_at` so a deployment
          // that later becomes `success` can be inserted. Already-stored rows are
          // never updated.
          .ignore();
      }
    });
  }

  async readByEntityCollectorAndWindow(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    from: Date,
    to: Date,
    productionEnvironments?: string[],
  ): Promise<DbDoraDeployment[]> {
    const query = this.dbClient<DbDoraDeploymentRow>(this.tableName)
      .select('*')
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .andWhere('collector_input_hash', collectorInputHash)
      .andWhere('created_at', '>=', from)
      .andWhere('created_at', '<=', to);

    if (productionEnvironments !== undefined) {
      applyProductionEnvironmentFilter(query, productionEnvironments);
    }

    const rows = await query.orderBy('created_at', 'asc');

    return rows.map(fromDoraDeploymentRow);
  }

  async readLatestByEntityCollectorBefore(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    before: Date,
    productionEnvironments: string[],
  ): Promise<DbDoraDeployment | undefined> {
    const query = this.dbClient<DbDoraDeploymentRow>(this.tableName)
      .select('*')
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .andWhere('collector_input_hash', collectorInputHash)
      .andWhere('created_at', '<', before);

    applyProductionEnvironmentFilter(query, productionEnvironments);

    const row = await query
      .orderBy([
        { column: 'created_at', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .first();

    return row ? fromDoraDeploymentRow(row) : undefined;
  }

  async markPullRequestsSynced(
    deploymentId: string,
    pullRequestsSync: {
      collectorId: string;
      collectorInputHash: string;
    },
    options?: DoraDbWriteOptions,
  ): Promise<void> {
    await (options?.trx ?? this.dbClient)(this.tableName)
      .where('id', deploymentId)
      .update({
        pull_requests_collector_id: pullRequestsSync.collectorId,
        pull_requests_collector_input_hash: pullRequestsSync.collectorInputHash,
      });
  }

  async deleteOlderThan(olderThan: Date): Promise<number> {
    return await this.dbClient(this.tableName)
      .where('created_at', '<', olderThan)
      .del();
  }
}
