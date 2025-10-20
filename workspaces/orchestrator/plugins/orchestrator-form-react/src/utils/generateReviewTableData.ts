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
import { JsonSchema, Draft07 as JSONSchema } from 'json-schema-library';

import { isJsonObject } from '@redhat/backstage-plugin-orchestrator-common';

export function processSchema(
  key: string,
  value: JsonValue | undefined,
  schema: JSONSchema7,
  formState: JsonObject,
): JsonObject {
  const parsedSchema = new JSONSchema(schema);
  const definitionInSchema =
    key === ''
      ? (schema as JsonSchema)
      : parsedSchema.getSchema({
          pointer: `#/${key}`,
          data: formState,
        });

  const name = definitionInSchema?.title ?? key;
  if (definitionInSchema) {
    if (definitionInSchema['ui:widget'] === 'password') {
      return { [name]: '******' };
    }

    if (isJsonObject(value)) {
      // Recurse nested objects
      const nestedValue = Object.entries(value).reduce(
        (prev, [nestedKey, _nestedValue]) => {
          const curKey = key ? `${key}/${nestedKey}` : nestedKey;
          return {
            ...prev,
            ...processSchema(curKey, _nestedValue, schema, formState),
          };
        },
        {},
      );

      return { [name]: nestedValue };
    }
  }

  return { [name]: value };
}

function generateReviewTableData(
  schema: JSONSchema7,
  data: JsonObject,
): JsonObject {
  schema.title = '';
  const result = processSchema('', data, schema, data);
  return result[''] as JsonObject;
}

export default generateReviewTableData;
