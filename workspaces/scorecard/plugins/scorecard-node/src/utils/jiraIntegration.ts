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
  JiraConfig,
  JiraOptions,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

/**
 * Validate Jira integration config to the expected schema
 * @public
 */

export function validateJiraConfig(
  jiraIntegration: unknown,
): asserts jiraIntegration is JiraConfig {
  if (typeof jiraIntegration !== 'object' || jiraIntegration === null) {
    throw new Error('Jira integration config must be an object');
  }

  if (
    !('baseUrl' in jiraIntegration) ||
    typeof jiraIntegration.baseUrl !== 'string' ||
    jiraIntegration.baseUrl.length === 0
  ) {
    throw new Error('Missing "baseUrl" for Jira integration config');
  }

  if (
    !('token' in jiraIntegration) ||
    typeof jiraIntegration.token !== 'string' ||
    jiraIntegration.token.length === 0
  ) {
    throw new Error('Missing "token" for Jira integration config');
  }

  if (
    !('product' in jiraIntegration) ||
    typeof jiraIntegration.product !== 'string' ||
    jiraIntegration.product.length === 0 ||
    !['datacenter', 'cloud'].includes(jiraIntegration.product)
  ) {
    throw new Error('Missing "product" for Jira integration config');
  }

  if ('apiVersion' in jiraIntegration) {
    if (
      typeof jiraIntegration.apiVersion !== 'string' ||
      jiraIntegration.apiVersion.length === 0
    ) {
      throw new Error('The "apiVersion" has invalid value format');
    }
  }
}

/**
 * Validate Jira options to the expected schema
 * @public
 */
export function validateJiraOptions(
  jiraOptions: unknown,
): asserts jiraOptions is JiraOptions | null {
  if (!jiraOptions) return;

  if (typeof jiraOptions !== 'object') {
    throw new Error('Jira options must be an object');
  }

  if ('mandatoryFilter' in jiraOptions && jiraOptions.mandatoryFilter) {
    if (typeof jiraOptions.mandatoryFilter !== 'string') {
      throw new Error('Jira options must have a mandatoryFilter property');
    }
  }

  if ('customFilter' in jiraOptions && jiraOptions.customFilter) {
    if (typeof jiraOptions.customFilter !== 'string') {
      throw new Error('Jira options must have a customFilter property');
    }
  }
}
