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

import { DEFAULT_INCLUDE_FIELDS, ZDR_INCLUDE_FIELDS } from '../../../constants';
import type {
  EffectiveConfig,
  ResponsesApiInputItem,
  ResponsesApiTool,
} from '../../../types';

export interface ContinuationResult {
  responseId: string;
  text: string;
  functionCalls: Array<{ callId: string; name: string; arguments: string }>;
}

export function buildTurnRequest(
  input: string | ResponsesApiInputItem[],
  instructions: string,
  tools: ResponsesApiTool[],
  config: EffectiveConfig,
  options:
    | {
        previousResponseId?: string;
        conversationId?: string;
        stream?: boolean;
        store?: boolean;
      }
    | undefined,
  isParamSupported: (param: string) => boolean,
  applyProductionParams: (
    request: Record<string, unknown>,
    config: EffectiveConfig,
  ) => void,
): Record<string, unknown> {
  const isZdrMode = config.zdrMode === true;
  const storeValue = options?.store ?? !isZdrMode;
  const includeFields = isZdrMode ? ZDR_INCLUDE_FIELDS : DEFAULT_INCLUDE_FIELDS;

  const sanitizedTools =
    tools.length > 0
      ? tools.map(tool => {
          if (tool.type !== 'function') return tool;
          return {
            type: 'function' as const,
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            ...(tool.strict !== undefined ? { strict: tool.strict } : {}),
          };
        })
      : undefined;

  const request: Record<string, unknown> = {
    input,
    model: config.model,
    tools: sanitizedTools,
    store: storeValue,
    include: includeFields,
  };

  if (config.promptRef) {
    const prompt: Record<string, unknown> = { id: config.promptRef.id };
    if (config.promptRef.version !== undefined)
      prompt.version = config.promptRef.version;
    if (config.promptRef.variables)
      prompt.variables = config.promptRef.variables;
    request.prompt = prompt;
  } else {
    request.instructions = instructions;
  }

  if (options?.stream) request.stream = true;
  if (config.toolChoice) request.tool_choice = config.toolChoice;
  request.parallel_tool_calls = config.parallelToolCalls ?? false;
  if (config.textFormat) request.text = { format: config.textFormat };

  if (config.reasoning) {
    const reasoning: Record<string, unknown> = {};
    if (config.reasoning.effort) reasoning.effort = config.reasoning.effort;
    if (config.reasoning.summary) reasoning.summary = config.reasoning.summary;
    if (Object.keys(reasoning).length > 0) request.reasoning = reasoning;
  }

  if (options?.conversationId) {
    request.conversation = options.conversationId;
  } else if (options?.previousResponseId) {
    request.previous_response_id = options.previousResponseId;
  }

  applyProductionParams(request, config);

  if (config.truncation && isParamSupported('truncation')) {
    request.truncation = config.truncation;
  }

  return request;
}
