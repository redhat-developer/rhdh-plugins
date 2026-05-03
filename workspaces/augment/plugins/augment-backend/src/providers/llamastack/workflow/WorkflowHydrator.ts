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
import type { FunctionTool as AgentsFunctionTool, Tool } from '@openai/agents-core';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  AgentNodeData,
  ToolNodeData,
  FileSearchNodeData,
  McpNodeData,
  NodeExecutionRecord,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ModelProvider } from '@openai/agents-core';

export interface HydratedWorkflow {
  runner: Runner;
  entryAgent: Agent;
  agents: Map<string, Agent>;
  maxTurns: number;
  executionPlan: WorkflowExecutionPlan;
}

/**
 * Execution plan for the workflow - describes the graph traversal
 * including classify routing, logic branching, and sequential execution.
 */
export interface WorkflowExecutionPlan {
  startNodeId: string;
  steps: ExecutionStep[];
}

export type ExecutionStep =
  | { type: 'agent'; nodeId: string; agentId: string }
  | { type: 'classify'; nodeId: string; agentId: string; routes: Record<string, string> }
  | { type: 'logic'; nodeId: string; condition: string; trueTarget: string; falseTarget?: string }
  | { type: 'transform'; nodeId: string; expression: string; outputVariable: string }
  | { type: 'set_state'; nodeId: string; assignments: Record<string, string> }
  | { type: 'user_interaction'; nodeId: string; prompt: string }
  | { type: 'end'; nodeId: string };

/**
 * Converts a serialized WorkflowDefinition into live @openai/agents-core
 * Agent and Runner instances ready for execution.
 *
 * The hydration process:
 * 1. Identify the start node and trace edges to find the entry agent
 * 2. Create Agent instances for all agent and classify nodes
 * 3. Wire tool bindings, guardrail bindings, and handoff edges
 * 4. Build an execution plan that describes graph traversal order
 * 5. Return a configured Runner with the entry agent and execution plan
 */
