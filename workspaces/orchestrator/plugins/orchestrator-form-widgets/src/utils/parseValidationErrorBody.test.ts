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

import { parseValidationErrorBody } from './parseValidationErrorBody';

const mockResponse = (
  overrides: Partial<Response> & {
    text?: () => Promise<string>;
    json?: () => Promise<unknown>;
  },
): Response => overrides as Response;

describe('parseValidationErrorBody', () => {
  it('parses JSON from response.text()', async () => {
    const response = mockResponse({
      text: async () => JSON.stringify({ issues: ['field is required'] }),
    });

    await expect(parseValidationErrorBody(response)).resolves.toEqual({
      issues: ['field is required'],
    });
  });

  it('returns undefined when response.text() is empty', async () => {
    const response = mockResponse({
      text: async () => '',
    });

    await expect(parseValidationErrorBody(response)).resolves.toBeUndefined();
  });

  it('returns undefined when response.text() is not valid JSON', async () => {
    const response = mockResponse({
      text: async () => 'not-json',
    });

    await expect(parseValidationErrorBody(response)).resolves.toBeUndefined();
  });

  it('falls back to response.json() when text is unavailable', async () => {
    const response = mockResponse({
      json: async () => ({ issues: ['from json()'] }),
    });

    await expect(parseValidationErrorBody(response)).resolves.toEqual({
      issues: ['from json()'],
    });
  });

  it('returns undefined when response.json() throws', async () => {
    const response = mockResponse({
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      },
    });

    await expect(parseValidationErrorBody(response)).resolves.toBeUndefined();
  });

  it('returns undefined when neither text nor json is available', async () => {
    const response = mockResponse({});

    await expect(parseValidationErrorBody(response)).resolves.toBeUndefined();
  });
});
