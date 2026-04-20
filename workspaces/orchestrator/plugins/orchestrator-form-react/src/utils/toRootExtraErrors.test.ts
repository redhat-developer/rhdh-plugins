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

import { toRootExtraErrors } from './toRootExtraErrors';

describe('toRootExtraErrors', () => {
  it('returns undefined when extraErrors is undefined', () => {
    expect(toRootExtraErrors('my-step', undefined)).toBeUndefined();
  });

  it('returns extraErrors unchanged when activeKey is undefined', () => {
    const tree = { a: { [ERRORS_KEY]: ['x'] } };
    expect(toRootExtraErrors(undefined, tree)).toBe(tree);
  });

  it('wraps the active step slice so RJSF receives root-shaped errors', () => {
    const inner = {
      xParams: {
        fieldA: { [ERRORS_KEY]: ['invalid A'] },
        fieldB: { [ERRORS_KEY]: ['invalid B'] },
      },
    };
    const fromGetExtraErrors = {
      'my-solution': inner,
    };
    expect(toRootExtraErrors('my-solution', fromGetExtraErrors)).toEqual({
      'my-solution': inner,
    });
  });

  it('returns undefined when the active step has no errors in the tree', () => {
    expect(
      toRootExtraErrors('missing-step', {
        'other-step': { [ERRORS_KEY]: ['e'] },
      }),
    ).toBeUndefined();
  });
});
