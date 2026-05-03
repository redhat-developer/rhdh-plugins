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

import type { WorkflowNode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ResponsesApiResponse } from './types';

export function extractTextFromResponse(response: ResponsesApiResponse): string {
  if (!response.output || response.output.length === 0) return '';

  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const content of item.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text;
        }
      }
    }
  }
  return '';
}

export function buildInputForNode(
  _node: WorkflowNode,
  userInput: string,
  state: Record<string, unknown>,
): string {
  const lastOutput = Object.keys(state)
    .filter(k => k.endsWith('_output'))
    .pop();

  if (lastOutput && state[lastOutput]) {
    const prev = typeof state[lastOutput] === 'string'
      ? state[lastOutput] as string
      : JSON.stringify(state[lastOutput]);
    return `Original request: ${userInput}\n\nPrevious step output: ${prev}`;
  }
  return userInput;
}
