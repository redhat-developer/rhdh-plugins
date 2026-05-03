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
import type { WorkflowNode, McpNodeData } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { NodeExecutionResult } from './types';

/**
 * Processes an MCP node by registering the MCP server info in workflow state.
 * The actual tool discovery and execution is delegated to LlamaStack,
 * which supports native `type: mcp` tools in the Responses API.
 */
export async function executeMcpNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
  logger: LoggerService,
): Promise<NodeExecutionResult> {
  const data = node.data as McpNodeData;
  const { serverUrl, serverLabel } = data;
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  if (!serverUrl) {
    return {
      output: undefined,
      trace: {
        nodeId: node.id, nodeType: 'mcp',
        nodeName: serverLabel || 'MCP',
        input: '', output: '',
        startedAt, completedAt: new Date().toISOString(),
        status: 'failed', error: 'MCP server URL is required',
        durationMs: Date.now() - startMs,
      },
    };
  }

  const existing = (state._mcpServers as Array<{ serverUrl: string; serverLabel: string }> | undefined) || [];
  state._mcpServers = [...existing, { serverUrl, serverLabel: serverLabel || 'MCP' }];

  logger.info(`MCP node ${node.id}: registered server ${serverLabel} at ${serverUrl}`);

  return {
    output: { serverUrl, serverLabel },
    trace: {
      nodeId: node.id, nodeType: 'mcp',
      nodeName: serverLabel || 'MCP',
      input: serverUrl,
      output: `Registered MCP server: ${serverLabel} (${serverUrl})`,
      startedAt, completedAt: new Date().toISOString(),
      status: 'completed', durationMs: Date.now() - startMs,
    },
  };
}
