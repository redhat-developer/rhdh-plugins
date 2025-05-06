/*
 * Copyright The Backstage Authors
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

/**
 * @public
 */
export type DynamicPluginAppConfig = {
  dynamicPlugins?: { frontend?: JsonObject };
};

/**
 * @public
 */
export type DynamicPackageConfig = {
  package: string;
  disabled?: boolean;
  pluginConfig?: DynamicPluginAppConfig;
};

/**
 * @public
 */
export function isDynamicPackageConfig(
  obj: unknown,
): obj is DynamicPackageConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  const pkg = obj as Record<string, unknown>;

  if (typeof pkg.package !== 'string' || pkg.package.trim() === '')
    return false;
  if ('disabled' in pkg && typeof pkg.disabled !== 'boolean') return false;
  if (
    'pluginConfig' in pkg &&
    (typeof pkg.pluginConfig !== 'object' ||
      pkg.pluginConfig === null ||
      Array.isArray(pkg.pluginConfig))
  )
    return false;
  return true;
}
