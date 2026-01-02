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

import { JsonObject, JsonValue } from '@backstage/types';

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import get from 'lodash/get';
import set from 'lodash/set';

/**
 * Extracts static default values from fetch:response:default properties in the schema.
 * These values are applied to formData before widgets render, ensuring defaults
 * are available immediately without waiting for fetch operations.
 *
 * @param schema - The JSON Schema containing ui:props with fetch:response:default
 * @param existingFormData - Existing form data to preserve (won't be overwritten)
 * @returns An object containing the extracted default values merged with existing data
 */
export function extractStaticDefaults(
  schema: JSONSchema7,
  existingFormData: JsonObject = {},
): JsonObject {
  const defaults: JsonObject = {};
  const rootSchema = schema;

  const getSchemaDefinition = (ref: string): JSONSchema7Definition => {
    const refPath = ref.replace(/^#\//, '').replace(/\//g, '.');
    return get(rootSchema, refPath);
  };

  const processSchema = (
    curSchema: JSONSchema7Definition,
    path: string,
  ): void => {
    if (typeof curSchema === 'boolean') {
      return;
    }

    // Handle $ref
    if (curSchema.$ref) {
      const resolved = getSchemaDefinition(curSchema.$ref);
      if (resolved) {
        processSchema(resolved, path);
      }
      return;
    }

    // Extract fetch:response:default from ui:props
    const uiProps = (curSchema as Record<string, unknown>)['ui:props'];
    if (uiProps && typeof uiProps === 'object') {
      const staticDefault = (uiProps as Record<string, unknown>)[
        'fetch:response:default'
      ];
      if (staticDefault !== undefined) {
        // Only set if not already in existing form data
        const existingValue = get(existingFormData, path);
        if (existingValue === undefined || existingValue === null) {
          set(defaults, path, staticDefault);
        }
      }
    }

    // Recursively process nested objects (inline processProperties)
    if (curSchema.properties) {
      for (const [key, propSchema] of Object.entries(curSchema.properties)) {
        const propPath = path ? `${path}.${key}` : key;
        processSchema(propSchema, propPath);
      }
    }

    // Handle arrays
    if (curSchema.items) {
      if (Array.isArray(curSchema.items)) {
        curSchema.items.forEach((itemSchema, index) => {
          processSchema(itemSchema, `${path}[${index}]`);
        });
      } else if (typeof curSchema.items === 'object') {
        // For array items schema, we don't process individual items
        // as they would need indices which don't exist yet
      }
    }

    // Handle composed schemas (allOf, oneOf, anyOf)
    if (curSchema.allOf) {
      curSchema.allOf.forEach(subSchema => processSchema(subSchema, path));
    }
    if (curSchema.oneOf) {
      curSchema.oneOf.forEach(subSchema => processSchema(subSchema, path));
    }
    if (curSchema.anyOf) {
      curSchema.anyOf.forEach(subSchema => processSchema(subSchema, path));
    }

    // Handle if/then/else conditionals
    if (curSchema.if) {
      processSchema(curSchema.if, path);
    }
    if (curSchema.then) {
      processSchema(curSchema.then, path);
    }
    if (curSchema.else) {
      processSchema(curSchema.else, path);
    }

    // Handle dependencies
    if (curSchema.dependencies) {
      Object.values(curSchema.dependencies).forEach(depValue => {
        if (typeof depValue === 'object' && !Array.isArray(depValue)) {
          processSchema(depValue as JSONSchema7, path);
        }
      });
    }
  };

  // Start processing from root
  processSchema(schema, '');

  // Merge defaults with existing form data (existing data takes precedence)
  return mergeDefaults(defaults, existingFormData);
}

/**
 * Recursively merges default values with existing form data.
 * Existing values take precedence over defaults.
 */
function mergeDefaults(defaults: JsonObject, existing: JsonObject): JsonObject {
  const result: JsonObject = {};

  // First, add all defaults
  for (const [key, value] of Object.entries(defaults)) {
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof existing[key] === 'object' &&
      existing[key] !== null &&
      !Array.isArray(existing[key])
    ) {
      // Recursively merge nested objects
      result[key] = mergeDefaults(
        value as JsonObject,
        existing[key] as JsonObject,
      );
    } else {
      result[key] = value as JsonValue;
    }
  }

  // Then, add/override with existing values
  for (const [key, value] of Object.entries(existing)) {
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      // Already merged above, but ensure existing nested values override
      result[key] = mergeDefaults(
        result[key] as JsonObject,
        value as JsonObject,
      );
    } else {
      result[key] = value as JsonValue;
    }
  }

  return result;
}

export default extractStaticDefaults;
