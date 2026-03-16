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
  ConversationItem,
  ProcessedMessage,
  ProcessedToolCall,
  ProcessedRagSource,
} from './conversationTypes';

/**
 * Extract plain text from a Responses API content field.
 * Handles string, array-of-parts, and undefined.
 *
 * @param excludeInputText - When true, skips `input_text` parts.
 *   Use for assistant messages: Llama Stack stores the system prompt
 *   (instructions) as `input_text` in conversation items, which must
 *   not be shown to the user.
 */
export function extractContentFromItem(
  content: string | Array<{ type: string; text?: string }> | undefined,
  excludeInputText = false,
): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(c => {
        if (typeof c.text !== 'string') return false;
        if (c.type === 'output_text' || c.type === 'text') return true;
        if (c.type === 'input_text') return !excludeInputText;
        return false;
      })
      .map(c => c.text || '')
      .join('');
  }
  return '';
}

/**
 * Extract user input text from a raw response input field.
 *
 * Two-pass approach: first looks for explicit `{type:'message', role:'user'}`
 * items, then falls back to bare `input_text` items. This prevents
 * accidentally returning the system prompt (instructions) when Llama Stack
 * stores them as `input_text` items before the user message.
 */
export function extractUserInputFromRaw(input: unknown): string {
  if (typeof input === 'string') return input;

  if (Array.isArray(input)) {
    // Pass 1: look for explicit user messages
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;
      const inputItem = item as Record<string, unknown>;

      if (inputItem.type === 'message' && inputItem.role === 'user') {
        if (typeof inputItem.content === 'string') return inputItem.content;
        if (Array.isArray(inputItem.content)) {
          return extractContentFromItem(
            inputItem.content as Array<{ type: string; text?: string }>,
          );
        }
      }
    }

    // Pass 2: fall back to bare input_text (only if no user message found)
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;
      const inputItem = item as Record<string, unknown>;

      if (
        inputItem.type === 'input_text' &&
        typeof inputItem.text === 'string'
      ) {
        return inputItem.text;
      }
    }
  }

  return '';
}

/**
 * Extract a preview string from the response input.
 * Prioritizes user messages to avoid showing the system prompt in
 * conversation list previews.
 */
export function getInputText(
  input:
    | string
    | Array<{
        type: string;
        content?: string | Array<{ type: string; text?: string }>;
        role?: string;
      }>,
): string {
  if (typeof input === 'string') {
    return input.slice(0, 80) + (input.length > 80 ? '...' : '');
  }
  if (!Array.isArray(input)) return '';

  const userMessage = input.find(
    item => item.type === 'message' && item.role === 'user',
  );
  const target =
    userMessage ??
    input.find(
      item =>
        item.type === 'message' &&
        item.role !== 'developer' &&
        item.role !== 'system',
    );
  if (target) {
    const content = extractContentFromItem(target.content);
    if (content) {
      return content.slice(0, 80) + (content.length > 80 ? '...' : '');
    }
  }
  return '';
}

/**
 * Process raw conversation items into frontend-ready messages.
 *
 * Groups tool calls (mcp_call, file_search_call, web_search_call) with
 * the next assistant message, extracts RAG sources, and drops orphaned
 * tool calls.
 */
const HANDOFF_PREFIX = 'transfer_to_';

function isHandoffFunctionCall(item: ConversationItem): boolean {
  return (
    item.type === 'function_call' &&
    typeof item.name === 'string' &&
    item.name.startsWith(HANDOFF_PREFIX)
  );
}

function extractReasoningText(item: ConversationItem): string {
  if (Array.isArray(item.summary)) {
    return item.summary
      .filter(s => s.type === 'summary_text' && typeof s.text === 'string')
      .map(s => s.text)
      .join('\n\n');
  }
  const text = extractContentFromItem(
    item.content as string | Array<{ type: string; text?: string }> | undefined,
  );
  return text || '';
}

function parseAgentNameFromHandoffOutput(
  output: string | undefined,
): string | undefined {
  if (!output) return undefined;
  try {
    const parsed = JSON.parse(output);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.assistant === 'string'
    ) {
      return parsed.assistant;
    }
  } catch {
    // not JSON — ignore
  }
  return undefined;
}

