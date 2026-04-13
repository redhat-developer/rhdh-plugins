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
import { sanitizeErrorMessage } from './errorSanitizer';

describe('sanitizeErrorMessage', () => {
  it('extracts detail and status from Llama Stack API error', () => {
    const raw =
      'Llama Stack API error: 400 Bad Request - {"detail":"Invalid model"}';
    const result = sanitizeErrorMessage(raw);
    expect(result).toEqual({
      message: 'Invalid model',
      inferredStatus: 400,
    });
  });

  it('extracts detail and status from Responses API error', () => {
    const raw =
      'Responses API error: 500 Streaming request failed - {"detail":"Internal server error"}';
    const result = sanitizeErrorMessage(raw);
    expect(result).toEqual({
      message: 'Internal server error',
      inferredStatus: 500,
    });
  });

  it('extracts 422 status from Responses API validation error', () => {
    const raw =
      'Responses API error: 422 Unprocessable Entity - {"detail":"Unsupported tool type"}';
    const result = sanitizeErrorMessage(raw);
    expect(result).toEqual({
      message: 'Unsupported tool type',
      inferredStatus: 422,
    });
  });

  it('falls back to truncated body when detail is not a string', () => {
    const raw =
      'Responses API error: 400 Bad Request - {"detail":{"nested":"value"}}';
    const result = sanitizeErrorMessage(raw);
    expect(result.inferredStatus).toBe(400);
    expect(result.message).toContain('"detail"');
  });

  it('falls back to raw body when JSON parsing fails', () => {
    const raw =
      'Llama Stack API error: 500 Internal Server Error - not valid json';
    const result = sanitizeErrorMessage(raw);
    expect(result).toEqual({
      message: 'not valid json',
      inferredStatus: 500,
    });
  });

  it('truncates long error bodies', () => {
    const longBody = 'x'.repeat(500);
    const raw = `Responses API error: 500 Error - ${longBody}`;
    const result = sanitizeErrorMessage(raw);
    expect(result.inferredStatus).toBe(500);
    expect(result.message.length).toBeLessThan(400);
    expect(result.message).toMatch(/\.\.\.$/);
  });

  it('returns raw message for unrecognized error formats', () => {
    const raw = 'Something unexpected happened';
    const result = sanitizeErrorMessage(raw);
    expect(result).toEqual({ message: 'Something unexpected happened' });
  });
});
