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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { Agent, Runner } from '@openai/agents-core';
import type {
  FunctionTool as AgentsFunctionTool,
  Tool,
} from '@openai/agents-core';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  AgentNodeData,
  NodeExecutionRecord,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ModelProvider } from '@openai/agents-core';
import { buildExecutionPlan } from './workflowExecutionPlan';
import { resolveToolsForAgent } from './workflowToolResolver';

export type {
  WorkflowExecutionPlan,
  ExecutionStep,
} from './workflowExecutionPlan';

export interface HydratedWorkflow {
  runner: Runner;
  entryAgent: Agent;
  agents: Map<string, Agent>;
  maxTurns: number;
  executionPlan: import('./workflowExecutionPlan').WorkflowExecutionPlan;
}

export class WorkflowHydrator {
  constructor(private readonly logger: LoggerService) {}

  hydrate(
    definition: WorkflowDefinition,
    modelProvider: ModelProvider,
    backendTools: AgentsFunctionTool[],
  ): HydratedWorkflow {
    const { nodes, edges, settings } = definition;

    const nodeMap = new Map<string, WorkflowNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const agentNodes = nodes.filter(n => n.type === 'agent');
    const classifyNodes = nodes.filter(n => n.type === 'classify');

    if (agentNodes.length === 0 && classifyNodes.length === 0) {
      throw new Error(
        'Workflow must contain at least one agent or classify node',
      );
    }

    const agents = new Map<string, Agent>();
    const agentNodeDataMap = new Map<string, AgentNodeData>();

    for (const node of agentNodes) {
      const data = node.data as AgentNodeData;
      agentNodeDataMap.set(node.id, data);

      const nodeTools = resolveToolsForAgent(
        node.id,
        edges,
        nodeMap,
        backendTools,
        this.logger,
      );

      agents.set(
        node.id,
        new Agent({
          name: data.name || data.agentKey,
          instructions: data.instructions || '',
          model: data.model || settings.defaultModel,
          tools: nodeTools,
          modelSettings: {
            temperature: data.temperature,
            maxTokens: data.maxOutputTokens,
            toolChoice: data.toolChoice as
              | 'auto'
              | 'required'
              | 'none'
              | undefined,
          },
          handoffDescription: data.handoffDescription,
          resetToolChoice: data.resetToolChoice,
          toolUseBehavior:
            data.toolUseBehavior === 'stop_on_first_tool'
              ? 'stop_on_first_tool'
              : undefined,
        }),
      );
    }

    for (const node of classifyNodes) {
      const data = node.data as Record<string, unknown>;
      const classifications =
        (data.classifications as Array<{
          label: string;
          description: string;
        }>) || [];
      const model = (data.model as string) || settings.defaultModel;

      const classDescriptions = classifications
        .map(c => `- "${c.label}": ${c.description}`)
        .join('\n');

      const instructions =
        (data.instructions as string) ||
        `Classify the input into exactly one of these categories:\n${classDescriptions}\n\nRespond with only the classification label in JSON format.`;

      agents.set(
        node.id,
        new Agent({
          name: node.label || 'Classify',
          instructions,
          model,
          modelSettings: { temperature: 0 },
        }),
      );
    }

    for (const node of agentNodes) {
      const handoffEdges = edges.filter(
        e =>
          e.source === node.id &&
          (e.type === 'handoff' || e.type === 'sequence') &&
          agents.has(e.target),
      );

      if (handoffEdges.length === 0) continue;

      const handoffTargets: Agent[] = [];
      const asToolTargets: Tool[] = [];

      for (const edge of handoffEdges) {
        const target = agents.get(edge.target);
        if (!target) continue;

        if (edge.type === 'sequence') {
          asToolTargets.push(
            target.asTool({
              toolName: `delegate_to_${edge.target.replace(/[^a-zA-Z0-9_]/g, '_')}`,
              toolDescription:
                target.handoffDescription || `Delegate to ${target.name}`,
            }),
          );
        } else {
          handoffTargets.push(target);
        }
      }

      if (handoffTargets.length > 0 || asToolTargets.length > 0) {
        const data = agentNodeDataMap.get(node.id)!;
        const nodeTools = resolveToolsForAgent(
          node.id,
          edges,
          nodeMap,
          backendTools,
          this.logger,
        );

        agents.set(
          node.id,
          new Agent({
            name: data.name || data.agentKey,
            instructions: data.instructions || '',
            model: data.model || settings.defaultModel,
            tools: [...nodeTools, ...asToolTargets] as AgentsFunctionTool[],
            handoffs: handoffTargets.length > 0 ? handoffTargets : undefined,
            modelSettings: {
              temperature: data.temperature,
              maxTokens: data.maxOutputTokens,
              toolChoice: data.toolChoice as
                | 'auto'
                | 'required'
                | 'none'
                | undefined,
            },
            handoffDescription: data.handoffDescription,
            resetToolChoice: data.resetToolChoice,
            toolUseBehavior:
              data.toolUseBehavior === 'stop_on_first_tool'
                ? 'stop_on_first_tool'
                : undefined,
          }),
        );
      }
    }

    const executionPlan = buildExecutionPlan(nodes, edges);
    const entryAgent = this.resolveEntryAgent(nodes, edges, agents);
    const maxTurns = settings.maxTurns ?? 10;
    const runner = new Runner({ modelProvider });

    this.logger.info(
      `Hydrated workflow "${definition.name}" with ${agents.size} agents, ` +
        `entry="${entryAgent.name}", maxTurns=${maxTurns}, ` +
        `plan has ${executionPlan.steps.length} steps`,
    );

    return { runner, entryAgent, agents, maxTurns, executionPlan };
  }

  private resolveEntryAgent(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    agents: Map<string, Agent>,
  ): Agent {
    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      const startEdge = edges.find(e => e.source === startNode.id);
      if (startEdge) {
        const entry = agents.get(startEdge.target);
        if (entry) return entry;
      }
    }
    const first = agents.values().next().value;
    if (!first) {
      throw new Error('No agents found in workflow');
    }
    return first;
  }

  createExecutionRecord(node: WorkflowNode): NodeExecutionRecord {
    return {
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.label ?? node.id,
      startedAt: new Date().toISOString(),
      status: 'running',
    };
  }
}
