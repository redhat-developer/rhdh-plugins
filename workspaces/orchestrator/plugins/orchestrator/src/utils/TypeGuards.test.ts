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

import { hasOwnProp, isNonNullable } from './TypeGuards';

describe('isNonNullable', () => {
  it('returns false for null and undefined', () => {
    expect(isNonNullable(null)).toBe(false);
    expect(isNonNullable(undefined)).toBe(false);
  });

  it('returns true for other values including empty string and zero', () => {
    expect(isNonNullable('')).toBe(true);
    expect(isNonNullable(0)).toBe(true);
    expect(isNonNullable(false)).toBe(true);
    expect(isNonNullable({})).toBe(true);
  });
});

describe('hasOwnProp', () => {
  it('returns true for own properties', () => {
    expect(hasOwnProp({ foo: 1 }, 'foo')).toBe(true);
  });

  it('returns false for missing or inherited properties', () => {
    expect(hasOwnProp({ foo: 1 }, 'bar')).toBe(false);
    expect(hasOwnProp({}, 'toString')).toBe(false);
  });
});
