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

import { FC } from 'react';

import { ProcessInstanceDTO } from '@redhat/backstage-plugin-orchestrator-common';

import { useTranslation } from '../../hooks/useTranslation';
import { compareNodes } from '../../utils/NodeInstanceUtils';
import { Paragraph } from './Paragraph';
import { WorkflowProgressNode } from './WorkflowProgressNode';
import { fromNodeInstanceToWorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

export interface WorkflowProgressProps {
  workflowStatus: ProcessInstanceDTO['state'];
  workflowNodes: ProcessInstanceDTO['nodes'];
  workflowError?: ProcessInstanceDTO['error'];
  emptyState?: React.ReactNode;
}

export const WorkflowProgress: FC<WorkflowProgressProps> = ({
  workflowStatus,
  workflowError,
  workflowNodes,
  emptyState,
}) => {
  const { t } = useTranslation();
  const defaultEmptyState = emptyState || (
    <Paragraph>{t('messages.noDataAvailable')}</Paragraph>
  );

  return (
    <>
      {workflowNodes.length === 0
        ? defaultEmptyState
        : structuredClone(workflowNodes)
            .sort(compareNodes)
            .map(
              fromNodeInstanceToWorkflowProgressNodeModel(
                workflowStatus,
                workflowError,
              ),
            )
            .map(model => (
              <WorkflowProgressNode model={model} key={model.id} />
            ))}
    </>
  );
};
WorkflowProgress.displayName = 'WorkflowProgress';
