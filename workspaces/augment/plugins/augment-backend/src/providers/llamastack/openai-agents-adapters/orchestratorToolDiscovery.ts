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
import { tool as createTool } from '@openai/agents-core';
import type { FunctionTool as AgentsFunctionTool } from '@openai/agents-core';
import type { ChatDeps } from '../../responses-api/chat/ResponsesApiService';

export interface CachedToolMeta {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolMetaCache {
  cachedToolMeta: CachedToolMeta[] | null;
  cachedToolMetaKey: string;
  cachedDiscoveryGeneration: number;
}

export const DISCOVERY_TIMEOUT_MS = 10_000;

export async function ensureToolMetaCached(
  deps: ChatDeps,
  cache: ToolMetaCache,
  logger: LoggerService,
): Promise<CachedToolMeta[]> {
  const executor = deps.backendToolExecutor;
  if (!executor) return [];

  const cacheKey = deps.mcpServers
    .map(s => s.id)
    .sort((a, b) => a.localeCompare(b))
    .join(',');
  const currentGen = executor.getDiscoveryGeneration();

  if (
    cache.cachedToolMeta &&
    cache.cachedToolMetaKey === cacheKey &&
    cache.cachedDiscoveryGeneration === currentGen
  ) {
    return cache.cachedToolMeta;
  }

  let discovered: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;

  try {
    discovered = await Promise.race([
      executor.ensureToolsDiscovered(deps.mcpServers),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tool discovery timed out')),
          DISCOVERY_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn('[OpenAIAgentsOrchestrator] Tool discovery failed', {
      error: msg,
    });
    if (cache.cachedToolMeta) {
      return cache.cachedToolMeta;
    }
    return [];
  }

  logger.info('[OpenAIAgentsOrchestrator] Discovered backend MCP tools', {
    count: discovered.length,
    servers: deps.mcpServers.map(s => s.id),
  });

  const meta: CachedToolMeta[] = discovered.map(apiTool => ({
    name: apiTool.name,
    description: apiTool.description ?? apiTool.name,
    parameters: apiTool.parameters ?? { type: 'object', properties: {} },
  }));

  cache.cachedToolMeta = meta;
  cache.cachedToolMetaKey = cacheKey;
  cache.cachedDiscoveryGeneration = executor.getDiscoveryGeneration();
  return meta;
}

export async function discoverBackendTools(
  deps: ChatDeps,
  cache: ToolMetaCache,
  logger: LoggerService,
): Promise<AgentsFunctionTool[]> {
  if (!deps.backendToolExecutor) return [];
  const toolExecutor = deps.backendToolExecutor;

  const meta = await ensureToolMetaCached(deps, cache, logger);

  return meta.map(
    t =>
      createTool({
        name: t.name,
        description: t.description,
        parameters: t.parameters as any,
        execute: async (input: unknown) => {
          const args =
            typeof input === 'string' ? input : JSON.stringify(input ?? {});
          try {
            return await toolExecutor.executeTool(t.name, args);
          } catch (execError) {
            const msg =
              execError instanceof Error
                ? execError.message
                : String(execError);
            logger.error('[OpenAIAgentsOrchestrator] Tool execution failed', {
              tool: t.name,
              error: msg,
            });
            return JSON.stringify({ error: msg });
          }
        },
      }) as unknown as AgentsFunctionTool,
  );
}

export function buildAgentToolFilter(
  agentsConfig: Record<string, Record<string, unknown>>,
  deps: ChatDeps,
):
  | ((agentKey: string, tools: AgentsFunctionTool[]) => AgentsFunctionTool[])
  | undefined {
  const hasScoping = Object.values(agentsConfig).some(
    c => Array.isArray(c.mcpServers) && (c.mcpServers as string[]).length > 0,
  );
  if (!hasScoping || !deps.backendToolExecutor) return undefined;

  const executor = deps.backendToolExecutor;
  return (agentKey: string, tools: AgentsFunctionTool[]) => {
    const config = agentsConfig[agentKey];
    if (!config) return tools;
    const allowedServers = config.mcpServers as string[] | undefined;
    if (!allowedServers || allowedServers.length === 0) return tools;

    return tools.filter(t => {
      const serverInfo = executor.getToolServerInfo(t.name);
      if (!serverInfo) return true;
      return allowedServers.includes(serverInfo.serverId);
    });
  };
}
