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
        nodeId: node.id, nodeType: 'agent',
        nodeName: data.name || node.label || node.id, model,
        input: inputText, output: outputText, responseId: response.id,
        startedAt, completedAt: new Date().toISOString(),
        status: 'completed', durationMs: Date.now() - startMs,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Agent node ${node.id} failed: ${errMsg}`);
    return {
      output: undefined,
      trace: {
        nodeId: node.id, nodeType: 'agent',
        nodeName: data.name || node.label || node.id, model,
        input: inputText, output: '',
        startedAt, completedAt: new Date().toISOString(),
        status: 'failed', error: errMsg, durationMs: Date.now() - startMs,
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
  const classifications = (data.classifications as Array<{ label: string; description: string }>) || [];
  const model = (data.model as string) || defaultModel;

  const enumValues = classifications.map(c => c.label);
  const classDescriptions = classifications
    .map(c => `- "${c.label}": ${c.description}`)
    .join('\n');

  const instructions = (data.instructions as string) ||
    `Classify the input into exactly one of these categories:\n${classDescriptions}\n\nRespond with the classification in the required JSON format.`;

  const inputText = buildInputForNode(node, userInput, state);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  try {
    const body: Record<string, unknown> = {
      model, input: inputText, instructions, store: true,
      text: {
        format: {
          type: 'json_schema', name: 'classification',
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
    try { parsed = JSON.parse(rawText); } catch { parsed = { classification: rawText.trim().toLowerCase() }; }

    return {
      output: parsed,
      trace: {
        nodeId: node.id, nodeType: 'classify',
        nodeName: node.label || 'Classify', model,
        input: inputText, output: rawText, parsedOutput: parsed,
        responseId: response.id, startedAt,
        completedAt: new Date().toISOString(),
        status: 'completed', durationMs: Date.now() - startMs,
      },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Classify node ${node.id} failed: ${errMsg}`);
    return {
      output: undefined,
      trace: {
        nodeId: node.id, nodeType: 'classify',
        nodeName: node.label || 'Classify', model,
        input: inputText, output: '', startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed', error: errMsg, durationMs: Date.now() - startMs,
      },
    };
  }
}

export function executeLogicNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const condition = (data.condition as string) || 'true';
  const startMs = Date.now();

  let result: boolean;
  try {
    const keys = Object.keys(state);
    const values = Object.values(state);
    const fn = new Function(...keys, `return Boolean(${condition})`);
    result = fn(...values);
  } catch {
    result = false;
  }

  return {
    output: result,
    trace: {
      nodeId: node.id, nodeType: 'logic',
      nodeName: node.label || 'If/Else',
      input: condition, output: String(result), parsedOutput: result,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed', durationMs: Date.now() - startMs,
    },
  };
}

export function executeTransformNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const expression = (data.expression as string) || '';
  const outputVariable = (data.outputVariable as string) || '_transformed';
  const startMs = Date.now();

  let result: unknown;
  try {
    const keys = Object.keys(state);
    const values = Object.values(state);
    const fn = new Function(...keys, `return (${expression})`);
    result = fn(...values);
  } catch {
    result = expression;
  }

  state[outputVariable] = result;

  return {
    output: result,
    trace: {
      nodeId: node.id, nodeType: 'transform',
      nodeName: node.label || 'Transform',
      input: expression, output: String(result), parsedOutput: result,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed', durationMs: Date.now() - startMs,
    },
  };
}

export function executeSetStateNode(
  node: WorkflowNode,
  state: Record<string, unknown>,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const assignments = (data.assignments as Record<string, string>) || {};
  const startMs = Date.now();

  for (const [key, expr] of Object.entries(assignments)) {
    try {
      const keys = Object.keys(state);
      const values = Object.values(state);
      const fn = new Function(...keys, `return (${expr})`);
      state[key] = fn(...values);
    } catch {
      state[key] = expr;
    }
  }

  return {
    output: assignments,
    trace: {
      nodeId: node.id, nodeType: 'set_state',
      nodeName: node.label || 'Set State',
      input: JSON.stringify(assignments), output: JSON.stringify(assignments),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed', durationMs: Date.now() - startMs,
    },
  };
}

export function executeUserInteractionNode(
  node: WorkflowNode,
): NodeExecutionResult {
  const data = node.data as Record<string, unknown>;
  const prompt = (data.prompt as string) || 'Awaiting approval';

  return {
    output: { approved: true, prompt },
    trace: {
      nodeId: node.id, nodeType: 'user_interaction',
      nodeName: node.label || 'Approval',
      input: prompt, output: 'Auto-approved (preview mode)',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed', durationMs: 0,
    },
  };
}

export function makeSkippedTrace(node: WorkflowNode): NodeExecutionResult {
  return {
    output: undefined,
    trace: {
      nodeId: node.id, nodeType: node.type,
      nodeName: node.label || node.id,
      input: '', output: '',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'skipped', durationMs: 0,
    },
  };
}
