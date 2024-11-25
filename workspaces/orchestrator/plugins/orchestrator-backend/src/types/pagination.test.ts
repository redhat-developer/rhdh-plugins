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
import { buildPagination } from './pagination';

describe('buildPagination()', () => {
  it('should build the correct pagination obj when no query parameters are passed', () => {
    const mockRequest: any = {
      body: {},
    };
    expect(buildPagination(mockRequest)).toEqual({});
  });
  it('should build the correct pagination obj when partial query parameters are passed', () => {
    const mockRequest: any = {
      body: {
        paginationInfo: {
          orderBy: 'lastUpdated',
        },
      },
    };
    expect(buildPagination(mockRequest)).toEqual({
      limit: undefined,
      offset: undefined,
      order: undefined,
      sortField: 'lastUpdated',
    });
  });
  it('should build the correct pagination obj when all query parameters are passed', () => {
    const mockRequest: any = {
      body: {
        paginationInfo: {
          offset: 1,
          pageSize: 50,
          orderBy: 'lastUpdated',
          orderDirection: 'DESC',
        },
      },
    };
    expect(buildPagination(mockRequest)).toEqual({
      limit: 50,
      offset: 1,
      order: 'DESC',
      sortField: 'lastUpdated',
    });
  });
  it('should build the correct pagination obj when non numeric value passed to number fields', () => {
    const mockRequest: any = {
      body: {
        paginationInfo: {
          offset: 'abc',
          pageSize: 'cde',
        },
      },
    };
    expect(buildPagination(mockRequest)).toEqual({
      limit: undefined,
      offset: undefined,
      order: undefined,
      sortField: undefined,
    });
  });
});
