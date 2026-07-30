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
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { MCPServerConfig, ResponsesApiFunctionTool } from '../../../types';
import { toErrorMessage } from '../../../services/utils';

export interface ResolvedTool {
  serverId: string;
  serverUrl: string;
  originalName: string;
  prefixedName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function processDiscoveryResults(
  results: PromiseSettledResult<{
    server: MCPServerConfig;
    serverTools: Array<{
      name: string;
      description?: string;
      inputSchema?: unknown;
    }>;
    client: Client | null;
  }>[],
  nextRegistry: Map<string, ResolvedTool>,
  nextClients: Map<string, Client>,
  tools: ResponsesApiFunctionTool[],
  prefixName: (serverId: string, toolName: string) => string,
  slimSchema: (schema: Record<string, unknown>) => Record<string, unknown>,
  logger: LoggerService,
): void {
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error(
        `[BackendToolExecutor] Server discovery rejected: ${toErrorMessage(result.reason)}`,
      );
      continue;
    }
    const { server, serverTools, client } = result.value;
    if (client) nextClients.set(server.id, client);
    for (const tool of serverTools) {
      const pName = prefixName(server.id, tool.name);
      const resolved: ResolvedTool = {
        serverId: server.id,
        serverUrl: server.url,
        originalName: tool.name,
        prefixedName: pName,
        description: tool.description || `Tool ${tool.name} from ${server.id}`,
        inputSchema: (tool.inputSchema as Record<string, unknown>) || {
          type: 'object',
          properties: {},
        },
      };
      nextRegistry.set(pName, resolved);
      tools.push({
        type: 'function',
        name: pName,
        description: resolved.description,
        parameters: slimSchema(resolved.inputSchema),
      });
    }
    logger.info(
      `[BackendToolExecutor] Discovered ${serverTools.length} tools from ${server.id}: [${serverTools.map(t => t.name).join(', ')}]`,
    );
  }
}

export function collectSucceededServerIds(
  results: PromiseSettledResult<{
    server: MCPServerConfig;
    client: Client | null;
  }>[],
): Set<string> {
  const ids = new Set<string>();
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.client !== null)
      ids.add(result.value.server.id);
  }
  return ids;
}

export function preserveFailedServerTools(
  succeededServerIds: Set<string>,
  currentRegistry: Map<string, ResolvedTool>,
  nextRegistry: Map<string, ResolvedTool>,
  nextClients: Map<string, Client>,
  currentClients: Map<string, Client>,
  tools: ResponsesApiFunctionTool[],
  slimSchema: (schema: Record<string, unknown>) => Record<string, unknown>,
  logger: LoggerService,
): void {
  let preservedCount = 0;
  for (const [key, resolved] of currentRegistry) {
    if (!nextRegistry.has(key) && !succeededServerIds.has(resolved.serverId)) {
      nextRegistry.set(key, resolved);
      tools.push({
        type: 'function',
        name: resolved.prefixedName,
        description: resolved.description,
        parameters: slimSchema(resolved.inputSchema),
      });
      preservedCount++;
    }
  }
  for (const [serverId, client] of currentClients) {
    if (!nextClients.has(serverId) && !succeededServerIds.has(serverId))
      nextClients.set(serverId, client);
  }
  if (preservedCount > 0)
    logger.warn(
      `[BackendToolExecutor] Preserved ${preservedCount} tool(s) from failed server(s) during partial re-discovery`,
    );
}

export function swapRegistryAndCleanup(
  currentClients: Map<string, Client>,
  nextClients: Map<string, Client>,
  serverCount: number,
  registrySize: number,
  generation: number,
  logger: LoggerService,
): void {
  for (const [id, client] of currentClients) {
    if (!nextClients.has(id)) {
      client
        .close()
        .catch(err =>
          logger.warn(
            `[BackendToolExecutor] Error closing stale client ${id}: ${toErrorMessage(err)}`,
          ),
        );
    }
  }
  logger.info(
    `[BackendToolExecutor] Total: ${registrySize} function tools from ${serverCount} server(s) (generation=${generation})`,
  );
}

export function closeOrphanedClients(
  nextClients: Map<string, Client>,
  currentClients: Map<string, Client>,
  registrySize: number,
  logger: LoggerService,
): void {
  logger.warn(
    `[BackendToolExecutor] No servers reachable during rediscovery (previous: ${registrySize}). Keeping previous registry and cached tool definitions.`,
  );
  for (const [id, client] of nextClients) {
    if (!currentClients.has(id) || currentClients.get(id) !== client) {
      client
        .close()
        .catch(err =>
          logger.warn(
            `[BackendToolExecutor] Error closing orphaned client ${id}: ${toErrorMessage(err)}`,
          ),
        );
    }
  }
}
