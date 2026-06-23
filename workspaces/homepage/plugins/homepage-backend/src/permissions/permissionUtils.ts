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

import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { VisibleDefaultWidget } from '../defaultWidgets/types';
import { rules as homepageRules } from './rules';

export const matches = (
  widget: VisibleDefaultWidget,
  filters?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): boolean => {
  if (!filters) {
    return true;
  }

  if ('allOf' in filters) {
    return filters.allOf.every(filter => matches(widget, filter));
  }

  if ('anyOf' in filters) {
    return filters.anyOf.some(filter => matches(widget, filter));
  }

  if ('not' in filters) {
    return !matches(widget, filters.not);
  }

  const matchedRule = Object.values(homepageRules).find(
    r => r.name === filters.rule,
  ) as any;
  return matchedRule?.apply(widget, filters.params ?? {}) ?? false;
};

export const filterAuthorizedWidgets = (
  widgets: VisibleDefaultWidget[],
  filter?: PermissionCriteria<
    PermissionCondition<string, PermissionRuleParams>
  >,
): VisibleDefaultWidget[] => {
  if (!filter) return widgets;
  return widgets.filter(
    widget =>
      !widget.tags || widget.tags.length === 0 || matches(widget, filter),
  );
};
