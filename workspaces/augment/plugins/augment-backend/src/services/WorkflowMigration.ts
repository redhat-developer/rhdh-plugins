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

import { v4 as uuid } from 'uuid';
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  AgentNodeData,
  ToolNodeData,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AgentConfig } from '../types/config';

const HORIZONTAL_SPACING = 300;
const VERTICAL_SPACING = 200;

/**
 * Converts existing AgentConfig records (the legacy flat agent
 * configuration format) into a WorkflowDefinition with auto-laid-out
 * nodes and edges derived from handoff/asTools relationships.
 *
 * Layout algorithm:
 * - Start node at top center
 * - Default agent directly below start
 * - Handoff targets laid out horizontally at the next row
 * - Tool/guardrail nodes placed around their agents
 */
export function migrateAgentConfigsToWorkflow(
  agentsConfig: Record<string, AgentConfig>,
  defaultAgentKey: string,
  workflowName?: string,
): WorkflowDefinition {
  const workflowId = uuid();
  const now = new Date().toISOString();
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  const keys = Object.keys(agentsConfig);
  if (keys.length === 0) {
    return {
      id: workflowId,
      name: workflowName || 'Migrated Workflow',
      description: 'Auto-migrated from agent configuration',
      version: 0,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      nodes: [createStartNode()],
      edges: [],
      settings: { maxTurns: 10, tracingEnabled: true },
    };
  }

  // Create start node
  const startNode = createStartNode();
  nodes.push(startNode);

  // Determine entry agent
  const entryKey = keys.includes(defaultAgentKey) ? defaultAgentKey : keys[0];

  // Compute layout levels using BFS from entry agent
  const levels = computeLevels(agentsConfig, entryKey);

  // Create agent nodes
  const agentNodeIds = new Map<string, string>();
  for (const [key, config] of Object.entries(agentsConfig)) {
    const level = levels.get(key) ?? 1;
    const sameLevel = [...levels.entries()]
      .filter(([, l]) => l === level)
      .map(([k]) => k);
    const posInLevel = sameLevel.indexOf(key);
    const totalInLevel = sameLevel.length;
    const xOffset = (posInLevel - (totalInLevel - 1) / 2) * HORIZONTAL_SPACING;

    const nodeId = `agent-${key}`;
    agentNodeIds.set(key, nodeId);

    const agentData: AgentNodeData = {
      agentKey: key,
      name: config.name ?? key,
      instructions: config.instructions ?? '',
      handoffDescription: config.handoffDescription,
      model: config.model,
      mcpServers: config.mcpServers,
      enableRAG: config.enableRAG,
      vectorStoreIds: config.vectorStoreIds,
      enableWebSearch: config.enableWebSearch,
      enableCodeInterpreter: config.enableCodeInterpreter,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      maxToolCalls: config.maxToolCalls,
      guardrails: config.guardrails,
      toolUseBehavior: config.toolUseBehavior as string | undefined,
      resetToolChoice: config.resetToolChoice,
      handoffInputFilter: config.handoffInputFilter,
      handoffInputSchema: config.handoffInputSchema,
      nestHandoffHistory: config.nestHandoffHistory,
      truncation: config.truncation,
      enabled: config.enabled,
    };

    nodes.push({
      id: nodeId,
      type: 'agent',
      position: { x: 250 + xOffset, y: 100 + level * VERTICAL_SPACING },
      data: agentData,
      label: config.name ?? key,
    });
  }

  // Connect start to entry agent
  const entryNodeId = agentNodeIds.get(entryKey)!;
  edges.push({
    id: `edge-start-${entryNodeId}`,
    source: startNode.id,
    target: entryNodeId,
    type: 'sequence',
  });

  // Create handoff edges
  for (const [key, config] of Object.entries(agentsConfig)) {
    const sourceId = agentNodeIds.get(key)!;

    if (config.handoffs) {
      for (const target of config.handoffs) {
        const targetId = agentNodeIds.get(target);
        if (targetId && targetId !== sourceId) {
          edges.push({
            id: `edge-handoff-${key}-${target}`,
            source: sourceId,
            target: targetId,
            type: 'handoff',
            label: `handoff`,
          });
        }
      }
    }

    if (config.asTools) {
      for (const target of config.asTools) {
        const targetId = agentNodeIds.get(target);
        if (targetId && targetId !== sourceId) {
          edges.push({
            id: `edge-astool-${key}-${target}`,
            source: sourceId,
            target: targetId,
            type: 'sequence',
            label: 'as tool',
          });
        }
      }
    }

    // Create tool nodes for MCP servers
    if (config.mcpServers && config.mcpServers.length > 0) {
      for (let i = 0; i < config.mcpServers.length; i++) {
        const serverId = config.mcpServers[i];
        const toolNodeId = `tool-${key}-${serverId}`;
        const toolData: ToolNodeData = {
          kind: 'mcp_server',
          label: serverId,
          mcpServerId: serverId,
        };

        const agentNode = nodes.find(n => n.id === sourceId)!;
        nodes.push({
          id: toolNodeId,
          type: 'tool',
          position: {
            x: agentNode.position.x + 220 + i * 160,
            y: agentNode.position.y + 20,
          },
          data: toolData,
          label: serverId,
        });

        edges.push({
          id: `edge-tool-${key}-${serverId}`,
          source: sourceId,
          target: toolNodeId,
          type: 'tool_binding',
        });
      }
    }
  }

  return {
    id: workflowId,
    name: workflowName || `Migrated: ${agentsConfig[entryKey]?.name ?? entryKey}`,
    description: `Auto-migrated from ${keys.length} agent configuration(s)`,
    version: 0,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    nodes,
    edges,
    settings: {
      maxTurns: 10,
      defaultModel: agentsConfig[entryKey]?.model,
      tracingEnabled: true,
      conversationPersistence: true,
    },
  };
}

function createStartNode(): WorkflowNode {
  return {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 30 },
    data: { inputDescription: 'User message' },
    label: 'Start',
  };
}

/**
 * BFS to assign depth levels to agents based on handoff/asTools graph.
 */
function computeLevels(
  agentsConfig: Record<string, AgentConfig>,
  entryKey: string,
): Map<string, number> {
  const levels = new Map<string, number>();
  const queue: Array<{ key: string; level: number }> = [{ key: entryKey, level: 0 }];
  levels.set(entryKey, 0);

  while (queue.length > 0) {
    const { key, level } = queue.shift()!;
    const config = agentsConfig[key];
    if (!config) continue;

    const targets = [
      ...(config.handoffs ?? []),
      ...(config.asTools ?? []),
    ];

    for (const target of targets) {
      if (!levels.has(target) && agentsConfig[target]) {
        levels.set(target, level + 1);
        queue.push({ key: target, level: level + 1 });
      }
    }
  }

  // Assign unconnected agents at level 1
  for (const key of Object.keys(agentsConfig)) {
    if (!levels.has(key)) {
      levels.set(key, 1);
    }
  }

  return levels;
}
