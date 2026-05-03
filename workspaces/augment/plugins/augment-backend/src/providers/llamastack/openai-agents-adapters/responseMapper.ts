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
import type {
  RunResult,
  RunItem,
} from '@openai/agents-core';
import type { ChatResponse } from '../../../types';
import type { ToolCallInfo } from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Maps an agents-core RunResult to the plugin's ChatResponse format.
 *
 * Extracts the final text output, agent name, tool call info,
 * reasoning summaries, and approval data from the RunResult items.
 */
export function toChatResponse(result: RunResult<any, any>): ChatResponse {
  const textOutput = extractTextFromItems(result.newItems);
  const toolCallsArr = extractToolCalls(result.newItems);
  const reasoning = extractReasoning(result.newItems);
  const approvalItems = extractApprovals(result.newItems);

  const usage = extractUsage(result);

  return {
    role: 'assistant',
    content: result.finalOutput
      ? typeof result.finalOutput === 'string'
        ? result.finalOutput
        : JSON.stringify(result.finalOutput)
      : textOutput,
    agentName: result.lastAgent?.name,
    toolCalls: toolCallsArr && toolCallsArr.length > 0 ? toolCallsArr : undefined,
    reasoning: reasoning.length > 0 ? reasoning : undefined,
    usage,
    pendingApprovals:
      approvalItems.length > 0 ? approvalItems : undefined,
  };
}

function extractUsage(
  result: RunResult<any, any>,
): ChatResponse['usage'] {
  let inputTokens = 0;
  let outputTokens = 0;
  for (const resp of result.rawResponses) {
    if (resp.usage) {
      inputTokens += resp.usage.inputTokens;
      outputTokens += resp.usage.outputTokens;
    }
  }
  if (inputTokens === 0 && outputTokens === 0) return undefined;
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
  };
}

function extractTextFromItems(items: RunItem[]): string {
  const texts: string[] = [];
  for (const item of items) {
    if (item.type === 'message_output_item') {
      const raw = item.rawItem as Record<string, unknown> | undefined;
      if (Array.isArray(raw?.content)) {
        const parts = raw.content as Array<Record<string, unknown>>;
        texts.push(parts.map(c => (typeof c.text === 'string' ? c.text : '')).join(''));
      } else if (typeof raw?.text === 'string') {
        texts.push(raw.text);
      }
    }
  }
  return texts.join('');
}

function extractToolCalls(
  items: RunItem[],
): ToolCallInfo[] {
  const calls: ToolCallInfo[] = [];
  for (const item of items) {
    if (item.type === 'tool_call_item') {
      const rawItem = item.rawItem as Record<string, unknown> | undefined;
      calls.push({
        id: (rawItem?.id as string) ?? (rawItem?.call_id as string) ?? `tc-${calls.length}`,
        name: (rawItem?.name as string) ?? 'unknown',
        serverLabel: 'function',
        arguments: (rawItem?.arguments as string) ?? '',
        output: (rawItem?.output as string) ?? undefined,
      });
    }
  }
  return calls;
}

function extractReasoning(
  items: RunItem[],
): NonNullable<ChatResponse['reasoning']> {
  const reasoning: NonNullable<ChatResponse['reasoning']> = [];
  for (const item of items) {
    if (item.type === 'reasoning_item' && item.rawItem) {
      const raw = item.rawItem as Record<string, unknown>;
      const content = raw.content as Array<Record<string, unknown>> | undefined;
      const text =
        content
          ?.map(c => (typeof c.text === 'string' ? c.text : ''))
          .join('') ?? '';
      reasoning.push({
        id: (raw.id as string) ?? `reasoning-${reasoning.length}`,
        text,
      });
    }
  }
  return reasoning;
}

function extractApprovals(
  items: RunItem[],
): NonNullable<ChatResponse['pendingApprovals']> {
  const approvals: NonNullable<ChatResponse['pendingApprovals']> = [];
  for (const item of items) {
    if (item.type === 'tool_approval_item') {
      const raw = item.rawItem as Record<string, unknown> | undefined;
      approvals.push({
        approvalRequestId: (raw?.id as string) ?? '',
        toolName: (raw?.name as string) ?? 'unknown',
        arguments: (raw?.arguments as string) ?? '',
      });
    }
  }
  return approvals;
}
