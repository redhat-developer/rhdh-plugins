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

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';
import usePolling from './usePolling';

export const ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY =
  'orchestrator-workflow-overviews';

type UseWorkflowOverviewsOptions = {
  workflowsArray?: string[];
  targetEntity?: string;
};

export const getWorkflowOverviewsCacheKey = ({
  workflowsArray,
  targetEntity,
}: UseWorkflowOverviewsOptions = {}) => {
  if (workflowsArray && targetEntity) {
    return `${ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY}:${targetEntity}`;
  }
  return ORCHESTRATOR_WORKFLOW_OVERVIEWS_CACHE_KEY;
};

export type WorkflowOverviewsState = {
  overviews?: WorkflowOverviewDTO[];
  loading: boolean;
  error?: Error;
  isReady: boolean;
  count?: number;
};

export const useWorkflowOverviews = (
  options: UseWorkflowOverviewsOptions = {},
): WorkflowOverviewsState => {
  const { workflowsArray, targetEntity } = options;
  const orchestratorApi = useApi(orchestratorApiRef);

  const fetchWorkflowOverviews = useCallback(async () => {
    if (workflowsArray && targetEntity) {
      const overviewsResp = await orchestratorApi.getWorkflowsOverviewForEntity(
        targetEntity,
        workflowsArray,
      );
      return overviewsResp.data.overviews;
    }
    const overviewsResp = await orchestratorApi.listWorkflowOverviews();
    return overviewsResp.data.overviews;
  }, [orchestratorApi, workflowsArray, targetEntity]);

  const cacheKey = useMemo(
    () => getWorkflowOverviewsCacheKey({ workflowsArray, targetEntity }),
    [workflowsArray, targetEntity],
  );

  const { loading, error, value } = usePolling<
    WorkflowOverviewDTO[] | undefined
  >(fetchWorkflowOverviews, { cacheKey });

  const isInitialLoading = loading && value === undefined;
  const isReady = !error && value !== undefined;

  return {
    overviews: value,
    loading: isInitialLoading,
    error,
    isReady,
    count: isReady ? (value?.length ?? 0) : undefined,
  };
};

export const useWorkflowsCount = (
  options: UseWorkflowOverviewsOptions = {},
): number | undefined => useWorkflowOverviews(options).count;
