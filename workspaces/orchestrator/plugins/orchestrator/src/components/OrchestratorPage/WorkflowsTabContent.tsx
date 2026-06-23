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

import {
  Content,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  useWorkflowOverviews,
  WorkflowOverviewsState,
} from '../../hooks/useWorkflowsCount';
import { OrchestratorEmptyState } from '../ui/OrchestratorEmptyState';
import { WorkflowsTable } from './WorkflowsTable';

type WorkflowsTabContentViewProps = {
  overviews?: WorkflowOverviewDTO[];
  loading: boolean;
  error?: Error;
  isReady: boolean;
};

export const WorkflowsTabContentView = ({
  overviews,
  loading,
  error,
  isReady,
}: WorkflowsTabContentViewProps) => (
  <Content noPadding>
    {loading ? <Progress /> : null}
    {error ? <ResponseErrorPanel error={error} /> : null}
    {isReady && (overviews?.length ?? 0) === 0 ? (
      <OrchestratorEmptyState variant="workflows" />
    ) : null}
    {isReady && (overviews?.length ?? 0) > 0 ? (
      <WorkflowsTable items={overviews ?? []} />
    ) : null}
  </Content>
);

const WorkflowsTabContentWithFetch = ({
  workflowsArray,
  targetEntity,
}: {
  workflowsArray?: string[];
  targetEntity?: string;
}) => {
  const overviewsState = useWorkflowOverviews({ workflowsArray, targetEntity });
  return <WorkflowsTabContentView {...overviewsState} />;
};

export const WorkflowsTabContent = ({
  workflowsArray,
  targetEntity,
  overviewsState,
}: {
  workflowsArray?: string[];
  targetEntity?: string;
  overviewsState?: WorkflowOverviewsState;
}) => {
  if (overviewsState) {
    return <WorkflowsTabContentView {...overviewsState} />;
  }

  return (
    <WorkflowsTabContentWithFetch
      workflowsArray={workflowsArray}
      targetEntity={targetEntity}
    />
  );
};
