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

import type { InputItem } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { ResponsesApiInputItem, ResponsesApiRequest } from './types';

/**
 * Options for building a Responses API request body.
 *
 * @public
 */
export interface BuildRequestOptions {
  /** The model to use for inference. */
  model: string;
  /** Boost input items to translate. */
  messages: InputItem[];
  /** Whether to enable streaming. */
  stream: boolean;
}

/**
 * Result of building a request body, including metadata about skipped items.
 *
 * @public
 */
export interface BuildRequestResult {
  /** The built request body. */
  body: ResponsesApiRequest;
  /** Number of non-text input items that were skipped. */
  skippedCount: number;
  /** The types of input items that were skipped (deduplicated). */
  skippedTypes: string[];
}

/**
 * Build a Responses API request body from boost InputItems.
 *
 * Translates boost `InputItem` values into `ResponsesApiInputItem` entries.
 * Non-text input items (file, image) are skipped since the Responses API
 * only supports text input in its current form.
 *
 * @param options - Request building options.
 * @returns The built request body and metadata about skipped items.
 *
 * @public
 */
export function buildResponsesApiRequest(
  options: BuildRequestOptions,
): BuildRequestResult {
  const { model, messages, stream } = options;

  const skipped = messages.filter(m => m.type !== 'text');
  const input: ResponsesApiInputItem[] = messages
    .filter((m): m is Extract<InputItem, { type: 'text' }> => m.type === 'text')
    .map(m => ({
      role: 'user' as const,
      content: m.text,
    }));

  return {
    body: { model, input, stream },
    skippedCount: skipped.length,
    skippedTypes: [...new Set(skipped.map(m => m.type))],
  };
}
