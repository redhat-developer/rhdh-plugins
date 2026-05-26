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

import type { StreamingEvent, StreamingEventCallback } from '../types';
import { debugError } from '../utils';

function isValidStreamEvent(event: unknown): event is StreamingEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    typeof (event as Record<string, unknown>).type === 'string'
  );
}

/**
 * Parse SSE events from a ReadableStream and invoke the callback for each event.
 * Handles line buffering, "data: " prefix, [DONE] sentinel, and JSON parsing.
 *
 * @param reader - The stream reader (from response.body.getReader())
 * @param onEvent - Callback for each parsed streaming event
 * @param signal - Optional AbortSignal for cancellation
 */
const MAX_BUFFER_SIZE = 1024 * 1024; // 1 MB

export async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: StreamingEventCallback,
  signal?: AbortSignal,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    let reading = true;
    while (reading) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        reading = false;
        continue;
      }

      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      if (buffer.length > MAX_BUFFER_SIZE) {
        await reader.cancel();
        onEvent({
          type: 'stream.error',
          error: 'Stream buffer exceeded maximum size',
          code: 'buffer_overflow',
        } as StreamingEvent);
        return;
      }
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        if (signal?.aborted) break;
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed: unknown = JSON.parse(data);
              if (isValidStreamEvent(parsed)) {
                try {
                  onEvent(parsed);
                } catch (handlerErr) {
                  debugError('SSE onEvent handler threw:', handlerErr);
                }
              } else {
                debugError(
                  'SSE event missing required "type" field:',
                  data.slice(0, 120),
                );
              }
            } catch (parseErr) {
              debugError('Malformed SSE event:', parseErr, data.slice(0, 120));
            }
          }
        }
      }
    }

    const tail = buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer;
    if (!signal?.aborted && tail.startsWith('data: ')) {
      const data = tail.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed: unknown = JSON.parse(data);
          if (isValidStreamEvent(parsed)) {
            try {
              onEvent(parsed);
            } catch (handlerErr) {
              debugError(
                'SSE onEvent handler threw (buffer tail):',
                handlerErr,
              );
            }
          } else {
            debugError(
              'SSE event missing required "type" field (buffer tail):',
              data.slice(0, 120),
            );
          }
        } catch (parseErr) {
          debugError(
            'Malformed SSE event (buffer tail):',
            parseErr,
            data.slice(0, 120),
          );
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
