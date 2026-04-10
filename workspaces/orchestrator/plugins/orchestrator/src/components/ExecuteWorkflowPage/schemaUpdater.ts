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

import { JSONSchema7 } from 'json-schema';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import { OrchestratorFormSchemaUpdater } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

const getScopePathFromId = (
  schema: JSONSchema7,
  scopeId?: string,
): string[] | undefined => {
  if (!scopeId || !schema.properties) {
    return undefined;
  }

  let raw = scopeId;
  if (raw.startsWith('root')) {
    raw = raw.slice(4);
    if (raw.startsWith('_') || raw.startsWith('.')) {
      raw = raw.slice(1);
    }
  }

  if (!raw) {
    return undefined;
  }

  const separators = ['_', '.'];
  const matchPath = (
    node: JSONSchema7,
    remaining: string,
  ): string[] | undefined => {
    if (!remaining) {
      return undefined;
    }

    if (node.type === 'array' && node.items && typeof node.items === 'object') {
      return matchPath(node.items as JSONSchema7, remaining);
    }

    if (!node.properties) {
      return undefined;
    }

    const keys = Object.keys(node.properties).sort(
      (a, b) => b.length - a.length,
    );
    for (const key of keys) {
      for (const separator of separators) {
        if (remaining === key) {
          return [key];
        }

        if (remaining.startsWith(`${key}${separator}`)) {
          const next = node.properties[key] as JSONSchema7;
          if (!next || typeof next !== 'object') {
            continue;
          }

          const rest = remaining.slice(key.length + separator.length);
          const childPath = matchPath(next, rest);
          if (childPath) {
            return [key, ...childPath];
          }
        }
      }
    }

    return undefined;
  };

  return matchPath(schema, raw);
};

const getScopedProperties = (
  schema: JSONSchema7,
  scopeId?: string,
): JSONSchema7['properties'] | undefined => {
  if (!schema.properties) {
    return undefined;
  }

  const scopePath = getScopePathFromId(schema, scopeId);
  if (!scopePath || scopePath.length === 0) {
    if (scopeId) {
      // eslint-disable-next-line no-console
      console.warn(
        `SchemaUpdater: Failed to resolve scopeId "${scopeId}", falling back to root`,
      );
    }
    return schema.properties;
  }

  // Scope to the parent object of the SchemaUpdater field
  const parentScope = scopePath.slice(0, -1);
  if (parentScope.length === 0) {
    return schema.properties;
  }

  let current: JSONSchema7 | undefined = schema;
  for (const key of parentScope) {
    if (
      current?.type === 'array' &&
      current.items &&
      typeof current.items === 'object'
    ) {
      current = current.items as JSONSchema7;
    }

    const properties = current?.properties;
    if (!properties || typeof properties !== 'object') {
      return undefined;
    }

    const next = properties[key];
    if (!next || typeof next !== 'object') {
      return undefined;
    }
    current = next as JSONSchema7;
  }

  if (
    current?.type === 'array' &&
    current.items &&
    typeof current.items === 'object'
  ) {
    return (current.items as JSONSchema7).properties;
  }

  return current?.properties;
};

// Stops searching and replacing after first hit
const deepSearchAndFirstReplace = (
  schemaProperties: JSONSchema7['properties'],
  placeholderId: string,
  chunk: JsonObject,
): boolean => {
  if (!schemaProperties) {
    return false;
  }

  if (schemaProperties[placeholderId]) {
    // hit
    if (!isEqual(schemaProperties[placeholderId], chunk)) {
      schemaProperties[placeholderId] = chunk;
    }
    return true;
  }

  for (const key of Object.keys(schemaProperties)) {
    if (typeof schemaProperties[key] === 'object') {
      // to make tsc happy
      const subproperties = (schemaProperties[key] as JSONSchema7).properties;

      if (deepSearchAndFirstReplace(subproperties, placeholderId, chunk)) {
        return true;
      }
    }
  }

  return false;
};

export const getSchemaUpdater: (
  schema: JSONSchema7 | undefined,
  setSchema: (schema: JSONSchema7) => void,
) => OrchestratorFormSchemaUpdater =
  (schema, setSchema) => (chunks, scopeId) => {
    if (!schema?.properties) {
      return;
    }

    const newSchema = cloneDeep(schema);
    const scopedProperties =
      getScopedProperties(newSchema, scopeId) ?? newSchema.properties;

    for (const [placeholderId, chunk] of Object.entries(chunks)) {
      deepSearchAndFirstReplace(scopedProperties, placeholderId, chunk);
    }

    if (!isEqual(schema, newSchema)) {
      setSchema(newSchema);
    }
  };
