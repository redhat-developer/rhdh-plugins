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

import { ERRORS_KEY } from '@rjsf/utils';

import { safeSet } from './safeSet';
import { JsonObject } from '@backstage/types';

describe('safeSet', () => {
  it('splits only on the first dot so deep paths (e.g. step.x.y) are not truncated', () => {
    // `String.prototype.split(".", 2)` truncates remainder (e.g. "a.b.c" -> ["a","b"]);
    // paths with three or more segments must recurse on `a` + `b.c`, not `a` + `b` only.
    const errors: JsonObject = {};
    safeSet(errors, 'a.b.c.d', { [ERRORS_KEY]: ['deep'] });
    expect(errors).toEqual({
      a: {
        b: {
          c: {
            d: {
              [ERRORS_KEY]: ['deep'],
            },
          },
        },
      },
    });
  });

  it('sets a single-segment path', () => {
    const errors: JsonObject = {};
    safeSet(errors, 'onlyKey', { [ERRORS_KEY]: ['msg'] });
    expect(errors).toEqual({ onlyKey: { [ERRORS_KEY]: ['msg'] } });
  });

  it('merges sibling leaf paths under a shared prefix when applied sequentially', () => {
    const errors: JsonObject = {};
    safeSet(errors, 'my-solution.xParams.fieldA', {
      [ERRORS_KEY]: ['a'],
    });
    safeSet(errors, 'my-solution.xParams.fieldB', {
      [ERRORS_KEY]: ['b'],
    });
    safeSet(errors, 'my-solution.xParams.fieldC', {
      [ERRORS_KEY]: ['c'],
    });
    expect(errors).toEqual({
      'my-solution': {
        xParams: {
          fieldA: { [ERRORS_KEY]: ['a'] },
          fieldB: { [ERRORS_KEY]: ['b'] },
          fieldC: { [ERRORS_KEY]: ['c'] },
        },
      },
    });
  });
});
