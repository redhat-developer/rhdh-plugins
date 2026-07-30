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

import {
  getInstanceVariables,
  hasInstanceVariables,
} from './instanceVariables';

describe('getInstanceVariables', () => {
  it('returns an empty object when workflowdata is undefined', () => {
    expect(getInstanceVariables(undefined)).toEqual({});
  });

  it('strips the result field when present', () => {
    expect(
      getInstanceVariables({
        foo: 'bar',
        result: { status: 'completed' },
      } as never),
    ).toEqual({ foo: 'bar' });
  });

  it('returns a shallow copy when result is absent', () => {
    const workflowdata = { foo: 'bar', nest: { a: 1 } } as never;
    const result = getInstanceVariables(workflowdata);

    expect(result).toEqual(workflowdata);
    expect(result).not.toBe(workflowdata);
  });
});

describe('hasInstanceVariables', () => {
  it('returns false for undefined or result-only payloads', () => {
    expect(hasInstanceVariables(undefined)).toBe(false);
    expect(hasInstanceVariables({ result: { ok: true } } as never)).toBe(false);
  });

  it('returns true when non-result variables remain', () => {
    expect(hasInstanceVariables({ foo: 'bar' } as never)).toBe(true);
    expect(
      hasInstanceVariables({ foo: 'bar', result: { ok: true } } as never),
    ).toBe(true);
  });
});
