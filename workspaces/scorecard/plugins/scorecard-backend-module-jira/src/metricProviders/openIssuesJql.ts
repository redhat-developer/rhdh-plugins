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

import type { JiraJqlFilters } from '../annotations';
import { joinJqlClauses } from '../clients/utils';
import { JIRA_MANDATORY_FILTER } from '../constants';
import type { JiraOpenIssuesOptions } from './JiraOpenIssuesConfig';

export function buildOpenIssuesJql(
  entityFilters: JiraJqlFilters,
  configOptions: JiraOpenIssuesOptions,
): string {
  const { customFilter: annotationCustomFilter } = entityFilters;
  const { mandatoryFilter, customFilter: optionsCustomFilter } = configOptions;

  const defaultFilterQuery = mandatoryFilter?.trim() || JIRA_MANDATORY_FILTER;

  const customFilterQuery =
    !annotationCustomFilter && optionsCustomFilter?.trim()
      ? optionsCustomFilter
      : null;

  return joinJqlClauses([
    ...Object.values(entityFilters),
    defaultFilterQuery,
    customFilterQuery,
  ]);
}
