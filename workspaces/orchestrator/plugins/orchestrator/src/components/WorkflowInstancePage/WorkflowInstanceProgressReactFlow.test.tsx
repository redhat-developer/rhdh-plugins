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

import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import {
  ProcessInstanceStatusDTO,
  type NodeInstanceDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowInstanceProgressReactFlow } from './WorkflowInstanceProgressReactFlow';

jest.mock('reactflow', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ nodes }: { nodes: Array<{ id: string; data: any }> }) =>
      React.createElement(
        'div',
        { 'data-testid': 'workflow-graph' },
        nodes.map(node =>
          React.createElement(
            'span',
            { key: node.id },
            `${node.data.label}:${node.data.status}`,
          ),
        ),
      ),
    Background: () => null,
    Controls: () => null,
    Handle: () => null,
    MarkerType: { ArrowClosed: 'arrowclosed' },
    Position: { Bottom: 'bottom', Top: 'top' },
    getSmoothStepPath: () => [''],
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('WorkflowInstanceProgressReactFlow', () => {
  it('marks completed and failed steps from the instance fixture', () => {
    const workflowNodes: NodeInstanceDTO[] = [
      {
        id: 'start-instance',
        name: 'start',
        definitionId: 'start',
        enter: '2024-01-01T00:00:00.000Z',
        exit: '2024-01-01T00:00:01.000Z',
      },
      {
        id: 'finish-instance',
        name: 'finish',
        definitionId: 'finish',
        enter: '2024-01-01T00:00:01.000Z',
      },
    ];

    render(
      <WorkflowInstanceProgressReactFlow
        workflowSource={JSON.stringify({
          start: 'start',
          states: [
            { name: 'start', type: 'operation', transition: 'finish' },
            { name: 'finish', type: 'operation', end: true },
          ],
        })}
        loadingWorkflowSource={false}
        workflowStatus={ProcessInstanceStatusDTO.Error}
        workflowNodes={workflowNodes}
        workflowError={{ nodeDefinitionId: 'finish', message: 'step failed' }}
      />,
    );

    expect(screen.getByTestId('workflow-graph')).toHaveTextContent(
      `start:${ProcessInstanceStatusDTO.Completed}`,
    );
    expect(screen.getByTestId('workflow-graph')).toHaveTextContent(
      `finish:${ProcessInstanceStatusDTO.Error}`,
    );
  });
});
