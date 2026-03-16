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
import { isPrivateUrlWithDns } from './utils/SsrfGuard';
import { listMcpServerTools } from './utils/mcpClient';

export interface McpTestResult {
  success: boolean;
  warning?: string;
  error?: string;
  serverType: string;
  tools: Array<{ name: string; description?: string }>;
  toolCount: number;
}

const BLOCKED_HEADERS = new Set([
  'host',
  'content-type',
  'content-length',
  'accept',
  'transfer-encoding',
  'connection',
  'cookie',
]);

/**
 * Tests MCP server connections using the official @modelcontextprotocol/sdk.
 * Handles the full protocol lifecycle: connect, list tools, close.
 */
export class McpTestService {
  constructor(
    private readonly skipTls: boolean,
    private readonly logger: LoggerService,
  ) {}

  async testConnection(
    url: string,
    type?: string,
    headers?: Record<string, string>,
  ): Promise<McpTestResult> {
    const ssrfReason = await isPrivateUrlWithDns(url);
    if (ssrfReason) {
      return {
        success: false,
        error:
          'URLs pointing to private/internal network addresses are not allowed',
        serverType: type || 'streamable-http',
        tools: [],
        toolCount: 0,
      };
    }

    try {
      const sanitizedHeaders: Record<string, string> = {};
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (
            typeof value === 'string' &&
            !BLOCKED_HEADERS.has(key.toLowerCase())
          ) {
            sanitizedHeaders[key] = value;
          }
        }
      }

      const tools = await listMcpServerTools(url, {
        headers: sanitizedHeaders,
        skipTlsVerify: this.skipTls,
        clientName: 'augment-test',
      });

      return {
        success: true,
        serverType: type || 'streamable-http',
        tools: tools.map(t => ({ name: t.name, description: t.description })),
        toolCount: tools.length,
      };
    } catch (err) {
      this.logger.debug('MCP test connection failed', {
        url,
        error: String(err),
      });
      return {
        success: false,
        error: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
        serverType: type || 'streamable-http',
        tools: [],
        toolCount: 0,
      };
    }
  }
}
