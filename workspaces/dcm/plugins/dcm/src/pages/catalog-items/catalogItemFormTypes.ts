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
  CatalogResource,
  FieldConfiguration,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { createYupValidator } from '../../utils/createYupValidator';
import { pickNumericBound } from '../../utils/schemaUtils';
import { type TFunction, makeTranslator } from '../../utils/formUtils';
import { validateJsonObject } from '../../utils/validateJsonObject';

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

/** One resource entry in the catalog item form. */
export type ResourceFormEntry = {
  /** Stable client-side key for React lists. Never sent to the API. */
  id: string;
  /** Unique name within the catalog item (e.g. "app", "ordersDb"). */
  name: string;
  /** Selected from ServiceType list. Immutable after creation. */
  service_type: string;
  /** Names of other resources that must be ready first. */
  requires_resources: string[];
  /** At least one field is required by the API. */
  fields: FieldRow[];
};

export type CatalogItemForm = {
  display_name: string;
  api_version: string;
  /** At least one resource is required. */
  resources: ResourceFormEntry[];
};

// ─── Scalar (top-level) validation ─────────────────────────────────────────

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
  });
}

const { validate: validateScalar } = createYupValidator<CatalogItemForm>(
  buildCatalogItemSchema(),
  f => ({ display_name: f.display_name, api_version: f.api_version }),
);

export function validateCatalogItemForm(
  f: CatalogItemForm,
  t?: TFunction,
): Partial<Record<'display_name' | 'api_version', string>> {
  if (!t) return validateScalar(f);
  const { validate } = createYupValidator<CatalogItemForm>(
    buildCatalogItemSchema(t),
    ff => ({ display_name: ff.display_name, api_version: ff.api_version }),
  );
  return validate(f);
}

// ─── Resource-level validation ──────────────────────────────────────────────

/** Per-resource name/service_type errors. */
export type ResourceFormErrors = {
  name?: string;
  service_type?: string;
  requires_resources?: string;
};

/**
 * Returns true when the `requires_resources` graph contains a cycle that
 * passes through `startName`. Uses an iterative DFS over the dependency map
 * built from `resources`.
 */
function hasDependencyCycle(
  startName: string,
  resources: ResourceFormEntry[],
): boolean {
  const depMap = new Map(
    resources.map(r => [r.name.trim(), r.requires_resources]),
  );
  const visited = new Set<string>();
  const stack = [...(depMap.get(startName) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === startName) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    stack.push(...(depMap.get(current) ?? []));
  }
  return false;
}

export function validateResourceEntry(
  entry: ResourceFormEntry,
  allNames: string[],
  allResources?: ResourceFormEntry[],
  t?: TFunction,
): ResourceFormErrors {
  const m = makeTranslator(t);
  const errors: ResourceFormErrors = {};
  const trimmedName = entry.name.trim();

  if (!trimmedName) {
    errors.name = m(
      'validation.catalogItem.resourceNameRequired',
      'Resource name is required',
    );
  } else if (allNames.filter(n => n === trimmedName).length > 1) {
    errors.name = m(
      'validation.catalogItem.resourceNameDuplicate',
      'Resource name must be unique within the catalog item',
    );
  } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmedName)) {
    errors.name = m(
      'validation.catalogItem.resourceNamePattern',
      'Only letters, numbers, hyphens and underscores are allowed (must start with a letter)',
    );
  }

  if (!entry.service_type.trim()) {
    errors.service_type = m(
      'validation.catalogItem.serviceTypeRequired',
      'Service type is required',
    );
  }

  if (
    allResources &&
    entry.requires_resources.length > 0 &&
    hasDependencyCycle(entry.name.trim(), allResources)
  ) {
    errors.requires_resources = m(
      'validation.catalogItem.requiresResourcesCycle',
      'Circular dependency detected in requires_resources',
    );
  }

  return errors;
}