export function processConversationItems(
  items: ConversationItem[],
  logger: LoggerService,
): ProcessedMessage[] {
  const messages: ProcessedMessage[] = [];
  let pendingToolCalls: ProcessedToolCall[] = [];
  let pendingRagSources: ProcessedRagSource[] = [];
  let pendingReasoning: string[] = [];
  let pendingAgentName: string | undefined;

  for (const item of items) {
    if (item.type === 'mcp_list_tools') continue;

    if (item.type === 'reasoning') {
      const text = extractReasoningText(item);
      if (text) pendingReasoning.push(text);
      continue;
    }

    if (item.type === 'function_call_output') {
      const agentName = parseAgentNameFromHandoffOutput(item.output);
      if (agentName) {
        pendingAgentName = agentName;
      }
      continue;
    }

    if (
      item.type === 'mcp_call' ||
      item.type === 'function_call' ||
      item.type === 'web_search_call'
    ) {
      if (isHandoffFunctionCall(item)) {
        const rawName = item.name!.slice(HANDOFF_PREFIX.length);
        pendingAgentName = rawName.replace(/_/g, ' ');
        continue;
      }

      pendingToolCalls.push({
        id: item.id || item.call_id || `tool-${pendingToolCalls.length}`,
        name: item.name || item.type,
        serverLabel: item.server_label || 'llamastack',
        arguments: item.arguments,
        output: item.output,
        error: item.error,
        status: item.error ? 'failed' : 'completed',
      });
      continue;
    }

    if (item.type === 'file_search_call') {
      pendingToolCalls.push({
        id: item.id || item.call_id || `tool-${pendingToolCalls.length}`,
        name: 'knowledge_search',
        serverLabel: 'llamastack',
        arguments: item.queries ? JSON.stringify(item.queries) : undefined,
        output: item.results
          ? `${item.results.length} result(s) found`
          : 'No results found',
        status: 'completed',
      });
      if (item.results) {
        for (const r of item.results) {
          pendingRagSources.push({
            filename: r.filename || r.file_id || '',
            fileId: r.file_id,
            text: r.text,
            score: r.score,
            attributes: r.attributes,
          });
        }
      }
      continue;
    }

    if (item.type !== 'message') continue;
    if (item.role !== 'user' && item.role !== 'assistant') continue;

    if (item.role === 'assistant' && Array.isArray(item.content)) {
      const hasInputText = item.content.some(
        c => c.type === 'input_text' && typeof c.text === 'string',
      );
      if (hasInputText) {
        logger.info(
          '[Sanitization] Stripped input_text (instructions) from assistant message in conversation items',
        );
      }
    }

    const text = extractContentFromItem(
      item.content as
        | string
        | Array<{ type: string; text?: string }>
        | undefined,
      item.role === 'assistant',
    );
    if (!text.trim()) {
      logger.debug(
        `[MessageProcessor] Skipping ${item.role} message with empty text after content extraction`,
      );
      continue;
    }

    if (item.role === 'user' && pendingToolCalls.length > 0) {
      logger.debug(
        `Dropping ${pendingToolCalls.length} orphaned tool call(s) before user message`,
      );
      pendingToolCalls = [];
      pendingRagSources = [];
    }
    if (item.role === 'user') {
      pendingReasoning = [];
      pendingAgentName = undefined;
    }

    const msg: ProcessedMessage = { role: item.role, text };

    if (typeof item.created_at === 'number') {
      msg.createdAt = new Date(item.created_at * 1000).toISOString();
    }

    if (item.role === 'assistant') {
      if (pendingToolCalls.length > 0) {
        msg.toolCalls = pendingToolCalls;
        pendingToolCalls = [];
      }
      if (pendingRagSources.length > 0) {
        msg.ragSources = pendingRagSources;
        pendingRagSources = [];
      }
      if (pendingReasoning.length > 0) {
        msg.reasoning = pendingReasoning.join('\n\n');
        pendingReasoning = [];
      }
      if (pendingAgentName) {
        msg.agentName = pendingAgentName;
        pendingAgentName = undefined;
      }
    }

    messages.push(msg);
  }

  if (pendingToolCalls.length > 0) {
    logger.debug(
      `Dropping ${pendingToolCalls.length} orphaned tool call(s) at end of conversation`,
    );
  }

  if (items.length > 0 && messages.length === 0) {
    logger.warn(
      `[MessageProcessor] Received ${items.length} conversation items but produced 0 messages — all items were filtered out`,
    );
  }

  return messages;
}
