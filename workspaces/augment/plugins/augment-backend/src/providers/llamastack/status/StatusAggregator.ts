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
  LlamaStackConfig,
  EffectiveConfig,
  AugmentStatus,
  MCPServerConfig,
  SecurityConfig,
} from '../../../types';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ClientManager } from '../ClientManager';
import type { McpAuthService } from '../McpAuthService';
import type { StatusService } from './StatusService';

/**
 * Dependencies for aggregating status.
 * The orchestrator resolves config and passes a snapshot; the aggregator
 * builds StatusDeps and delegates to StatusService.
 */
export interface StatusAggregatorDeps {
  /** YAML baseline config; null when Llama Stack is not configured */
  llamaStackConfig: LlamaStackConfig | null;
  /** Resolved config (YAML + DB overrides) when llamaStackConfig is not null */
  resolved?: EffectiveConfig;
  clientManager: ClientManager;
  mcpAuth: McpAuthService | null;
  /** Effective MCP servers (resolved.mcpServers ?? yamlMcpServers when config exists) */
  mcpServers: MCPServerConfig[];
  /** MCP servers from YAML, used to derive yamlServerIds */
  yamlMcpServers: MCPServerConfig[];
  securityConfig: SecurityConfig;
  vectorStoreReady: boolean;
  statusService: StatusService;
  logger: LoggerService;
  /** Tool execution mode from YAML config */
  toolExecutionMode?: 'direct' | 'backend';
  /** Error from last agent graph resolution, if any */
  agentGraphError?: string | null;
}

/**
 * Aggregates status by resolving config, building StatusDeps, and delegating
 * to StatusService. Extracted from ResponsesApiCoordinator.getStatus() to
 * keep the orchestrator focused on orchestration.
 *
 * When llamaStackConfig is null, returns status for "not configured".
 * When llamaStackConfig is set, resolved must be provided to merge
 * admin overrides into the status config.
 */
export async function aggregateStatus(
  deps: StatusAggregatorDeps,
): Promise<AugmentStatus> {
  const {
    llamaStackConfig,
    resolved,
    clientManager,
    mcpAuth,
    mcpServers,
    yamlMcpServers,
    securityConfig,
    vectorStoreReady,
    statusService,
    logger,
  } = deps;

  if (!llamaStackConfig) {
    return statusService.getStatus({
      config: null,
      clientManager,
      mcpAuth,
      mcpServers: yamlMcpServers,
      yamlServerIds: new Set(yamlMcpServers.map(s => s.id)),
      securityConfig,
      vectorStoreReady,
      logger,
    });
  }

  if (!resolved) {
    throw new Error('resolved config is required when llamaStackConfig is set');
  }

  const statusConfig: LlamaStackConfig = {
    ...llamaStackConfig,
    model: resolved.model,
    baseUrl: resolved.baseUrl,
    vectorStoreIds: resolved.vectorStoreIds,
    vectorStoreName: resolved.vectorStoreName,
    embeddingModel: resolved.embeddingModel,
  };

  const status = await statusService.getStatus({
    config: statusConfig,
    clientManager,
    mcpAuth,
    mcpServers,
    yamlServerIds: new Set(yamlMcpServers.map(s => s.id)),
    securityConfig,
    vectorStoreReady,
    logger,
  });

  if (resolved.agents && Object.keys(resolved.agents).length > 0) {
    status.agents = Object.entries(resolved.agents).map(([key, agent]) => ({
      key,
      name: agent.name,
      isDefault: key === resolved.defaultAgent,
    }));
  }

  if (deps.toolExecutionMode) {
    status.toolExecutionMode = deps.toolExecutionMode;
  }

  if (deps.agentGraphError) {
    status.agentGraphError = deps.agentGraphError;
  }

  if (deps.toolExecutionMode === 'direct' && status.mcpServers) {
    const toolNameToServers = new Map<string, string[]>();
    for (const server of status.mcpServers) {
      if (!server.connected || !server.tools) continue;
      for (const tool of server.tools) {
        const list = toolNameToServers.get(tool.name) ?? [];
        list.push(server.id);
        toolNameToServers.set(tool.name, list);
      }
    }
    const conflicts = [...toolNameToServers.entries()].filter(
      ([, servers]) => servers.length > 1,
    );
    if (conflicts.length > 0) {
      const details = conflicts
        .map(([name, servers]) => `${name} on [${servers.join(', ')}]`)
        .join('; ');
      logger.warn(
        `Tool name conflict detected in direct mode: ${details}. ` +
          `Set augment.toolExecutionMode: backend to resolve.`,
      );
    }
  }

  return status;
}
