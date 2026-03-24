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

import { McpValidationResult } from './mcp-server-types';

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Validates MCP server credentials using the Streamable HTTP transport.
 *
 * The flow follows the MCP protocol:
 *   1. POST initialize → server returns capabilities + session id
 *   2. POST notifications/initialized
 *   3. POST tools/list → server returns available tools
 */
export class McpServerValidator {
  constructor(private readonly logger: LoggerService) {}

  async validate(url: string, token: string): Promise<McpValidationResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json, text/event-stream',
    };

    try {
      // Step 1: Initialize
      const initResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'lightspeed-backend', version: '1.0.0' },
          },
          id: 1,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (initResponse.status === 401 || initResponse.status === 403) {
        return {
          valid: false,
          toolCount: 0,
          tools: [],
          error: 'Invalid credentials — server returned 401/403',
        };
      }

      if (!initResponse.ok) {
        return {
          valid: false,
          toolCount: 0,
          tools: [],
          error: `Server returned HTTP ${initResponse.status}`,
        };
      }

      const sessionId = initResponse.headers.get('mcp-session-id');
      if (sessionId) {
        headers['Mcp-Session-Id'] = sessionId;
      }

      // Step 2: Send initialized notification
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }).catch((err: unknown) => {
        this.logger.debug(
          `MCP initialized notification failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      });

      // Step 3: List tools
      const toolsResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (toolsResponse.ok) {
        const contentType = toolsResponse.headers.get('content-type') || '';

        let rpcResult:
          | {
              tools?: Array<{ name: string; description?: string }>;
            }
          | undefined;

        if (contentType.includes('application/json')) {
          const data = (await toolsResponse.json()) as {
            result?: typeof rpcResult;
          };
          rpcResult = data.result;
        } else if (contentType.includes('text/event-stream')) {
          rpcResult = await this.parseToolsFromSse(toolsResponse);
        }

        if (rpcResult) {
          const tools = rpcResult.tools ?? [];
          return {
            valid: true,
            toolCount: tools.length,
            tools: tools.map(t => ({
              name: t.name,
              description: t.description ?? '',
            })),
          };
        }

        // Server responded with an unexpected content-type — still valid
        return { valid: true, toolCount: 0, tools: [] };
      }

      // Initialize succeeded but tools/list failed — still consider connected
      this.logger.warn(
        `MCP server at ${url} accepted initialize but tools/list returned ${toolsResponse.status}`,
      );
      return { valid: true, toolCount: 0, tools: [] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes('TimeoutError') ||
        message.includes('AbortError') ||
        message.includes('abort')
      ) {
        return {
          valid: false,
          toolCount: 0,
          tools: [],
          error: 'Connection timed out',
        };
      }

      this.logger.error(`MCP validation failed for ${url}: ${message}`);
      return {
        valid: false,
        toolCount: 0,
        tools: [],
        error: message,
      };
    }
  }

  /**
   * Parse a tools/list JSON-RPC result from an SSE (text/event-stream) response.
   * MCP Streamable HTTP servers may return SSE instead of plain JSON.
   * Each SSE event has the form:
   *   event: message
   *   data: {"jsonrpc":"2.0","result":{...},"id":2}
   */
  private async parseToolsFromSse(
    response: Response,
  ): Promise<
    { tools?: Array<{ name: string; description?: string }> } | undefined
  > {
    try {
      const body = await response.text();

      for (const line of body.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice('data:'.length).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr) as {
            result?: {
              tools?: Array<{ name: string; description?: string }>;
            };
          };
          if (parsed.result) {
            return parsed.result;
          }
        } catch {
          // not valid JSON — skip this data line
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to parse SSE tools/list response: ${msg}`);
    }
    return undefined;
  }
}
