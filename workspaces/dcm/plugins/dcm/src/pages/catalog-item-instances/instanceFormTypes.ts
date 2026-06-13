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
  CatalogItemInstance,
  FieldConfiguration,
  UserValue,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';
import { pickNumericBound } from '../../utils/schemaUtils';

type TFunction = (key: string, ...args: any[]) => string;

/** One user-supplied field value, with string value for form binding. */
export type UserValueRow = {
  path: string;
  displayName: string;
  /** Always a string in the form — coerced to the proper type on submit. */
  value: string;
  /**
   * JSON Schema `type` from the field's validation_schema.
   * Used to coerce the string form value back to the correct API type.
   */
  schemaType?: string;
  /** When set, the field renders as a Select restricted to these values. */
  enumValues?: string[];
  /** Inclusive lower bound (from validation_schema.minimum). */
  schemaMin?: number;
  /** Inclusive upper bound (from validation_schema.maximum). */
  schemaMax?: number;
  /** Whether the field must be filled (from validation_schema.required). */
  required?: boolean;
};

export type InstanceForm = {
  api_version: string;
  display_name: string;
  catalog_item_id: string;
  /** Populated from the selected catalog item's editable fields. */
  user_values: UserValueRow[];
};

function buildInstanceSchema(t?: TFunction) {
  const m = (key: string, fallback: string) => (t ? t(key) : fallback);
  return yup.object({
    display_name: yup
      .string()
      .required(
        m(
          'validation.instance.displayNameRequired',
          'Display name is required',
        ),
      )
      .min(
        1,
        m(
          'validation.instance.displayNameEmpty',
          'Display name cannot be empty',
        ),
      )
      .max(
        63,
        m(
          'validation.instance.displayNameMax',
          'Display name must be at most 63 characters',
        ),
      ),
    catalog_item_id: yup
      .string()
      .required(
        m(
          'validation.instance.catalogItemRequired',
          'Catalog item is required',
        ),
      ),
    api_version: yup
      .string()
      .required(
        m('validation.instance.apiVersionRequired', 'API version is required'),
      )
      .matches(
        /^v\d+(?:(?:alpha|beta)\d*)?$/,
        m(
          'validation.instance.apiVersionPattern',
          'Must follow the pattern v<number>[alpha|beta][number] \u2014 e.g. v1, v1alpha1',
        ),
      ),
  });
}

export function validateInstanceForm(
  form: InstanceForm,
  t?: TFunction,
): Partial<Record<keyof InstanceForm, string>> {
  const { validate } = createYupValidator<InstanceForm>(
    buildInstanceSchema(t),
    f => ({
      display_name: f.display_name,
      catalog_item_id: f.catalog_item_id,
      api_version: f.api_version,
    }),
  );
  return validate(form);
}

const { isValid: isInstanceScalarValid } = createYupValidator<InstanceForm>(
  buildInstanceSchema(),
  f => ({
    display_name: f.display_name,
    catalog_item_id: f.catalog_item_id,
    api_version: f.api_version,
  }),
);

export function emptyInstanceForm(): InstanceForm {
  return {
    api_version: 'v1alpha1',
    display_name: '',
    catalog_item_id: '',
    user_values: [],
  };
}

/** Serialise a field's default value to a form string for display. */
function defaultToString(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return '';
  }
}

/** Extract typed schema metadata from a {@link FieldConfiguration}. */
function extractSchemaInfo(
  field: FieldConfiguration,
): Pick<
  UserValueRow,
  'schemaType' | 'enumValues' | 'schemaMin' | 'schemaMax' | 'required'
> {
  const schema = field.validation_schema ?? {};
  const schemaType =
    typeof schema.type === 'string' ? schema.type.toLowerCase() : undefined;
  const enumValues =
    Array.isArray(schema.enum) &&
    schema.enum.every(v => typeof v === 'string' || typeof v === 'number')
      ? (schema.enum as (string | number)[]).map(String)
      : undefined;
  const schemaMin = pickNumericBound(schema, 'minimum', 'min');
  const schemaMax = pickNumericBound(schema, 'maximum', 'max');
  const required = schema.required === true;
  return { schemaType, enumValues, schemaMin, schemaMax, required };
}

/**
 * Validates user-value rows against their schema constraints.
 * Returns a record keyed by row index; only rows with errors are included.
 */
export function validateUserValues(
  rows: UserValueRow[],
  t?: TFunction,
): Record<number, string> {
  const m = (
    key: string,
    fallback: string,
    opts?: Record<string, string | number>,
  ) => {
    if (t) return t(key, opts);
    if (!opts) return fallback;
    return fallback.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? k));
  };

  const errors: Record<number, string> = {};

  rows.forEach((row, i) => {
    const v = row.value.trim();

    if (row.required && v === '') {
      errors[i] = m(
        'validation.instance.fieldRequired',
        'This field is required',
      );
      return;
    }

    if (
      v !== '' &&
      (row.schemaType === 'integer' || row.schemaType === 'number')
    ) {
      const n = Number(v);
      if (Number.isNaN(n)) {
        errors[i] = m(
          'validation.instance.fieldMustBeNumber',
          'Must be a valid number',
        );
        return;
      }
      if (row.schemaMin !== undefined && n < row.schemaMin) {
        errors[i] = m(
          'validation.instance.fieldMin',
          `Must be at least ${row.schemaMin}`,
          { min: row.schemaMin },
        );
        return;
      }
      if (row.schemaMax !== undefined && n > row.schemaMax) {
        errors[i] = m(
          'validation.instance.fieldMax',
          `Must be at most ${row.schemaMax}`,
          { max: row.schemaMax },
        );
        return;
      }
    }
  });

  return errors;
}

export function isInstanceFormValid(f: InstanceForm): boolean {
  return (
    isInstanceScalarValid(f) &&
    Object.keys(validateUserValues(f.user_values)).length === 0
  );
}

/** Build UserValueRows from the selected catalog item's editable fields. */
export function buildUserValueRows(
  item: CatalogItem | undefined,
): UserValueRow[] {
  if (!item?.spec?.fields) return [];
  return item.spec.fields
    .filter(field => field.editable)
    .map(field => ({
      path: field.path,
      displayName: field.display_name ?? field.path,
      value: defaultToString(field.default),
      ...extractSchemaInfo(field),
    }));
}

/**
 * Coerce a string form value back to the typed value the API expects,
 * using the JSON Schema `type` declared in the field's validation_schema.
 */
function coerceValue(raw: string, schemaType?: string): unknown {
  const trimmed = raw.trim();
  switch (schemaType) {
    case 'integer': {
      const n = Number.parseInt(trimmed, 10);
      return Number.isNaN(n) ? trimmed : n;
    }
    case 'number': {
      const n = Number.parseFloat(trimmed);
      return Number.isNaN(n) ? trimmed : n;
    }
    case 'boolean':
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      return trimmed;
    case 'array':
    case 'object':
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    default:
      return trimmed;
  }
}

export function formToInstance(f: InstanceForm): CatalogItemInstance {
  const userValues: UserValue[] = f.user_values
    .filter(r => r.value.trim() !== '')
    .map(r => ({ path: r.path, value: coerceValue(r.value, r.schemaType) }));

  return {
    api_version: f.api_version.trim(),
    display_name: f.display_name.trim(),
    spec: {
      catalog_item_id: f.catalog_item_id.trim(),
      user_values: userValues,
    },
  };
}