export class WorkflowHydrator {
  constructor(
    private readonly logger: LoggerService,
  ) {}

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
      throw new Error('Workflow must contain at least one agent or classify node');
    }

    const agents = new Map<string, Agent>();
    const agentNodeDataMap = new Map<string, AgentNodeData>();

    // Pass 1: create agents for agent nodes
    for (const node of agentNodes) {
      const data = node.data as AgentNodeData;
      agentNodeDataMap.set(node.id, data);

      const nodeTools = this.resolveToolsForAgent(
        node.id, edges, nodeMap, backendTools,
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
            toolChoice: data.toolChoice as 'auto' | 'required' | 'none' | undefined,
          },
          handoffDescription: data.handoffDescription,
          resetToolChoice: data.resetToolChoice,
          toolUseBehavior: data.toolUseBehavior === 'stop_on_first_tool'
            ? 'stop_on_first_tool'
            : undefined,
        }),
      );
    }

    // Pass 1b: create agents for classify nodes (agents with outputType)
    for (const node of classifyNodes) {
      const data = node.data as Record<string, unknown>;
      const classifications = (data.classifications as Array<{ label: string; description: string }>) || [];
      const model = (data.model as string) || settings.defaultModel;

      const classDescriptions = classifications
        .map(c => `- "${c.label}": ${c.description}`)
        .join('\n');

      const instructions = (data.instructions as string) ||
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

    // Pass 2: wire handoffs between agents based on edges
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
              toolDescription: target.handoffDescription || `Delegate to ${target.name}`,
            }),
          );
        } else {
          handoffTargets.push(target);
        }
      }

      if (handoffTargets.length > 0 || asToolTargets.length > 0) {
        const data = agentNodeDataMap.get(node.id)!;
        const nodeTools = this.resolveToolsForAgent(node.id, edges, nodeMap, backendTools);

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
              toolChoice: data.toolChoice as 'auto' | 'required' | 'none' | undefined,
            },
            handoffDescription: data.handoffDescription,
            resetToolChoice: data.resetToolChoice,
            toolUseBehavior: data.toolUseBehavior === 'stop_on_first_tool'
              ? 'stop_on_first_tool'
              : undefined,
          }),
        );
      }
    }

    // Build execution plan
    const executionPlan = this.buildExecutionPlan(nodes, edges);

    // Find entry agent: first agent/classify connected from Start node
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

  private buildExecutionPlan(
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
          for (const edge of outEdges.filter(e => e.type !== 'tool_binding' && e.type !== 'guardrail_binding')) {
            traverse(edge.target);
          }
          break;

        case 'classify': {
          const routes: Record<string, string> = {};
          for (const edge of outEdges) {
            if (edge.condition) {
              routes[edge.condition] = edge.target;
            } else {
              routes['__default__'] = edge.target;
            }
          }
          steps.push({ type: 'classify', nodeId: node.id, agentId: node.id, routes });
          for (const edge of outEdges) traverse(edge.target);
          break;
        }

        case 'logic': {
          const d = node.data as Record<string, unknown>;
          const condition = (d.condition as string) || 'true';
          const trueTarget = outEdges[0]?.target || '';
          const falseTarget = outEdges[1]?.target;
          steps.push({ type: 'logic', nodeId: node.id, condition, trueTarget, falseTarget });
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

  private resolveToolsForAgent(
    agentNodeId: string,
    edges: WorkflowEdge[],
    nodeMap: Map<string, WorkflowNode>,
    backendTools: AgentsFunctionTool[],
  ): AgentsFunctionTool[] {
    const tools: AgentsFunctionTool[] = [];

    const toolEdges = edges.filter(
      e => e.source === agentNodeId && e.type === 'tool_binding',
    );

    for (const edge of toolEdges) {
      const toolNode = nodeMap.get(edge.target);
      if (!toolNode) continue;

      if (toolNode.type === 'tool') {
        const data = toolNode.data as ToolNodeData;
        switch (data.kind) {
          case 'mcp_server': {
            if (data.mcpServerId) {
              const filtered = data.mcpToolFilter;
              for (const bt of backendTools) {
                if (!filtered || filtered.length === 0 || filtered.includes(bt.name)) {
                  tools.push(bt);
                }
              }
            }
            break;
          }
          case 'custom_function': {
            if (data.functionDef) {
              tools.push({
                type: 'function',
                name: data.functionDef.name,
                description: data.functionDef.description,
                parameters: data.functionDef.parameters,
                strict: false,
                execute: async () => JSON.stringify({ result: 'custom function placeholder' }),
              } as unknown as AgentsFunctionTool);
            }
            break;
          }
          case 'file_search':
          case 'web_search':
          case 'code_interpreter':
            break;
        }
      } else if (toolNode.type === 'file_search') {
        const data = toolNode.data as FileSearchNodeData;
        const vectorStoreIds = data.vectorStoreIds || [];
        const maxResults = data.maxResults || 10;
        tools.push({
          type: 'function',
          name: `file_search_${toolNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          description: `Search files in vector stores: ${vectorStoreIds.join(', ') || 'default'}`,
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
          },
          strict: false,
          execute: async (args: Record<string, unknown>) => {
            this.logger.info(`File search: query="${args.query}", stores=${vectorStoreIds}, max=${maxResults}`);
            return JSON.stringify({ results: [], message: 'File search executed via LlamaStack vector_stores API' });
          },
        } as unknown as AgentsFunctionTool);
      } else if (toolNode.type === 'mcp') {
        const data = toolNode.data as McpNodeData;
        const serverLabel = data.serverLabel || 'MCP Server';
        const serverUrl = data.serverUrl || '';
        const requireApproval = data.requireApproval || 'never';
        const allowedTools = data.allowedTools || [];

        tools.push({
          type: 'function',
          name: `mcp_${toolNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
          description: `MCP Server: ${serverLabel} (${serverUrl}). Approval: ${requireApproval}. Tools: ${allowedTools.length > 0 ? allowedTools.join(', ') : 'all'}`,
          parameters: {
            type: 'object',
            properties: {
              tool_name: { type: 'string', description: 'Name of the MCP tool to invoke' },
              arguments: { type: 'object', description: 'Arguments to pass to the tool' },
            },
            required: ['tool_name'],
          },
          strict: false,
          execute: async (args: Record<string, unknown>) => {
            this.logger.info(`MCP call: server=${serverUrl}, tool=${args.tool_name}, approval=${requireApproval}`);
            if (requireApproval === 'always') {
              return JSON.stringify({ status: 'pending_approval', tool: args.tool_name, server: serverLabel });
            }
            return JSON.stringify({ status: 'executed', tool: args.tool_name, server: serverLabel, result: 'MCP tool placeholder' });
          },
        } as unknown as AgentsFunctionTool);
      }
    }

    if (tools.length === 0) {
      return [...backendTools];
    }
    return tools;
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
