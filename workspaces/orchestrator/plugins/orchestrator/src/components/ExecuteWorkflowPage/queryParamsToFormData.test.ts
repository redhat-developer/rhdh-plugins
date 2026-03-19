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

import { mergeQueryParamsIntoFormData } from './queryParamsToFormData';

describe('mergeQueryParamsIntoFormData', () => {
  it('returns base data when schema has no properties', () => {
    const schema = { type: 'object' } as JSONSchema7;
    const searchParams = new URLSearchParams('language=English');
    const baseData = { existing: 'value' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ existing: 'value' });
  });

  it('merges query params matching flat schema properties', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=English&name=John');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English', name: 'John' });
  });

  it('overrides base data with query param values', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=Spanish');
    const baseData = { language: 'English', name: 'bob' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'Spanish', name: 'bob' });
  });

  it('excludes reserved query params (targetEntity, instanceId)', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams(
      'targetEntity=default:component:my-app&instanceId=123&language=English',
    );
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English' });
    expect(result).not.toHaveProperty('targetEntity');
    expect(result).not.toHaveProperty('instanceId');
  });

  it('merges nested paths from query params', () => {
    const schema = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams(
      'step1.language=Spanish&step1.name=carol',
    );
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      step1: { language: 'Spanish', name: 'carol' },
    });
  });

  it('ignores query params that do not match schema paths', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams(
      'language=English&unknownParam=ignored&other=alsoIgnored',
    );
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English' });
  });

  it('merges dot-notation param key (firstStep.fooTheFirst=test)', () => {
    const schema = {
      type: 'object',
      properties: {
        firstStep: {
          type: 'object',
          properties: {
            fooTheFirst: { type: 'string' },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('firstStep.fooTheFirst=test');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      firstStep: { fooTheFirst: 'test' },
    });
  });

  it('returns base data unchanged when searchParams is empty', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('');
    const baseData = { language: 'English', name: 'bob' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English', name: 'bob' });
  });

  it('preserves base data when no query params match schema paths', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('foo=bar&baz=qux');
    const baseData = { language: 'English' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English' });
  });

  it('merges query params into existing nested base data', () => {
    const schema = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('step1.language=Spanish');
    const baseData = { step1: { language: 'English', name: 'alice' } };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      step1: { language: 'Spanish', name: 'alice' },
    });
  });

  it('handles multiple nested levels (step1.step2.field)', () => {
    const schema = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            step2: {
              type: 'object',
              properties: {
                deepField: { type: 'string' },
              },
            },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('step1.step2.deepField=deepValue');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      step1: { step2: { deepField: 'deepValue' } },
    });
  });

  it('handles multiple steps with different nested params', () => {
    const schema = {
      type: 'object',
      properties: {
        chooseEntity: {
          type: 'object',
          properties: {
            target_entity: { type: 'string' },
          },
        },
        provideInputs: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams(
      'chooseEntity.target_entity=default:component:my-app&provideInputs.language=English&provideInputs.name=alice',
    );
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      chooseEntity: { target_entity: 'default:component:my-app' },
      provideInputs: { language: 'English', name: 'alice' },
    });
  });

  it('handles URL-encoded values in query params', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('name=John%20Doe');

    const result = mergeQueryParamsIntoFormData(schema, searchParams, {});

    expect(result).toEqual({ name: 'John Doe' });
  });

  it('works when baseFormData is omitted (uses default empty object)', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=English');

    const result = mergeQueryParamsIntoFormData(schema, searchParams);

    expect(result).toEqual({ language: 'English' });
  });

  it('coerces enum values (case-insensitive match)', () => {
    const schema = {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: ['English', 'Spanish'],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=english');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English' });
  });

  it('skips query param when value does not match enum', () => {
    const schema = {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: ['English', 'Spanish'],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=French');
    const baseData = { language: 'English' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English' });
  });

  it('uses exact enum value when param matches exactly', () => {
    const schema = {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          enum: ['English', 'Spanish'],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=Spanish');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'Spanish' });
  });

  it('coerces numeric enum values', () => {
    const schema = {
      type: 'object',
      properties: {
        priority: {
          type: 'integer',
          enum: [1, 2, 3],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('priority=2');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ priority: 2 });
  });

  it('skips numeric enum when value is not in enum', () => {
    const schema = {
      type: 'object',
      properties: {
        priority: {
          type: 'integer',
          enum: [1, 2, 3],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('priority=5');
    const baseData = { priority: 1 };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ priority: 1 });
  });

  it('coerces boolean enum values', () => {
    const schema = {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          enum: [true, false],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('enabled=true');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ enabled: true });
  });

  it('coerces boolean enum values (case-insensitive)', () => {
    const schema = {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          enum: [true, false],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('enabled=FALSE');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ enabled: false });
  });

  it('coerces plain number field without enum', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('count=42.5');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ count: 42.5 });
  });

  it('coerces plain integer field without enum', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('count=42');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ count: 42 });
  });

  it('skips integer field when value is not an integer', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('count=42.5');
    const baseData = { count: 10 };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ count: 10 });
  });

  it('coerces plain boolean field without enum', () => {
    const schema = {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('active=true');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ active: true });
  });

  it('prepopulates fields defined via $ref in $defs', () => {
    const schema = {
      type: 'object',
      $defs: {
        LanguageField: {
          type: 'string',
          enum: ['English', 'Spanish'],
        },
      },
      properties: {
        language: { $ref: '#/$defs/LanguageField' },
        name: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=english&name=alice');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'English', name: 'alice' });
  });

  it('prepopulates nested fields when step uses $ref', () => {
    const schema = {
      type: 'object',
      $defs: {
        InputsStep: {
          type: 'object',
          properties: {
            language: { type: 'string', enum: ['English', 'Spanish'] },
            name: { type: 'string' },
          },
        },
      },
      properties: {
        step1: { $ref: '#/$defs/InputsStep' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams(
      'step1.language=Spanish&step1.name=bob',
    );
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({
      step1: { language: 'Spanish', name: 'bob' },
    });
  });

  it('prepopulates nested $ref with enum coercion', () => {
    const schema = {
      type: 'object',
      $defs: {
        LanguageEnum: {
          type: 'string',
          enum: ['English', 'Spanish', 'French'],
        },
      },
      properties: {
        step1: {
          type: 'object',
          properties: {
            language: { $ref: '#/$defs/LanguageEnum' },
          },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('step1.language=french');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ step1: { language: 'French' } });
  });

  it('prepopulates with #/definitions/ (legacy JSON Schema)', () => {
    const schema = {
      type: 'object',
      definitions: {
        NameField: { type: 'string' },
      },
      properties: {
        name: { $ref: '#/definitions/NameField' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('name=charlie');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ name: 'charlie' });
  });

  it('coerces array type from comma-separated query param', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('tags=foo,bar,baz');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ tags: ['foo', 'bar', 'baz'] });
  });

  it('coerces array type with single value', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('tags=only-one');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ tags: ['only-one'] });
  });

  it('prepopulates oneOf branch field (mode.alphaValue)', () => {
    const schema = {
      type: 'object',
      properties: {
        mode: {
          oneOf: [
            {
              type: 'object',
              properties: {
                alphaValue: { type: 'string' },
              },
              required: ['alphaValue'],
            },
            {
              type: 'object',
              properties: {
                betaValue: { type: 'string' },
              },
              required: ['betaValue'],
            },
          ],
        },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('mode.alphaValue=test');
    const baseData = {};

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ mode: { alphaValue: 'test' } });
  });

  it('does not mutate base data', () => {
    const schema = {
      type: 'object',
      properties: {
        language: { type: 'string' },
      },
    } as JSONSchema7;
    const searchParams = new URLSearchParams('language=Spanish');
    const baseData = { language: 'English' };

    const result = mergeQueryParamsIntoFormData(schema, searchParams, baseData);

    expect(result).toEqual({ language: 'Spanish' });
    expect(baseData).toEqual({ language: 'English' });
  });
});
