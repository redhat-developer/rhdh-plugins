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

import type { AgentWizardFormData, WizardStepKey } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

const DNS_1123_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function validateStep(
  step: WizardStepKey,
  data: AgentWizardFormData,
): ValidationError[] {
  switch (step) {
    case 'identity':
      return validateIdentity(data);
    case 'instructions':
      return validateInstructions(data);
    case 'model':
      return validateModel(data);
    case 'tools':
    case 'connections':
    case 'guardrails':
    case 'review':
      return [];
    default:
      return [];
  }
}

function validateIdentity(data: AgentWizardFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Agent name is required' });
  }
  if (!data.key.trim()) {
    errors.push({ field: 'key', message: 'Agent key is required' });
  } else if (!DNS_1123_REGEX.test(data.key)) {
    errors.push({
      field: 'key',
      message: 'Key must be lowercase alphanumeric with hyphens (DNS-1123)',
    });
  }
  return errors;
}

function validateInstructions(data: AgentWizardFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.instructions.trim()) {
    errors.push({
      field: 'instructions',
      message: 'System instructions are required',
    });
  }
  return errors;
}

function validateModel(data: AgentWizardFormData): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.model.trim()) {
    errors.push({ field: 'model', message: 'Model selection is required' });
  }
  return errors;
}

export function validateAll(
  data: AgentWizardFormData,
): ValidationError[] {
  return [
    ...validateIdentity(data),
    ...validateInstructions(data),
    ...validateModel(data),
  ];
}

export function nameToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
}
