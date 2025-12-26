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

import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';

import { MarketplacePlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { ExtensionParams, rules as extensionRules } from '../permissions/rules';

export const matches = (
  plugin?: MarketplacePlugin,
  filters?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): boolean => {
  if (!filters) {
    return true;
  }

  if (!plugin) {
    return false;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(plugin, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(plugin, filter));
  }

  if ('not' in filters) {
    return !matches(plugin, filters.not);
  }
  return (
    Object.values(extensionRules)
      .find(r => r.name === filters.rule)
      ?.apply(plugin, filters.params as ExtensionParams) ?? false
  );
};
