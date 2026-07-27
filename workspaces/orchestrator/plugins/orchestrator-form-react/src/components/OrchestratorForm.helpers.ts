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

import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';

export const getNumSteps = (schema: JSONSchema7): number | undefined => {
  if (schema.type !== 'object' || !schema.properties) return undefined;
  const isMultiStep = Object.values(schema.properties).every(
    prop => (prop as JSONSchema7).type === 'object',
  );
  return isMultiStep ? Object.keys(schema.properties).length : undefined;
};

/**
 * Remove hidden steps from the schema.
 *
 * A wizard step is removed when
 *   "type": "object"
 *   "ui:widget": "hidden"
 *   and properties are empty ("properties": {})
 *
 * @param schema - The schema to remove hidden steps from.
 * @returns The schema with hidden steps removed.
 */
export const removeHiddenSteps = (schema: JSONSchema7): JSONSchema7 => {
  if (typeof schema.properties === 'object') {
    const hiddenSteps = Object.entries(schema.properties)
      .map(([key, value]: [string, JSONSchema7Definition]) => {
        const uiWidget = get(value, 'ui:widget');
        if (
          typeof value !== 'boolean' &&
          value.type === 'object' &&
          uiWidget === 'hidden' &&
          value.properties &&
          Object.keys(value.properties).length === 0
        ) {
          return key;
        }
        return undefined;
      })
      .filter(Boolean) as string[];

    if (hiddenSteps.length > 0) {
      const newSchema = cloneDeep(schema);
      hiddenSteps.forEach(step => {
        delete newSchema.properties?.[step];
      });

      return newSchema;
    }
  }

  return schema;
};
