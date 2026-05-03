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
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { ConversationService } from '../conversations/ConversationService';
import type {
  EffectiveConfig,
  MCPServerConfig,
  ResponsesApiTool,
  ResponsesApiFileSearchTool,
} from '../../../types';
import type { BackendToolExecutor } from './BackendToolExecutor';
import { buildMcpTools } from './McpToolBuilder';
import type { CapabilityInfo } from '../types';

/**
 * Dependencies for building tools (matches ChatDeps).
 */
export interface ToolsBuilderDeps {
  client: ResponsesApiClient;
  config: EffectiveConfig;
  mcpServers: MCPServerConfig[];
  mcpAuth: McpAuthService | null;
  conversations: ConversationService | null;
  /** When set, MCP tools are converted to function tools and executed by the backend. */
  backendToolExecutor?: BackendToolExecutor;
}

/**
 * Strip fields from tool definitions that the connected Llama Stack
 * server does not support. Only modifies `function` type tools;
 * `mcp`, `file_search`, and built-in tools are passed through unchanged.
 */
export function sanitizeToolsForServer(
  tools: ResponsesApiTool[],
  capabilities: CapabilityInfo,
  logger: LoggerService,
): ResponsesApiTool[] {
  return tools.map(tool => {
    if (tool.type !== 'function') return tool;

    const { strict, type: _discriminator, ...rest } = tool;
    if (strict !== undefined && !capabilities.strictField) {
      logger.debug(
        `[ToolsBuilder] Stripped 'strict' field from function tool "${rest.name}" (server does not support it)`,
      );
    }
    const sanitized = capabilities.strictField ? { strict, ...rest } : rest;
    return sanitized as ResponsesApiTool;
  });
}

/**
 * Build the tools array for the Responses API request.
 * All config is read from the passed-in deps.
 *
 * @param enableRAG - Whether to include file_search tool
 * @param deps - Chat dependencies (client, config, mcpServers, mcpAuth, conversations)
 * @param logger - Logger for diagnostics
 * @param logPrefix - Optional prefix for log messages (e.g., '[Stream] ')
 * @param capabilities - Server capabilities for tool sanitization
 */
export async function buildTools(
  enableRAG: boolean,
  deps: ToolsBuilderDeps,
  logger: LoggerService,
  logPrefix: string = '',
  capabilities?: CapabilityInfo,
): Promise<ResponsesApiTool[]> {
  const { config, mcpServers, mcpAuth } = deps;
  const tools: ResponsesApiTool[] = [];

  if (logPrefix && mcpServers.length > 0) {
    logger.info(
      `${logPrefix}MCP servers resolved: ${mcpServers
        .map(
          s =>
            `${s.id}(staticHeaders=${
              s.headers ? Object.keys(s.headers).join(',') : 'none'
            })`,
        )
        .join(', ')}`,
    );
  }

  if (enableRAG) {
    const dedupedStoreIds = [...new Set(config.vectorStoreIds)];
    if (dedupedStoreIds.length > 0) {
      const fileSearchTool: ResponsesApiFileSearchTool = {
        type: 'file_search',
        vector_store_ids: dedupedStoreIds,
      };
      if (config.fileSearchMaxResults) {
        fileSearchTool.max_num_results = config.fileSearchMaxResults;
      }
      if (config.fileSearchScoreThreshold) {
        fileSearchTool.ranking_options = {
          score_threshold: config.fileSearchScoreThreshold,
        };
      }
      tools.push(fileSearchTool);
      logger.info(
        `${logPrefix}file_search tool added: stores=${dedupedStoreIds.join(
          ',',
        )}, maxResults=${config.fileSearchMaxResults ?? 'default'}`,
      );
    } else {
      logger.warn(
        `${logPrefix}RAG enabled but no vector store IDs configured — file_search tool will not be added`,
      );
    }
  }

  if (deps.backendToolExecutor && mcpServers.length > 0) {
    logger.info(
      `${logPrefix}Backend-executed tools mode ACTIVE — MCP tools converted to function calls`,
    );
    const backendTools =
      await deps.backendToolExecutor.ensureToolsDiscovered(mcpServers);
    if (backendTools.length === 0) {
      logger.error(
        `${logPrefix}Backend tool discovery returned 0 tools from ${mcpServers.length} server(s): ` +
          `[${mcpServers.map(s => `${s.id} @ ${s.url}`).join(', ')}]. ` +
          `The LLM will have no MCP tools available. ` +
          `Check MCP server connectivity, authentication, and streamable-http compatibility.`,
      );
    } else {
      logger.info(
        `${logPrefix}Discovered ${backendTools.length} backend tool(s) from ${mcpServers.length} server(s)`,
      );
    }
    tools.push(...backendTools);
  } else {
    if (mcpServers.length > 0 && mcpAuth) {
      const mcpTools = await buildMcpTools({
        mcpAuth,
        mcpServers,
        logger,
        logPrefix: logPrefix || undefined,
      });
      tools.push(...mcpTools);
    } else if (mcpServers.length > 0 && !mcpAuth) {
      for (const server of mcpServers) {
        logger.warn(
          `${logPrefix}Skipping MCP server ${server.id}: McpAuthService not initialized`,
        );
      }
    }
  }

  if (config.functions) {
    for (const func of config.functions) {
      tools.push({
        type: 'function',
        name: func.name,
        description: func.description,
        parameters: func.parameters,
        strict: func.strict ?? true,
      });
    }
  }

  if (config.enableWebSearch) {
    tools.push({ type: 'web_search' });
  }

  if (config.enableCodeInterpreter) {
    tools.push({ type: 'code_interpreter' });
  }

  if (capabilities) {
    return sanitizeToolsForServer(tools, capabilities, logger);
  }
  return tools;
}
