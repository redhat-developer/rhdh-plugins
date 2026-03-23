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

import type { JsonObject, JsonValue } from '@backstage/types';

import type { JSONSchema7 } from 'json-schema';
import { Draft07 as JsonSchema } from 'json-schema-library';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

/** Query param keys that are reserved for navigation/other purposes, not form fields */
const RESERVED_QUERY_PARAMS = new Set(['targetEntity', 'instanceId']);

/**
 * Converts dot-notation path to JSON Pointer (e.g. "firstStep.language" -> "#/firstStep/language")
 */
function toJsonPointer(path: string): string {
  if (!path) return '#';
  return `#/${path.replace(/\./g, '/')}`;
}

/**
 * Resolves $ref to the target schema (supports #/$defs and #/definitions).
 */
function resolveRef(root: JSONSchema7, ref: string): JSONSchema7 | undefined {
  if (!ref.startsWith('#/')) return undefined;
  const path = ref.slice(2).replace(/\//g, '.');
  const parts = path.split('.');
  let current: unknown = root;
  for (const p of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    )
      return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current as JSONSchema7;
}

/**
 * Returns true if the path exists in the schema's properties (recursively).
 * Handles $ref, oneOf, anyOf, allOf. Used to reject unknown query params.
 */
function pathExistsInSchema(
  schema: JSONSchema7,
  path: string,
  root: JSONSchema7,
): boolean {
  if (!path) return true;
  let s: JSONSchema7 | undefined = schema;
  const parts = path.split('.');

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!s || typeof s === 'boolean') return false;
    if (s.$ref) {
      s = resolveRef(root, s.$ref);
      i--;
      continue;
    }
    if (s.oneOf || s.anyOf) {
      const remaining = parts.slice(i).join('.');
      return pathExistsInComposite(s, remaining, root);
    }
    const props = s.properties;
    if (!props || typeof props !== 'object') return false;
    if (!(part in props)) return false;
    s = props[part] as JSONSchema7;
  }
  return true;
}

/**
 * Checks if path exists in any branch of oneOf/anyOf/allOf.
 */
function pathExistsInComposite(
  schema: JSONSchema7,
  path: string,
  root: JSONSchema7,
): boolean {
  const branches: JSONSchema7[] = [];
  if (schema.oneOf) branches.push(...(schema.oneOf as JSONSchema7[]));
  if (schema.anyOf) branches.push(...(schema.anyOf as JSONSchema7[]));
  if (schema.allOf) {
    for (const b of schema.allOf as JSONSchema7[]) {
      const branch =
        b && typeof b === 'object' && '$ref' in b
          ? resolveRef(root, (b as JSONSchema7).$ref!)
          : (b as JSONSchema7);
      if (branch) branches.push(branch);
    }
  }
  return branches.some(b => pathExistsInSchema(b as JSONSchema7, path, root));
}

const LEAF_TYPES = [
  'string',
  'number',
  'integer',
  'boolean',
  'null',
  'array',
] as const;

/**
 * Returns true if the schema defines a concrete type for a settable value.
 * Excludes only object schemas so we only merge when the path targets a real field
 * (scalar or array), not a nested object placeholder.
 */
function isDefinedLeafSchema(s: JSONSchema7 | undefined): boolean {
  if (!s || typeof s === 'boolean') return false;
  if (s.enum !== undefined || s.const !== undefined) return true;
  const t = s.type;
  if (Array.isArray(t)) return t.some(v => LEAF_TYPES.includes(v as any));
  return t !== undefined && LEAF_TYPES.includes(t as any);
}

/**
 * Gets the schema definition for a dot-notation path using json-schema-library.
 * Resolves $ref, oneOf, anyOf, allOf, and if/then/else when data context is provided.
 *
 * @param schema - The root JSON Schema
 * @param path - Dot-notation path (e.g. "mode.alphaValue")
 * @param data - The data object at that path; required for oneOf/anyOf/if resolution
 */
