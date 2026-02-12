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

/**
 * Filter query by user permissions.
 * When canDoAll is false/undefined, restricts to rows where created_by matches userEntityRef.
 */
export function filterPermissions(
  queryBuilder: Knex.QueryBuilder,
  canDoAll: boolean | undefined,
  userEntityRef: string,
): void {
  if (!canDoAll) {
    queryBuilder.where('created_by', userEntityRef);
  }
}

const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'created_at',
  createdBy: 'created_by',
  finishedAt: 'finished_at',
  startedAt: 'started_at',
};

/**
 * Map REST sort param to database column name.
 */
export function mapSortToDatabaseColumn(sort?: string): string | undefined {
  return sort ? SORT_COLUMN_MAP[sort] || sort : undefined;
}
