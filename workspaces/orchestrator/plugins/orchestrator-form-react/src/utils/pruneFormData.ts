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

import type { JSONSchema7 } from 'json-schema';

type WorkflowInputSchema = JSONSchema7 & {
  omitFromWorkflowInput?: boolean;
};

/**
 * Resolves $ref references in a schema by looking in $defs
 */
function resolveSchema(
  schema: JSONSchema7,
  rootSchema: JSONSchema7,
): JSONSchema7 {
  if (!schema.$ref) return schema;

  // Handle #/$defs/name references
  const refPath = schema.$ref;
  if (refPath.startsWith('#/$defs/')) {
    const defName = refPath.replace('#/$defs/', '');
    const resolved = rootSchema.$defs?.[defName];
    if (resolved && typeof resolved === 'object') {
      return resolved as JSONSchema7;
    }
  }

  return schema;
}

function shouldOmitFromWorkflowInput(schema: JSONSchema7): boolean {
  return (schema as WorkflowInputSchema).omitFromWorkflowInput === true;
}

/**
 * Checks if a property's enum value matches the form data
 */
function matchesEnum(propSchema: JSONSchema7, value: any): boolean {
  if (!propSchema.enum) return true;
  return propSchema.enum.includes(value);
}

/**
 * Checks if a property's const value matches the form data
 */
function matchesConst(propSchema: JSONSchema7, value: any): boolean {
  if (propSchema.const === undefined) return true;
  return propSchema.const === value;
}

/**
 * Collects valid property names from schema based on current form data
 */
function getValidProperties(
  schema: JSONSchema7,
  formData: JsonObject,
): Set<string> {
  const valid = new Set<string>();

  // Add base properties
  if (schema.properties) {
    Object.keys(schema.properties).forEach(key => valid.add(key));
  }

  // Handle dependencies with oneOf (common pattern for conditional fields)
  if (schema.dependencies) {
    Object.entries(schema.dependencies).forEach(([depKey, depValue]) => {
      // Only process if dependency key exists
      if (formData[depKey] === undefined) return;

      // Array form: ['prop1', 'prop2']
      if (Array.isArray(depValue)) {
        depValue.forEach(prop => valid.add(prop));
        return;
      }

      // Schema form with oneOf
      const depSchema = depValue as JSONSchema7;
      if (depSchema.oneOf) {
        // Find matching branch
        for (const branch of depSchema.oneOf) {
          if (typeof branch !== 'object' || !branch.properties) continue;

          const branchSchema = branch as JSONSchema7;
          const branchProps = branchSchema.properties;
          if (!branchProps) continue;

          let matches = true;

          // Check if this branch matches current data
          for (const [key, propDef] of Object.entries(branchProps)) {
            if (typeof propDef === 'boolean') continue;
            const propSchema = propDef as JSONSchema7;
            const value = formData[key];

            if (
              !matchesEnum(propSchema, value) ||
              !matchesConst(propSchema, value)
            ) {
              matches = false;
              break;
            }
          }

          // If branch matches, add its properties
          if (matches) {
            Object.keys(branchProps).forEach(key => valid.add(key));
          }
        }
      }

      // Add properties from dependency schema itself
      if (depSchema.properties) {
        Object.keys(depSchema.properties).forEach(key => valid.add(key));
      }
    });
  }

  // Handle allOf with if/then/else conditionals
  if (schema.allOf) {
    schema.allOf.forEach(subSchema => {
      if (typeof subSchema !== 'object') return;

      const subSchemaObj = subSchema as JSONSchema7;

      // Check for if/then/else pattern
      if (subSchemaObj.if && typeof subSchemaObj.if === 'object') {
        const ifSchema = subSchemaObj.if as JSONSchema7;
        const conditionMatches = checkIfCondition(ifSchema, formData);

        if (conditionMatches && subSchemaObj.then) {
          // Condition matches, add properties from 'then'
          const thenSchema = subSchemaObj.then as JSONSchema7;
          if (thenSchema.properties) {
            Object.keys(thenSchema.properties).forEach(key => valid.add(key));
          }
        } else if (!conditionMatches && subSchemaObj.else) {
          // Condition doesn't match, add properties from 'else'
          const elseSchema = subSchemaObj.else as JSONSchema7;
          if (elseSchema.properties) {
            Object.keys(elseSchema.properties).forEach(key => valid.add(key));
          }
        }
      } else {
        // No if/then/else, just add properties from this allOf branch
        if (subSchemaObj.properties) {
          Object.keys(subSchemaObj.properties).forEach(key => valid.add(key));
        }
      }
    });
  }

  // Handle oneOf at the schema level
  if (schema.oneOf) {
    // For oneOf, we need to find which branch the current data matches
    for (const branch of schema.oneOf) {
      if (typeof branch !== 'object') continue;

      const branchSchema = branch as JSONSchema7;
      if (!branchSchema.properties) continue;

      // Check if current data matches this branch
      const branchMatches = Object.entries(formData).some(([key, value]) => {
        const propSchema = branchSchema.properties?.[key];
        if (!propSchema || typeof propSchema === 'boolean') return false;

        const propSchemaDef = propSchema as JSONSchema7;
        // Check if this property exists in this branch and matches its constraints
        return (
          matchesEnum(propSchemaDef, value) &&
          matchesConst(propSchemaDef, value)
        );
      });

      if (branchMatches) {
        // Add all properties from the matching branch
        Object.keys(branchSchema.properties).forEach(key => valid.add(key));
        break; // Only one branch should match in oneOf
      }
    }

    // If no branch matched, allow all properties from all branches
    // This is a fallback to prevent data loss during schema transitions
    if (valid.size === 0) {
      schema.oneOf.forEach(branch => {
        if (typeof branch !== 'object') return;
        const branchSchema = branch as JSONSchema7;
        if (branchSchema.properties) {
          Object.keys(branchSchema.properties).forEach(key => valid.add(key));
        }
      });
    }
  }

  return valid;
}

