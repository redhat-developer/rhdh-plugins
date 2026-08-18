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
import { hasError, hasPart } from './eventTypes';
import { extractErrorString } from './mcpErrorSanitizer';
import {
  LS_EVENT,
  LS_ITEM_TYPE,
  handleResponseCreated,
  handleResponseCompleted,
  handleOutputItemAdded,
  handleOutputItemDone,
  handleContentPartDone,
  handleArgumentsDelta,
  handleMcpCallCompleted,
  handleMcpCallFailed,
  handleMcpCallRequiresApproval,
  extractResponseFailedError,
} from './streamEventHandlers';

export { LS_EVENT, LS_ITEM_TYPE };

function handleTypelessEvent(
  event: Record<string, unknown>,
): NormalizedStreamEvent[] {
  if (hasError(event) && event.error) {
    const errorMessage =
      typeof event.error === 'string'
        ? event.error
        : event.error.message || 'Unknown server error';
    return [{ type: 'stream.error', error: errorMessage }];
  }
  return [];
}

export function normalizeLlamaStackEvent(
  rawJson: string,
  onUnknownEvent?: (type: string) => void,
): NormalizedStreamEvent[] {
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawJson);
  } catch {
    return [];
  }

  const type = event.type as string | undefined;
  if (!type) return handleTypelessEvent(event);

  switch (type) {
    case LS_EVENT.RESPONSE_CREATED:
      return [handleResponseCreated(event)];
    case LS_EVENT.RESPONSE_IN_PROGRESS:
      return [];
    case LS_EVENT.RESPONSE_COMPLETED:
      return [handleResponseCompleted(event)];
    case LS_EVENT.RESPONSE_FAILED:
      return [
        { type: 'stream.error', error: extractResponseFailedError(event) },
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
      return event.delta
        ? [{ type: 'stream.text.delta', delta: event.delta as string }]
        : [];
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
      return event.delta
        ? [{ type: 'stream.reasoning.delta', delta: event.delta as string }]
        : [];
    case LS_EVENT.REASONING_TEXT_DONE:
    case LS_EVENT.REASONING_SUMMARY_TEXT_DONE:
      return [
        { type: 'stream.reasoning.done', text: (event.text as string) || '' },
      ];
    case LS_EVENT.REASONING_SUMMARY_PART_ADDED:
    case LS_EVENT.REASONING_SUMMARY_PART_DONE:
      return [];
    default:
      onUnknownEvent?.(type);
      return [];
  }
}
