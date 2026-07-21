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

import { deepSearchObject } from './deepSearchObject';

describe('deepSearchObject', () => {
  it('returns the root object when the predicate matches', () => {
    const obj = { 'ui:widget': 'AuthRequester' };

    expect(
      deepSearchObject(
        obj,
        candidate => candidate['ui:widget'] === 'AuthRequester',
      ),
    ).toBe(obj);
  });

  it('returns the first nested match', () => {
    const nested = { 'ui:widget': 'AuthRequester', name: 'token' };
    const obj = {
      properties: {
        a: { type: 'string' },
        b: nested,
      },
    };

    expect(
      deepSearchObject(
        obj,
        candidate => candidate['ui:widget'] === 'AuthRequester',
      ),
    ).toBe(nested);
  });

  it('returns undefined when no match is found', () => {
    expect(
      deepSearchObject(
        { properties: { a: { type: 'string' }, b: 1 } },
        candidate => candidate['ui:widget'] === 'AuthRequester',
      ),
    ).toBeUndefined();
  });
});
