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
import { Agent } from '@openai/agents-core';
import type { FunctionTool as AgentsFunctionTool, Tool } from '@openai/agents-core';
import type { AgentConfig } from '../../../types/config';

/**
 * Build the full agent map from an agents config record.
 *
 * Two-pass algorithm:
 * 1. Create all Agent instances with instructions, model, and backend tools
 * 2. Wire handoffs and asTools references between the live Agent instances
 *
 * This ensures handoff targets and agent-as-tool delegates are fully
 * configured Agent objects (not stubs), enabling the Runner to execute
 * the complete graph with proper instructions and tools on each agent.
 */
export function buildAgentGraph(
  agentsConfig: Record<string, AgentConfig>,
  defaultAgentKey: string,
  backendTools: AgentsFunctionTool[],
  agentToolFilter?: (agentKey: string, tools: AgentsFunctionTool[]) => AgentsFunctionTool[],
): {
  agents: Map<string, Agent>;
  defaultAgent: Agent;
} {
  const allKeys = Object.keys(agentsConfig);
  const agents = new Map<string, Agent>();

  // Pass 1: create agents without cross-references
  for (const [key, config] of Object.entries(agentsConfig)) {
    const filteredTools = agentToolFilter
      ? agentToolFilter(key, backendTools)
      : backendTools;

    agents.set(
      key,
      new Agent({
        name: config.name ?? key,
        instructions: config.instructions ?? '',
        model: config.model,
        tools: [...filteredTools],
        modelSettings: {
          temperature: config.temperature,
          maxTokens: config.maxOutputTokens,
          toolChoice: config.toolChoice as
            | 'auto'
            | 'required'
            | 'none'
            | undefined,
        },
        handoffDescription: config.handoffDescription,
        resetToolChoice: config.resetToolChoice,
        toolUseBehavior: config.toolUseBehavior === 'stop_on_first_tool'
          ? 'stop_on_first_tool'
          : undefined,
      }),
    );
  }

  // Pass 2: wire handoffs and asTools between live Agent instances
  for (const [key, config] of Object.entries(agentsConfig)) {
    const agent = agents.get(key);
    if (!agent) continue;

    const handoffs: Agent[] = [];
    if (config.handoffs) {
      for (const handoffKey of config.handoffs) {
        const target = agents.get(handoffKey);
        if (target && handoffKey !== key) {
          handoffs.push(target);
        }
      }
    }

    const asToolInstances: Tool[] = [];
    if (config.asTools) {
      for (const delegateKey of config.asTools) {
        const delegate = agents.get(delegateKey);
        if (delegate && delegateKey !== key) {
          asToolInstances.push(
            delegate.asTool({
              toolName: `delegate_to_${sanitizeKey(delegateKey)}`,
              toolDescription:
                delegate.handoffDescription ||
                `Delegate a sub-task to the ${delegate.name} agent and get back a result.`,
            }),
          );
        }
      }
    }

    if (handoffs.length > 0 || asToolInstances.length > 0) {
      const existingTools = (agent as unknown as { _tools?: Tool[] })._tools ?? [];
      const merged = new Agent({
        name: agent.name,
        instructions: config.instructions ?? '',
        model: config.model,
        tools: [...existingTools, ...asToolInstances] as AgentsFunctionTool[],
        handoffs: handoffs.length > 0 ? handoffs : undefined,
        modelSettings: {
          temperature: config.temperature,
          maxTokens: config.maxOutputTokens,
          toolChoice: config.toolChoice as
            | 'auto'
            | 'required'
            | 'none'
            | undefined,
        },
        handoffDescription: config.handoffDescription,
        resetToolChoice: config.resetToolChoice,
        toolUseBehavior: config.toolUseBehavior === 'stop_on_first_tool'
          ? 'stop_on_first_tool'
          : undefined,
      });
      agents.set(key, merged);
    }
  }

  // Resolve default agent
  if (!agents.has(defaultAgentKey) && agents.size > 0) {
    const firstKey = allKeys[0];
    return { agents, defaultAgent: agents.get(firstKey)! };
  }

  const defaultAgent = agents.get(defaultAgentKey);
  if (!defaultAgent) {
    const fallback = new Agent({
      name: 'default',
      instructions: 'You are a helpful assistant.',
    });
    agents.set('default', fallback);
    return { agents, defaultAgent: fallback };
  }

  return { agents, defaultAgent };
}

/**
 * Build a single Agent from config (utility for single-agent mode).
 */
export function buildAgentFromConfig(
  key: string,
  config: AgentConfig,
  _allAgentKeys: string[],
  backendTools: AgentsFunctionTool[],
): Agent {
  return new Agent({
    name: config.name ?? key,
    instructions: config.instructions ?? '',
    model: config.model,
    tools: [...backendTools],
    modelSettings: {
      temperature: config.temperature,
      maxTokens: config.maxOutputTokens,
      toolChoice: config.toolChoice as 'auto' | 'required' | 'none' | undefined,
    },
    handoffDescription: config.handoffDescription,
  });
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
}
