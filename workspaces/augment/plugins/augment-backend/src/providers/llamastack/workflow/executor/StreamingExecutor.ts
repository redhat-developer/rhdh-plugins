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
import type {
  WorkflowNode,
  AgentNodeData,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ResponsesApiClient } from '../../../responses-api/client/ResponsesApiClient';
import type { NodeExecutionResult, StreamEventEmitter } from './types';
import { buildInputForNode } from './ResponseParser';

export async function executeAgentNodeStreaming(
  node: WorkflowNode,
  userInput: string,
  state: Record<string, unknown>,
  previousResponseId: string | undefined,
  defaultModel: string,
  client: ResponsesApiClient,
  logger: LoggerService,
  onEvent: StreamEventEmitter,
  signal?: AbortSignal,
): Promise<NodeExecutionResult> {
  const data = node.data as AgentNodeData;
  const model = data.model || defaultModel;
  const instructions = data.instructions || '';
  const inputText = buildInputForNode(node, userInput, state);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const stateMcpServers = (state._mcpServers as Array<{ serverUrl: string; serverLabel: string }> | undefined) || [];
  const directMcpUrls = Array.isArray(data.mcpServers) ? (data.mcpServers as string[]) : [];

  const tools: Array<Record<string, unknown>> = [
    ...stateMcpServers.map(s => ({
      type: 'mcp',
      server_label: s.serverLabel,
      server_url: s.serverUrl.endsWith('/sse') ? s.serverUrl : `${s.serverUrl}/sse`,
      require_approval: 'never',
    })),
    ...directMcpUrls.map((url, i) => ({
      type: 'mcp',
      server_label: `mcp_${i}`,
      server_url: url.endsWith('/sse') ? url : `${url}/sse`,
      require_approval: 'never',
    })),
  ];

  try {
    const body: Record<string, unknown> = {
      model, input: inputText,
      instructions: instructions || undefined,
      store: true, stream: true,
    };
    if (previousResponseId) body.previous_response_id = previousResponseId;
    if (data.temperature !== undefined) body.temperature = data.temperature;
    if (data.maxOutputTokens) body.max_output_tokens = data.maxOutputTokens;
    if (tools.length > 0) body.tools = tools;

    let fullText = '';
    let responseId = '';

    await client.streamRequest(
      '/v1/responses',
      body,
      (eventData: string) => {
        try {
          const evt = JSON.parse(eventData);

          if (evt.type === 'response.output_text.delta' && evt.delta) {
            fullText += evt.delta;
            onEvent({ type: 'node.delta', data: { nodeId: node.id, delta: evt.delta } });
          } else if (evt.type === 'response.completed' && evt.response?.id) {
            responseId = evt.response.id;
          } else if (evt.type === 'response.mcp_call.in_progress' || evt.type === 'response.mcp_call_in_progress') {
            onEvent({
              type: 'node.tool_call.started',
              data: {
                nodeId: node.id,
                toolName: evt.name || evt.item?.name || 'tool',
                serverLabel: evt.server_label || evt.item?.server_label,
              },
            });
          } else if (evt.type === 'response.mcp_call.completed' || evt.type === 'response.mcp_call_completed') {
            onEvent({
              type: 'node.tool_call.completed',
              data: {
                nodeId: node.id,
                toolName: evt.name || evt.item?.name || 'tool',
                output: evt.output || evt.item?.output,
              },
            });
          } else if (evt.type === 'response.function_call_arguments.delta' && evt.delta) {
            onEvent({
              type: 'node.tool_call.arguments_delta',
              data: { nodeId: node.id, delta: evt.delta },
            });
          } else if (evt.type === 'response.output_item.added' && evt.item?.type === 'mcp_call') {
            onEvent({
              type: 'node.tool_call.started',
              data: {
                nodeId: node.id,
                toolName: evt.item.name || 'mcp_tool',
                serverLabel: evt.item.server_label,
              },
            });
          } else if (evt.type === 'response.output_item.done' && evt.item?.type === 'mcp_call') {
            onEvent({
              type: 'node.tool_call.completed',
              data: {
                nodeId: node.id,
                toolName: evt.item.name || 'mcp_tool',
                output: evt.item.output,
              },
            });
          }
        } catch { /* skip unparseable SSE frames */ }
      },
      signal,
    );

    return {
      output: fullText,
      trace: {
        nodeId: node.id, nodeType: 'agent',
        nodeName: data.name || node.label || node.id, model,
        input: inputText, output: fullText, responseId,
        startedAt, completedAt: new Date().toISOString(),
        status: 'completed', durationMs: Date.now() - startMs,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Streaming agent node ${node.id} failed: ${errMsg}`);
    return {
      output: undefined,
      trace: {
        nodeId: node.id, nodeType: 'agent',
        nodeName: data.name || node.label || node.id, model,
        input: inputText, output: '', startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed', error: errMsg, durationMs: Date.now() - startMs,
      },
    };
  }
}
