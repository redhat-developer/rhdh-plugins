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
import { pickNumericBound } from '../../utils/schemaUtils';
import { type TFunction, makeTranslator } from '../../utils/formUtils';

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

function buildCatalogItemSchema(t?: TFunction) {
  const m = makeTranslator(t);
  return yup.object({
    display_name: yup
      .string()
      .required(
        m(
          'validation.catalogItem.displayNameRequired',
          'Display name is required',
        ),
      )
      .min(
        1,
        m(
          'validation.catalogItem.displayNameEmpty',
          'Display name cannot be empty',
        ),
      )
      .max(
        63,
        m(
          'validation.catalogItem.displayNameMax',
          'Display name must be at most 63 characters',
        ),
      ),
    api_version: yup
      .string()
      .required(
        m(
          'validation.catalogItem.apiVersionRequired',
          'API version is required',
        ),
      )
      .matches(
        /^v\d+(?:(?:alpha|beta)\d*)?$/,
        m(
          'validation.catalogItem.apiVersionPattern',
          'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
        ),
      ),
    service_type: yup
      .string()
      .required(
        m(
          'validation.catalogItem.serviceTypeRequired',
          'Service type is required',
        ),
      ),
  });
}

const { validate: validateScalar } = createYupValidator<CatalogItemForm>(
  buildCatalogItemSchema(),
  f => ({
    display_name: f.display_name,
    api_version: f.api_version,
    service_type: f.service_type,
  }),
);

export function validateCatalogItemForm(
  f: CatalogItemForm,
  t?: TFunction,
): Partial<Record<keyof CatalogItemForm, string>> {
  if (!t) return validateScalar(f);
  const { validate } = createYupValidator<CatalogItemForm>(
    buildCatalogItemSchema(t),
    ff => ({
      display_name: ff.display_name,
      api_version: ff.api_version,
      service_type: ff.service_type,
    }),
  );
  return validate(f);
}

export function hasValidFields(f: CatalogItemForm): boolean {
  return f.fields.some(row => row.path.trim() !== '');
}

/** Per-row validation errors for a {@link FieldRow}. */
export type FieldRowErrors = {
  path?: string;
  default_value?: string;
  validation_schema?: string;
};

/** Returns true if a string looks like intended JSON (and should therefore be valid JSON). */
function looksLikeJson(s: string): boolean {
  return s.startsWith('{') || s.startsWith('[') || s.startsWith('"');
}

/**
 * Validates all field rows for:
 * - Duplicate paths (only non-empty paths are checked)
 * - `default_value` that looks like JSON but fails to parse
 * - `validation_schema` that is non-empty but not a valid JSON object
 *
 * Returns a record keyed by row index; only rows with errors are included.
 */

export function validateFieldRows(
  fields: FieldRow[],
  t?: TFunction,
): Record<number, FieldRowErrors> {
  const m = makeTranslator(t);

  const result: Record<number, FieldRowErrors> = {};
  const seenPaths = new Map<string, number>();

  fields.forEach((row, i) => {
    const rowErrors: FieldRowErrors = {};
    const trimmedPath = row.path.trim();

    if (trimmedPath !== '') {
      if (seenPaths.has(trimmedPath)) {
        rowErrors.path = m(
          'validation.catalogItem.duplicatePath',
          'Duplicate path \u2014 paths must be unique',
        );
      } else {
        seenPaths.set(trimmedPath, i);
      }
    }

    const defaultTrimmed = row.default_value.trim();
    if (defaultTrimmed && looksLikeJson(defaultTrimmed)) {
      try {
        JSON.parse(defaultTrimmed);
      } catch {
        rowErrors.default_value = m(
          'validation.catalogItem.invalidJson',
          'Invalid JSON \u2014 fix the syntax or use a plain string value',
        );
      }
    }

    const schemaTrimmed = row.validation_schema.trim();
    let schemaMin: number | undefined;
    let schemaMax: number | undefined;
    if (schemaTrimmed) {
      try {
        const parsed = JSON.parse(schemaTrimmed);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          rowErrors.validation_schema = m(
            'validation.catalogItem.schemaMustBeObject',
            'Must be a JSON object \u2014 e.g. {"type":"integer"}',
          );
        } else {
          schemaMin = pickNumericBound(parsed, 'minimum', 'min');
          schemaMax = pickNumericBound(parsed, 'maximum', 'max');
          if (
            schemaMin !== undefined &&
            schemaMax !== undefined &&
            schemaMin > schemaMax
          ) {
            rowErrors.validation_schema = m(
              'validation.catalogItem.schemaMinMaxConflict',
              `minimum (${schemaMin}) must not exceed maximum (${schemaMax})`,
              { min: schemaMin, max: schemaMax },
            );
          }
        }
      } catch {
        rowErrors.validation_schema = m(
          'validation.catalogItem.schemaInvalidJson',
          'Invalid JSON syntax',
        );
      }
    }

    const defaultNum = Number(defaultTrimmed);
    if (
      !rowErrors.default_value &&
      !rowErrors.validation_schema &&
      defaultTrimmed &&
      Number.isFinite(defaultNum)
    ) {
      if (schemaMin !== undefined && defaultNum < schemaMin) {
        rowErrors.default_value = m(
          'validation.catalogItem.defaultBelowMin',
          `Default value (${defaultNum}) is below the schema minimum (${schemaMin})`,
          { value: defaultNum, min: schemaMin },
        );
      } else if (schemaMax !== undefined && defaultNum > schemaMax) {
        rowErrors.default_value = m(
          'validation.catalogItem.defaultAboveMax',
          `Default value (${defaultNum}) exceeds the schema maximum (${schemaMax})`,
          { value: defaultNum, max: schemaMax },
        );
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      result[i] = rowErrors;
    }
  });

  return result;
}

export function isCatalogItemFormValid(f: CatalogItemForm): boolean {
  if (Object.keys(validateScalar(f)).length !== 0) return false;
  if (!hasValidFields(f)) return false;
  return Object.keys(validateFieldRows(f.fields)).length === 0;
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
