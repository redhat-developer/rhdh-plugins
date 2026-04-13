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
import type { Provider } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';

export type ProviderForm = {
  name: string;
  endpoint: string;
  service_type: string;
  schema_version: string;
  operations: string[];
};

export const KNOWN_OPERATIONS = [
  'create',
  'read',
  'update',
  'delete',
  'list',
  'patch',
] as const;

const providerSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .matches(
      /^[a-z][a-z0-9-]*$/,
      'Only lowercase letters, numbers, and hyphens are allowed (must start with a letter)',
    ),
  endpoint: yup
    .string()
    .required('Endpoint is required')
    .matches(
      /^https?:\/\/[^\s]+$/,
      'Must start with http:// or https:// (e.g. http://my-service:8081/api)',
    ),
  service_type: yup
    .string()
    .required('Service type is required')
    .min(1, 'Please select a service type from the list'),
  schema_version: yup
    .string()
    .required('Schema version is required')
    .matches(
      /^v\d+(?:(?:alpha|beta)\d*)?$/,
      'Must follow the pattern v<number>[alpha|beta][number] — e.g. v1, v1alpha1, v2beta2',
    ),
});

export const { validate: validateProviderForm, isValid: isProviderFormValid } =
  createYupValidator<ProviderForm>(providerSchema);

export function emptyProviderForm(): ProviderForm {
  return {
    name: '',
    endpoint: '',
    service_type: '',
    schema_version: 'v1alpha1',
    operations: [],
  };
}

/** Convert "my-awesome-provider" → "My Awesome Provider" */
export function nameToDisplayName(name: string): string {
  return name
    .split('-')
    .map(word => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
    .trim();
}

export function providerToForm(p: Provider): ProviderForm {
  return {
    name: p.name ?? '',
    endpoint: p.endpoint ?? '',
    service_type: p.service_type ?? '',
    schema_version: p.schema_version ?? 'v1alpha1',
    operations: p.operations ?? [],
  };
}

export function formToProvider(f: ProviderForm): Provider {
  return {
    name: f.name.trim(),
    display_name: nameToDisplayName(f.name.trim()),
    endpoint: f.endpoint.trim(),
    service_type: f.service_type.trim(),
    schema_version: f.schema_version.trim(),
    operations: f.operations.length > 0 ? f.operations : undefined,
  };
}
