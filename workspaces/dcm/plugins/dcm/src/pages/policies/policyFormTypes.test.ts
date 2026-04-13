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

import {
  emptyPolicyForm,
  formToPolicy,
  isPolicyFormValid,
  policyToForm,
  validatePolicyForm,
} from './policyFormTypes';

describe('validatePolicyForm', () => {
  const valid = () => ({
    ...emptyPolicyForm(),
    display_name: 'My Policy',
    rego_code: 'package dcm\nselected_provider := "p1"',
  });

  it('returns no errors for a valid form', () => {
    expect(validatePolicyForm(valid())).toEqual({});
  });

  it('requires display_name', () => {
    const errors = validatePolicyForm({ ...valid(), display_name: '' });
    expect(errors.display_name).toBeDefined();
  });

  it('requires rego_code', () => {
    const errors = validatePolicyForm({ ...valid(), rego_code: '' });
    expect(errors.rego_code).toBeDefined();
  });

  it('validates priority range', () => {
    const tooLow = validatePolicyForm({ ...valid(), priority: '0' });
    expect(tooLow.priority).toBeDefined();

    const tooHigh = validatePolicyForm({ ...valid(), priority: '1001' });
    expect(tooHigh.priority).toBeDefined();

    const ok = validatePolicyForm({ ...valid(), priority: '500' });
    expect(ok.priority).toBeUndefined();
  });

  it('accepts only GLOBAL or USER as policy_type', () => {
    const errors = validatePolicyForm({
      ...valid(),
      policy_type: 'CUSTOM' as any,
    });
    expect(errors.policy_type).toBeDefined();
  });
});

describe('isPolicyFormValid', () => {
  it('returns true for a valid form', () => {
    expect(
      isPolicyFormValid({
        display_name: 'My Policy',
        description: '',
        policy_type: 'GLOBAL',
        priority: '500',
        rego_code: 'package dcm',
        enabled: true,
      }),
    ).toBe(true);
  });
});

describe('policyToForm / formToPolicy round-trip', () => {
  it('preserves all scalar fields', () => {
    const form = {
      display_name: 'Test',
      description: 'A description',
      policy_type: 'USER' as const,
      priority: '100',
      rego_code: 'package dcm',
      enabled: false,
    };
    const policy = formToPolicy(form);
    const back = policyToForm(policy);
    expect(back.display_name).toBe(form.display_name);
    expect(back.policy_type).toBe(form.policy_type);
    expect(back.priority).toBe(form.priority);
    expect(back.enabled).toBe(form.enabled);
  });
});
