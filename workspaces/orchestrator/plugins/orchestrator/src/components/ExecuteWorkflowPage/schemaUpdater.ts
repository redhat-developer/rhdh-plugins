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
import isEqual from 'lodash/isEqual';

import { OrchestratorFormSchemaUpdater } from '@redhat/backstage-plugin-orchestrator-form-api';

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
) => OrchestratorFormSchemaUpdater = (schema, setSchema) => chunks => {
  if (!schema?.properties) {
    return;
  }

  const newSchema = structuredClone(schema);
  for (const [placeholderId, chunk] of Object.entries(chunks)) {
    deepSearchAndFirstReplace(newSchema.properties, placeholderId, chunk);
  }

  if (!isEqual(schema, newSchema)) {
    setSchema(newSchema);
  }
};