// ─── Field-row validation ───────────────────────────────────────────────────

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
      const schemaResult = validateJsonObject(schemaTrimmed);
      if (schemaResult.status === 'syntax') {
        rowErrors.validation_schema = m(
          'validation.catalogItem.schemaInvalidJson',
          'Invalid JSON syntax',
        );
      } else if (schemaResult.status === 'not_object') {
        rowErrors.validation_schema = m(
          'validation.catalogItem.schemaMustBeObject',
          'Must be a JSON object \u2014 e.g. {"type":"integer"}',
        );
      } else if (schemaResult.status === 'ok') {
        schemaMin = pickNumericBound(schemaResult.value, 'minimum', 'min');
        schemaMax = pickNumericBound(schemaResult.value, 'maximum', 'max');
        if (
          !rowErrors.validation_schema &&
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

export function hasValidFields(fields: FieldRow[]): boolean {
  return fields.some(row => row.path.trim() !== '');
}

export function isCatalogItemFormValid(f: CatalogItemForm): boolean {
  if (Object.keys(validateScalar(f)).length !== 0) return false;
  if (f.resources.length === 0) return false;
  const allNames = f.resources.map(r => r.name.trim());
  for (const resource of f.resources) {
    const errs = validateResourceEntry(resource, allNames, f.resources);
    if (Object.keys(errs).length !== 0) return false;
    if (!hasValidFields(resource.fields)) return false;
    if (Object.keys(validateFieldRows(resource.fields)).length !== 0)
      return false;
  }
  return true;
}

// ─── Empty constructors ─────────────────────────────────────────────────────

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

export function emptyResourceFormEntry(): ResourceFormEntry {
  return {
    id: globalThis.crypto.randomUUID(),
    name: '',
    service_type: '',
    requires_resources: [],
    fields: [emptyFieldRow()],
  };
}

export function emptyCatalogItemForm(): CatalogItemForm {
  return {
    display_name: '',
    api_version: 'v1alpha1',
    resources: [],
  };
}

// ─── API <-> Form converters ────────────────────────────────────────────────

function fieldRowFromConfig(f: FieldConfiguration): FieldRow {
  return {
    id: globalThis.crypto.randomUUID(),
    path: f.path,
    display_name: f.display_name ?? '',
    editable: f.editable ?? false,
    default_value: f.default === undefined ? '' : JSON.stringify(f.default),
    validation_schema: f.validation_schema
      ? JSON.stringify(f.validation_schema, null, 2)
      : '',
  };
}

export function catalogItemToForm(item: CatalogItem): CatalogItemForm {
  const apiResources = item.spec?.resources ?? [];
  return {
    display_name: item.display_name ?? '',
    api_version: item.api_version ?? 'v1alpha1',
    resources:
      apiResources.length > 0
        ? apiResources.map(r => ({
            id: globalThis.crypto.randomUUID(),
            name: r.name,
            service_type: r.service_type,
            requires_resources: r.requires_resources ?? [],
            fields:
              r.fields && r.fields.length > 0
                ? r.fields.map(fieldRowFromConfig)
                : [emptyFieldRow()],
          }))
        : [],
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
  const result = validateJsonObject(raw);
  return result.status === 'ok' ? result.value : undefined;
}

function buildFieldConfigs(fields: FieldRow[]): FieldConfiguration[] {
  return fields
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

function buildCatalogResources(
  resources: ResourceFormEntry[],
): CatalogResource[] {
  return resources.map(r => ({
    name: r.name.trim(),
    service_type: r.service_type.trim(),
    ...(r.requires_resources.length > 0
      ? { requires_resources: r.requires_resources }
      : {}),
    fields: buildFieldConfigs(r.fields),
  }));
}

export function formToCatalogItem(f: CatalogItemForm): CatalogItem {
  return {
    display_name: f.display_name.trim() || undefined,
    api_version: f.api_version.trim() || undefined,
    spec: {
      resources: buildCatalogResources(f.resources),
    },
  };
}

/**
 * Converts an edit-mode form to a {@link CatalogItem} PATCH payload.
 * `api_version` is always included to avoid backends treating a missing key as
 * "clear". `requires_resources` is included via {@link buildCatalogResources}
 * because `updateCatalogItem` uses `application/merge-patch+json`, which
 * replaces arrays wholesale — omitting it would wipe create-time dependencies.
 */
export function formToCatalogItemForUpdate(f: CatalogItemForm): CatalogItem {
  return {
    display_name: f.display_name.trim() || undefined,
    api_version: f.api_version.trim() || undefined,
    spec: {
      resources: buildCatalogResources(f.resources),
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
  // Pre-multi-resource shape used spec.service_type + spec.fields at the top
  // level. When importing such a file, wrap them as a single "default" resource
  // so the form is populated rather than left empty.
  const resourcesRaw: unknown[] = Array.isArray(specRaw.resources)
    ? specRaw.resources
    : [];
  if (
    resourcesRaw.length === 0 &&
    (typeof specRaw.service_type === 'string' || Array.isArray(specRaw.fields))
  ) {
    resourcesRaw.push({
      name: 'default',
      service_type:
        typeof specRaw.service_type === 'string' ? specRaw.service_type : '',
      fields: Array.isArray(specRaw.fields) ? specRaw.fields : [],
    });
  }

  const resources: ResourceFormEntry[] =
    resourcesRaw.length > 0
      ? resourcesRaw.map((res: unknown) => {
          const r =
            typeof res === 'object' && res !== null
              ? (res as Record<string, unknown>)
              : {};
          const fieldsRaw = Array.isArray(r.fields) ? r.fields : [];
          const fields: FieldRow[] =
            fieldsRaw.length > 0
              ? fieldsRaw.map((f: unknown) => {
                  const field =
                    typeof f === 'object' && f !== null
                      ? (f as Record<string, unknown>)
                      : {};
                  return {
                    id: globalThis.crypto.randomUUID(),
                    path: typeof field.path === 'string' ? field.path : '',
                    display_name:
                      typeof field.display_name === 'string'
                        ? field.display_name
                        : '',
                    editable: Boolean(field.editable),
                    default_value:
                      field.default === undefined
                        ? ''
                        : JSON.stringify(field.default),
                    validation_schema:
                      typeof field.validation_schema === 'object' &&
                      field.validation_schema !== null
                        ? JSON.stringify(field.validation_schema, null, 2)
                        : '',
                  };
                })
              : [emptyFieldRow()];
          const requiresRaw = Array.isArray(r.requires_resources)
            ? r.requires_resources
            : [];
          return {
            id: globalThis.crypto.randomUUID(),
            name: typeof r.name === 'string' ? r.name : '',
            service_type:
              typeof r.service_type === 'string' ? r.service_type : '',
            requires_resources: requiresRaw.filter(
              (x: unknown) => typeof x === 'string',
            ) as string[],
            fields,
          };
        })
      : [];

  return {
    display_name:
      typeof data.display_name === 'string' ? data.display_name : '',
    api_version:
      typeof data.api_version === 'string' ? data.api_version : 'v1alpha1',
    resources,
  };
}
