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
import { Pagination } from '../types/pagination';
import {
  buildGraphQlQuery,
  buildOrderByVariables,
  buildPaginationVariables,
  buildQueryParamVariable,
} from './queryBuilder';

describe('buildGraphQlQuery', () => {
  const defaultTestParams = {
    queryBody: 'id status',
    type: 'ProcessInstances' as
      | 'ProcessDefinitions'
      | 'ProcessInstances'
      | 'Jobs',
    pagination: {
      offset: 0,
      limit: 10,
      order: 'asc',
      sortField: 'name',
    } as Pagination | undefined,
    whereClause: 'version: "1.0"',
  };

  type TestCase = {
    name: string;
    params: typeof defaultTestParams;
    expectedResult: string;
  };

  const testCases: TestCase[] = [
    {
      name: 'should build a basic query without where clause and pagination',
      params: {
        type: defaultTestParams.type,
        queryBody: defaultTestParams.queryBody,
        whereClause: '',
        pagination: {},
      },
      expectedResult: `query ($paginationInfo: Pagination, $orderByInfo: ${defaultTestParams.type.slice(0, -1)}OrderBy){${defaultTestParams.type} (orderBy: $orderByInfo, pagination: $paginationInfo) {${defaultTestParams.queryBody} } }`,
    },
    {
      name: 'should build a query with a where clause',
      params: {
        type: defaultTestParams.type,
        queryBody: defaultTestParams.queryBody,
        whereClause: defaultTestParams.whereClause,
        pagination: {},
      },
      expectedResult: `query ($paginationInfo: Pagination, $orderByInfo: ${defaultTestParams.type.slice(0, -1)}OrderBy){${defaultTestParams.type} (where: {${defaultTestParams.whereClause}}, orderBy: $orderByInfo, pagination: $paginationInfo) {${defaultTestParams.queryBody} } }`,
    },
    {
      // The query string always contains $paginationInfo/$orderByInfo variable refs
      // regardless of pagination values — actual values are passed via buildQueryParamVariable.
      name: 'should build the same query structure with or without pagination values',
      params: {
        type: defaultTestParams.type,
        queryBody: defaultTestParams.queryBody,
        whereClause: '',
        pagination: defaultTestParams.pagination,
      },
      expectedResult: `query ($paginationInfo: Pagination, $orderByInfo: ${defaultTestParams.type.slice(0, -1)}OrderBy){${defaultTestParams.type} (orderBy: $orderByInfo, pagination: $paginationInfo) {${defaultTestParams.queryBody} } }`,
    },
    {
      name: 'should build a query with both where clause and pagination',
      params: {
        ...defaultTestParams,
      },
      expectedResult: `query ($paginationInfo: Pagination, $orderByInfo: ${defaultTestParams.type.slice(0, -1)}OrderBy){${defaultTestParams.type} (where: {${
        defaultTestParams.whereClause
      }}, orderBy: $orderByInfo, pagination: $paginationInfo) {${
        defaultTestParams.queryBody
      } } }`,
    },
  ];

  testCases.forEach(({ name, params, expectedResult }) => {
    it(`${name}`, () => {
      const result = buildGraphQlQuery(params);
      expect(result).toBe(expectedResult);
    });
  });
});

describe('buildOrderByVariables', () => {
  it('returns empty object when no pagination is provided', () => {
    expect(buildOrderByVariables(undefined)).toEqual({});
  });

  it('returns empty object when pagination has no sortField', () => {
    expect(buildOrderByVariables({ limit: 10, offset: 0 })).toEqual({});
  });

  it('returns orderBy object with ASC as default when no order is provided', () => {
    expect(buildOrderByVariables({ sortField: 'name' })).toEqual({
      name: 'ASC',
    });
  });

  it('returns orderBy object with the specified order uppercased', () => {
    expect(
      buildOrderByVariables({ sortField: 'lastUpdated', order: 'desc' }),
    ).toEqual({ lastUpdated: 'DESC' });
  });

  it('returns orderBy object with DESC when order is DESC', () => {
    expect(
      buildOrderByVariables({ sortField: 'start', order: 'DESC' }),
    ).toEqual({ start: 'DESC' });
  });
});

describe('buildPaginationVariables', () => {
  it('returns empty object when no pagination is provided', () => {
    expect(buildPaginationVariables(undefined)).toEqual({});
  });

  it('returns empty object when pagination has neither limit nor offset', () => {
    expect(
      buildPaginationVariables({ order: 'ASC', sortField: 'name' }),
    ).toEqual({});
  });

  it('includes only limit when only limit is defined', () => {
    expect(buildPaginationVariables({ limit: 20 })).toEqual({ limit: 20 });
  });

  it('includes only offset when only offset is defined', () => {
    expect(buildPaginationVariables({ offset: 5 })).toEqual({ offset: 5 });
  });

  it('includes both limit and offset when both are defined', () => {
    expect(buildPaginationVariables({ limit: 10, offset: 0 })).toEqual({
      limit: 10,
      offset: 0,
    });
  });
});

describe('buildQueryParamVariable', () => {
  it('returns paginationInfo and orderByInfo with empty objects when no args provided', () => {
    const result = buildQueryParamVariable(undefined, undefined);
    expect(result).toEqual({
      paginationInfo: {},
      orderByInfo: {},
    });
  });

  it('includes pagination values in paginationInfo and orderByInfo', () => {
    const pagination: Pagination = {
      limit: 10,
      offset: 5,
      sortField: 'name',
      order: 'ASC',
    };
    const result = buildQueryParamVariable(pagination, undefined);
    expect(result).toEqual({
      paginationInfo: { limit: 10, offset: 5 },
      orderByInfo: { name: 'ASC' },
    });
  });

  it('merges filter clause variables alongside pagination info', () => {
    const pagination: Pagination = { limit: 5 };
    const filterCondition: FilterClause = {
      clause: 'processId: {equal: $processId}',
      clauseVariable: [
        {
          clauseVariableName: 'processId',
          clauseVariableType: 'StringArgument',
          formattedValue: 'my-workflow',
        },
      ],
    };
    const result = buildQueryParamVariable(pagination, filterCondition);
    expect(result).toEqual({
      paginationInfo: { limit: 5 },
      orderByInfo: {},
      processId: 'my-workflow',
    });
  });

  it('supports multiple filter clause variables', () => {
    const filterCondition: FilterClause = {
      clause: 'id: {equal: $id}, status: {equal: $status}',
      clauseVariable: [
        {
          clauseVariableName: 'id',
          clauseVariableType: 'StringArgument',
          formattedValue: 'wf-123',
        },
        {
          clauseVariableName: 'status',
          clauseVariableType: 'StringArgument',
          formattedValue: 'ACTIVE',
        },
      ],
    };
    const result = buildQueryParamVariable(undefined, filterCondition);
    expect(result.id).toBe('wf-123');
    expect(result.status).toBe('ACTIVE');
  });
});