/**
 * Checks if the 'if' condition in a schema matches the form data
 */
function checkIfCondition(
  ifSchema: JSONSchema7,
  formData: JsonObject,
): boolean {
  if (!ifSchema.properties) return true;

  // Check all constraints in the 'if' schema
  for (const [key, propDef] of Object.entries(ifSchema.properties)) {
    if (typeof propDef === 'boolean') continue;

    const propSchema = propDef as JSONSchema7;
    const value = formData[key];

    // Check const constraint
    if (propSchema.const !== undefined) {
      if (value !== propSchema.const) {
        return false;
      }
    }

    // Check enum constraint
    if (propSchema.enum && value !== undefined) {
      if (!propSchema.enum.includes(value as any)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Recursively prunes form data to only include properties that exist in the schema.
 * This removes stale properties that were added by SchemaUpdater but later removed
 * when the schema was updated again.
 *
 * @param formData - The form data to prune
 * @param schema - The current JSON schema
 * @param rootSchema - The root schema (for resolving $ref)
 * @returns Pruned form data containing only properties that exist in the schema
 */
export function pruneFormData(
  formData: JsonObject,
  schema: JSONSchema7,
  rootSchema?: JSONSchema7,
): JsonObject {
  const root = rootSchema || schema;
  const validProps = getValidProperties(schema, formData);
  const pruned: JsonObject = {};

  for (const [key, value] of Object.entries(formData)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Skip if property is not valid
    if (!validProps.has(key)) continue;

    // Get property schema for recursion
    let propSchema = schema.properties?.[key];
    if (typeof propSchema === 'boolean' || !propSchema) {
      pruned[key] = value as JsonValue;
      continue;
    }

    // Resolve $ref if present
    propSchema = resolveSchema(propSchema as JSONSchema7, root);

    // Recursively prune nested objects
    if (
      propSchema.type === 'object' &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Only prune if schema has validation rules (properties, dependencies, allOf, or oneOf)
      // Otherwise keep data as-is (handles $ref and other schema patterns)
      if (
        propSchema.properties ||
        propSchema.dependencies ||
        propSchema.allOf ||
        propSchema.oneOf
      ) {
        pruned[key] = pruneFormData(
          value as JsonObject,
          propSchema as JSONSchema7,
          root,
        );
      } else {
        // No validation rules, keep the data as-is
        pruned[key] = value as JsonValue;
      }
    } else {
      pruned[key] = value as JsonValue;
    }
  }

  return pruned;
}

/**
 * Removes fields marked with omitFromWorkflowInput from the form data.
 * This keeps the review UI intact while excluding data from execution payloads.
 */
export function omitFromWorkflowInput(
  formData: JsonObject,
  schema: JSONSchema7,
  rootSchema?: JSONSchema7,
): JsonObject {
  const root = rootSchema || schema;
  const filtered: JsonObject = {};

  for (const [key, value] of Object.entries(formData)) {
    if (value === undefined) continue;

    let propSchema = schema.properties?.[key];
    if (typeof propSchema === 'boolean' || !propSchema) {
      filtered[key] = value as JsonValue;
      continue;
    }

    propSchema = resolveSchema(propSchema as JSONSchema7, root);
    if (shouldOmitFromWorkflowInput(propSchema)) {
      continue;
    }

    if (
      propSchema.type === 'object' &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      filtered[key] = omitFromWorkflowInput(
        value as JsonObject,
        propSchema as JSONSchema7,
        root,
      );
      continue;
    }

    if (propSchema.type === 'array' && Array.isArray(value)) {
      const itemsSchema =
        typeof propSchema.items === 'object' && propSchema.items
          ? resolveSchema(propSchema.items as JSONSchema7, root)
          : undefined;

      if (itemsSchema && shouldOmitFromWorkflowInput(itemsSchema)) {
        continue;
      }

      if (
        itemsSchema &&
        itemsSchema.type === 'object' &&
        itemsSchema.properties
      ) {
        filtered[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return omitFromWorkflowInput(
              item as JsonObject,
              itemsSchema as JSONSchema7,
              root,
            );
          }
          return item as JsonValue;
        });
      } else {
        filtered[key] = value as JsonValue;
      }
      continue;
    }

    filtered[key] = value as JsonValue;
  }

  return filtered;
}
