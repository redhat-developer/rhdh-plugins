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
  it('applies schema defaults when no fetch default', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'app' },
      },
    };

    expect(extractStaticDefaults(schema)).toEqual({ name: 'app' });
  });

  it('prefers fetch:response:default over schema default', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          default: 'schema',
          'ui:props': { 'fetch:response:default': 'fetch' },
        } as JSONSchema7 & Record<string, unknown>,
      },
    };

    expect(extractStaticDefaults(schema)).toEqual({ name: 'fetch' });
  });

  it('does not overwrite existing form data values', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'schema' },
      },
    };

    expect(extractStaticDefaults(schema, { name: 'existing' })).toEqual({
      name: 'existing',
    });
  });

  it('preserves falsy defaults', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: false },
        retries: { type: 'number', default: 0 },
        note: { type: 'string', default: '' },
      },
    };

    expect(extractStaticDefaults(schema)).toEqual({
      enabled: false,
      retries: 0,
      note: '',
    });
  });

  it('applies defaults from composed schemas', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      allOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'composed' },
          },
        },
      ],
    };

    expect(extractStaticDefaults(schema)).toEqual({ name: 'composed' });
  });

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
