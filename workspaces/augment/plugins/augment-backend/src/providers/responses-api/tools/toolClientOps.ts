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
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { MCPServerConfig } from '../../../types';
import { toErrorMessage } from '../../../services/utils';
import { isPrivateUrlWithDns } from '../../../services/utils/SsrfGuard';
import { connectToMcpServer } from '../../../services/utils/mcpClient';
import type { ResolvedTool } from './toolDiscoveryHelpers';

export async function connectAndListToolsSafe(
  server: MCPServerConfig,
  mcpAuth: McpAuthService,
  skipTlsVerify: boolean,
  logger: LoggerService,
  options?: { skipSsrfCheck?: boolean },
): Promise<{
  client: Client | null;
  tools: Array<{ name: string; description?: string; inputSchema?: unknown }>;
}> {
  if (!options?.skipSsrfCheck) {
    const ssrfReason = await isPrivateUrlWithDns(server.url);
    if (ssrfReason) {
      logger.warn(
        `[BackendToolExecutor] Skipping MCP server ${server.id}: URL blocked by SSRF guard (${ssrfReason})`,
      );
      return { client: null, tools: [] };
    }
  }
  logger.info(
    `[BackendToolExecutor] Connecting to MCP server ${server.id} @ ${server.url} (skipTlsVerify=${skipTlsVerify})`,
  );
  const authHeaders = await mcpAuth.getServerHeaders(server);
  try {
    const { client, tools } = await connectToMcpServer(server.url, {
      headers: authHeaders,
      skipTlsVerify,
      clientName: 'augment-backend',
    });
    logger.info(
      `[BackendToolExecutor] ${server.id} tools/list: ${tools.length} tool(s) [${tools.map(t => t.name).join(', ')}]`,
    );
    return { client, tools };
  } catch (err) {
    logger.error(
      `[BackendToolExecutor] Failed to connect to ${server.id}: ${toErrorMessage(err)}`,
    );
    return { client: null, tools: [] };
  }
}

export async function executeToolOnClient(
  client: Client,
  tool: ResolvedTool,
  args: Record<string, unknown>,
  logger: LoggerService,
): Promise<string> {
  const result = await client.callTool({
    name: tool.originalName,
    arguments: args,
  });
  if (result.isError) {
    const errorText = Array.isArray(result.content)
      ? result.content
          .filter(
            (c: { type: string; text?: string }) => c.type === 'text' && c.text,
          )
          .map((c: { type: string; text?: string }) => c.text)
          .join('\n')
      : JSON.stringify(result.content);
    logger.error(
      `[BackendToolExecutor] Tool ${tool.originalName} returned error: ${errorText}`,
    );
    return JSON.stringify({ error: errorText || 'Tool returned an error' });
  }
  if (Array.isArray(result.content)) {
    const textParts = result.content
      .filter(
        (c: { type: string; text?: string }) => c.type === 'text' && c.text,
      )
      .map((c: { type: string; text?: string }) => c.text!);
    return textParts.length > 0
      ? textParts.join('\n')
      : JSON.stringify(result.content);
  }
  return JSON.stringify(result.content ?? result);
}

export function isSessionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('session not found') ||
    lower.includes('session expired') ||
    lower.includes('session_not_found') ||
    lower.includes('invalid session')
  );
}
