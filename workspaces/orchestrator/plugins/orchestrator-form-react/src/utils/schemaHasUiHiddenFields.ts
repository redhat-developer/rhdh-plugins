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

import type { JSONSchema7 } from 'json-schema';
import { get } from 'lodash';

/**
 * Returns true when the schema tree contains any `ui:hidden` marker (static or conditional),
 * matching how the default review step decides to show the hidden-fields notice.
 *
 * @public
 */
export function schemaHasUiHiddenFields(schema: JSONSchema7): boolean {
  if (typeof schema === 'boolean') {
    return false;
  }

  if (get(schema, 'ui:hidden')) {
    return true;
  }

  if (schema.properties) {
    for (const prop of Object.values(schema.properties)) {
      if (typeof prop !== 'boolean' && schemaHasUiHiddenFields(prop)) {
        return true;
      }
    }
  }

  if (schema.items && typeof schema.items !== 'boolean') {
    if (Array.isArray(schema.items)) {
      for (const item of schema.items) {
        if (typeof item !== 'boolean' && schemaHasUiHiddenFields(item)) {
          return true;
        }
      }
    } else if (schemaHasUiHiddenFields(schema.items)) {
      return true;
    }
  }

  return false;
}
