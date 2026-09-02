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
  fromDoraPullRequestRow,
  toDoraPullRequestRow,
  type DbDoraPullRequestRow,
} from './mappers';
import type { DbDoraPullRequest, DbDoraPullRequestCreate } from './types';

export interface DoraPullRequestsStore {
  upsert(pullRequests: DbDoraPullRequestCreate[]): Promise<void>;
  readByEntityCollectorAndDeployment(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    deploymentId: string,
  ): Promise<DbDoraPullRequest[]>;
  /**
   * Deletes pull requests whose parent deployment is older than the cutoff (for sqlite without CASCADE delete support).
   */
  deleteForDeploymentsOlderThan(olderThan: Date): Promise<number>;
}

export class DatabaseDoraPullRequests implements DoraPullRequestsStore {
  private readonly tableName = 'dora_pull_requests';
  private readonly deploymentsTableName = 'dora_deployments';

  constructor(private readonly dbClient: Knex) {}

  async upsert(pullRequests: DbDoraPullRequestCreate[]): Promise<void> {
    if (pullRequests.length === 0) {
      return;
    }

    await this.dbClient(this.tableName)
      .insert(
        pullRequests.map(pullRequest => ({
          ...toDoraPullRequestRow(pullRequest),
          id: randomUUID(),
        })),
      )
      .onConflict([
        'catalog_entity_ref',
        'collector_id',
        'collector_input_hash',
        'original_pr_id',
        'deployment_id',
      ])
      .merge(['first_commit_at']);
  }

  async readByEntityCollectorAndDeployment(
    catalogEntityRef: string,
    collectorId: string,
    collectorInputHash: string,
    deploymentId: string,
  ): Promise<DbDoraPullRequest[]> {
    const rows = await this.dbClient<DbDoraPullRequestRow>(this.tableName)
      .select('*')
      .where('catalog_entity_ref', catalogEntityRef)
      .andWhere('collector_id', collectorId)
      .andWhere('collector_input_hash', collectorInputHash)
      .andWhere('deployment_id', deploymentId)
      .orderBy('first_commit_at', 'asc');

    return rows.map(fromDoraPullRequestRow);
  }

  async deleteForDeploymentsOlderThan(olderThan: Date): Promise<number> {
    return await this.dbClient(this.tableName)
      .whereIn(
        'deployment_id',
        this.dbClient(this.deploymentsTableName)
          .select('id')
          .where('created_at', '<', olderThan),
      )
      .del();
  }
}
