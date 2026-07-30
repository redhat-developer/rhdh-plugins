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

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  buildWorkflowReactFlowGraph,
  parseWorkflowSource,
} from './buildWorkflowReactFlowGraph';

describe('buildWorkflowReactFlowGraph', () => {
  it('parses a simple workflow and builds nodes and edges', () => {
    const source = `
id: demo
specVersion: "0.8"
name: demo
start: step-a
states:
  - name: step-a
    type: inject
    transition: step-b
  - name: step-b
    type: inject
    end: true
`;

    const parsed = parseWorkflowSource(source);
    expect(parsed.error).toBeUndefined();
    expect(parsed.definition?.states).toHaveLength(2);

    const statusMap = new Map<string, ProcessInstanceStatusDTO>([
      ['step-a', ProcessInstanceStatusDTO.Completed],
      ['step-b', ProcessInstanceStatusDTO.Active],
    ]);

    const flow = buildWorkflowReactFlowGraph(parsed.definition!, statusMap);
    expect(flow).toBeDefined();
    expect(flow?.nodes.map(node => node.id)).toEqual(
      expect.arrayContaining(['step-a', 'step-b']),
    );
    expect(
      flow?.edges.some(
        edge => edge.source === 'step-a' && edge.target === 'step-b',
      ),
    ).toBe(true);
    expect(flow?.nodes.find(node => node.id === 'step-b')?.data.status).toBe(
      ProcessInstanceStatusDTO.Active,
    );
    expect(flow?.edges.length).toBeGreaterThan(0);
  });
});
