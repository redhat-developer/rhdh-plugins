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

import { useCallback, useMemo } from 'react';

import { useApi } from '@backstage/core-plugin-api';

import {
  PaginationInfoDTOOrderDirectionEnum,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import usePolling from './usePolling';

export const ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY =
  'orchestrator-workflow-overviews';

export const ALL_WORKFLOW_OVERVIEWS_CACHE_KEY = `${ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY}:all`;

export type UseWorkflowOverviewsOptions = {
  workflowsArray?: string[];
  targetEntity?: string;
  page?: number;
  pageSize?: number;
};

export const isEntityScopedWorkflowOverviews = (
  options: UseWorkflowOverviewsOptions,
): boolean => Boolean(options.workflowsArray && options.targetEntity);

export const getWorkflowOverviewsCacheKey = (
  options: UseWorkflowOverviewsOptions = {},
): string => {
  if (isEntityScopedWorkflowOverviews(options)) {
    return `${ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY}:${options.targetEntity}`;
  }

  if (options.page !== undefined && options.pageSize !== undefined) {
    return `${ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY}:${options.page}:${options.pageSize}`;
  }

  return ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY;
};

export type WorkflowOverviewsState = {
  overviews?: WorkflowOverviewDTO[];
  loading: boolean;
  tableLoading: boolean;
  error?: Error;
  isReady: boolean;
  count?: number;
  hasNextPage?: boolean;
  isPaginated?: boolean;
};

const useWorkflowOverviewsFetch = (
  options: UseWorkflowOverviewsOptions & {
    cacheKey: string;
    paginated?: boolean;
  },
): WorkflowOverviewsState => {
  const {
    workflowsArray,
    targetEntity,
    page = 0,
    pageSize = 20,
    cacheKey,
    paginated = false,
  } = options;
  const orchestratorApi = useApi(orchestratorApiRef);
  const isEntityScoped = isEntityScopedWorkflowOverviews(options);

  const fetchWorkflowOverviews = useCallback(async () => {
    if (isEntityScoped) {
      const overviewsResp = await orchestratorApi.getWorkflowsOverviewForEntity(
        targetEntity!,
        workflowsArray!,
      );
      return overviewsResp.data.overviews;
    }

    if (paginated) {
      const overviewsResp = await orchestratorApi.listWorkflowOverviews({
        pageSize: pageSize + 1,
        offset: page * pageSize,
        orderBy: 'name',
        orderDirection: PaginationInfoDTOOrderDirectionEnum.Asc,
      });
      return overviewsResp.data.overviews;
    }

    const overviewsResp = await orchestratorApi.listWorkflowOverviews();
    return overviewsResp.data.overviews;
  }, [
    orchestratorApi,
    isEntityScoped,
    targetEntity,
    workflowsArray,
    paginated,
    page,
    pageSize,
  ]);

  const { loading, error, value } = usePolling<
    WorkflowOverviewDTO[] | undefined
  >(fetchWorkflowOverviews, { cacheKey });

  const isInitialLoading = loading && value === undefined;
  const isReady = !error && value !== undefined;
  const hasNextPage =
    paginated && !isEntityScoped && (value?.length ?? 0) === pageSize + 1;

  const count = isReady ? (value?.length ?? 0) : undefined;

  return {
    overviews: value,
    loading: isInitialLoading,
    tableLoading: loading,
    error,
    isReady,
    count,
    hasNextPage,
    isPaginated: paginated && !isEntityScoped,
  };
};

export const useWorkflowOverviews = (
  options: UseWorkflowOverviewsOptions = {},
): WorkflowOverviewsState => {
  const { workflowsArray, targetEntity, page, pageSize } = options;
  const isEntityScoped = isEntityScopedWorkflowOverviews(options);
  const paginated =
    !isEntityScoped && page !== undefined && pageSize !== undefined;

  const cacheKey = useMemo(() => {
    if (paginated) {
      return getWorkflowOverviewsCacheKey({
        workflowsArray,
        targetEntity,
        page,
        pageSize,
      });
    }
    if (isEntityScoped) {
      return getWorkflowOverviewsCacheKey({ workflowsArray, targetEntity });
    }
    return ALL_WORKFLOW_OVERVIEWS_CACHE_KEY;
  }, [isEntityScoped, paginated, page, pageSize, targetEntity, workflowsArray]);

  return useWorkflowOverviewsFetch({
    ...options,
    cacheKey,
    paginated,
  });
};

/** Unpaginated list used for total count and global search. */
export const useAllWorkflowOverviews = (
  options: Omit<UseWorkflowOverviewsOptions, 'page' | 'pageSize'> = {},
): WorkflowOverviewsState => useWorkflowOverviews(options);

export const useWorkflowsCount = (
  options: Omit<UseWorkflowOverviewsOptions, 'page' | 'pageSize'> = {},
): number | undefined => useAllWorkflowOverviews(options).count;
