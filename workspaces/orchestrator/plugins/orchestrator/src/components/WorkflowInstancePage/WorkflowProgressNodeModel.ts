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
  NodeInstanceDTO,
  ProcessInstanceErrorDTO,
  ProcessInstanceStatusDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { isNonNullable } from '../../utils/TypeGuards';

export type WorkflowProgressNodeModel = NodeInstanceDTO & {
  status?: ProcessInstanceStatusDTO;
  error?: ProcessInstanceErrorDTO;
};

export const fromNodeInstanceToWorkflowProgressNodeModel =
  (
    workflowStatus?: ProcessInstanceStatusDTO,
    workflowError?: ProcessInstanceErrorDTO,
  ) =>
  (
    node: NodeInstanceDTO,
    nodeIndex: number,
    nodes: NodeInstanceDTO[],
  ): WorkflowProgressNodeModel => {
    const isLastNode = nodeIndex === nodes.length - 1;
    const model: WorkflowProgressNodeModel = {
      ...node,
      status: workflowStatus,
      enter: node.enter,
    };

    if (isNonNullable(node.exit)) {
      model.exit = node.exit;
    }

    if (node.definitionId === workflowError?.nodeDefinitionId) {
      model.status = ProcessInstanceStatusDTO.Error;
      model.error = workflowError;
    } else if (node.enter && node.exit) {
      model.status = ProcessInstanceStatusDTO.Completed;
    } else if (!node.exit) {
      model.status = ProcessInstanceStatusDTO.Active;
    }

    if (
      workflowStatus &&
      isLastNode &&
      (workflowStatus === ProcessInstanceStatusDTO.Aborted ||
        workflowStatus === ProcessInstanceStatusDTO.Suspended)
    ) {
      model.status = workflowStatus;
    }

    return model;
  };
