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

import { FilterClause } from '../types/filterClause';
import { Pagination, PaginationQueryVariable } from '../types/pagination';

export function buildGraphQlQuery(args: {
  type: 'ProcessDefinitions' | 'ProcessInstances' | 'Jobs';
  queryBody: string;
  whereClause?: string;
  pagination?: Pagination;
  filterCondition?: FilterClause;
}): string {
  const queryHeaderStart = 'query (';
  const queryHeaderEnd = ')';

  const queryHeaderPaginationOrderByParams = `$paginationInfo: Pagination, $orderByInfo: ${args.type.slice(0, -1)}OrderBy`;

  const filterParams = args.filterCondition?.clauseVariable
    ?.map(cl => {
      return `$${cl.clauseVariableName}: ${cl.clauseVariableType}`;
    })
    .join(', ');

  const params = [queryHeaderPaginationOrderByParams, filterParams]
    .filter(Boolean)
    .join(', ');

  let query = `${queryHeaderStart}${params}${queryHeaderEnd}{${args.type}`;
  const whereClause = buildWhereClause(args.whereClause);

  const paginationClause = 'pagination: $paginationInfo';
  const orderByClause = 'orderBy: $orderByInfo';

  if (whereClause || paginationClause || orderByClause) {
    query += ' (';
    query += [whereClause, orderByClause, paginationClause]
      .filter(Boolean)
      .join(', ');
    query += ') ';
  }

  query += ` {${args.queryBody} } }`;

  return query.replace(/\s+/g, ' ').trim();
}

function buildWhereClause(whereClause?: string): string {
  return whereClause ? `where: {${whereClause}}` : '';
}

export function buildOrderByVariables(pagination?: Pagination): {
  [key: string]: string;
} {
  const orderByVariable: { [key: string]: string } = {};

  if (pagination?.sortField !== undefined) {
    orderByVariable[pagination.sortField] =
      pagination.order !== undefined ? pagination.order?.toUpperCase() : 'ASC';
  }

  return orderByVariable;
}

export function buildPaginationVariables(
  pagination?: Pagination,
): PaginationQueryVariable {
  const paginationVariable: PaginationQueryVariable = {};

  if (pagination?.limit !== undefined) {
    paginationVariable.limit = pagination.limit;
  }

  if (pagination?.offset !== undefined) {
    paginationVariable.offset = pagination.offset;
  }
  return paginationVariable;
}

export function buildQueryParamVariable(
  pagination?: Pagination,
  filterCondition?: FilterClause,
) {
  const paramVariables: any = {
    paginationInfo: buildPaginationVariables(pagination),
    orderByInfo: buildOrderByVariables(pagination),
  };

  filterCondition?.clauseVariable?.forEach(p => {
    paramVariables[p.clauseVariableName] = p.formattedValue;
  });

  return paramVariables;
}
