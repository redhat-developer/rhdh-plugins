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
import { buildResponsesApiRequest } from './requestBuilder';

describe('buildResponsesApiRequest', () => {
  it('converts text input items to Responses API input', () => {
    const messages: InputItem[] = [
      { type: 'text', text: 'Hello world' },
      { type: 'text', text: 'How are you?' },
    ];

    const result = buildResponsesApiRequest({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages,
      stream: false,
    });

    expect(result.body).toEqual({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      input: [
        { role: 'user', content: 'Hello world' },
        { role: 'user', content: 'How are you?' },
      ],
      stream: false,
    });
    expect(result.skippedCount).toBe(0);
    expect(result.skippedTypes).toEqual([]);
  });

  it('skips non-text input items and reports them', () => {
    const messages: InputItem[] = [
      { type: 'text', text: 'Hello' },
      { type: 'file', url: 'https://example.com/doc.pdf' },
      { type: 'image', url: 'https://example.com/img.png' },
    ];

    const result = buildResponsesApiRequest({
      model: 'test-model',
      messages,
      stream: true,
    });

    expect(result.body.input).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(result.body.stream).toBe(true);
    expect(result.skippedCount).toBe(2);
    expect(result.skippedTypes).toEqual(
      expect.arrayContaining(['file', 'image']),
    );
  });

  it('produces empty input for all non-text messages', () => {
    const messages: InputItem[] = [
      { type: 'file', url: 'https://example.com/doc.pdf' },
    ];

    const result = buildResponsesApiRequest({
      model: 'test-model',
      messages,
      stream: false,
    });

    expect(result.body.input).toEqual([]);
    expect(result.skippedCount).toBe(1);
  });

  it('handles empty messages array', () => {
    const result = buildResponsesApiRequest({
      model: 'test-model',
      messages: [],
      stream: false,
    });

    expect(result.body.input).toEqual([]);
    expect(result.skippedCount).toBe(0);
    expect(result.skippedTypes).toEqual([]);
  });
});
