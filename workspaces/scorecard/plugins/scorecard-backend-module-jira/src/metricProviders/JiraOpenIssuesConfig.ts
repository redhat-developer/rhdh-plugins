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

import type { Config } from '@backstage/config';
import { validateJqlExpression } from '../clients/utils';
import { OPEN_ISSUES_CONFIG_PATH } from '../constants';

export interface JiraOpenIssuesOptions {
  mandatoryFilter?: string;
  customFilter?: string;
}

type JiraOpenIssuesFilterOptionKey = keyof JiraOpenIssuesOptions;

/**
 * Parses and validates an optional free-form JQL filter from openIssues options.
 * Missing or whitespace-only values are treated as unset.
 */
function parseOptionalJqlFilter(
  optionsConfig: Config | undefined,
  key: JiraOpenIssuesFilterOptionKey,
): string | undefined {
  const raw = optionsConfig?.getOptionalString(key);
  if (raw === undefined || !raw.trim()) {
    return undefined;
  }

  return validateJqlExpression(
    raw,
    `${OPEN_ISSUES_CONFIG_PATH}.options.${key}`,
  );
}

/**
 * Parses open-issues provider options from app-config.
 */
export function parseJiraOpenIssuesConfigOptions(
  config: Config,
): JiraOpenIssuesOptions {
  const optionsConfig = config.getOptionalConfig(
    `${OPEN_ISSUES_CONFIG_PATH}.options`,
  );

  return {
    mandatoryFilter: parseOptionalJqlFilter(optionsConfig, 'mandatoryFilter'),
    customFilter: parseOptionalJqlFilter(optionsConfig, 'customFilter'),
  };
}
