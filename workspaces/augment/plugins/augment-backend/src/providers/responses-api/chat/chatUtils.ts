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
import type { ChatRequest } from '../../../types';

/**
 * Extract the last user message content from a ChatRequest.
 * Returns `undefined` if no user message is found.
 */
export function extractLastUserMessage(
  request: ChatRequest,
): string | undefined {
  for (let i = request.messages.length - 1; i >= 0; i--) {
    const msg = request.messages[i];
    if (msg.role === 'user' && typeof msg.content === 'string') {
      return msg.content;
    }
  }
  return undefined;
}

/**
 * Extract the last user message content from a ChatRequest.
 * Throws if no user message is found.
 */
export function requireLastUserMessage(
  request: ChatRequest,
  errorPrefix = '',
): string {
  const content = extractLastUserMessage(request);
  if (content === undefined) {
    throw new Error(`${errorPrefix}No user message found in request`);
  }
  return content;
}
