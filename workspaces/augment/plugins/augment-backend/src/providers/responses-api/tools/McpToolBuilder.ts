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
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { MCPServerConfig, ResponsesApiMcpTool } from '../../../types';

function buildSingleMcpTool(
  server: MCPServerConfig,
  headers: Record<string, string>,
  approvalConfig: ResponsesApiMcpTool['require_approval'],
  logger?: LoggerService,
  logPrefix?: string,
): ResponsesApiMcpTool {
  const log = logger && logPrefix ? logger : undefined;

  log?.info(
    `${logPrefix}MCP server ${server.id} HITL require_approval: ${JSON.stringify(approvalConfig)}`,
  );

  const mcpTool: ResponsesApiMcpTool = {
    type: 'mcp',
    server_url: server.url,
    server_label: server.id,
    require_approval: approvalConfig,
  };

  if (server.allowedTools && server.allowedTools.length > 0) {
    mcpTool.allowed_tools = server.allowedTools;
    log?.info(
      `${logPrefix}MCP server ${server.id} limited to ${server.allowedTools.length} allowed tools`,
    );
  }

  if (Object.keys(headers).length > 0) {
    mcpTool.headers = headers;
    log?.info(
      `${logPrefix}MCP server ${server.id} auth: Authorization=${
        headers.Authorization
          ? `present(${headers.Authorization.length} chars)`
          : 'absent'
      }, totalHeaders=${Object.keys(headers).length}`,
    );
  } else {
    log?.warn(
      `${logPrefix}MCP server ${server.id} has NO headers/auth — Llama Stack will connect unauthenticated`,
    );
  }

  return mcpTool;
}

/**
 * Build MCP tool definitions for the Responses API.
 *
 * Shared between the normal chat path (ToolsBuilder) and the HITL
 * approval continuation path (ApprovalContinuationExecutor).
 */
export async function buildMcpTools(opts: {
  mcpAuth: McpAuthService;
  mcpServers: MCPServerConfig[];
  logger?: LoggerService;
  logPrefix?: string;
}): Promise<ResponsesApiMcpTool[]> {
  const { mcpAuth, mcpServers, logger, logPrefix } = opts;

  const headerResults = await Promise.all(
    mcpServers.map(s => mcpAuth.getServerHeaders(s)),
  );

  return mcpServers.map((server, i) =>
    buildSingleMcpTool(
      server,
      headerResults[i],
      mcpAuth.getApiApprovalConfig(server.requireApproval),
      logger,
      logPrefix,
    ),
  );
}
