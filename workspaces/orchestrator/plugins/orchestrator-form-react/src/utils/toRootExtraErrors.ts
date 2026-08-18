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

/**
 * RJSF `extraErrors` must match the root `schema.properties` shape. For
 * multi-step forms, `getExtraErrors` returns a tree keyed by step name; pass
 * `activeKey` so the slice is wrapped again for the root form.
 */
export function toRootExtraErrors(
  activeKey: string | undefined,
  extraErrors: ErrorSchema<JsonObject> | undefined,
): ErrorSchema<JsonObject> | undefined {
  if (!extraErrors) {
    return undefined;
  }
  if (!activeKey) {
    return extraErrors;
  }
  const slice = extraErrors[activeKey];
  if (!slice) {
    return undefined;
  }
  return { [activeKey]: slice } as ErrorSchema<JsonObject>;
}
