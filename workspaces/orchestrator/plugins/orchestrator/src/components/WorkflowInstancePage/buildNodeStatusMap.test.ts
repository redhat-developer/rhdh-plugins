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

import { buildNodeStatusMap } from './buildNodeStatusMap';

const makeNode = (
  overrides: Partial<NodeInstanceDTO> & { id: string },
): NodeInstanceDTO => ({
  id: overrides.id,
  name: overrides.name,
  definitionId: overrides.definitionId,
  nodeId: overrides.nodeId,
  enter: overrides.enter,
  exit: overrides.exit,
});

describe('buildNodeStatusMap', () => {
  it('returns an empty map for empty nodes', () => {
    const result = buildNodeStatusMap([]);
    expect(result.size).toBe(0);
  });

  it('maps completed nodes by name, definitionId, and nodeId', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        nodeId: 'node-a',
        enter: '2024-01-01T00:00:00Z',
        exit: '2024-01-01T00:01:00Z',
      }),
    ];

    const result = buildNodeStatusMap(
      nodes,
      ProcessInstanceStatusDTO.Completed,
    );

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Completed);
    expect(result.get('def-a')).toBe(ProcessInstanceStatusDTO.Completed);
    expect(result.get('node-a')).toBe(ProcessInstanceStatusDTO.Completed);
  });

  it('marks nodes without exit as Active', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        enter: '2024-01-01T00:00:00Z',
      }),
    ];

    const result = buildNodeStatusMap(nodes, ProcessInstanceStatusDTO.Active);

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Active);
  });

  it('downgrades Active nodes to Aborted when workflow is aborted', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        enter: '2024-01-01T00:00:00Z',
        exit: '2024-01-01T00:01:00Z',
      }),
      makeNode({
        id: '2',
        name: 'StepB',
        definitionId: 'def-b',
        enter: '2024-01-01T00:01:00Z',
      }),
    ];

    const result = buildNodeStatusMap(nodes, ProcessInstanceStatusDTO.Aborted);

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Completed);
    expect(result.get('StepB')).toBe(ProcessInstanceStatusDTO.Aborted);
  });

  it('downgrades Active nodes to Error when workflow has failed', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        enter: '2024-01-01T00:00:00Z',
        exit: '2024-01-01T00:01:00Z',
      }),
      makeNode({
        id: '2',
        name: 'StepB',
        definitionId: 'def-b',
        enter: '2024-01-01T00:01:00Z',
      }),
    ];

    const result = buildNodeStatusMap(nodes, ProcessInstanceStatusDTO.Error);

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Completed);
    expect(result.get('StepB')).toBe(ProcessInstanceStatusDTO.Error);
  });

  it('downgrades Active nodes to Suspended when workflow is suspended', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepB',
        definitionId: 'def-b',
        enter: '2024-01-01T00:01:00Z',
      }),
    ];

    const result = buildNodeStatusMap(
      nodes,
      ProcessInstanceStatusDTO.Suspended,
    );

    expect(result.get('StepB')).toBe(ProcessInstanceStatusDTO.Suspended);
  });

  it('marks error node by matching nodeDefinitionId', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        enter: '2024-01-01T00:00:00Z',
        exit: '2024-01-01T00:01:00Z',
      }),
      makeNode({
        id: '2',
        name: 'StepB',
        definitionId: 'def-b',
        enter: '2024-01-01T00:01:00Z',
      }),
    ];

    const result = buildNodeStatusMap(nodes, ProcessInstanceStatusDTO.Error, {
      nodeDefinitionId: 'def-b',
      message: 'something failed',
    });

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Completed);
    expect(result.get('StepB')).toBe(ProcessInstanceStatusDTO.Error);
    expect(result.get('def-b')).toBe(ProcessInstanceStatusDTO.Error);
  });

  it('does not downgrade Active nodes when workflow is still running', () => {
    const nodes: NodeInstanceDTO[] = [
      makeNode({
        id: '1',
        name: 'StepA',
        definitionId: 'def-a',
        enter: '2024-01-01T00:00:00Z',
      }),
    ];

    const result = buildNodeStatusMap(nodes, ProcessInstanceStatusDTO.Active);

    expect(result.get('StepA')).toBe(ProcessInstanceStatusDTO.Active);
  });
});
