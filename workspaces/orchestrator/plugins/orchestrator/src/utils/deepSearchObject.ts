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

import { JsonObject } from '@backstage/types/index';

import { isJsonObject } from '@redhat/backstage-plugin-orchestrator-common';

/*
 * Recursively searches through a JSON object and its nested objects,
 * returning the first property for which the provided predicate returns true.
 *
 * @example
 * const result = deepSearchObject(schema, obj => obj['ui:widget'] === 'AuthRequester');
 */
export const deepSearchObject = (
  obj: JsonObject,
  predicate: (obj: JsonObject) => boolean,
): JsonObject | undefined => {
  if (predicate(obj)) {
    return obj;
  }

  for (const [_, value] of Object.entries(obj)) {
    if (isJsonObject(value)) {
      const result = deepSearchObject(value as JsonObject, predicate);
      if (result !== undefined) {
        return result;
      }
    }
  }

  return undefined;
};
