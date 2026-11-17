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

import {
  getStepSchemaErrors,
  hasErrorSchemaErrors,
} from './validateStepFormData';

describe('validateStepFormData', () => {
  const schema: JSONSchema7 = {
    type: 'object',
    properties: {
      step1: {
        type: 'object',
        properties: {
          requiredField: { type: 'string' },
        },
        required: ['requiredField'],
      },
      step2: {
        type: 'object',
        properties: {
          otherField: { type: 'string' },
        },
        required: ['otherField'],
      },
    },
  };

  it('detects errors on a specific step index', () => {
    const errors = getStepSchemaErrors(schema, { step2: {} }, 1);
    expect(hasErrorSchemaErrors(errors)).toBe(true);
  });

  it('returns no errors when the step satisfies the schema', () => {
    const errors = getStepSchemaErrors(
      schema,
      { step1: { requiredField: 'ok' } },
      0,
    );
    expect(hasErrorSchemaErrors(errors)).toBe(false);
  });

  it('detects cross-step conditional required fields on an intermediate step', () => {
    const crossStepSchema: JSONSchema7 = {
      type: 'object',
      properties: {
        path_choice: {
          type: 'object',
          properties: { shippingPath: { type: 'boolean' } },
        },
        details: {
          type: 'object',
          properties: {
            shippingAddress: { type: 'string' },
            pickupLocation: { type: 'string' },
          },
        },
      },
      allOf: [
        {
          if: {
            properties: {
              path_choice: {
                properties: { shippingPath: { const: false } },
              },
            },
          },
          then: {
            properties: {
              details: { required: ['pickupLocation'] },
            },
          },
        },
      ],
    };

    const formData = {
      path_choice: { shippingPath: false },
      details: { shippingAddress: 'stale from shipping path' },
    };

    const errors = getStepSchemaErrors(crossStepSchema, formData, 1);
    expect(hasErrorSchemaErrors(errors)).toBe(true);
  });
});
