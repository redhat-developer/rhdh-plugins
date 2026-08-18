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

import { JSONSchema7 } from 'json-schema';

import { getActiveStepKey, getSortedStepEntries } from './getSortedStepEntries';

describe('getSortedStepEntries', () => {
  it('filters a step with conditional ui:hidden at the step level', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            trigger: { type: 'string' },
          },
        },
        step2: {
          type: 'object',
          'ui:hidden': { when: 'step1.trigger', is: 'hide' },
          properties: {
            detail: { type: 'string' },
          },
        } as JSONSchema7,
      },
    };

    const formData: JsonObject = {
      step1: { trigger: 'hide' },
      step2: { detail: '' },
    };

    expect(getSortedStepEntries(schema, formData)?.map(([key]) => key)).toEqual(
      ['step1'],
    );
  });

  it('filters a step when all properties are conditionally hidden (local scope)', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        inputs: {
          type: 'object',
          properties: {
            mode: { type: 'string', 'ui:hidden': true },
            detailsA: {
              type: 'string',
              'ui:hidden': { when: 'mode', isNot: 'show' },
            } as JSONSchema7,
            detailsB: {
              type: 'string',
              'ui:hidden': { when: 'mode', isNot: 'show' },
            } as JSONSchema7,
          },
        } as JSONSchema7,
        summary: {
          type: 'object',
          properties: {
            info: { type: 'string' },
          },
        },
      },
    };

    const formData: JsonObject = {
      inputs: {
        mode: 'hide',
        details: '',
      },
      summary: {
        info: 'visible',
      },
    };

    expect(getSortedStepEntries(schema, formData)?.map(([key]) => key)).toEqual(
      ['summary'],
    );
  });

  it('returns steps in ui:order order, appending keys not in ui:order at the end', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      'ui:order': ['step3', 'step1', 'step2'],
      properties: {
        step1: { type: 'object', properties: { a: { type: 'string' } } },
        step2: { type: 'object', properties: { b: { type: 'string' } } },
        step3: { type: 'object', properties: { c: { type: 'string' } } },
        step4: { type: 'object', properties: { d: { type: 'string' } } },
      },
    } as JSONSchema7;

    const keys = getSortedStepEntries(schema)?.map(([key]) => key);
    // step3, step1, step2 from ui:order, then step4 (not in ui:order)
    expect(keys).toEqual(['step3', 'step1', 'step2', 'step4']);
  });

  it('returns steps in natural object key order when ui:order is absent', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        alpha: { type: 'object', properties: { x: { type: 'string' } } },
        beta: { type: 'object', properties: { y: { type: 'string' } } },
        gamma: { type: 'object', properties: { z: { type: 'string' } } },
      },
    };

    const keys = getSortedStepEntries(schema)?.map(([key]) => key);
    expect(keys).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('excludes a step with static ui:hidden: true', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        visibleStep: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
        hiddenStep: {
          type: 'object',
          'ui:hidden': true,
          properties: { secret: { type: 'string' } },
        } as JSONSchema7,
        anotherVisible: {
          type: 'object',
          properties: { value: { type: 'string' } },
        },
      },
    };

    const keys = getSortedStepEntries(schema)?.map(([key]) => key);
    expect(keys).toEqual(['visibleStep', 'anotherVisible']);
  });

  it('resolves active step key using filtered step list', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: {
            trigger: { type: 'string' },
          },
        },
        step2: {
          type: 'object',
          'ui:hidden': { when: 'step1.trigger', is: 'hide' },
          properties: {
            detail: { type: 'string' },
          },
        } as JSONSchema7,
        step3: {
          type: 'object',
          properties: {
            final: { type: 'string' },
          },
        },
      },
    };

    const formData: JsonObject = {
      step1: { trigger: 'hide' },
      step2: { detail: '' },
      step3: { final: '' },
    };

    expect(getActiveStepKey(schema, 0, formData)).toBe('step1');
    expect(getActiveStepKey(schema, 1, formData)).toBe('step3');
  });

  it('getActiveStepKey throws when activeStep index is out of range', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step1: { type: 'object', properties: { a: { type: 'string' } } },
      },
    };

    expect(() => getActiveStepKey(schema, 5)).toThrow(
      'Active step key not found for activeStep: 5',
    );
  });
});
