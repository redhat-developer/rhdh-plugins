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

import { ErrorSchema } from '@rjsf/utils';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

export function mergeExtraErrors(
  existing: ErrorSchema<JsonObject> | undefined,
  fieldErrors: ErrorSchema<JsonObject>,
  fieldPath: string,
): ErrorSchema<JsonObject> | undefined {
  const result = existing ? cloneDeep(existing) : {};

  unset(result, fieldPath);

  const newFieldError = get(fieldErrors, fieldPath);
  if (newFieldError && typeof newFieldError === 'object') {
    set(result, fieldPath, newFieldError);
  }

  if (Object.keys(result).length === 0) return undefined;
  return result as ErrorSchema<JsonObject>;
}
