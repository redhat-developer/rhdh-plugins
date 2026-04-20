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
import type { Resource } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';

export type ResourceForm = {
  catalog_item_instance_id: string;
  spec: string;
  /** Optional client-assigned ID (sent as a query parameter). */
  id: string;
};

const ID_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

const resourceSchema = yup.object({
  catalog_item_instance_id: yup
    .string()
    .required('Catalog item instance is required'),
  spec: yup
    .string()
    .required('Spec is required')
    .test(
      'valid-json',
      'Must be valid JSON with at least one property',
      val => {
        try {
          const parsed = JSON.parse(val ?? '');
          return (
            typeof parsed === 'object' &&
            parsed !== null &&
            Object.keys(parsed).length > 0
          );
        } catch {
          return false;
        }
      },
    ),
  id: yup
    .string()
    .optional()
    .test(
      'id-pattern',
      'Must be 1\u201363 lowercase alphanumeric characters or hyphens, not starting or ending with a hyphen',
      val => !val || ID_PATTERN.test(val),
    ),
});

export const { validate: validateResourceForm, isValid: isResourceFormValid } =
  createYupValidator<ResourceForm>(resourceSchema);

export function emptyResourceForm(): ResourceForm {
  return { catalog_item_instance_id: '', spec: '{}', id: '' };
}

export function formToResource(f: ResourceForm): Resource {
  return {
    catalog_item_instance_id: f.catalog_item_instance_id,
    spec: JSON.parse(f.spec) as Record<string, unknown>,
  };
}
