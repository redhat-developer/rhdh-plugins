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

import { requireBooleanProperty } from './util';

describe('requireBooleanProperty', () => {
  it('returns the property when it is a boolean', () => {
    expect(requireBooleanProperty({ flag: true }, 'flag', 'input')).toBe(true);
    expect(requireBooleanProperty({ flag: false }, 'flag', 'input')).toBe(
      false,
    );
  });

  it('throws when the property is missing', () => {
    expect(() =>
      requireBooleanProperty({ name: 'x' }, 'flag', 'input'),
    ).toThrow('Missing required boolean property "flag" at "input"');
  });

  it('throws when the property is present but not a boolean', () => {
    expect(() =>
      requireBooleanProperty({ isSecret: 'true' }, 'isSecret', 'input'),
    ).toThrow(TypeError);
    expect(() =>
      requireBooleanProperty({ isSecret: 'true' }, 'isSecret', 'input'),
    ).toThrow('isSecret must be a boolean at "input" (received string)');
    expect(() =>
      requireBooleanProperty({ isSecret: 1 }, 'isSecret', ''),
    ).toThrow('isSecret must be a boolean at "<root>" (received number)');
  });
});
