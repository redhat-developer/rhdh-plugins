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

export const parseValidationErrorBody = async (
  response: Response,
): Promise<JsonObject | undefined> => {
  try {
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (!text) {
        return undefined;
      }
      return JSON.parse(text) as JsonObject;
    }
    if (typeof response.json === 'function') {
      return (await response.json()) as JsonObject;
    }
  } catch {
    return undefined;
  }
  return undefined;
};
