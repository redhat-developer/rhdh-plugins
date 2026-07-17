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

import { JsonObject } from '@backstage/types';

import { ERRORS_KEY, ErrorSchema } from '@rjsf/utils';

import {
  clearExtraErrorAtPath,
  rjsfIdToFieldPath,
} from './clearExtraErrorAtPath';

describe('clearExtraErrorAtPath', () => {
  const extraErrors = {
    'managed-app-ci': {
      xParams: {
        fossaTeamName: { [ERRORS_KEY]: ['required'] },
        sonarProjectKey: { [ERRORS_KEY]: ['required'] },
      },
    },
  } as ErrorSchema<JsonObject>;

  it('preserves all errors when fieldPath is undefined', () => {
    expect(clearExtraErrorAtPath(extraErrors, undefined)).toBe(extraErrors);
  });

  it('clears only the targeted field', () => {
    expect(
      clearExtraErrorAtPath(
        extraErrors,
        'managed-app-ci.xParams.fossaTeamName',
      ),
    ).toEqual({
      'managed-app-ci': {
        xParams: {
          sonarProjectKey: { [ERRORS_KEY]: ['required'] },
        },
      },
    });
  });

  it('maps rjsf ids with hyphens to dotted paths', () => {
    expect(rjsfIdToFieldPath('root_managed-app-ci_xParams_fossaTeamName')).toBe(
      'managed-app-ci.xParams.fossaTeamName',
    );
  });
});