function getSchemaAtPath(
  schema: JSONSchema7,
  path: string,
  data: JsonObject,
): JSONSchema7 | undefined {
  if (!path) return undefined;

  try {
    const parsedSchema = new JsonSchema(schema);
    const pointer = toJsonPointer(path);
    const resolved = parsedSchema.getSchema({
      pointer,
      data,
    });
    if (!resolved || typeof resolved === 'boolean') return undefined;
    const schemaObj = resolved as JSONSchema7;
    const isLeaf = isDefinedLeafSchema(schemaObj);
    return isLeaf ? schemaObj : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Coerces a single string value for a scalar schema (used for array items).
 */
function coerceScalarValue(
  strParam: string,
  itemSchema: JSONSchema7 | undefined,
): JsonValue | undefined {
  if (!itemSchema) return strParam;

  const enumValues = itemSchema.enum as
    | (string | number | boolean)[]
    | undefined;
  const hasEnum =
    enumValues && Array.isArray(enumValues) && enumValues.length > 0;

  if (hasEnum) {
    if (enumValues!.includes(strParam)) return strParam;
    for (const enumVal of enumValues!) {
      if (typeof enumVal === 'boolean') {
        const lower = strParam.toLowerCase();
        if (
          (lower === 'true' && enumVal === true) ||
          (lower === 'false' && enumVal === false)
        ) {
          return enumVal;
        }
      } else if (typeof enumVal === 'number') {
        const parsed = Number(strParam);
        if (!Number.isNaN(parsed) && parsed === enumVal) return parsed;
      } else if (typeof enumVal === 'string') {
        if (enumVal.toLowerCase() === strParam.toLowerCase()) return enumVal;
      }
    }
    return undefined;
  }

  if (itemSchema.type === 'boolean') {
    const lower = strParam.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return undefined;
  }
  if (itemSchema.type === 'integer') {
    const parsed = Number(strParam);
    if (!Number.isNaN(parsed) && Number.isInteger(parsed)) return parsed;
    return undefined;
  }
  if (itemSchema.type === 'number') {
    const parsed = Number(strParam);
    if (!Number.isNaN(parsed)) return parsed;
    return undefined;
  }

  // string or unspecified type
  return strParam;
}

/**
 * Coerces a query param value to match schema constraints (type, enum).
 * Returns the typed value to use, or undefined if the value is invalid and should be skipped.
 * Supports string, number, integer, boolean, and array types including enum coercion.
 */
function coerceValueForSchema(
  paramValue: string,
  propSchema: JSONSchema7 | undefined,
): JsonValue | undefined {
  if (!propSchema) return paramValue;
  const strParam = paramValue.trim();

  // Array type: parse comma-separated values
  if (propSchema.type === 'array') {
    const itemsSchema =
      typeof propSchema.items === 'object' &&
      propSchema.items &&
      !Array.isArray(propSchema.items)
        ? (propSchema.items as JSONSchema7)
        : undefined;

    const parts = strParam
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const coerced: JsonValue[] = [];

    for (const part of parts) {
      const item = coerceScalarValue(part, itemsSchema);
      if (item !== undefined) {
        coerced.push(item);
      }
    }

    return coerced.length > 0 ? coerced : undefined;
  }

  return coerceScalarValue(strParam, propSchema);
}

/**
 * Merges URL query parameters that match schema property paths into the base form data.
 * Uses try-and-resolve: for each param, builds proposed data and asks json-schema-library
 * for the schema at that path. If a schema is found, coerces and merges. This delegates
 * full support for $ref, oneOf, anyOf, allOf, and if/then/else to the library.
 *
 * @param schema - The workflow input JSON Schema
 * @param searchParams - URL search params from useSearchParams()
 * @param baseFormData - Base form data from API (value?.data)
 * @returns Form data with query param values merged in
 */
export function mergeQueryParamsIntoFormData(
  schema: JSONSchema7,
  searchParams: URLSearchParams,
  baseFormData: JsonObject = {},
): JsonObject {
  const result = cloneDeep(baseFormData) as JsonObject;

  for (const [paramKey, paramValue] of searchParams.entries()) {
    if (RESERVED_QUERY_PARAMS.has(paramKey)) {
      continue;
    }
    if (paramValue === undefined || paramValue === null) {
      continue;
    }

    if (!pathExistsInSchema(schema, paramKey, schema)) continue;

    // Build proposed data with raw value so getSchema can resolve oneOf/anyOf/if-then-else
    const proposedData = cloneDeep(result) as JsonObject;
    set(proposedData, paramKey, paramValue);

    const propSchema = getSchemaAtPath(schema, paramKey, proposedData);
    if (!propSchema) continue;

    const valueToSet = coerceValueForSchema(paramValue, propSchema);
    if (valueToSet !== undefined) {
      set(result, paramKey, valueToSet);
    }
  }

  return result;
}
