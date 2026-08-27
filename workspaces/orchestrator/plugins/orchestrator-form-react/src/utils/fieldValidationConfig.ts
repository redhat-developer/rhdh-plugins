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

import { UiSchema } from '@rjsf/utils';
import type { JSONSchema7 } from 'json-schema';
import get from 'lodash/get';

export type ValidateOnMode = 'blur' | 'change';

export interface FieldValidationConfig {
  validateOn: ValidateOnMode[];
  validateGroup?: string;
}

export function parseValidateOn(raw: unknown): ValidateOnMode[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter((s): s is ValidateOnMode => s === 'blur' || s === 'change');
}

export function getFieldValidationConfig(
  uiSchema: UiSchema<JsonObject, JSONSchema7>,
  fieldPath: string,
): FieldValidationConfig | undefined {
  const fieldUiSchema = get(uiSchema, fieldPath) as JsonObject | undefined;
  if (!fieldUiSchema) return undefined;

  const validateOn = parseValidateOn(fieldUiSchema['ui:validateOn']);
  if (validateOn.length === 0) return undefined;

  const validateGroup =
    typeof fieldUiSchema['ui:validateGroup'] === 'string'
      ? (fieldUiSchema['ui:validateGroup'] as string)
      : undefined;

  return { validateOn, validateGroup };
}

export function getGroupMembers(
  uiSchema: UiSchema<JsonObject, JSONSchema7>,
  groupName: string,
  prefix = '',
): string[] {
  const members: string[] = [];
  const dottedPrefix = prefix ? `${prefix}.` : '';

  for (const [key, value] of Object.entries(uiSchema)) {
    if (key.startsWith('ui:')) continue;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const fieldGroup = (value as JsonObject)['ui:validateGroup'];
      if (fieldGroup === groupName) {
        members.push(`${dottedPrefix}${key}`);
      }
      members.push(
        ...getGroupMembers(
          value as UiSchema<JsonObject, JSONSchema7>,
          groupName,
          `${dottedPrefix}${key}`,
        ),
      );
    }
  }

  return members;
}

export function areAllGroupFieldsPopulated(
  members: string[],
  formData: JsonObject,
): boolean {
  return members.every(path => {
    const value = get(formData, path);
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}
