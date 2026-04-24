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

export type PolicyForm = {
  display_name: string;
  description: string;
  policy_type: PolicyType;
  /** Stored as a string for text field binding; converted to number on submit. */
  priority: string;
  rego_code: string;
  enabled: boolean;
};

const policySchema = yup.object({
  display_name: yup
    .string()
    .required('Display name is required')
    .min(1, 'Display name cannot be empty')
    .max(255, 'Display name must be at most 255 characters'),
  policy_type: yup
    .string()
    .required('Policy type is required')
    .oneOf(['GLOBAL', 'USER'], 'Must be GLOBAL or USER'),
  priority: yup
    .number()
    .typeError('Priority must be a number')
    .min(1, 'Priority must be at least 1')
    .max(1000, 'Priority must be at most 1000'),
  rego_code: yup
    .string()
    .required('Rego code is required')
    .min(1, 'Rego code cannot be empty'),
});

export const { validate: validatePolicyForm, isValid: isPolicyFormValid } =
  createYupValidator<PolicyForm>(policySchema, f => ({
    ...f,
    priority: f.priority === '' ? undefined : Number(f.priority),
  }));

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
