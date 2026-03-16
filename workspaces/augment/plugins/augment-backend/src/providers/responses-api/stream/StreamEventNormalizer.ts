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

/**
 * Llama Stack Event Normalizer
 *
 * Translates raw Llama Stack Responses API SSE events into normalized
 * streaming events. This is the only place in the codebase that
 * understands the Llama Stack streaming protocol.
 *
 * Input:  Raw JSON string from Llama Stack SSE stream
 * Output: Zero or more NormalizedStreamEvent objects
 *
 * The normalizer is a pure function with no side effects.
 */

import type { NormalizedStreamEvent } from '../../types';
import { hasResponse, hasItem, hasPart, hasError } from './eventTypes';

function extractErrorString(error: string | { message?: string }): string {
  if (typeof error === 'string') return error;
  return error.message ?? '';
}

const INTERNAL_URL_PATTERN =
  /https?:\/\/[^\s]+\.svc(\.cluster\.local)?(:\d+)?[^\s]*/;
const RAW_URL_TEST_PATTERN = /https?:\/\/[^\s]+/;

/**
 * Sanitize MCP error messages to avoid exposing internal infrastructure
 * URLs to users. Handles proxy URLs, Kubernetes service URLs, and any
 * raw URLs that might leak internal addresses.
 */
function sanitizeMcpError(error: string, serverLabel?: string): string {
  if (INTERNAL_URL_PATTERN.test(error)) {
    const label = serverLabel || 'MCP server';
    return buildUserFriendlyError(error, label);
  }

  if (RAW_URL_TEST_PATTERN.test(error)) {
    const label = serverLabel || 'MCP server';
    return buildUserFriendlyError(error, label);
  }

  return error;
}

function buildUserFriendlyError(error: string, label: string): string {
  if (/connection refused|ECONNREFUSED/i.test(error)) {
    return `MCP server "${label}" is temporarily unreachable (connection refused). Check that the server is running and accessible.`;
  }
  if (/timeout|ETIMEDOUT/i.test(error)) {
    return `MCP server "${label}" timed out. The server may be overloaded or unreachable.`;
  }
  if (/502/i.test(error)) {
    return `MCP server "${label}" returned an error (502). The server may be down or misconfigured.`;
  }
  if (/401|unauthorized/i.test(error)) {
    return `MCP server "${label}" rejected the request (unauthorized). Check the server's authentication configuration.`;
  }
  if (/403|forbidden/i.test(error)) {
    return `MCP server "${label}" denied access (forbidden). Check permissions and credentials.`;
  }
  return `MCP server "${label}" encountered an error. Contact your administrator if the issue persists.`;
}

// =============================================================================
// Llama Stack Event Type Constants
// =============================================================================

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

const LS_ITEM_TYPE = {
  FUNCTION_CALL: 'function_call',
  FUNCTION_CALL_OUTPUT: 'function_call_output',
  MCP_CALL: 'mcp_call',
  MCP_APPROVAL_REQUEST: 'mcp_approval_request',
  FILE_SEARCH_CALL: 'file_search_call',
  MESSAGE: 'message',
  MCP_LIST_TOOLS: 'mcp_list_tools',
} as const;

// =============================================================================
// Normalizer
// =============================================================================

/**
 * Normalize a single raw Llama Stack SSE event into zero or more
 * NormalizedStreamEvents.
 *
 * Returns an array because some raw events map to multiple normalized
 * events (e.g., output_item.done for file_search produces both
 * stream.rag.results and potentially stream.tool.completed).
 */
