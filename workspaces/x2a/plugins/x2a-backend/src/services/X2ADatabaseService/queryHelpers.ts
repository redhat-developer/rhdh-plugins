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
 * When canDoAll is false/undefined, restricts to rows where owned_by matches
 * the user or any of the Backstage groups the user is a member of.
 */
export function filterPermissions(
  queryBuilder: Knex.QueryBuilder,
  canDoAll: boolean | undefined,
  userEntityRef: string,
  groupsOfUser: string[] = [],
): void {
  if (!canDoAll) {
    const allowedCreators = [userEntityRef, ...groupsOfUser];
    queryBuilder.whereIn('owned_by', allowedCreators);
  }
}

const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'created_at',
  ownedBy: 'owned_by',
  finishedAt: 'finished_at',
  startedAt: 'started_at',
};

const NON_DB_SORT_FIELDS: ReadonlySet<string> = new Set(['status']);

/**
 * Map REST sort param to database column name.
 * Returns `undefined` for computed fields (e.g. "status") that have no DB column.
 */
export function mapSortToDatabaseColumn(sort?: string): string | undefined {
  if (!sort || NON_DB_SORT_FIELDS.has(sort)) return undefined;
  return SORT_COLUMN_MAP[sort] || sort;
}

export function isNonDbSortField(sort?: string): boolean {
  return !!sort && NON_DB_SORT_FIELDS.has(sort);
}
