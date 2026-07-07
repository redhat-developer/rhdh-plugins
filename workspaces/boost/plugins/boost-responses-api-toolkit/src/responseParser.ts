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

import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { ResponsesApiResponse, ResponsesApiStreamEvent } from './types';

/**
 * Extract plain text from a non-streaming Responses API response.
 *
 * Concatenates all `output_text` parts from message-type outputs.
 *
 * @param result - The Responses API response object.
 * @returns The concatenated text content.
 *
 * @public
 */
export function extractTextFromResponse(result: ResponsesApiResponse): string {
  const parts: string[] = [];
  for (const output of result.output ?? []) {
    if (output.type === 'message' && output.content) {
      for (const part of output.content) {
        if (part.type === 'output_text') {
          parts.push(part.text);
        }
      }
    }
  }
  return parts.join('');
}

/**
 * Normalize a Responses API stream event into boost NormalizedStreamEvents.
 *
 * Maps Responses API event types to the boost streaming contract:
 * - `response.output_text.delta` → `text`
 * - `response.mcp_call.in_progress` → `tool_call`
 * - `response.mcp_call.completed` → `tool_result`
 * - `response.completed` → `done`
 *
 * @param event - A Responses API stream event.
 * @returns An array of normalized stream events (may be empty for unhandled types).
 *
 * @public
 */
export function normalizeStreamEvent(
  event: ResponsesApiStreamEvent,
): NormalizedStreamEvent[] {
  const events: NormalizedStreamEvent[] = [];

  switch (event.type) {
    case 'response.output_text.delta':
      if (event.delta) {
        events.push({ type: 'text', text: event.delta });
      }
      break;

    case 'response.mcp_call.in_progress':
      if (event.item?.id && event.item?.server_label) {
        events.push({
          type: 'tool_call',
          toolCallId: event.item.id,
          toolName: event.item.server_label,
          args: '{}',
        });
      }
      break;

    case 'response.mcp_call.completed':
      if (event.item?.id) {
        const resultText = event.item.content?.map(p => p.text).join('') ?? '';
        events.push({
          type: 'tool_result',
          toolCallId: event.item.id,
          content: resultText,
        });
      }
      break;

    case 'response.completed':
      events.push({ type: 'done' });
      break;

    default:
      // Unhandled event types are silently ignored.
      // Callers can log these at debug level if desired.
      break;
  }

  return events;
}
