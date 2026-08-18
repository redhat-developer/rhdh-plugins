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
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { fromNodeInstanceToWorkflowProgressNodeModel } from './WorkflowProgressNodeModel';

describe('fromNodeInstanceToWorkflowProgressNodeModel', () => {
  const nodes: NodeInstanceDTO[] = [
    {
      id: 'n1',
      name: 'Start',
      definitionId: 'start',
      enter: '2024-01-01T00:00:00Z',
      exit: '2024-01-01T00:01:00Z',
    },
    {
      id: 'n2',
      name: 'Work',
      definitionId: 'work',
      enter: '2024-01-01T00:01:00Z',
    },
  ];

  it('marks completed nodes and active nodes by enter/exit', () => {
    const mapNode = fromNodeInstanceToWorkflowProgressNodeModel(
      ProcessInstanceStatusDTO.Active,
    );

    expect(mapNode(nodes[0], 0, nodes)).toEqual(
      expect.objectContaining({
        id: 'n1',
        status: ProcessInstanceStatusDTO.Completed,
        exit: '2024-01-01T00:01:00Z',
      }),
    );
    expect(mapNode(nodes[1], 1, nodes)).toEqual(
      expect.objectContaining({
        id: 'n2',
        status: ProcessInstanceStatusDTO.Active,
      }),
    );
  });

  it('attaches workflow error status to the matching node', () => {
    const workflowError = {
      nodeDefinitionId: 'work',
      message: 'boom',
    };
    const mapNode = fromNodeInstanceToWorkflowProgressNodeModel(
      ProcessInstanceStatusDTO.Error,
      workflowError,
    );

    expect(mapNode(nodes[1], 1, nodes)).toEqual(
      expect.objectContaining({
        status: ProcessInstanceStatusDTO.Error,
        error: workflowError,
      }),
    );
  });

  it('overrides the last node status for aborted workflows', () => {
    const mapNode = fromNodeInstanceToWorkflowProgressNodeModel(
      ProcessInstanceStatusDTO.Aborted,
    );

    expect(mapNode(nodes[1], 1, nodes).status).toBe(
      ProcessInstanceStatusDTO.Aborted,
    );
    expect(mapNode(nodes[0], 0, nodes).status).toBe(
      ProcessInstanceStatusDTO.Completed,
    );
  });

  it('overrides the last node status for suspended workflows', () => {
    const mapNode = fromNodeInstanceToWorkflowProgressNodeModel(
      ProcessInstanceStatusDTO.Suspended,
    );

    expect(mapNode(nodes[1], 1, nodes).status).toBe(
      ProcessInstanceStatusDTO.Suspended,
    );
  });
});
