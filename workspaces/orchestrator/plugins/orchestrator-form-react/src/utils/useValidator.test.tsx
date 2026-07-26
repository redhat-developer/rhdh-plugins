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

import { ReactNode } from 'react';

import { renderHook } from '@testing-library/react';
import type { JSONSchema7 } from 'json-schema';

import { StepperContextProvider } from './StepperContext';
import useValidator from './useValidator';

const multiStepSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    step1: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
    step2: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
      },
    },
  },
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <StepperContextProvider reviewStep={<div>review</div>} t={key => key}>
    {children}
  </StepperContextProvider>
);

describe('useValidator', () => {
  it('returns all errors for single-step schemas', () => {
    const { result } = renderHook(() => useValidator(false), { wrapper });
    const schema: JSONSchema7 = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    };

    const validation = result.current.validateFormData({}, schema);

    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some(err => err.property?.includes('name'))).toBe(
      true,
    );
  });

  it('filters multi-step errors to the active step', () => {
    const { result } = renderHook(() => useValidator(true), { wrapper });

    const validation = result.current.validateFormData({}, multiStepSchema);

    expect(
      validation.errors.every(err => err.property?.startsWith('.step1.')),
    ).toBe(true);
    expect(validation.errors.some(err => err.property?.includes('step2'))).toBe(
      false,
    );
  });

  it('exposes activeStep for forced re-renders', () => {
    const { result } = renderHook(() => useValidator(true), { wrapper });
    expect(result.current.activeStep).toBe(0);
  });

  it('delegates isValid to the underlying AJV validator', () => {
    const { result } = renderHook(() => useValidator(false), { wrapper });
    const schema: JSONSchema7 = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    };

    expect(result.current.isValid(schema, {}, schema)).toBe(false);
    expect(result.current.isValid(schema, { name: 'ok' }, schema)).toBe(true);
  });
});
