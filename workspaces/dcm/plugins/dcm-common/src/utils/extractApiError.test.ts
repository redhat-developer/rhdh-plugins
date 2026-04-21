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

import { extractApiError } from './extractApiError';

describe('extractApiError', () => {
  it('returns the message for a plain Error object', () => {
    expect(extractApiError(new Error('something went wrong'))).toBe(
      'something went wrong',
    );
  });

  it('converts a non-Error value to string', () => {
    expect(extractApiError('raw string error')).toBe('raw string error');
    expect(extractApiError(42)).toBe('42');
  });

  it('extracts the detail field from a flat JSON error message', () => {
    const msg = 'Error: {"detail":"provider not found","title":"Not Found"}';
    expect(extractApiError(new Error(msg))).toBe('provider not found');
  });

  it('extracts the title when there is no detail field', () => {
    const msg = 'Error: {"title":"Forbidden"}';
    expect(extractApiError(new Error(msg))).toBe('Forbidden');
  });

  it('recursively unwraps nested JSON detail chains', () => {
    const inner = JSON.stringify({ detail: 'inner error', title: 'Inner' });
    const outer = JSON.stringify({
      detail: `some context: ${inner}`,
      title: 'Outer',
    });
    const msg = `DCM API error: ${outer}`;
    expect(extractApiError(new Error(msg))).toBe('inner error');
  });

  it('returns the raw message when there is no JSON', () => {
    expect(extractApiError(new Error('network timeout'))).toBe(
      'network timeout',
    );
  });

  it('returns the prefix text when JSON cannot be parsed', () => {
    const msg = 'prefix message: {invalid json}';
    const result = extractApiError(new Error(msg));
    expect(result).toBe('prefix message');
  });

  it('handles an empty string gracefully', () => {
    expect(extractApiError('')).toBe('');
  });

  it('does not recurse when detail and the recursive result are the same', () => {
    const msg = '{"detail":"no nesting here"}';
    expect(extractApiError(new Error(msg))).toBe('no nesting here');
  });
});
