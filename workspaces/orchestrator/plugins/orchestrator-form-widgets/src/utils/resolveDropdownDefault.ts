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

import { applySelectorString } from './applySelector';

type ResolveDropdownDefaultOptions = {
  data?: JsonObject;
  values: string[];
  staticDefault?: string;
};

export const resolveDropdownDefault = async ({
  data,
  values,
  staticDefault,
}: ResolveDropdownDefaultOptions): Promise<string | undefined> => {
  if (!values || values.length === 0) {
    return undefined;
  }

  const hasStaticDefault = typeof staticDefault === 'string';
  let resolvedDefault: string | undefined;

  if (hasStaticDefault && data) {
    try {
      resolvedDefault = await applySelectorString(data, staticDefault);
    } catch {
      resolvedDefault = undefined;
    }
  }

  if (resolvedDefault && values.includes(resolvedDefault)) {
    return resolvedDefault;
  }

  if (hasStaticDefault && values.includes(staticDefault)) {
    return staticDefault;
  }

  return values[0];
};
