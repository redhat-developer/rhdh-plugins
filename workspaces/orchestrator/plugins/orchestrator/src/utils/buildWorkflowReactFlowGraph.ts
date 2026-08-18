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

import { Edge, MarkerType, Node } from 'reactflow';

import dagre from '@dagrejs/dagre';
import * as yaml from 'js-yaml';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

export type WorkflowFlowNodeData = {
  label: string;
  secondaryLabel?: string;
  status?: ProcessInstanceStatusDTO;
};

type WorkflowStateCondition = {
  transition?: string;
  condition?: string;
};

type WorkflowStateError = {
  transition?: string;
  error?: string;
};

type WorkflowState = {
  name?: string;
  type?: string;
  transition?: string | { nextState?: string };
  end?: boolean | { terminate?: boolean };
  dataConditions?: WorkflowStateCondition[];
  defaultCondition?: WorkflowStateCondition;
  eventConditions?: WorkflowStateCondition[];
  onErrors?: WorkflowStateError[];
};

type WorkflowDefinition = {
  start?: string;
  states?: WorkflowState[];
};

type ParsedWorkflow = {
  definition?: WorkflowDefinition;
  error?: string;
};

const NODE_GAP_Y = 90;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

const getTransitionTarget = (
  transition: WorkflowState['transition'],
): string | undefined => {
  if (typeof transition === 'string') {
    return transition;
  }
  if (transition && typeof transition === 'object') {
    if (typeof transition.nextState === 'string') {
      return transition.nextState;
    }
  }
  return undefined;
};

export const parseWorkflowSource = (source: string): ParsedWorkflow => {
  if (!source.trim()) {
    return { error: 'empty' };
  }

  try {
    return { definition: JSON.parse(source) as WorkflowDefinition };
  } catch {
    // fall through to YAML parser
  }

  try {
    const parsed = yaml.load(source);
    if (parsed && typeof parsed === 'object') {
      return { definition: parsed as WorkflowDefinition };
    }
  } catch {
    return { error: 'parse' };
  }

  return { error: 'parse' };
};

export const buildWorkflowReactFlowGraph = (
  definition: WorkflowDefinition,
  nodeStatusById: Map<string, ProcessInstanceStatusDTO> = new Map(),
):
  | {
      nodes: Node<WorkflowFlowNodeData>[];
      edges: Edge[];
      contentWidth: number;
      contentHeight: number;
    }
  | undefined => {
  const states = definition.states ?? [];
  if (states.length === 0) {
    return undefined;
  }

  const nodeIds = new Set<string>();
  const nodeOrder: string[] = [];
  const nodeMap = new Map<string, Node<WorkflowFlowNodeData>>();
  const edges: Edge[] = [];

  const ensureNode = (
    id: string,
    label: string,
    options?: { secondaryLabel?: string },
  ) => {
    if (nodeIds.has(id)) {
      return;
    }
    nodeIds.add(id);
    nodeOrder.push(id);
    const status = nodeStatusById.get(id);
    nodeMap.set(id, {
      id,
      type: 'workflowNode',
      position: { x: 0, y: 0 },
      data: {
        label,
        secondaryLabel: options?.secondaryLabel,
        status,
      },
    });
  };

  for (const state of states) {
    if (state.name) {
      ensureNode(state.name, state.name, { secondaryLabel: state.type });
    }
  }

  const addEdge = (source: string, target: string) => {
    ensureNode(target, target);
    edges.push({
      id: `edge-${source}-${target}-${edges.length}`,
      source,
      target,
      type: 'labeled',
      markerEnd: { type: MarkerType.ArrowClosed },
    });
  };

  for (const state of states) {
    const stateName = state.name;
    if (!stateName) {
      continue;
    }
    const directTransition = getTransitionTarget(state.transition);
    if (directTransition) {
      addEdge(stateName, directTransition);
    }

    state.dataConditions?.forEach(condition => {
      if (condition.transition) {
        addEdge(stateName, condition.transition);
      }
    });

    if (state.defaultCondition?.transition) {
      addEdge(stateName, state.defaultCondition.transition);
    }

    state.eventConditions?.forEach(condition => {
      if (condition.transition) {
        addEdge(stateName, condition.transition);
      }
    });

    state.onErrors?.forEach(error => {
      if (error.transition) {
        addEdge(stateName, error.transition);
      }
    });
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    ranksep: NODE_GAP_Y,
    nodesep: 40,
  });

  nodeOrder.forEach(id => {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });
  dagre.layout(g);

  const nodes: Node<WorkflowFlowNodeData>[] = [];
  nodeOrder.forEach(id => {
    const node = nodeMap.get(id);
    const layout = g.node(id);
    if (!node || !layout) {
      return;
    }
    nodes.push({
      ...node,
      position: {
        x: layout.x - NODE_WIDTH / 2,
        y: layout.y - NODE_HEIGHT / 2,
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      },
    });
  });

  const minX = Math.min(...nodes.map(n => n.position.x));
  const minY = Math.min(...nodes.map(n => n.position.y));
  const maxX = Math.max(...nodes.map(n => n.position.x + NODE_WIDTH));
  const maxY = Math.max(...nodes.map(n => n.position.y + NODE_HEIGHT));

  return {
    nodes,
    edges,
    contentWidth: maxX - minX,
    contentHeight: maxY - minY,
  };
};
