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

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

/** Query param keys that are reserved for navigation/other purposes, not form fields */
const RESERVED_QUERY_PARAMS = new Set(['targetEntity', 'instanceId']);

/**
 * Resolves $ref in a schema by looking up the reference in the root schema.
 * Supports #/$defs/name and #/definitions/name (and other #/path/to/def patterns).
 */
function resolveRef(
  schema: JSONSchema7Definition,
  rootSchema: JSONSchema7,
): JSONSchema7Definition {
  if (typeof schema === 'boolean') return schema;
  if (!schema.$ref) return schema;

  const refPath = schema.$ref.replace(/^#\//, '').replace(/\//g, '.');
  const resolved = get(rootSchema, refPath);
  return resolved ?? schema;
}

/**
 * Recursively collects all valid leaf property paths from a JSONSchema7 schema.
 * Resolves $ref before walking properties. Leaf paths point to fields that can
 * be set from a scalar query param.
 *
 * @param schema - The JSON Schema to extract paths from
 * @param path - Current path prefix (empty for root)
 * @param rootSchema - Root schema for resolving $ref
 * @returns Set of dot-notation paths (e.g. "language", "name", "step1.language")
 */
function extractSchemaPaths(
  schema: JSONSchema7Definition,
  path: string,
  rootSchema: JSONSchema7,
): Set<string> {
  const paths = new Set<string>();

  if (typeof schema === 'boolean') {
    return paths;
  }

  const resolved = resolveRef(schema, rootSchema) as JSONSchema7;
  if (typeof resolved === 'boolean') return paths;
  if (!resolved.properties) return paths;

  for (const [key, propSchema] of Object.entries(resolved.properties)) {
    const propPath = path ? `${path}.${key}` : key;

    if (typeof propSchema === 'boolean') {
      paths.add(propPath);
      continue;
    }

    const propResolved = resolveRef(propSchema, rootSchema) as JSONSchema7;

    // If this property has nested properties (object type), recurse
    if (
      propResolved &&
      typeof propResolved === 'object' &&
      propResolved.type === 'object' &&
      propResolved.properties &&
      Object.keys(propResolved.properties).length > 0
    ) {
      const nestedPaths = extractSchemaPaths(
        propResolved,
        propPath,
        rootSchema,
      );
      nestedPaths.forEach(p => paths.add(p));
    } else {
      paths.add(propPath);
    }
  }

  return paths;
}

/**
 * Gets the schema definition for a dot-notation path within the root schema.
 * Resolves $ref when traversing.
 */
function getSchemaAtPath(
  schema: JSONSchema7,
  path: string,
  rootSchema: JSONSchema7,
): JSONSchema7 | undefined {
  if (!path) return undefined;
  const pathParts = path.split('.');
  let current: JSONSchema7Definition = schema;
  for (const part of pathParts) {
    if (typeof current === 'boolean') return undefined;
    current = resolveRef(current, rootSchema);
    if (typeof current === 'boolean') return undefined;
    if (!current.properties?.[part]) return undefined;
    current = current.properties[part];
  }
  const resolved = resolveRef(current, rootSchema);
  return typeof resolved === 'boolean' ? undefined : (resolved as JSONSchema7);
}

/**
 * Coerces a query param value to match schema constraints (type, enum).
 * Returns the typed value to use, or undefined if the value is invalid and should be skipped.
 * Supports string, number, integer, and boolean types including enum coercion.
 */
function coerceValueForSchema(
  paramValue: string,
  propSchema: JSONSchema7 | undefined,
): JsonValue | undefined {
  if (!propSchema) return paramValue;
  const strParam = paramValue.trim();

  const enumValues = propSchema.enum as
    | (string | number | boolean)[]
    | undefined;
  const hasEnum =
    enumValues && Array.isArray(enumValues) && enumValues.length > 0;

  if (hasEnum) {
    // Exact string match first
    if (enumValues!.includes(strParam)) return strParam;

    // Try to match by parsing into enum value types
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
        if (!Number.isNaN(parsed) && parsed === enumVal) {
          if (propSchema.type === 'integer' && !Number.isInteger(parsed)) {
            continue;
          }
          return parsed;
        }
      } else if (typeof enumVal === 'string') {
        if (enumVal.toLowerCase() === strParam.toLowerCase()) return enumVal;
      }
    }
    return undefined;
  }

  // No enum: coerce by schema type
  if (propSchema.type === 'boolean') {
    const lower = strParam.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    return undefined;
  }
  if (propSchema.type === 'integer') {
    const parsed = Number(strParam);
    if (!Number.isNaN(parsed) && Number.isInteger(parsed)) return parsed;
    return undefined;
  }
  if (propSchema.type === 'number') {
    const parsed = Number(strParam);
    if (!Number.isNaN(parsed)) return parsed;
    return undefined;
  }

  return strParam;
}

/**
 * Merges URL query parameters that match schema property paths into the base form data.
 * Query param values take precedence over base form data for prepopulation.
 * Reserved params (targetEntity, instanceId) are excluded.
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
  const validPaths = extractSchemaPaths(schema, '', schema);
  const result = cloneDeep(baseFormData) as JsonObject;

  for (const [paramKey, paramValue] of searchParams.entries()) {
    if (RESERVED_QUERY_PARAMS.has(paramKey)) {
      continue;
    }
    if (paramValue === undefined || paramValue === null) {
      continue;
    }

    if (validPaths.has(paramKey)) {
      const propSchema = getSchemaAtPath(schema, paramKey, schema);
      const valueToSet = coerceValueForSchema(paramValue, propSchema);
      if (valueToSet !== undefined) {
        set(result, paramKey, valueToSet);
      }
    }
  }

  return result;
}
