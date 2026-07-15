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

import {
  isFieldErrorSchema,
  normalizeErrorSchema,
  resolveStepErrorSchema,
} from './resolveStepErrorSchema';

describe('resolveStepErrorSchema', () => {
  it('returns the nested slice when the root error schema is keyed by step', () => {
    const stepErrors = { fieldA: { [ERRORS_KEY]: ['required'] } };
    const tree = { stepOne: stepErrors };

    expect(resolveStepErrorSchema(tree, 'stepOne', 'stepOne')).toStrictEqual(
      stepErrors,
    );
  });

  it('returns the root error schema when it is already scoped to the active step', () => {
    const slice = { fieldA: { [ERRORS_KEY]: ['required'] } };

    expect(resolveStepErrorSchema(slice, 'stepOne', 'stepOne')).toStrictEqual(
      slice,
    );
  });

  it('returns undefined for non-active steps without a nested slice', () => {
    const slice = { fieldA: { [ERRORS_KEY]: ['required'] } };

    expect(resolveStepErrorSchema(slice, 'stepTwo', 'stepOne')).toBeUndefined();
  });
});

describe('normalizeErrorSchema', () => {
  it('coerces string __errors values to arrays', () => {
    expect(normalizeErrorSchema({ [ERRORS_KEY]: 'invalid' } as any)).toEqual({
      [ERRORS_KEY]: ['invalid'],
    });
  });

  it('normalizes nested error trees', () => {
    expect(
      normalizeErrorSchema({
        stepOne: { fieldA: { [ERRORS_KEY]: 'required' } },
      } as any),
    ).toEqual({
      stepOne: { fieldA: { [ERRORS_KEY]: ['required'] } },
    });
  });
});

describe('isFieldErrorSchema', () => {
  it('detects field-level error objects', () => {
    expect(isFieldErrorSchema({ [ERRORS_KEY]: ['msg'] })).toBe(true);
  });

  it('rejects non-array __errors values', () => {
    expect(isFieldErrorSchema({ [ERRORS_KEY]: 'msg' })).toBe(false);
  });
});
