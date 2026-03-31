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

import type { JSONSchema7 } from 'json-schema';

import extractStaticDefaults from './extractStaticDefaults';

describe('extractStaticDefaults', () => {
  it('applies root default objects without creating empty key', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      default: { foo: 'bar' },
      properties: {
        foo: { type: 'string' },
      },
    };

    expect(extractStaticDefaults(schema)).toEqual({ foo: 'bar' });
  });

  it('does not override existing data with root defaults', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      default: { foo: 'bar' },
      properties: {
        foo: { type: 'string' },
      },
    };

    expect(extractStaticDefaults(schema, { foo: 'existing' })).toEqual({
      foo: 'existing',
    });
  });
});
