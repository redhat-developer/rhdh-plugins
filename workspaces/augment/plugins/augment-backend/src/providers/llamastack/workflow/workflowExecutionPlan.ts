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

import type {
  WorkflowNode,
  WorkflowEdge,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export interface WorkflowExecutionPlan {
  startNodeId: string;
  steps: ExecutionStep[];
}

export type ExecutionStep =
  | { type: 'agent'; nodeId: string; agentId: string }
  | {
      type: 'classify';
      nodeId: string;
      agentId: string;
      routes: Record<string, string>;
    }
  | {
      type: 'logic';
      nodeId: string;
      condition: string;
      trueTarget: string;
      falseTarget?: string;
    }
  | {
      type: 'transform';
      nodeId: string;
      expression: string;
      outputVariable: string;
    }
  | { type: 'set_state'; nodeId: string; assignments: Record<string, string> }
  | { type: 'user_interaction'; nodeId: string; prompt: string }
  | { type: 'end'; nodeId: string };

export function buildExecutionPlan(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): WorkflowExecutionPlan {
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) {
    return { startNodeId: '', steps: [] };
  }

  const steps: ExecutionStep[] = [];
  const visited = new Set<string>();

  const traverse = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const outEdges = edges.filter(e => e.source === nodeId);

    switch (node.type) {
      case 'start':
        for (const edge of outEdges) traverse(edge.target);
        break;

      case 'agent':
        steps.push({ type: 'agent', nodeId: node.id, agentId: node.id });
        for (const edge of outEdges.filter(
          e => e.type !== 'tool_binding' && e.type !== 'guardrail_binding',
        )) {
          traverse(edge.target);
        }
        break;

      case 'classify': {
        const routes: Record<string, string> = {};
        for (const edge of outEdges) {
          if (edge.condition) {
            routes[edge.condition] = edge.target;
          } else {
            routes.__default__ = edge.target;
          }
        }
        steps.push({
          type: 'classify',
          nodeId: node.id,
          agentId: node.id,
          routes,
        });
        for (const edge of outEdges) traverse(edge.target);
        break;
      }

      case 'logic': {
        const d = node.data as Record<string, unknown>;
        const condition = (d.condition as string) || 'true';
        const trueTarget = outEdges[0]?.target || '';
        const falseTarget = outEdges[1]?.target;
        steps.push({
          type: 'logic',
          nodeId: node.id,
          condition,
          trueTarget,
          falseTarget,
        });
        for (const edge of outEdges) traverse(edge.target);
        break;
      }

      case 'transform': {
        const d = node.data as Record<string, unknown>;
        steps.push({
          type: 'transform',
          nodeId: node.id,
          expression: (d.expression as string) || '',
          outputVariable: (d.outputVariable as string) || '_transformed',
        });
        for (const edge of outEdges) traverse(edge.target);
        break;
      }

      case 'set_state': {
        const d = node.data as Record<string, unknown>;
        steps.push({
          type: 'set_state',
          nodeId: node.id,
          assignments: (d.assignments as Record<string, string>) || {},
        });
        for (const edge of outEdges) traverse(edge.target);
        break;
      }

      case 'user_interaction': {
        const d = node.data as Record<string, unknown>;
        steps.push({
          type: 'user_interaction',
          nodeId: node.id,
          prompt: (d.prompt as string) || 'Please confirm.',
        });
        for (const edge of outEdges) traverse(edge.target);
        break;
      }

      case 'end':
        steps.push({ type: 'end', nodeId: node.id });
        break;

      default:
        for (const edge of outEdges) traverse(edge.target);
        break;
    }
  };

  traverse(startNode.id);
  return { startNodeId: startNode.id, steps };
}
