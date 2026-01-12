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

/* eslint-disable @typescript-eslint/no-use-before-define */

import { JsonObject } from '@backstage/types';

import { UiSchema } from '@rjsf/utils';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import get from 'lodash/get';
import merge from 'lodash/merge';
import set from 'lodash/set';

/**
 * Extracts the uiSchema from a mixed JSON Schema that includes
 * both standard JSON Schema properties and react-json-schema-form specific
 * UI Schema properties (prefixed with 'ui:'). The function does not modify
 * the original JSON Schema.
 *
 * @param mixedSchema - The JSON Schema that contains both standard and UI Schema properties.
 * @returns An object representing the uiSchema.
 */

const getSchemaDefinition = (ref: string, rootSchema: JSONSchema7) => {
  const path = ref.replace(/^#\//, '').replace(/\//g, '.');
  return get(rootSchema, path);
};

const getStringAfterDot = (input: string) =>
  input.startsWith('.') ? input.slice(1) : input;

function replaceSparseArrayElementsdWithEmptyObject(value: any): any {
  /* handle cases where ui: properties exists for some of the itmes in the array, for example: 
    {
      "selectedItem": {
      "anyOf": [
        ,
        ,
        {
          "ui:widget": "color",
        },
      ],
    }
    the function will return 
    {
      "selectedItem": {
      "anyOf": [
        {},
        {},
        {
          "ui:widget": "color",
        },
      ],
    }
  */
  if (Array.isArray(value)) {
    return [...value].map(item => {
      return item ? replaceSparseArrayElementsdWithEmptyObject(item) : {};
    });
  } else if (value && typeof value === 'object') {
    return Object.keys(value).reduce(
      (acc, key) => {
        acc[key] = replaceSparseArrayElementsdWithEmptyObject(value[key]);
        return acc;
      },
      {} as Record<string, any>,
    );
  }
  return value;
}

function extractUiSchema(mixedSchema: JSONSchema7): UiSchema<JsonObject> {
  const rootSchema = mixedSchema;
  const result = {};

  const processObjectProperties = (
    properties: {
      [key: string]: JSONSchema7Definition;
    },
    path: string,
  ) => {
    for (const [key, value] of Object.entries(properties)) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      processObject(value, `${path}.${key}`);
    }
  };

  const processObject = (curSchema: JSONSchema7Definition, path: string) => {
    if (typeof curSchema === 'boolean') {
      return;
    }
    if (curSchema.$ref) {
      processObject(getSchemaDefinition(curSchema.$ref, rootSchema), path);
    } else if (curSchema.properties) {
      processObjectProperties(curSchema.properties, path);
    } else if (curSchema.items) {
      processArraySchema(curSchema, path);
    } else {
      processLeafSchema(curSchema, path);
    }
    processOrder(curSchema, path);
    processComposedSchema(curSchema, path);
  };

  const processOrder = (curSchema: JSONSchema7Definition, path: string) => {
    const uiOrder = get(curSchema, 'ui:order');
    if (uiOrder) {
      const diff = {};
      set(diff, getStringAfterDot(`${path}.ui:order`), uiOrder);
      merge(result, diff);
    }
  };

  const processLeafSchema = (
    leafSchema: JSONSchema7Definition,
    path: string,
  ) => {
    for (const [subSchemaKey, value] of Object.entries(leafSchema)) {
      if (subSchemaKey.startsWith('ui:')) {
        set(result, getStringAfterDot(`${path}.${subSchemaKey}`), value);
      }
    }
  };

  const processArrayItems = (items: JSONSchema7Definition[], path: string) => {
    for (let i = 0; i < items.length; ++i) {
      processObject(items[i], `${path}[${i}]`);
    }
  };

  const processArraySchema = (schema: JSONSchema7, path: string) => {
    if (Array.isArray(schema.items)) {
      processArrayItems(schema.items, `${path}.items`);
    } else if (typeof schema.items === 'object') {
      processObject(schema.items, `${path}.items`);
    }
    if (schema.additionalItems && typeof schema.additionalItems === 'object') {
      processObject(schema.additionalItems, `${path}.additinalItems`);
    }
    processLeafSchema(schema, path);
  };

  const processComposedSchema = (curSchema: JSONSchema7, path: string) => {
    if (curSchema.anyOf) {
      processArrayItems(curSchema.anyOf, `${path}.anyOf`);
    } else if (curSchema.oneOf) {
      processArrayItems(curSchema.oneOf, `${path}.oneOf`);
    } else if (curSchema.allOf) {
      processArrayItems(curSchema.allOf, `${path}.allOf`);
    } else if (curSchema.then) {
      processObject(curSchema.then, `${path}`);
      if (curSchema.else) {
        processObject(curSchema.else, `${path}`);
      }
    }

    // Handle dependencies with oneOf - extract UI properties from conditional branches
    if (curSchema.dependencies) {
      Object.entries(curSchema.dependencies).forEach(([_depKey, depValue]) => {
        if (typeof depValue === 'object' && !Array.isArray(depValue)) {
          const depSchema = depValue as JSONSchema7;
          if (depSchema.oneOf) {
            // Process each oneOf branch to extract UI properties
            depSchema.oneOf.forEach(branch => {
              if (typeof branch === 'object' && branch.properties) {
                processObjectProperties(branch.properties, path);
              }
            });
          }
        }
      });
    }
  };

  processObject(mixedSchema, '');
  return replaceSparseArrayElementsdWithEmptyObject(result);
}

const addFocusOnFirstElement = (
  schema: JSONSchema7,
  uiSchema: UiSchema<JsonObject>,
  isMultiStep: boolean,
) => {
  if (!schema.properties) {
    return;
  }
  if (!isMultiStep) {
    const firstKey = Object.keys(schema.properties)[0];
    uiSchema[firstKey] = {
      ...uiSchema[firstKey],
      'ui:autofocus': true,
    };
  }
  for (const [stepKey, subSchema] of Object.entries(schema.properties)) {
    if (typeof subSchema !== 'object') {
      return;
    }
    const _subSchema = subSchema.$ref
      ? getSchemaDefinition(subSchema.$ref, schema)
      : subSchema;
    if (!_subSchema.properties) {
      return;
    }
    const subSchemaFirstKey = Object.keys(_subSchema.properties)[0];
    uiSchema[stepKey] = {
      ...uiSchema[stepKey],
      [subSchemaFirstKey]: {
        ...uiSchema[stepKey]?.[subSchemaFirstKey],
        'ui:autofocus': true,
      },
    };
  }
};

const generateUiSchema = (
  schema: JSONSchema7,
  isMultiStep: boolean,
): UiSchema<JsonObject> => {
  const uiSchema = extractUiSchema(schema);
  addFocusOnFirstElement(schema, uiSchema, isMultiStep);
  return uiSchema;
};

export default generateUiSchema;
