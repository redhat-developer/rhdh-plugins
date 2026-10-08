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

import { mergeExtraErrors } from './mergeExtraErrors';

describe('mergeExtraErrors', () => {
  it('merges errors into empty state', () => {
    const fieldErrors = {
      userId: { [ERRORS_KEY]: ['User ID is invalid'] },
    };
    const result = mergeExtraErrors(undefined, fieldErrors, 'userId');
    expect(result).toEqual({
      userId: { [ERRORS_KEY]: ['User ID is invalid'] },
    });
  });

  it('replaces existing errors at the field path', () => {
    const existing = {
      userId: { [ERRORS_KEY]: ['Old error'] },
    };
    const fieldErrors = {
      userId: { [ERRORS_KEY]: ['New error'] },
    };
    const result = mergeExtraErrors(existing, fieldErrors, 'userId');
    expect(result).toEqual({
      userId: { [ERRORS_KEY]: ['New error'] },
    });
  });

  it('preserves errors from other fields', () => {
    const existing = {
      userId: { [ERRORS_KEY]: ['User error'] },
      email: { [ERRORS_KEY]: ['Email error'] },
    };
    const fieldErrors = {
      userId: { [ERRORS_KEY]: ['Updated user error'] },
    };
    const result = mergeExtraErrors(existing, fieldErrors, 'userId');
    expect(result).toEqual({
      userId: { [ERRORS_KEY]: ['Updated user error'] },
      email: { [ERRORS_KEY]: ['Email error'] },
    });
  });

  it('clears errors when validation passes', () => {
    const existing = {
      userId: { [ERRORS_KEY]: ['Old error'] },
    };
    const result = mergeExtraErrors(existing, {}, 'userId');
    expect(result).toBeUndefined();
  });

  it('returns undefined when result is empty', () => {
    const result = mergeExtraErrors(undefined, {}, 'userId');
    expect(result).toBeUndefined();
  });

  it('does not mutate the existing error schema', () => {
    const existing = {
      userId: { [ERRORS_KEY]: ['Old error'] },
    };
    const copy = JSON.parse(JSON.stringify(existing));
    mergeExtraErrors(existing, {}, 'userId');
    expect(existing).toEqual(copy);
  });
});
