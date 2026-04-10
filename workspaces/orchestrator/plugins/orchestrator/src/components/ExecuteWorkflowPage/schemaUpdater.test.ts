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

import { getSchemaUpdater } from './schemaUpdater';

describe('getSchemaUpdater', () => {
  it('updates only within the scoped step when id is provided', () => {
    const schema = {
      type: 'object',
      properties: {
        'app-registration': {
          type: 'object',
          properties: {
            schemaUpdater: { type: 'string' },
            placeholderTwo: { type: 'string', title: 'App placeholder' },
          },
        },
        'caas-namespace': {
          type: 'object',
          properties: {
            schemaUpdater: { type: 'string' },
            placeholderTwo: { type: 'string', title: 'CaaS placeholder' },
          },
        },
      },
    } as JSONSchema7;

    const setSchema = jest.fn();
    const updateSchema = getSchemaUpdater(schema, setSchema);

    updateSchema(
      {
        placeholderTwo: {
          type: 'string',
          title: 'CaaS placeholder (updated)',
        },
      },
      'root_caas-namespace_schemaUpdater',
    );

    expect(setSchema).toHaveBeenCalledTimes(1);
    const updatedSchema = setSchema.mock.calls[0][0] as JSONSchema7;
    expect(
      (updatedSchema.properties?.['app-registration'] as JSONSchema7).properties
        ?.placeholderTwo,
    ).toEqual({ type: 'string', title: 'App placeholder' });
    expect(
      (updatedSchema.properties?.['caas-namespace'] as JSONSchema7).properties
        ?.placeholderTwo,
    ).toEqual({ type: 'string', title: 'CaaS placeholder (updated)' });
  });

  it('scopes updates to nested objects when SchemaUpdater is nested', () => {
    const schema = {
      type: 'object',
      properties: {
        step: {
          type: 'object',
          properties: {
            placeholderTwo: { type: 'string', title: 'Step placeholder' },
            nested: {
              type: 'object',
              properties: {
                schemaUpdater: { type: 'string' },
                placeholderTwo: { type: 'string', title: 'Nested placeholder' },
              },
            },
          },
        },
      },
    } as JSONSchema7;

    const setSchema = jest.fn();
    const updateSchema = getSchemaUpdater(schema, setSchema);

    updateSchema(
      {
        placeholderTwo: {
          type: 'string',
          title: 'Nested placeholder (updated)',
        },
      },
      'root_step_nested_schemaUpdater',
    );

    expect(setSchema).toHaveBeenCalledTimes(1);
    const updatedSchema = setSchema.mock.calls[0][0] as JSONSchema7;
    const stepProps = (updatedSchema.properties?.step as JSONSchema7)
      .properties;
    expect(stepProps?.placeholderTwo).toEqual({
      type: 'string',
      title: 'Step placeholder',
    });
    expect(
      (stepProps?.nested as JSONSchema7).properties?.placeholderTwo,
    ).toEqual({ type: 'string', title: 'Nested placeholder (updated)' });
  });

  it('supports dot-notation ids for scoping', () => {
    const schema = {
      type: 'object',
      properties: {
        step: {
          type: 'object',
          properties: {
            placeholderTwo: { type: 'string', title: 'Step placeholder' },
            nested: {
              type: 'object',
              properties: {
                schemaUpdater: { type: 'string' },
                placeholderTwo: { type: 'string', title: 'Nested placeholder' },
              },
            },
          },
        },
      },
    } as JSONSchema7;

    const setSchema = jest.fn();
    const updateSchema = getSchemaUpdater(schema, setSchema);

    updateSchema(
      {
        placeholderTwo: {
          type: 'string',
          title: 'Nested placeholder (dot updated)',
        },
      },
      'root.step.nested.schemaUpdater',
    );

    expect(setSchema).toHaveBeenCalledTimes(1);
    const updatedSchema = setSchema.mock.calls[0][0] as JSONSchema7;
    const stepProps = (updatedSchema.properties?.step as JSONSchema7)
      .properties;
    expect(stepProps?.placeholderTwo).toEqual({
      type: 'string',
      title: 'Step placeholder',
    });
    expect(
      (stepProps?.nested as JSONSchema7).properties?.placeholderTwo,
    ).toEqual({ type: 'string', title: 'Nested placeholder (dot updated)' });
  });

  it('resolves scope through array items', () => {
    const schema = {
      type: 'object',
      properties: {
        step: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  schemaUpdater: { type: 'string' },
                  placeholderTwo: {
                    type: 'string',
                    title: 'Array placeholder',
                  },
                },
              },
            },
          },
        },
      },
    } as JSONSchema7;

    const setSchema = jest.fn();
    const updateSchema = getSchemaUpdater(schema, setSchema);

    updateSchema(
      {
        placeholderTwo: {
          type: 'string',
          title: 'Array placeholder (updated)',
        },
      },
      'root_step_items_schemaUpdater',
    );

    expect(setSchema).toHaveBeenCalledTimes(1);
    const updatedSchema = setSchema.mock.calls[0][0] as JSONSchema7;
    const arrayProps = (
      (updatedSchema.properties?.step as JSONSchema7).properties
        ?.items as JSONSchema7
    ).items as JSONSchema7;
    expect(arrayProps.properties?.placeholderTwo).toEqual({
      type: 'string',
      title: 'Array placeholder (updated)',
    });
  });

  it('prefers longest matching keys when scoping', () => {
    const schema = {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          properties: {
            schemaUpdater: { type: 'string' },
            placeholderTwo: { type: 'string', title: 'App placeholder' },
          },
        },
        'app-registration': {
          type: 'object',
          properties: {
            schemaUpdater: { type: 'string' },
            placeholderTwo: {
              type: 'string',
              title: 'App-registration placeholder',
            },
          },
        },
      },
    } as JSONSchema7;

    const setSchema = jest.fn();
    const updateSchema = getSchemaUpdater(schema, setSchema);

    updateSchema(
      {
        placeholderTwo: {
          type: 'string',
          title: 'App-registration placeholder (updated)',
        },
      },
      'root_app-registration_schemaUpdater',
    );

    expect(setSchema).toHaveBeenCalledTimes(1);
    const updatedSchema = setSchema.mock.calls[0][0] as JSONSchema7;
    expect(
      (updatedSchema.properties?.app as JSONSchema7).properties?.placeholderTwo,
    ).toEqual({ type: 'string', title: 'App placeholder' });
    expect(
      (updatedSchema.properties?.['app-registration'] as JSONSchema7).properties
        ?.placeholderTwo,
    ).toEqual({
      type: 'string',
      title: 'App-registration placeholder (updated)',
    });
  });
});
