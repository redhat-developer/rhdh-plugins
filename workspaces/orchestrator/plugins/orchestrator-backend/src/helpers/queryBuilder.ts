/*
 * Copyright 2024 The Backstage Authors
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
import { Pagination } from '../types/pagination';

export function buildGraphQlQuery(args: {
  type: 'ProcessDefinitions' | 'ProcessInstances' | 'Jobs';
  queryBody: string;
  whereClause?: string;
  pagination?: Pagination;
}): string {
  let query = `{${args.type}`;

  const whereClause = buildWhereClause(args.whereClause);
  const paginationClause = buildPaginationClause(args.pagination);

  if (whereClause || paginationClause) {
    query += ' (';
    query += [whereClause, paginationClause].filter(Boolean).join(', ');
    query += ') ';
  }

  query += ` {${args.queryBody} } }`;

  return query.replace(/\s+/g, ' ').trim();
}

function buildWhereClause(whereClause?: string): string {
  return whereClause ? `where: {${whereClause}}` : '';
}

function buildPaginationClause(pagination?: Pagination): string {
  if (!pagination) return '';

  const parts = [];

  if (pagination.sortField !== undefined) {
    parts.push(
      `orderBy: {${pagination.sortField}: ${
        pagination.order !== undefined ? pagination.order?.toUpperCase() : 'ASC'
      }}`,
    );
  }

  const paginationParts = [];
  if (pagination.limit !== undefined) {
    paginationParts.push(`limit: ${pagination.limit}`);
  }
  if (pagination.offset !== undefined) {
    paginationParts.push(`offset: ${pagination.offset}`);
  }
  if (paginationParts.length) {
    parts.push(`pagination: {${paginationParts.join(', ')}}`);
  }

  return parts.join(', ');
}
