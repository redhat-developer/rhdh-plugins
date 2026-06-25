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

import type { NormalizedStreamEvent } from '../../types';
import { hasResponse, hasItem, hasPart, hasError } from './eventTypes';
import { sanitizeMcpError } from './mcpErrorSanitizer';

export const LS_EVENT = {
  RESPONSE_CREATED: 'response.created',
  RESPONSE_IN_PROGRESS: 'response.in_progress',
  RESPONSE_COMPLETED: 'response.completed',
  RESPONSE_FAILED: 'response.failed',
  ERROR: 'error',
  MCP_LIST_TOOLS_IN_PROGRESS: 'response.mcp_list_tools.in_progress',
  MCP_LIST_TOOLS_COMPLETED: 'response.mcp_list_tools.completed',
  OUTPUT_ITEM_ADDED: 'response.output_item.added',
  OUTPUT_ITEM_DONE: 'response.output_item.done',
  FUNCTION_CALL_ARGUMENTS_DELTA: 'response.function_call_arguments.delta',
  FUNCTION_CALL_ARGUMENTS_DONE: 'response.function_call_arguments.done',
  MCP_CALL_IN_PROGRESS: 'response.mcp_call.in_progress',
  MCP_CALL_COMPLETED: 'response.mcp_call.completed',
  MCP_CALL_FAILED: 'response.mcp_call.failed',
  MCP_CALL_REQUIRES_APPROVAL: 'response.mcp_call.requires_approval',
  MCP_CALL_ARGUMENTS_DELTA: 'response.mcp_call.arguments.delta',
  MCP_CALL_ARGUMENTS_DONE: 'response.mcp_call.arguments.done',
  MCP_CALL_ARGUMENTS_DELTA_LEGACY: 'response.mcp_call_arguments.delta',
  CONTENT_PART_ADDED: 'response.content_part.added',
  CONTENT_PART_DONE: 'response.content_part.done',
  OUTPUT_TEXT_DELTA: 'response.output_text.delta',
  OUTPUT_TEXT_DONE: 'response.output_text.done',
  REASONING_TEXT_DELTA: 'response.reasoning_text.delta',
  REASONING_TEXT_DONE: 'response.reasoning_text.done',
  REASONING_SUMMARY_PART_ADDED: 'response.reasoning_summary_part.added',
  REASONING_SUMMARY_PART_DONE: 'response.reasoning_summary_part.done',
  REASONING_SUMMARY_TEXT_DELTA: 'response.reasoning_summary_text.delta',
  REASONING_SUMMARY_TEXT_DONE: 'response.reasoning_summary_text.done',
} as const;

export const LS_ITEM_TYPE = {
  FUNCTION_CALL: 'function_call',
  FUNCTION_CALL_OUTPUT: 'function_call_output',
  MCP_CALL: 'mcp_call',
  MCP_APPROVAL_REQUEST: 'mcp_approval_request',
  FILE_SEARCH_CALL: 'file_search_call',
  MESSAGE: 'message',
  MCP_LIST_TOOLS: 'mcp_list_tools',
} as const;

export function handleResponseCreated(
  event: Record<string, unknown>,
): NormalizedStreamEvent {
  const responseId = hasResponse(event)
    ? event.response?.id || event.response_id || ''
    : (event.response_id as string) || '';
  const model = hasResponse(event) ? event.response?.model : undefined;
  const createdAt = hasResponse(event) ? event.response?.created_at : undefined;
  return {
    type: 'stream.started',
    responseId: String(responseId),
    model,
    createdAt: typeof createdAt === 'number' ? createdAt : undefined,
  };
}

export function handleResponseCompleted(
  event: Record<string, unknown>,
): NormalizedStreamEvent {
  if (!hasResponse(event)) {
    return {
      type: 'stream.completed',
      responseId: undefined,
      usage: undefined,
    };
  }
  const { response } = event;
  const usage = response?.usage;
  return {
    type: 'stream.completed',
    responseId: response?.id,
    usage: usage
      ? {
          input_tokens: usage.input_tokens ?? 0,
          output_tokens: usage.output_tokens ?? 0,
          total_tokens: usage.total_tokens ?? 0,
          input_tokens_details: usage.input_tokens_details,
          output_tokens_details: usage.output_tokens_details ?? undefined,
        }
      : undefined,
  };
}

export function handleOutputItemAdded(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (!hasItem(event) || !event.item) return [];
  const item = event.item;
  const itemType = item.type ?? '';

  switch (itemType) {
    case LS_ITEM_TYPE.MCP_APPROVAL_REQUEST:
      return [
        {
          type: 'stream.tool.approval',
          callId: item.id ?? '',
          name: item.name ?? '',
          serverLabel: item.server_label,
          arguments: item.arguments,
        },
      ];
    case LS_ITEM_TYPE.FUNCTION_CALL_OUTPUT:
      return [];
    case LS_ITEM_TYPE.FILE_SEARCH_CALL:
      return [];
    case LS_ITEM_TYPE.FUNCTION_CALL:
    case LS_ITEM_TYPE.MCP_CALL:
      return [
        {
          type: 'stream.tool.started',
          callId: item.id ?? '',
          name: item.name ?? '',
          serverLabel: item.server_label,
        },
      ];
    default:
      return [];
  }
}

function stringifyOutput(output: unknown): string | undefined {
  if (typeof output === 'string') return output;
  if (output !== null && output !== undefined)
    return JSON.stringify(output, null, 2);
  return undefined;
}

