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

export const safeSet: (
  errors: JsonObject,
  path: string,
  value: JsonValue,
) => void = (errors, path, value) => {
  const steps = path.split('.', 2);
  if (steps.length === 1) {
    errors[steps[0]] = value;
  } else {
    const safeObject = (errors[steps[0]] ?? {}) as JsonObject;
    errors[steps[0]] = safeObject;
    safeSet(safeObject, steps[1], value);
  }
};
