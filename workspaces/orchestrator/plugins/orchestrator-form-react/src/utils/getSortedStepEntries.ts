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
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import get from 'lodash/get';

/**
 * Get step entries from the schema sorted by the ui:order property.
 * If the ui:order property is not present, the step entries are sorted by the order of the properties in the schema.
 * Hidden steps (with ui:hidden: true) are filtered out.
 * Steps where ALL inputs are marked with ui:hidden: true are also automatically filtered out.
 *
 * @param schema - The schema to get the sorted step entries from.
 * @returns An array of [key, subSchema] pairs, a subSchema conforms a single wizard step.
 */
export const getSortedStepEntries = (
  schema: JSONSchema7,
): [string, JSONSchema7Definition][] | undefined => {
  if (!schema.properties) {
    return undefined;
  }

  let sortedStepEntries = Object.entries(schema.properties);

  const uiOrder = get(schema, 'ui:order') as string[] | undefined;
  if (uiOrder && uiOrder.length > 0) {
    sortedStepEntries = uiOrder
      .map(key =>
        schema.properties?.[key] ? [key, schema.properties[key]] : undefined,
      )
      .filter(Boolean) as [string, JSONSchema7Definition][];

    Object.entries(schema.properties).forEach(([key, subSchema]) => {
      if (!uiOrder.includes(key)) {
        sortedStepEntries.push([key, subSchema]);
      }
    });
  }

  // Filter out hidden steps (fields with ui:hidden: true)
  // Also filter out steps where ALL inputs are hidden
  sortedStepEntries = sortedStepEntries.filter(([_, subSchema]) => {
    if (typeof subSchema === 'boolean') {
      return true;
    }

    // Check if step itself is explicitly hidden
    if (get(subSchema, 'ui:hidden') === true) {
      return false;
    }

    // Check if ALL inputs within this step are hidden
    if (subSchema.type === 'object' && subSchema.properties) {
      const properties = Object.values(subSchema.properties);

      // If step has properties, check if all are hidden
      if (properties.length > 0) {
        const allHidden = properties.every(prop => {
          if (typeof prop === 'boolean') {
            return false;
          }
          return get(prop, 'ui:hidden') === true;
        });

        if (allHidden) {
          return false;
        }
      }
    }

    return true;
  });

  return sortedStepEntries;
};

export const getActiveStepKey = (
  schema: JSONSchema7,
  activeStep: number,
): string => {
  const sortedStepEntries = getSortedStepEntries(schema) ?? [];
  const activeKey = sortedStepEntries[activeStep]?.[0];
  if (!activeKey) {
    throw new Error(
      `Active step key not found for activeStep: ${activeStep} in schema: ${JSON.stringify(schema)}`,
    );
  }
  return activeKey;
};
