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

import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import type { ResponsesApiTool } from '../../../types';
import type { ContinuationResult } from './chatTurnBuilder';

export function buildToolOutputInput(options: {
  callId: string;
  output: string;
  functionCall?: { name: string; arguments: string };
  additionalToolOutputs?: Array<{
    callId: string;
    output: string;
    functionCall?: { name: string; arguments: string };
  }>;
}): Array<Record<string, unknown>> {
  const input: Array<Record<string, unknown>> = [];
  const allOutputs = [
    {
      callId: options.callId,
      output: options.output,
      functionCall: options.functionCall,
    },
    ...(options.additionalToolOutputs ?? []),
  ];
  for (const toolOutput of allOutputs) {
    if (toolOutput.functionCall) {
      input.push({
        type: 'function_call',
        call_id: toolOutput.callId,
        name: toolOutput.functionCall.name,
        arguments: toolOutput.functionCall.arguments,
      });
    }
    input.push({
      type: 'function_call_output',
      call_id: toolOutput.callId,
      output: toolOutput.output,
    });
  }
  return input;
}

export function buildContinuationBody(
  options: {
    model: string;
    conversationId?: string;
    previousResponseId?: string;
    tools?: ResponsesApiTool[];
    guardrails?: string[];
    safetyIdentifier?: string;
    instructions?: string;
    maxOutputTokens?: number;
    temperature?: number;
    truncation?: 'auto' | 'disabled';
  },
  input: Array<Record<string, unknown>>,
  isParamSupported: (param: string) => boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    input,
    store: true,
  };

  if (options.previousResponseId) {
    body.previous_response_id = options.previousResponseId;
  } else if (options.conversationId) {
    body.conversation = options.conversationId;
  }
  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools.map(tool => {
      if (tool.type !== 'function') return tool;
      const { type: _discriminator, ...rest } = tool;
      return rest;
    });
  }
  if (options.guardrails && options.guardrails.length > 0)
    body.guardrails = options.guardrails;
  if (options.safetyIdentifier)
    body.safety_identifier = options.safetyIdentifier;
  if (options.instructions) body.instructions = options.instructions;
  if (options.maxOutputTokens !== undefined && options.maxOutputTokens > 0) {
    if (isParamSupported('max_output_tokens'))
      body.max_output_tokens = options.maxOutputTokens;
  }
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.truncation && isParamSupported('truncation'))
    body.truncation = options.truncation;
  return body;
}

export function parseContinuationResponse(response: {
  id: string;
  output: Array<{
    type: string;
    content?: Array<{ type: string; text: string }>;
    name?: string;
    call_id?: string;
    arguments?: string;
    id?: string;
  }>;
}): ContinuationResult {
  let text = '';
  const functionCalls: ContinuationResult['functionCalls'] = [];

  for (const item of response.output ?? []) {
    if (item.type === 'function_call') {
      functionCalls.push({
        callId: item.call_id ?? item.id ?? '',
        name: item.name ?? '',
        arguments: item.arguments ?? '{}',
      });
      continue;
    }
    if (item.type !== 'message') continue;
    const msg = item as { content?: Array<{ type: string; text?: string }> };
    for (const c of msg.content ?? []) {
      if (c.type === 'output_text' && c.text) text += c.text;
    }
  }
  return { responseId: response.id, text, functionCalls };
}

export async function executeContinuation(
  options: {
    client: ResponsesApiClient;
    model: string;
    callId: string;
    output: string;
    previousResponseId: string;
    guardrails?: string[];
    safetyIdentifier?: string;
    functionCall?: { name: string; arguments: string };
    conversationId?: string;
    maxOutputTokens?: number;
    temperature?: number;
    instructions?: string;
    truncation?: 'auto' | 'disabled';
    tools?: ResponsesApiTool[];
    additionalToolOutputs?: Array<{
      callId: string;
      output: string;
      functionCall?: { name: string; arguments: string };
    }>;
  },
  isParamSupported: (param: string) => boolean,
): Promise<ContinuationResult> {
  const input = buildToolOutputInput(options);
  const body = buildContinuationBody(options, input, isParamSupported);

  const response = await options.client.request<{
    id: string;
    output: Array<{
      type: string;
      content?: Array<{ type: string; text: string }>;
      name?: string;
      call_id?: string;
      server_label?: string;
      arguments?: string;
      id?: string;
    }>;
  }>('/v1/responses', { method: 'POST', body: JSON.stringify(body) });

  return parseContinuationResponse(response);
}
