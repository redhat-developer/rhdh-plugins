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

/**
 * Agent graph types and resolution.
 *
 * These types were previously re-exported from @augment-adk/augment-adk.
 * They are now defined locally to remove that dependency while maintaining
 * the same interface for AgentGraphManager and ResponsesApiCoordinator.
 */
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ChatDeps } from '../chat/ResponsesApiService';
import type {
  AgentConfig,
  ChatResponse,
  ResponsesApiInputItem,
  ResponsesApiResponse,
} from '../../../types';

export interface ResolvedAgent {
  key: string;
  functionName: string;
  config: AgentConfig;
  handoffTools: Array<{ type: string; name: string; description?: string; parameters?: unknown; strict?: boolean }>;
  agentAsToolTools: Array<{ type: string; name: string; description?: string; parameters?: unknown; strict?: boolean }>;
  handoffTargetKeys: Set<string>;
  asToolTargetKeys: Set<string>;
}

export interface AgentGraphSnapshot {
  agents: Map<string, ResolvedAgent>;
  defaultAgentKey: string;
  maxTurns: number;
}

export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

export const toFunctionToolName = sanitizeName;

export type BuildDepsForAgent = (agent: ResolvedAgent) => Promise<ChatDeps>;

export type MaxTurnsExceededHandler = (ctx: {
  agentPath: string[];
  lastResponse?: ResponsesApiResponse;
}) => ChatResponse | undefined;

export type InputFilterFn = (
  input: string | ResponsesApiInputItem[],
  agentKey: string,
  turn: number,
) => string | ResponsesApiInputItem[];

export type ToolErrorFormatterFn = (toolName: string, error: string) => string;

/**
 * Build and validate an AgentGraphSnapshot from raw AgentConfig records.
 *
 * This is a local implementation that replaces the ADK's resolveAgentGraph.
 * It builds a map of agents with their handoff/delegation relationships.
 */
export function resolveAgentGraph(
  configs: Record<string, AgentConfig>,
  defaultAgent: string,
  maxAgentTurns: number | undefined,
  logger: LoggerService,
): AgentGraphSnapshot {
  const agents = new Map<string, ResolvedAgent>();

  for (const [key, config] of Object.entries(configs)) {
    const handoffTargetKeys = new Set<string>(config.handoffs ?? []);
    const asToolTargetKeys = new Set<string>(config.asTools ?? []);

    const handoffTools = [...handoffTargetKeys]
      .filter(targetKey => configs[targetKey])
      .map(targetKey => ({
        type: 'function' as const,
        name: `transfer_to_${sanitizeName(targetKey)}`,
        description:
          configs[targetKey]?.handoffDescription ??
          `Transfer to ${configs[targetKey]?.name ?? targetKey}`,
        parameters: { type: 'object', properties: {} } as unknown,
        strict: false,
      }));

    const agentAsToolTools = [...asToolTargetKeys]
      .filter(targetKey => configs[targetKey])
      .map(targetKey => ({
        type: 'function' as const,
        name: `delegate_to_${sanitizeName(targetKey)}`,
        description:
          configs[targetKey]?.handoffDescription ??
          `Delegate task to ${configs[targetKey]?.name ?? targetKey}`,
        parameters: { type: 'object', properties: {} } as unknown,
        strict: false,
      }));

    agents.set(key, {
      key,
      functionName: sanitizeName(key),
      config,
      handoffTools,
      agentAsToolTools,
      handoffTargetKeys,
      asToolTargetKeys,
    });
  }

  let defaultAgentKey = defaultAgent;
  if (!agents.has(defaultAgentKey)) {
    const firstKey = Object.keys(configs)[0];
    if (firstKey) {
      logger.warn(
        `Default agent "${defaultAgent}" not found in config, falling back to "${firstKey}"`,
      );
      defaultAgentKey = firstKey;
    } else {
      logger.warn('No agents configured, creating empty graph');
    }
  }

  return {
    agents,
    defaultAgentKey,
    maxTurns: maxAgentTurns ?? 10,
  };
}
