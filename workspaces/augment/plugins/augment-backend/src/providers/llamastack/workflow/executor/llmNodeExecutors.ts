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
import type { ResponsesApiClient } from '../../../../services/ResponsesApiClient';
import type { NodeExecutionResult, ResponsesApiResponse } from './types';
import { extractTextFromResponse, buildInputForNode } from './ResponseParser';

export async function executeAgentNode(
  node: WorkflowNode,
  userInput: string,
  state: Record<string, unknown>,
  previousResponseId: string | undefined,
  defaultModel: string,
  client: ResponsesApiClient,
  logger: LoggerService,
): Promise<NodeExecutionResult> {
  const data = node.data as AgentNodeData;
  const model = data.model || defaultModel;
  const instructions = data.instructions || '';
  const inputText = buildInputForNode(node, userInput, state);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const stateMcpServers =
    (state._mcpServers as
      | Array<{ serverUrl: string; serverLabel: string }>
      | undefined) || [];
  const directMcpUrls = Array.isArray(data.mcpServers)
    ? (data.mcpServers as string[])
    : [];

  const tools: Array<Record<string, unknown>> = [
    ...stateMcpServers.map(s => ({
      type: 'mcp',
      server_label: s.serverLabel,
      server_url: s.serverUrl.endsWith('/sse')
        ? s.serverUrl
        : `${s.serverUrl}/sse`,
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
      model,
      input: inputText,
      instructions: instructions || undefined,
      store: true,
    };
    if (previousResponseId) body.previous_response_id = previousResponseId;
    if (data.temperature !== undefined) body.temperature = data.temperature;
    if (data.maxOutputTokens) body.max_output_tokens = data.maxOutputTokens;
    if (tools.length > 0) body.tools = tools;

    const response = await client.request<ResponsesApiResponse>(
      '/v1/responses',
      { method: 'POST', body },
    );

    const outputText = extractTextFromResponse(response);
    return {
      output: outputText,
      trace: {
        nodeId: node.id,
        nodeType: 'agent',
        nodeName: data.name || node.label || node.id,
        model,
        input: inputText,
        output: outputText,
        responseId: response.id,
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'completed',
        durationMs: Date.now() - startMs,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Agent node ${node.id} failed: ${errMsg}`);
    return {
      output: undefined,
      trace: {
        nodeId: node.id,
        nodeType: 'agent',
        nodeName: data.name || node.label || node.id,
        model,
        input: inputText,
        output: '',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed',
        error: errMsg,
        durationMs: Date.now() - startMs,
      },
    };
  }
}

export async function executeClassifyNode(
  node: WorkflowNode,
  userInput: string,
  state: Record<string, unknown>,
  previousResponseId: string | undefined,
  defaultModel: string,
  client: ResponsesApiClient,
  logger: LoggerService,
): Promise<NodeExecutionResult> {
  const data = node.data as Record<string, unknown>;
  const classifications =
    (data.classifications as Array<{ label: string; description: string }>) ||
    [];
  const model = (data.model as string) || defaultModel;

  const enumValues = classifications.map(c => c.label);
  const classDescriptions = classifications
    .map(c => `- "${c.label}": ${c.description}`)
    .join('\n');

  const instructions =
    (data.instructions as string) ||
    `Classify the input into exactly one of these categories:\n${classDescriptions}\n\nRespond with the classification in the required JSON format.`;

  const inputText = buildInputForNode(node, userInput, state);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  try {
    const body: Record<string, unknown> = {
      model,
      input: inputText,
      instructions,
      store: true,
      text: {
        format: {
          type: 'json_schema',
          name: 'classification',
          schema: {
            type: 'object',
            properties: {
              classification: {
                type: 'string',
                enum: enumValues.length > 0 ? enumValues : undefined,
              },
            },
            required: ['classification'],
          },
        },
      },
    };
    if (previousResponseId) body.previous_response_id = previousResponseId;

    const response = await client.request<ResponsesApiResponse>(
      '/v1/responses',
      { method: 'POST', body },
    );

    const rawText = extractTextFromResponse(response);
    let parsed: { classification: string } | null = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { classification: rawText.trim().toLowerCase() };
    }

    return {
      output: parsed,
      trace: {
        nodeId: node.id,
        nodeType: 'classify',
        nodeName: node.label || 'Classify',
        model,
        input: inputText,
        output: rawText,
        parsedOutput: parsed,
        responseId: response.id,
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'completed',
        durationMs: Date.now() - startMs,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Classify node ${node.id} failed: ${errMsg}`);
    return {
      output: undefined,
      trace: {
        nodeId: node.id,
        nodeType: 'classify',
        nodeName: node.label || 'Classify',
        model,
        input: inputText,
        output: '',
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed',
        error: errMsg,
        durationMs: Date.now() - startMs,
      },
    };
  }
}
