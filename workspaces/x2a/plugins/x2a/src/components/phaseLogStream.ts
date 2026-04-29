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
 * Reads a fetch Response body as `text/plain` and invokes `onChunk` for each
 * decoded segment. If `body` is missing, falls back to `response.text()`.
 */
export async function readPlainTextResponseStream(
  response: Response,
  options: {
    signal?: AbortSignal;
    onChunk: (chunk: string) => void;
  },
): Promise<void> {
  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(errBody || `Log request failed (${response.status})`);
  }

  if (!response.body) {
    options.onChunk(await response.text());
    return;
  }

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const streamDecoder = new TextDecoder();
  const reader = response.body.getReader();

  const abort = () => {
    reader.cancel().catch(() => undefined);
  };
  if (options.signal) {
    options.signal.addEventListener('abort', abort, { once: true });
  }

  try {
    for (;;) {
      if (options.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const { done, value } = await reader.read();
      if (done) {
        const tail = streamDecoder.decode();
        if (tail) {
          options.onChunk(tail);
        }
        break;
      }
      if (value && value.length > 0) {
        options.onChunk(streamDecoder.decode(value, { stream: true }));
      }
    }
  } finally {
    options.signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}
