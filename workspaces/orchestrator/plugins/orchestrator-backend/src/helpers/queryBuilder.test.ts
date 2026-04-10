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

import { Pagination } from '../types/pagination';
import { buildGraphQlQuery } from './queryBuilder';

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
      name: 'should build a query with pagination',
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
