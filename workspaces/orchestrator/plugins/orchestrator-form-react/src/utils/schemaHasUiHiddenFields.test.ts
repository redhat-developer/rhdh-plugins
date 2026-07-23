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

import { schemaHasUiHiddenFields } from './schemaHasUiHiddenFields';

describe('schemaHasUiHiddenFields', () => {
  it('returns false when schema has no ui:hidden markers', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };

    expect(schemaHasUiHiddenFields(schema)).toBe(false);
  });

  it('returns true when a property has ui:hidden', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        secret: {
          type: 'string',
          'ui:hidden': true,
        } as JSONSchema7 & Record<string, unknown>,
      },
    };

    expect(schemaHasUiHiddenFields(schema)).toBe(true);
  });

  it('returns true for nested object properties with ui:hidden', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step: {
          type: 'object',
          properties: {
            hiddenField: {
              type: 'string',
              'ui:hidden': { path: '/show', value: true },
            } as JSONSchema7 & Record<string, unknown>,
          },
        },
      },
    };

    expect(schemaHasUiHiddenFields(schema)).toBe(true);
  });

  it('returns true when array items schema has ui:hidden', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              note: {
                type: 'string',
                'ui:hidden': true,
              } as JSONSchema7 & Record<string, unknown>,
            },
          },
        },
      },
    };

    expect(schemaHasUiHiddenFields(schema)).toBe(true);
  });

  it('returns true when a tuple items entry has ui:hidden', () => {
    const schema: JSONSchema7 = {
      type: 'array',
      items: [
        { type: 'string' },
        {
          type: 'string',
          'ui:hidden': true,
        } as JSONSchema7 & Record<string, unknown>,
      ],
    };

    expect(schemaHasUiHiddenFields(schema)).toBe(true);
  });

  it('returns false for boolean schema values', () => {
    expect(schemaHasUiHiddenFields(true as unknown as JSONSchema7)).toBe(false);
  });
});
