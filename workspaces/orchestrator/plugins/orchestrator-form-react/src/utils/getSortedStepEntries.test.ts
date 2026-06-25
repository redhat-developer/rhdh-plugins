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
});
