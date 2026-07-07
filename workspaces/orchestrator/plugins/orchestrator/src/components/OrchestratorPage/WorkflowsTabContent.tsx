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

import { useEffect, useMemo, useState } from 'react';

import {
  Content,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { DEFAULT_TABLE_PAGE_SIZE } from '../../constants';
import {
  isEntityScopedWorkflowOverviews,
  useAllWorkflowOverviews,
  WorkflowOverviewsState,
} from '../../hooks/useWorkflowsCount';
import { filterWorkflowOverviewsBySearch } from '../../utils/filterWorkflowOverviews';
import { OrchestratorEmptyState } from '../ui/OrchestratorEmptyState';
import { WorkflowsTable } from './WorkflowsTable';

type WorkflowsTabContentViewProps = {
  overviews?: WorkflowOverviewDTO[];
  loading: boolean;
  tableLoading: boolean;
  error?: Error;
  isReady: boolean;
  totalCount?: number;
  isPaginated?: boolean;
  page?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  search?: string;
  onSearchChange?: (search: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export const WorkflowsTabContentView = ({
  overviews,
  loading,
  tableLoading,
  error,
  isReady,
  totalCount,
  isPaginated = false,
  page = 0,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  hasNextPage = false,
  search = '',
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: WorkflowsTabContentViewProps) => {
  const isSearching = search.trim().length > 0;
  const hasTableRows = (overviews?.length ?? 0) > 0 || page > 0;
  const showEmptyState = isReady && !hasTableRows && page === 0 && !isSearching;

  return (
    <Content noPadding>
      {loading ? <Progress /> : null}
      {error ? <ResponseErrorPanel error={error} /> : null}
      {showEmptyState ? <OrchestratorEmptyState variant="workflows" /> : null}
      {isReady && (hasTableRows || isSearching) ? (
        <WorkflowsTable
          items={overviews ?? []}
          totalCount={totalCount}
          isLoading={tableLoading}
          isPaginated={isPaginated}
          page={page}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          search={search}
          onSearchChange={onSearchChange}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </Content>
  );
};

const slicePaginatedPage = (
  overviews: WorkflowOverviewDTO[],
  page: number,
  pageSize: number,
) => {
  const start = page * pageSize;
  return overviews.slice(start, start + pageSize);
};

const WorkflowsTabContentWithFetch = ({
  workflowsArray,
  targetEntity,
  search,
  onSearchChange,
}: {
  workflowsArray?: string[];
  targetEntity?: string;
  search: string;
  onSearchChange: (search: string) => void;
}) => {
  const isEntityScoped = isEntityScopedWorkflowOverviews({
    workflowsArray,
    targetEntity,
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const isSearching = search.trim().length > 0;

  const allWorkflows = useAllWorkflowOverviews({
    workflowsArray,
    targetEntity,
  });

  useEffect(() => {
    setPage(0);
  }, [search]);

  const filteredOverviews = useMemo(
    () => filterWorkflowOverviewsBySearch(allWorkflows.overviews ?? [], search),
    [allWorkflows.overviews, search],
  );

  const tableOverviews = useMemo(() => {
    if (isEntityScoped) {
      return isSearching
        ? slicePaginatedPage(filteredOverviews, page, pageSize)
        : (allWorkflows.overviews ?? []);
    }

    if (isSearching) {
      return slicePaginatedPage(filteredOverviews, page, pageSize);
    }

    // Server-side pagination runs before RBAC filtering; paginate the
    // authorized list client-side so allowed workflows are not dropped.
    return slicePaginatedPage(allWorkflows.overviews ?? [], page, pageSize);
  }, [
    allWorkflows.overviews,
    filteredOverviews,
    isEntityScoped,
    isSearching,
    page,
    pageSize,
  ]);

  const authorizedCount = allWorkflows.overviews?.length ?? 0;

  const totalCount = isSearching
    ? filteredOverviews.length
    : allWorkflows.count;

  const hasNextPage = isSearching
    ? (page + 1) * pageSize < filteredOverviews.length
    : (page + 1) * pageSize < authorizedCount;

  const isPaginated =
    isEntityScoped || isSearching
      ? filteredOverviews.length > pageSize || page > 0
      : authorizedCount > pageSize || page > 0;

  const loading = allWorkflows.loading;
  const tableLoading = allWorkflows.tableLoading;
  const error = allWorkflows.error;
  const isReady = allWorkflows.isReady;

  return (
    <WorkflowsTabContentView
      overviews={tableOverviews}
      loading={loading}
      tableLoading={tableLoading}
      error={error}
      isReady={isReady}
      totalCount={totalCount}
      isPaginated={isPaginated}
      page={page}
      pageSize={pageSize}
      hasNextPage={hasNextPage}
      search={search}
      onSearchChange={onSearchChange}
      onPageChange={setPage}
      onPageSizeChange={nextPageSize => {
        setPageSize(nextPageSize);
        setPage(0);
      }}
    />
  );
};

export const WorkflowsTabContent = ({
  workflowsArray,
  targetEntity,
  overviewsState,
  search: controlledSearch,
  onSearchChange,
}: {
  workflowsArray?: string[];
  targetEntity?: string;
  overviewsState?: WorkflowOverviewsState;
  search?: string;
  onSearchChange?: (search: string) => void;
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const search = controlledSearch ?? internalSearch;
  const handleSearchChange = onSearchChange ?? setInternalSearch;

  if (overviewsState) {
    return (
      <WorkflowsTabContentView
        overviews={overviewsState.overviews}
        loading={overviewsState.loading}
        tableLoading={overviewsState.tableLoading}
        error={overviewsState.error}
        isReady={overviewsState.isReady}
        totalCount={overviewsState.count}
      />
    );
  }

  return (
    <WorkflowsTabContentWithFetch
      workflowsArray={workflowsArray}
      targetEntity={targetEntity}
      search={search}
      onSearchChange={handleSearchChange}
    />
  );
};
