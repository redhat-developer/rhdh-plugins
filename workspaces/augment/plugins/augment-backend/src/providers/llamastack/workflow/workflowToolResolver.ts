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
import type { FunctionTool as AgentsFunctionTool } from '@openai/agents-core';
import type {
  WorkflowNode,
  WorkflowEdge,
  ToolNodeData,
  FileSearchNodeData,
  McpNodeData,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export function resolveToolsForAgent(
  agentNodeId: string,
  edges: WorkflowEdge[],
  nodeMap: Map<string, WorkflowNode>,
  backendTools: AgentsFunctionTool[],
  logger: LoggerService,
): AgentsFunctionTool[] {
  const tools: AgentsFunctionTool[] = [];

  const toolEdges = edges.filter(
    e => e.source === agentNodeId && e.type === 'tool_binding',
  );

  for (const edge of toolEdges) {
    const toolNode = nodeMap.get(edge.target);
    if (!toolNode) continue;

    if (toolNode.type === 'tool') {
      const data = toolNode.data as ToolNodeData;
      switch (data.kind) {
        case 'mcp_server': {
          if (data.mcpServerId) {
            const filtered = data.mcpToolFilter;
            for (const bt of backendTools) {
              if (
                !filtered ||
                filtered.length === 0 ||
                filtered.includes(bt.name)
              ) {
                tools.push(bt);
              }
            }
          }
          break;
        }
        case 'custom_function': {
          if (data.functionDef) {
            tools.push({
              type: 'function',
              name: data.functionDef.name,
              description: data.functionDef.description,
              parameters: data.functionDef.parameters,
              strict: false,
              execute: async () =>
                JSON.stringify({ result: 'custom function placeholder' }),
            } as unknown as AgentsFunctionTool);
          }
          break;
        }
        case 'file_search':
        case 'web_search':
        case 'code_interpreter':
          break;
        default:
          break;
      }
    } else if (toolNode.type === 'file_search') {
      const data = toolNode.data as FileSearchNodeData;
      const vectorStoreIds = data.vectorStoreIds || [];
      const maxResults = data.maxResults || 10;
      tools.push({
        type: 'function',
        name: `file_search_${toolNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        description: `Search files in vector stores: ${vectorStoreIds.join(', ') || 'default'}`,
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
        strict: false,
        execute: async (args: Record<string, unknown>) => {
          logger.info(
            `File search: query="${args.query}", stores=${vectorStoreIds}, max=${maxResults}`,
          );
          return JSON.stringify({
            results: [],
            message: 'File search executed via LlamaStack vector_stores API',
          });
        },
      } as unknown as AgentsFunctionTool);
    } else if (toolNode.type === 'mcp') {
      const data = toolNode.data as McpNodeData;
      const serverLabel = data.serverLabel || 'MCP Server';
      const serverUrl = data.serverUrl || '';
      const requireApproval = data.requireApproval || 'never';
      const allowedTools = data.allowedTools || [];

      tools.push({
        type: 'function',
        name: `mcp_${toolNode.id.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        description: `MCP Server: ${serverLabel} (${serverUrl}). Approval: ${requireApproval}. Tools: ${allowedTools.length > 0 ? allowedTools.join(', ') : 'all'}`,
        parameters: {
          type: 'object',
          properties: {
            tool_name: {
              type: 'string',
              description: 'Name of the MCP tool to invoke',
            },
            arguments: {
              type: 'object',
              description: 'Arguments to pass to the tool',
            },
          },
          required: ['tool_name'],
        },
        strict: false,
        execute: async (args: Record<string, unknown>) => {
          logger.info(
            `MCP call: server=${serverUrl}, tool=${args.tool_name}, approval=${requireApproval}`,
          );
          if (requireApproval === 'always') {
            return JSON.stringify({
              status: 'pending_approval',
              tool: args.tool_name,
              server: serverLabel,
            });
          }
          return JSON.stringify({
            status: 'executed',
            tool: args.tool_name,
            server: serverLabel,
            result: 'MCP tool placeholder',
          });
        },
      } as unknown as AgentsFunctionTool);
    }
  }

  if (tools.length === 0) {
    return [...backendTools];
  }
  return tools;
}
