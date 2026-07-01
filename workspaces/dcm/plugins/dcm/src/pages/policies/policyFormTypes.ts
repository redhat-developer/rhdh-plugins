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

import * as yup from 'yup';
import type {
  Policy,
  PolicyType,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';
import { type TFunction, makeTranslator } from '../../utils/formUtils';

export type PolicyForm = {
  display_name: string;
  description: string;
  policy_type: PolicyType;
  /** Stored as a string for text field binding; converted to number on submit. */
  priority: string;
  rego_code: string;
  enabled: boolean;
};

function buildPolicySchema(t?: TFunction) {
  const m = makeTranslator(t);
  return yup.object({
    display_name: yup
      .string()
      .trim()
      .required(
        m('validation.policy.displayNameRequired', 'Display name is required'),
      )
      .min(
        1,
        m('validation.policy.displayNameEmpty', 'Display name cannot be empty'),
      )
      .max(
        255,
        m(
          'validation.policy.displayNameMax',
          'Display name must be at most 255 characters',
        ),
      ),
    description: yup
      .string()
      .max(
        255,
        m(
          'validation.policy.descriptionMax',
          'Description must be at most 255 characters',
        ),
      ),
    policy_type: yup
      .string()
      .required(
        m('validation.policy.policyTypeRequired', 'Policy type is required'),
      )
      .oneOf(
        ['GLOBAL', 'USER'],
        m('validation.policy.policyTypeOneOf', 'Must be GLOBAL or USER'),
      ),
    priority: yup
      .number()
      .typeError(
        m('validation.policy.priorityType', 'Priority must be a number'),
      )
      .required(m('validation.policy.priorityRequired', 'Priority is required'))
      .integer(
        m(
          'validation.policy.priorityInteger',
          'Priority must be a whole number',
        ),
      )
      .min(1, m('validation.policy.priorityMin', 'Priority must be at least 1'))
      .max(
        1000,
        m('validation.policy.priorityMax', 'Priority must be at most 1000'),
      ),
    rego_code: yup
      .string()
      .trim()
      .required(
        m('validation.policy.regoCodeRequired', 'Rego code is required'),
      )
      .min(
        1,
        m('validation.policy.regoCodeEmpty', 'Rego code cannot be empty'),
      ),
  });
}

export function validatePolicyForm(
  form: PolicyForm,
  t?: TFunction,
): Partial<Record<keyof PolicyForm, string>> {
  const { validate } = createYupValidator<PolicyForm>(
    buildPolicySchema(t),
    f => ({
      ...f,
      priority: f.priority === '' ? undefined : Number(f.priority),
    }),
  );
  return validate(form);
}

const { isValid: isPolicyScalarValid } = createYupValidator<PolicyForm>(
  buildPolicySchema(),
  f => ({ ...f, priority: f.priority === '' ? undefined : Number(f.priority) }),
);

/**
 * Validates structural Rego requirements independently of Yup.
 * Returns an error string when the code is non-empty but violates a rule,
 * or undefined when the code is valid (or empty — empty is caught by Yup).
 */
const REGO_PACKAGE_RE = /^package\s+\S+/;

export function validateRegoCode(
  value: string,
  t?: TFunction,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const hasPackage = trimmed
    .split('\n')
    .some(line => REGO_PACKAGE_RE.test(line.trimStart()));
  if (!hasPackage) {
    return t
      ? t('validation.policy.regoCodePackage')
      : 'Must contain a package declaration \u2014 e.g. "package dcm.placement"';
  }
  return undefined;
}

export function isPolicyFormValid(f: PolicyForm): boolean {
  return isPolicyScalarValid(f) && validateRegoCode(f.rego_code) === undefined;
}

export function emptyPolicyForm(): PolicyForm {
  return {
    display_name: '',
    description: '',
    policy_type: 'GLOBAL',
    priority: '500',
    rego_code: '',
    enabled: true,
  };
}

export function policyToForm(p: Policy): PolicyForm {
  return {
    display_name: p.display_name ?? '',
    description: p.description ?? '',
    policy_type: p.policy_type ?? 'GLOBAL',
    priority: String(p.priority ?? 500),
    rego_code: p.rego_code ?? '',
    enabled: p.enabled ?? true,
  };
}

export function formToPolicy(f: PolicyForm): Policy {
  return {
    display_name: f.display_name.trim() || undefined,
    description: f.description.trim() || undefined,
    policy_type: f.policy_type,
    priority: Number(f.priority) || 500,
    rego_code: f.rego_code.trim() || undefined,
    enabled: f.enabled,
  };
}
