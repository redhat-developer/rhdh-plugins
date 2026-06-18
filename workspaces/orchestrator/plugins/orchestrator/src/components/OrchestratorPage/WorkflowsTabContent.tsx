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

import { useCallback, useEffect, useMemo } from 'react';

import {
  Content,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import usePolling from '../../hooks/usePolling';
import { OrchestratorEmptyState } from '../ui/OrchestratorEmptyState';
import { WorkflowsTable } from './WorkflowsTable';

export const WorkflowsTabContent = ({
  workflowsArray,
  targetEntity,
  onCountChange,
}: {
  workflowsArray?: string[];
  targetEntity?: string;
  onCountChange?: (count: number | undefined) => void;
}) => {
  const orchestratorApi = useApi(orchestratorApiRef);

  const fetchWorkflowOverviews = useCallback(async () => {
    let overviewsResp;
    if (workflowsArray && targetEntity) {
      overviewsResp = await orchestratorApi.getWorkflowsOverviewForEntity(
        targetEntity,
        workflowsArray,
      );
    } else {
      overviewsResp = await orchestratorApi.listWorkflowOverviews();
    }
    return overviewsResp.data.overviews;
  }, [orchestratorApi, workflowsArray, targetEntity]);

  const { loading, error, value } = usePolling<
    WorkflowOverviewDTO[] | undefined
  >(fetchWorkflowOverviews);

  const isReady = useMemo(() => !loading && !error, [loading, error]);

  useEffect(() => {
    onCountChange?.(isReady ? (value?.length ?? 0) : undefined);
    return () => onCountChange?.(undefined);
  }, [isReady, value, onCountChange]);

  return (
    <Content noPadding>
      {loading ? <Progress /> : null}
      {error ? <ResponseErrorPanel error={error} /> : null}
      {isReady && (value?.length ?? 0) === 0 ? (
        <OrchestratorEmptyState variant="workflows" />
      ) : null}
      {isReady && (value?.length ?? 0) > 0 ? (
        <WorkflowsTable items={value ?? []} />
      ) : null}
    </Content>
  );
};
