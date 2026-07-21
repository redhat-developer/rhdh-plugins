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
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { compareNodes } from '../../utils/NodeInstanceUtils';
import { fromNodeInstanceToWorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

const addStatusKey = (
  statusMap: Map<string, ProcessInstanceStatusDTO>,
  key: string | undefined,
  status: ProcessInstanceStatusDTO | undefined,
) => {
  if (key && status) {
    statusMap.set(key, status);
  }
};

/** Maps instance node progress to workflow state ids used in the SWF graph. */
export const buildNodeStatusMap = (
  workflowNodes: NodeInstanceDTO[],
  workflowStatus?: ProcessInstanceStatusDTO,
  workflowError?: ProcessInstanceErrorDTO,
): Map<string, ProcessInstanceStatusDTO> => {
  const statusMap = new Map<string, ProcessInstanceStatusDTO>();
  const sortedNodes = structuredClone(workflowNodes).sort(compareNodes);

  sortedNodes.forEach((node, index) => {
    const model = fromNodeInstanceToWorkflowProgressNodeModel(
      workflowStatus,
      workflowError,
    )(node, index, sortedNodes);

    addStatusKey(statusMap, node.name, model.status);
    addStatusKey(statusMap, node.definitionId, model.status);
    addStatusKey(statusMap, node.nodeId, model.status);
  });

  if (
    workflowStatus === ProcessInstanceStatusDTO.Aborted ||
    workflowStatus === ProcessInstanceStatusDTO.Suspended ||
    workflowStatus === ProcessInstanceStatusDTO.Error
  ) {
    for (const [key, status] of statusMap) {
      if (status === ProcessInstanceStatusDTO.Active) {
        statusMap.set(key, workflowStatus);
      }
    }
  }

  return statusMap;
};
