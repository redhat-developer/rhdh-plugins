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

import React, { useCallback, useMemo, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import snakeCase from 'lodash/snakeCase';
import {
  Link,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import type { Recommendations } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/models';
import type { GetRecommendationListRequest } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { PageLayout } from '../../components/PageLayout';
import { TableToolbar } from './components/TableToolbar';
import { Filters } from './components/Filters';
import { BasePage } from '../../components/BasePage';
import { optimizationsBreakdownRouteRef } from '../../routes';
import { getTimeFromNow } from '../../utils/dates';
import { optimizationsApiRef } from '../../apis';

export const DEFAULT_DEBOUNCE_INTERVAL: number = 700;
export const DEFAULT_PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100];
export const DEFAULT_SORTING_DIRECTION: GetRecommendationListRequest['query']['orderHow'] =
  'desc';
export const DEFAULT_SORTING_COLUMN: GetRecommendationListRequest['query']['orderBy'] =
  'last_reported';
export const DEFAULT_PADDING: 'dense' | 'default' = 'dense';

/** This type actually represents what's going to be sent to the back-end. */
type QueryState = Omit<
  GetRecommendationListRequest['query'],
  'startDate' | 'endDate'
>;

type AvailableFilteringOptions = Pick<
  QueryState,
  'cluster' | 'project' | 'workload' | 'workloadType'
>;

const initialQueryState: QueryState = {
  limit: DEFAULT_PAGE_SIZE_OPTIONS[0],
  offset: 0,
  orderBy: DEFAULT_SORTING_COLUMN,
  orderHow: DEFAULT_SORTING_DIRECTION,
};

const availableFilteringOptionsInitialState: AvailableFilteringOptions = {
  cluster: [],
  project: [],
  workload: [],
  workloadType: [],
};

/** @public */
export function OptimizationsPage() {
  const [currentPage, setCurrentPage] = useState<number>(0); // First page starts from 0
  const [queryState, setQueryState] = useState<QueryState>(initialQueryState);
  const api = useApi(optimizationsApiRef);
  const { value, error, loading } = useAsync(async () => {
    const response = await api.getRecommendationList({ query: queryState });
    return response.json();
  }, [queryState]);

  const columns = useMemo<TableColumn<Recommendations>[]>(
    () => [
      {
        title: 'Container',
        field: 'container',
        render: data => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const link = useRouteRef(optimizationsBreakdownRouteRef);
          return React.createElement(Link, {
            to: link({ id: data.id! }),
            children: data.container,
          });
        },
      },
      {
        title: 'Project',
        field: 'project',
      },
      {
        title: 'Workload',
        field: 'workload',
      },
      {
        title: 'Type',
        field: 'workloadType',
      },
      {
        title: 'Cluster',
        field: 'clusterAlias',
      },
      {
        title: 'Last reported',
        field: 'lastReported',
        render(data, _type) {
          return getTimeFromNow(data.lastReported?.toString());
        },
      },
    ],
    [],
  );
  const optimizableContainersCount = useMemo(
    () => value?.meta?.count ?? 0,
    [value?.meta?.count],
  );
  const data = useMemo(() => value?.data ?? [], [value?.data]);

  const handlePageChange = useCallback(
    (pageNumber: number, pageSize: number): void => {
      setCurrentPage(pageNumber);
      setQueryState(lastQueryState => ({
        ...lastQueryState,
        offset: pageNumber * pageSize,
        limit: pageSize,
      }));
    },
    [],
  );

  const handleRowsPerPageChange = useCallback((pageSize: number): void => {
    setQueryState(lastState => ({
      ...lastState,
      offset: (lastState.offset ?? 0) * pageSize,
      limit: pageSize,
    }));
  }, []);

  const handleOrderChange = useCallback(
    (orderBy: number, orderDirection: 'desc' | 'asc'): void => {
      const { field } = columns[orderBy];
      setQueryState(lastState => ({
        ...lastState,
        orderBy:
          field === 'clusterAlias'
            ? 'cluster'
            : (snakeCase(field as string) as NonNullable<
                typeof lastState.orderBy
              >),
        orderHow: orderDirection as NonNullable<typeof lastState.orderHow>,
      }));
    },
    [columns],
  );

  const handleFiltersChange = useCallback(
    (
      fieldId: 'cluster' | 'workloadType' | 'workload' | 'project',
      values: string[],
    ): void => {
      setQueryState(lastQueryState => ({
        ...lastQueryState,
        offset: 0,
        [fieldId]: values,
      }));
      setCurrentPage(0);
    },
    [],
  );

  const handleFiltersReset = useCallback((): void => {
    if (
      queryState.cluster?.length === 0 &&
      queryState.project?.length === 0 &&
      queryState.workload?.length === 0 &&
      queryState.workloadType?.length === 0
    ) {
      return;
    }

    setQueryState(lastQueryState => ({
      ...lastQueryState,
      ...availableFilteringOptionsInitialState,
    }));
  }, [
    queryState.cluster?.length,
    queryState.project?.length,
    queryState.workload?.length,
    queryState.workloadType?.length,
  ]);

  const handleSearchChange = useCallback((searchText: string): void => {
    setQueryState(lastState => ({
      ...lastState,
      container: Array.from(new Set(searchText.split(',').filter(Boolean))),
    }));
  }, []);

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <BasePage pageTitle="Resource Optimization" withContentPadding>
      <PageLayout>
        <PageLayout.Filters>
          <Filters
            cluster={{
              options: [],
              label: 'CLUSTERS',
            }}
            project={{
              options: [],
              label: 'PROJECTS',
            }}
            workload={{
              options: [],
              label: 'WORKLOADS',
            }}
            workloadType={{
              options: [],
              label: 'TYPES',
            }}
            onFiltersChange={handleFiltersChange}
            onFiltersReset={handleFiltersReset}
          />
        </PageLayout.Filters>
        <PageLayout.Table>
          <Table<Recommendations>
            components={{
              Toolbar: TableToolbar,
            }}
            title={`Optimizable containers (${
              optimizableContainersCount ?? 'N/A'
            })`}
            options={{
              debounceInterval: DEFAULT_DEBOUNCE_INTERVAL,
              padding: DEFAULT_PADDING,
              pageSize: queryState.limit,
              pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
              paging: true,
              search: true,
              sorting: true,
              thirdSortClick: false,
            }}
            localization={{
              toolbar: {
                searchPlaceholder: 'Search container name',
              },
            }}
            data={data}
            columns={columns}
            isLoading={loading}
            totalCount={optimizableContainersCount}
            page={currentPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onOrderChange={handleOrderChange}
            onSearchChange={handleSearchChange}
          />
        </PageLayout.Table>
      </PageLayout>
    </BasePage>
  );
}
OptimizationsPage.displayName = 'OptimizationsPage';
