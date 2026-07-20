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

import { JsonValue } from '@backstage/types';

import { isJsonObject } from './isJsonObject';

describe('isJsonObject', () => {
  it('returns true for plain objects', () => {
    expect(isJsonObject({ key: 'value' })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(isJsonObject(['a', 'b'] as unknown as JsonValue)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isJsonObject(null)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isJsonObject('value')).toBe(false);
    expect(isJsonObject(10)).toBe(false);
    expect(isJsonObject(true)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isJsonObject(undefined)).toBe(false);
  });
});
