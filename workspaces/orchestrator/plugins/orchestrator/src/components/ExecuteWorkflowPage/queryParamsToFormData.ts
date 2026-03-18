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

import type { JsonObject } from '@backstage/types';

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';

/** Query param keys that are reserved for navigation/other purposes, not form fields */
const RESERVED_QUERY_PARAMS = new Set(['targetEntity', 'instanceId']);

/**
 * Recursively collects all valid leaf property paths from a JSONSchema7 schema.
 * Leaf paths are those that point to primitive values (string, number, boolean)
 * or to fields that can be set from a scalar query param.
 *
 * @param schema - The JSON Schema to extract paths from
 * @param path - Current path prefix (empty for root)
 * @returns Set of dot-notation paths (e.g. "language", "name", "step1.language")
 */
function extractSchemaPaths(
  schema: JSONSchema7Definition,
  path: string,
): Set<string> {
  const paths = new Set<string>();

  if (typeof schema === 'boolean') {
    return paths;
  }

  if (!schema.properties) {
    return paths;
  }

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const propPath = path ? `${path}.${key}` : key;

    if (typeof propSchema === 'boolean') {
      paths.add(propPath);
      continue;
    }

    const propSchemaObj = propSchema as JSONSchema7;

    // If this property has nested properties (object type), recurse
    if (
      propSchemaObj.type === 'object' &&
      propSchemaObj.properties &&
      Object.keys(propSchemaObj.properties).length > 0
    ) {
      const nestedPaths = extractSchemaPaths(propSchemaObj, propPath);
      nestedPaths.forEach(p => paths.add(p));
    } else {
      // Leaf node - can be set from a query param
      paths.add(propPath);
    }
  }

  return paths;
}

/**
 * Gets the schema definition for a dot-notation path within the root schema.
 */
function getSchemaAtPath(
  schema: JSONSchema7,
  path: string,
): JSONSchema7 | undefined {
  if (!path) return undefined;
  const pathParts = path.split('.');
  let current: JSONSchema7Definition = schema;
  for (const part of pathParts) {
    if (typeof current === 'boolean' || !current.properties?.[part]) {
      return undefined;
    }
    current = current.properties[part];
  }
  return typeof current === 'boolean' ? undefined : (current as JSONSchema7);
}

/**
 * Coerces a query param value to match schema constraints (e.g. enum).
 * Returns the value to use, or undefined if the value is invalid and should be skipped.
 */
function coerceValueForSchema(
  paramValue: string,
  propSchema: JSONSchema7 | undefined,
): string | undefined {
  if (!propSchema) return paramValue;
  if (!propSchema.enum || !Array.isArray(propSchema.enum)) return paramValue;

  const enumValues = propSchema.enum as (string | number | boolean)[];
  const strParam = paramValue.trim();

  // Exact match first
  if (enumValues.includes(strParam)) return strParam;

  // Case-insensitive match for string enums
  const match = enumValues.find(
    v => typeof v === 'string' && v.toLowerCase() === strParam.toLowerCase(),
  );
  return match !== undefined ? String(match) : undefined;
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
  const validPaths = extractSchemaPaths(schema, '');
  const result = cloneDeep(baseFormData) as JsonObject;

  for (const [paramKey, paramValue] of searchParams.entries()) {
    if (RESERVED_QUERY_PARAMS.has(paramKey)) {
      continue;
    }
    if (paramValue === undefined || paramValue === null) {
      continue;
    }

    if (validPaths.has(paramKey)) {
      const propSchema = getSchemaAtPath(schema, paramKey);
      const valueToSet = coerceValueForSchema(paramValue, propSchema);
      if (valueToSet !== undefined) {
        set(result, paramKey, valueToSet);
      }
    }
  }

  return result;
}