function mapFileSearchResult(
  item: Record<string, unknown>,
): NormalizedStreamEvent | undefined {
  if (!Array.isArray(item.results)) return undefined;
  const validResults = item.results.filter(
    (r: unknown) => r !== null && r !== undefined && typeof r === 'object',
  ) as Record<string, unknown>[];
  return {
    type: 'stream.rag.results' as const,
    sources: validResults.map(r => {
      const attrs = r.attributes as Record<string, unknown> | undefined;
      return {
        filename: (r.filename ?? r.file_id ?? '') as string,
        fileId: r.file_id as string | undefined,
        text: r.text as string | undefined,
        score: r.score as number | undefined,
        title: attrs?.title as string | undefined,
        sourceUrl: attrs?.source_url as string | undefined,
        contentType: attrs?.content_type as string | undefined,
        attributes: attrs,
      };
    }),
    filesSearched: validResults
      .map(r => (r.filename ?? r.name ?? r.file_id ?? '') as string)
      .filter(Boolean),
  };
}

function mapToolCallResult(
  item: Record<string, unknown>,
): NormalizedStreamEvent {
  const error = item.error;
  if (error) {
    let errorStr: string;
    if (typeof error === 'string') errorStr = error;
    else if (error && typeof error === 'object' && 'message' in error)
      errorStr = String((error as { message?: string }).message ?? '');
    else errorStr = String(error ?? '');
    return {
      type: 'stream.tool.failed',
      callId: (item.id as string) ?? '',
      name: (item.name as string) ?? '',
      serverLabel: item.server_label as string | undefined,
      error: errorStr,
    };
  }
  return {
    type: 'stream.tool.completed',
    callId: (item.id as string) ?? '',
    name: (item.name as string) ?? '',
    serverLabel: item.server_label as string | undefined,
    output: stringifyOutput(item.output),
  };
}

function mapFunctionCallOutput(
  item: Record<string, unknown>,
): NormalizedStreamEvent | undefined {
  const callId = item.call_id as string | undefined;
  if (!callId) return undefined;
  return {
    type: 'stream.tool.completed',
    callId,
    name: '',
    output: stringifyOutput(item.output),
  };
}

export function handleOutputItemDone(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (!hasItem(event) || !event.item) return [];
  const item = event.item;
  const itemType = item.type ?? '';
  const results: NormalizedStreamEvent[] = [];
  if (itemType === LS_ITEM_TYPE.FILE_SEARCH_CALL) {
    const r = mapFileSearchResult(item);
    if (r) results.push(r);
  }
  if (
    itemType === LS_ITEM_TYPE.FUNCTION_CALL ||
    itemType === LS_ITEM_TYPE.MCP_CALL
  ) {
    results.push(mapToolCallResult(item));
  }
  if (itemType === LS_ITEM_TYPE.FUNCTION_CALL_OUTPUT) {
    const r = mapFunctionCallOutput(item);
    if (r) results.push(r);
  }
  return results;
}

export function handleContentPartDone(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (!hasPart(event) || !event.part) return [];
  const part = event.part;
  if (part.type === 'output_text' && typeof part.text === 'string')
    return [{ type: 'stream.text.done', text: part.text }];
  return [];
}

export function handleArgumentsDelta(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  const delta = event.delta as string | undefined;
  const itemId = event.item_id as string | undefined;
  if (!delta || !itemId) return [];
  return [{ type: 'stream.tool.delta', callId: itemId, delta }];
}

export function handleMcpCallCompleted(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  const itemId = event.item_id as string | undefined;
  if (!itemId) return [];
  return [
    {
      type: 'stream.tool.completed',
      callId: itemId,
      name: (event.name as string) || '',
      serverLabel: event.server_label as string | undefined,
      output: event.output as string | undefined,
    },
  ];
}

export function handleMcpCallFailed(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  const itemId = event.item_id as string | undefined;
  if (!itemId) return [];
  const rawError = (event.error as string) || 'Tool call failed';
  const serverLabel = event.server_label as string | undefined;
  return [
    {
      type: 'stream.tool.failed',
      callId: itemId,
      name: (event.name as string) || '',
      serverLabel,
      error: sanitizeMcpError(rawError, serverLabel),
    },
  ];
}

export function extractResponseFailedError(
  event: Record<string, unknown>,
): string {
  let raw: string | undefined;
  if (hasResponse(event) && event.response) {
    const errObj = event.response.error;
    if (typeof errObj === 'string') raw = errObj;
    else if (errObj?.message) raw = errObj.message;
    else if (event.response.status_reason) raw = event.response.status_reason;
  }
  if (!raw && hasError(event) && event.error) {
    if (typeof event.error === 'string') raw = event.error;
    else if (event.error.message) raw = event.error.message;
  }
  if (!raw && event.message) raw = event.message as string;
  return sanitizeMcpError(raw || 'Response generation failed');
}

export function handleMcpCallRequiresApproval(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  const itemId =
    (event.item_id as string | undefined) ||
    (event.id as string | undefined) ||
    (event.call_id as string | undefined);
  if (!itemId) return [];
  return [
    {
      type: 'stream.tool.approval',
      callId: itemId,
      name: (event.name as string) || '',
      serverLabel: event.server_label as string | undefined,
      arguments: event.arguments as string | undefined,
    },
  ];
}
