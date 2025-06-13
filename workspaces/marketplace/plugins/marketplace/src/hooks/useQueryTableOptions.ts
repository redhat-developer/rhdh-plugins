/*
 * Copyright The Backstage Authors
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

import { useCallback, useRef, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { TableColumn, TableProps } from '@backstage/core-components';

interface QueryTableOptions<DataRow extends object> {
  query: {
    offset: number;
    limit: number;
    orderFields?: {
      field: string;
      order: 'asc' | 'desc';
    };
    searchTerm?: string;
  };
  tableProps: Partial<TableProps<DataRow>>;
}

const getNumberOrDefault = (str: string | null, defaultValue: number) => {
  if (!str) return defaultValue;
  const num = parseInt(str, 10);
  return !num || isNaN(num) ? defaultValue : num;
};

export const useQueryTableOptions = <DataRow extends object>(
  columns: TableColumn<DataRow>[],
): QueryTableOptions<DataRow> => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getNumberOrDefault(searchParams.get('page'), 0);
  const pageSize = getNumberOrDefault(searchParams.get('pageSize'), 5);
  const searchText = searchParams.get('searchText') ?? undefined;
  const order = searchParams.get('order') ?? undefined;

  const onPageChange = useCallback(
    (newPage: number) => {
      setSearchParams(params => {
        if (newPage <= 0) {
          params.delete('page');
        } else {
          params.set('page', String(newPage));
        }
        return params;
      });
    },
    [setSearchParams],
  );

  const onRowsPerPageChange = useCallback(
    (newPageSize: number) => {
      setSearchParams(params => {
        if (newPageSize <= 0) {
          params.delete('pageSize');
        } else {
          params.set('pageSize', String(newPageSize));
        }
        return params;
      });
    },
    [setSearchParams],
  );

  const onSearchChangeDebounceTimeout = useRef<ReturnType<typeof setTimeout>>();
  const onSearchChange = useCallback(
    (newSearchText: string) => {
      clearTimeout(onSearchChangeDebounceTimeout.current);
      onSearchChangeDebounceTimeout.current = setTimeout(() => {
        setSearchParams(params => {
          if (!newSearchText) {
            params.delete('searchText');
          } else {
            params.set('searchText', newSearchText);
          }
          params.delete('page');
          return params;
        });
      }, 500);
    },
    [setSearchParams],
  );

  const onOrderChange = useCallback(
    (orderBy: number, orderDirection: 'asc' | 'desc') => {
      if (orderBy === -1) {
        setSearchParams(params => {
          params.delete('order');
          params.delete('page');
          return params;
        });
        return;
      }
      setSearchParams(params => {
        params.set(
          'order',
          `${columns[orderBy]?.field?.toString()} ${orderDirection}`,
        );
        params.delete('page');
        return params;
      });
    },
    [setSearchParams, columns],
  );

  return useMemo(
    () => ({
      query: {
        offset: page * pageSize,
        limit: pageSize,
        orderFields: order
          ? {
              field: order.split(' ')[0],
              order: order.split(' ')[1] as 'asc' | 'desc',
            }
          : {
              field: 'metadata.name',
              order: 'asc',
            },
        searchTerm: searchText,
      },

      tableProps: {
        page,
        options: {
          pageSize,
          searchText,
        },
        onPageChange,
        onRowsPerPageChange,
        onSearchChange,
        onOrderChange,
      },
    }),
    [
      page,
      pageSize,
      searchText,
      order,
      onPageChange,
      onRowsPerPageChange,
      onSearchChange,
      onOrderChange,
    ],
  );
};