export function normalizeLlamaStackEvent(
  rawJson: string,
  onUnknownEvent?: (type: string) => void,
): NormalizedStreamEvent[] {
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawJson);
  } catch {
    // JSON parse failure is expected for non-JSON event data; return empty array
    return [];
  }

  const type = event.type as string | undefined;

  // Handle error events that lack a type field (e.g., {"error": {"message": "..."}})
  if (!type) {
    if (hasError(event) && event.error) {
      const errorMessage =
        typeof event.error === 'string'
          ? event.error
          : event.error.message || 'Unknown server error';
      return [{ type: 'stream.error', error: errorMessage }];
    }
    return [];
  }

  switch (type) {
    case LS_EVENT.RESPONSE_CREATED:
      return [handleResponseCreated(event)];

    case LS_EVENT.RESPONSE_IN_PROGRESS:
      return [];

    case LS_EVENT.RESPONSE_COMPLETED:
      return [handleResponseCompleted(event)];

    case LS_EVENT.RESPONSE_FAILED:
      return [
        {
          type: 'stream.error',
          error: extractResponseFailedError(event),
        },
      ];

    case LS_EVENT.ERROR:
      return [
        {
          type: 'stream.error',
          error:
            (event.message as string) ||
            (hasError(event) && event.error
              ? extractErrorString(event.error)
              : '') ||
            'Unknown error',
        },
      ];

    case LS_EVENT.MCP_LIST_TOOLS_IN_PROGRESS:
      return [
        {
          type: 'stream.tool.discovery',
          serverLabel: event.server_label as string | undefined,
          status: 'in_progress',
        },
      ];

    case LS_EVENT.MCP_LIST_TOOLS_COMPLETED:
      return [
        {
          type: 'stream.tool.discovery',
          serverLabel: event.server_label as string | undefined,
          status: 'completed',
          toolCount: event.tool_count as number | undefined,
        },
      ];

    case LS_EVENT.OUTPUT_ITEM_ADDED:
      return handleOutputItemAdded(event);

    case LS_EVENT.OUTPUT_ITEM_DONE:
      return handleOutputItemDone(event);

    case LS_EVENT.FUNCTION_CALL_ARGUMENTS_DELTA:
    case LS_EVENT.MCP_CALL_ARGUMENTS_DELTA:
    case LS_EVENT.MCP_CALL_ARGUMENTS_DELTA_LEGACY:
      return handleArgumentsDelta(event);

    case LS_EVENT.FUNCTION_CALL_ARGUMENTS_DONE:
    case LS_EVENT.MCP_CALL_ARGUMENTS_DONE:
      return [];

    case LS_EVENT.MCP_CALL_IN_PROGRESS:
      return [];

    case LS_EVENT.MCP_CALL_COMPLETED:
      return handleMcpCallCompleted(event);

    case LS_EVENT.MCP_CALL_FAILED:
      return handleMcpCallFailed(event);

    case LS_EVENT.MCP_CALL_REQUIRES_APPROVAL:
      return handleMcpCallRequiresApproval(event);

    case LS_EVENT.CONTENT_PART_ADDED:
      return [];

    case LS_EVENT.CONTENT_PART_DONE:
      return handleContentPartDone(event);

    case LS_EVENT.OUTPUT_TEXT_DELTA:
      if (event.delta) {
        return [{ type: 'stream.text.delta', delta: event.delta as string }];
      }
      return [];

    case LS_EVENT.OUTPUT_TEXT_DONE:
      return [
        {
          type: 'stream.text.done',
          text:
            (hasPart(event) ? event.part?.text : undefined) ||
            (event.text as string) ||
            '',
        },
      ];

    case LS_EVENT.REASONING_TEXT_DELTA:
    case LS_EVENT.REASONING_SUMMARY_TEXT_DELTA:
      if (event.delta) {
        return [
          { type: 'stream.reasoning.delta', delta: event.delta as string },
        ];
      }
      return [];

    case LS_EVENT.REASONING_TEXT_DONE:
    case LS_EVENT.REASONING_SUMMARY_TEXT_DONE:
      return [
        {
          type: 'stream.reasoning.done',
          text: (event.text as string) || '',
        },
      ];

    case LS_EVENT.REASONING_SUMMARY_PART_ADDED:
    case LS_EVENT.REASONING_SUMMARY_PART_DONE:
      return [];

    default:
      onUnknownEvent?.(type);
      return [];
  }
}

// =============================================================================
// Handler Functions
// =============================================================================

function handleResponseCreated(
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

function handleResponseCompleted(
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

function handleOutputItemAdded(
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

    case LS_ITEM_TYPE.FUNCTION_CALL_OUTPUT: {
      // Function call output is handled when the matching tool call
      // is completed — we emit a stream.tool.completed in output_item.done
      return [];
    }

    case LS_ITEM_TYPE.FILE_SEARCH_CALL:
      // RAG search started — results come in output_item.done
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
    if (typeof error === 'string') {
      errorStr = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorStr = String((error as { message?: string }).message ?? '');
    } else {
      errorStr = String(error ?? '');
    }
    return {
      type: 'stream.tool.failed',
      callId: (item.id as string) ?? '',
      name: (item.name as string) ?? '',
      serverLabel: item.server_label as string | undefined,
      error: errorStr,
    };
  }
  const output = item.output;
  const outputStr = stringifyOutput(output);
  return {
    type: 'stream.tool.completed',
    callId: (item.id as string) ?? '',
    name: (item.name as string) ?? '',
    serverLabel: item.server_label as string | undefined,
    output: outputStr,
  };
}

function stringifyOutput(output: unknown): string | undefined {
  if (typeof output === 'string') return output;
  if (output !== null && output !== undefined) {
    return JSON.stringify(output, null, 2);
  }
  return undefined;
}

function mapFunctionCallOutput(
  item: Record<string, unknown>,
): NormalizedStreamEvent | undefined {
  const callId = item.call_id as string | undefined;
  if (!callId) return undefined;
  const outputStr = stringifyOutput(item.output);
  return {
    type: 'stream.tool.completed',
    callId,
    name: '',
    output: outputStr,
  };
}

function handleOutputItemDone(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (!hasItem(event) || !event.item) return [];

  const item = event.item;
  const itemType = item.type ?? '';
  const results: NormalizedStreamEvent[] = [];

  if (itemType === LS_ITEM_TYPE.FILE_SEARCH_CALL) {
    const ragEvent = mapFileSearchResult(item);
    if (ragEvent) results.push(ragEvent);
  }

  if (
    itemType === LS_ITEM_TYPE.FUNCTION_CALL ||
    itemType === LS_ITEM_TYPE.MCP_CALL
  ) {
    results.push(mapToolCallResult(item));
  }

  if (itemType === LS_ITEM_TYPE.FUNCTION_CALL_OUTPUT) {
    const outputEvent = mapFunctionCallOutput(item);
    if (outputEvent) results.push(outputEvent);
  }

  return results;
}

function handleContentPartDone(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (!hasPart(event) || !event.part) return [];
  const part = event.part;
  if (part.type === 'output_text' && typeof part.text === 'string') {
    return [{ type: 'stream.text.done', text: part.text }];
  }
  return [];
}

function handleArgumentsDelta(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  const delta = event.delta as string | undefined;
  const itemId = event.item_id as string | undefined;
  if (!delta || !itemId) return [];

  return [
    {
      type: 'stream.tool.delta',
      callId: itemId,
      delta,
    },
  ];
}

function handleMcpCallCompleted(
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

function handleMcpCallFailed(
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

function extractResponseFailedError(event: Record<string, unknown>): string {
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

function handleMcpCallRequiresApproval(
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
