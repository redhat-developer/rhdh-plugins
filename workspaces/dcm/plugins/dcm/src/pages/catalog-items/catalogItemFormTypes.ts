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
  CatalogItem,
  FieldConfiguration,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';

export type FieldRow = {
  /** Stable client-side identifier used as React list key. Never sent to the API. */
  id: string;
  path: string;
  display_name: string;
  editable: boolean;
  /** Any JSON-serialisable value, stored as a JSON string in the form ("" = not set). */
  default_value: string;
  /** JSON Schema object stored as a JSON string in the form ("" = not set). */
  validation_schema: string;
};

export type CatalogItemForm = {
  display_name: string;
  api_version: string;
  service_type: string;
  /** At least one field is required by the API (spec.fields minItems: 1). */
  fields: FieldRow[];
};

const catalogItemSchema = yup.object({
  display_name: yup
    .string()
    .required('Display name is required')
    .min(1, 'Display name cannot be empty')
    .max(63, 'Display name must be at most 63 characters'),
  api_version: yup
    .string()
    .required('API version is required')
    .matches(
      /^v\d+(?:(?:alpha|beta)\d*)?$/,
      'Must follow the pattern v<number>[alpha|beta][number] — e.g. v1, v1alpha1',
    ),
});

const { validate: validateScalar } = createYupValidator<CatalogItemForm>(
  catalogItemSchema,
  f => ({ display_name: f.display_name, api_version: f.api_version }),
);

export function validateCatalogItemForm(
  f: CatalogItemForm,
): Partial<Record<keyof CatalogItemForm, string>> {
  return validateScalar(f);
}

export function hasValidFields(f: CatalogItemForm): boolean {
  return f.fields.some(row => row.path.trim() !== '');
}

export function isCatalogItemFormValid(f: CatalogItemForm): boolean {
  return Object.keys(validateScalar(f)).length === 0 && hasValidFields(f);
}

export function emptyFieldRow(): FieldRow {
  return {
    id: globalThis.crypto.randomUUID(),
    path: '',
    display_name: '',
    editable: false,
    default_value: '',
    validation_schema: '',
  };
}

export function emptyCatalogItemForm(): CatalogItemForm {
  return {
    display_name: '',
    api_version: 'v1alpha1',
    service_type: '',
    fields: [emptyFieldRow()],
  };
}

export function catalogItemToForm(item: CatalogItem): CatalogItemForm {
  const apiFields = item.spec?.fields ?? [];
  return {
    display_name: item.display_name ?? '',
    api_version: item.api_version ?? 'v1alpha1',
    service_type: item.spec?.service_type ?? '',
    fields:
      apiFields.length > 0
        ? apiFields.map(f => ({
            id: globalThis.crypto.randomUUID(),
            path: f.path,
            display_name: f.display_name ?? '',
            editable: f.editable ?? false,
            default_value:
              f.default === undefined ? '' : JSON.stringify(f.default),
            validation_schema: f.validation_schema
              ? JSON.stringify(f.validation_schema, null, 2)
              : '',
          }))
        : [emptyFieldRow()],
  };
}

function parseJsonField(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function parseJsonObjectField(
  raw: string,
): Record<string, unknown> | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore invalid JSON
  }
  return undefined;
}

function buildFields(f: CatalogItemForm): FieldConfiguration[] {
  return f.fields
    .filter(row => row.path.trim() !== '')
    .map(row => {
      const defaultVal = parseJsonField(row.default_value);
      const validationSchema = parseJsonObjectField(row.validation_schema);
      return {
        path: row.path.trim(),
        display_name: row.display_name.trim() || undefined,
        editable: row.editable,
        ...(defaultVal === undefined ? {} : { default: defaultVal }),
        ...(validationSchema ? { validation_schema: validationSchema } : {}),
      };
    });
}

export function formToCatalogItem(f: CatalogItemForm): CatalogItem {
  return {
    display_name: f.display_name.trim() || undefined,
    api_version: f.api_version.trim() || undefined,
    spec: {
      service_type: f.service_type.trim() || undefined,
      fields: buildFields(f),
    },
  };
}

/**
 * Converts an edit-mode form to a {@link CatalogItem} payload, omitting
 * `spec.service_type` because it cannot be changed after creation.
 */
export function formToCatalogItemForUpdate(f: CatalogItemForm): CatalogItem {
  return {
    display_name: f.display_name.trim() || undefined,
    api_version: f.api_version.trim() || undefined,
    spec: {
      fields: buildFields(f),
    },
  };
}

/**
 * Builds a {@link CatalogItemForm} from a raw JSON/YAML-parsed object.
 * Used when importing a catalog item definition from a file.
 */
export function catalogItemFromPayload(raw: unknown): CatalogItemForm {
  if (typeof raw !== 'object' || raw === null) return emptyCatalogItemForm();
  const data = raw as Record<string, unknown>;
  const specRaw =
    typeof data.spec === 'object' && data.spec !== null
      ? (data.spec as Record<string, unknown>)
      : {};
  const fieldsRaw = Array.isArray(specRaw.fields) ? specRaw.fields : [];

  const fields: FieldRow[] =
    fieldsRaw.length > 0
      ? fieldsRaw.map((f: unknown) => {
          const field =
            typeof f === 'object' && f !== null
              ? (f as Record<string, unknown>)
              : {};
          const validationSchemRaw = field.validation_schema;
          return {
            id: globalThis.crypto.randomUUID(),
            path: typeof field.path === 'string' ? field.path : '',
            display_name:
              typeof field.display_name === 'string' ? field.display_name : '',
            editable: Boolean(field.editable),
            default_value:
              field.default === undefined ? '' : JSON.stringify(field.default),
            validation_schema:
              typeof validationSchemRaw === 'object' &&
              validationSchemRaw !== null
                ? JSON.stringify(validationSchemRaw, null, 2)
                : '',
          };
        })
      : [emptyFieldRow()];

  return {
    display_name:
      typeof data.display_name === 'string' ? data.display_name : '',
    api_version:
      typeof data.api_version === 'string' ? data.api_version : 'v1alpha1',
    service_type:
      typeof specRaw.service_type === 'string' ? specRaw.service_type : '',
    fields,
  };
}
