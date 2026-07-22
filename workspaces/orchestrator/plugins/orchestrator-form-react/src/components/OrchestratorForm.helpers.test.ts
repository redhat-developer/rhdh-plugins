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

import { getNumSteps, removeHiddenSteps } from './OrchestratorForm.helpers';

describe('getNumSteps', () => {
  it('returns undefined for non-object schemas', () => {
    expect(getNumSteps({ type: 'string' })).toBeUndefined();
  });

  it('returns undefined when properties are missing', () => {
    expect(getNumSteps({ type: 'object' })).toBeUndefined();
  });

  it('returns undefined for single-step schemas with non-object fields', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    };
    expect(getNumSteps(schema)).toBeUndefined();
  });

  it('returns the step count for multi-step object schemas', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step1: { type: 'object', properties: {} },
        step2: { type: 'object', properties: {} },
      },
    };
    expect(getNumSteps(schema)).toBe(2);
  });
});

describe('removeHiddenSteps', () => {
  it('returns the schema unchanged when there are no hidden empty steps', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        step1: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      },
    };

    expect(removeHiddenSteps(schema)).toBe(schema);
  });

  it('removes empty object steps marked with ui:widget hidden', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        visible: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
        hidden: {
          type: 'object',
          properties: {},
          'ui:widget': 'hidden',
        } as JSONSchema7 & Record<string, unknown>,
      },
    };

    expect(removeHiddenSteps(schema)).toEqual({
      type: 'object',
      properties: {
        visible: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      },
    });
  });

  it('keeps hidden steps that still have properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        hiddenButNotEmpty: {
          type: 'object',
          properties: { keep: { type: 'string' } },
          'ui:widget': 'hidden',
        } as JSONSchema7 & Record<string, unknown>,
      },
    };

    expect(removeHiddenSteps(schema)).toBe(schema);
  });
});
