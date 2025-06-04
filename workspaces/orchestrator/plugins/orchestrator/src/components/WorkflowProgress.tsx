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

import React from 'react';

import { ProcessInstanceDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { compareNodes } from '../utils/NodeInstanceUtils';
import { Paragraph } from './Paragraph';
import { WorkflowProgressNode } from './WorkflowProgressNode';
import { fromNodeInstanceToWorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

export interface WorkflowProgressProps {
  workflowStatus: ProcessInstanceDTO['state'];
  workflowNodes: ProcessInstanceDTO['nodes'];
  workflowError?: ProcessInstanceDTO['error'];
  emptyState?: React.ReactNode;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  workflowStatus,
  workflowError,
  workflowNodes,
  emptyState = <Paragraph>No data available</Paragraph>,
}) => (
  <>
    {workflowNodes.length === 0
      ? emptyState
      : structuredClone(workflowNodes)
          .sort(compareNodes)
          .map(
            fromNodeInstanceToWorkflowProgressNodeModel(
              workflowStatus,
              workflowError,
            ),
          )
          .map(model => <WorkflowProgressNode model={model} key={model.id} />)}
  </>
);
WorkflowProgress.displayName = 'WorkflowProgress';
