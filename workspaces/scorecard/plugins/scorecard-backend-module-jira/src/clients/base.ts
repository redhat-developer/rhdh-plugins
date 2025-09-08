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
import type { Entity } from '@backstage/catalog-model';
import {
  JiraConfig,
  JiraEntityFilters,
  JiraOptions,
  Product,
  RequestOptions,
} from '../types';
import {
  ANNOTATION_JIRA_PROJECT_KEY,
  ANNOTATION_JIRA_COMPONENT,
  ANNOTATION_JIRA_LABEL,
  ANNOTATION_JIRA_TEAM,
  ANNOTATION_JIRA_CUSTOM_FILTER,
  API_VERSION_DEFAULT,
  JIRA_CONFIG_PATH,
  JIRA_OPTIONS_PATH,
  JIRA_MANDATORY_FILTER,
  CONFIG_TOKEN,
  CONFIG_PRODUCT,
  CONFIG_API_VERSION,
  CONFIG_BASE_URL,
  CONFIG_MANDATORY_FILTER,
  CONFIG_CUSTOM_FILTER,
} from '../constants';

export abstract class JiraClient {
  protected readonly config: JiraConfig;
  protected readonly options?: JiraOptions;

  constructor(config: Config) {
    const jiraConfig = config.getConfig(JIRA_CONFIG_PATH);
    this.config = {
      baseUrl: jiraConfig.getString(CONFIG_BASE_URL),
      token: jiraConfig.getString(CONFIG_TOKEN),
      product: jiraConfig.getString(CONFIG_PRODUCT) as Product,
      apiVersion: jiraConfig.getOptionalString(CONFIG_API_VERSION),
    };

    const jiraOptions = config.getOptionalConfig(JIRA_OPTIONS_PATH);
    if (jiraOptions) {
      this.options = {
        mandatoryFilter: jiraOptions.getOptionalString(CONFIG_MANDATORY_FILTER),
        customFilter: jiraOptions.getOptionalString(CONFIG_CUSTOM_FILTER),
      };
    }
  }

  protected async sendRequest({
    url,
    method,
    headers = {},
    body = '',
  }: RequestOptions): Promise<unknown> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Atlassian-Token': 'no-check',
          ...headers,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Jira request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Jira error message: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  protected getFiltersFromEntity(entity: Entity): JiraEntityFilters {
    const annotations = entity?.metadata?.annotations || {};

    const projectKey = annotations[ANNOTATION_JIRA_PROJECT_KEY];
    if (!projectKey) {
      throw new Error(
        `Missing required 'jira/project-key' annotation for entity '${
          entity.metadata?.name || 'unknown'
        }'`,
      );
    }

    const filters: JiraEntityFilters = { project: `project = "${projectKey}"` };

    const component = annotations[ANNOTATION_JIRA_COMPONENT];
    if (component) filters.component = `component = "${component}"`;

    const label = annotations[ANNOTATION_JIRA_LABEL];
    if (label) filters.label = `labels = "${label}"`;

    const team = annotations[ANNOTATION_JIRA_TEAM];
    if (team) filters.team = `team = ${team}`;

    const customFilter = annotations[ANNOTATION_JIRA_CUSTOM_FILTER];
    if (customFilter) filters.customFilter = customFilter;

    return filters;
  }

  protected buildJqlFilters(filters: JiraEntityFilters): string {
    const { customFilter: annotationCustomFilter } = filters;
    const { mandatoryFilter, customFilter: optionsCustomFilter } =
      this.options || {};

    const defaultFilterQuery = mandatoryFilter ?? JIRA_MANDATORY_FILTER;

    const customFilterQuery =
      !annotationCustomFilter && optionsCustomFilter
        ? optionsCustomFilter
        : null;

    return Object.values({
      defaultFilterQuery,
      customFilterQuery,
      ...filters,
    })
      .filter(value => !!value)
      .join(' AND ');
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  async getCountOpenIssues(entity: Entity): Promise<number> {
    const filters = this.getFiltersFromEntity(entity);
    const jql = this.buildJqlFilters(filters);

    const apiVersion = this.config.apiVersion ?? API_VERSION_DEFAULT;
    const url = `${this.config.baseUrl}/rest/api/${apiVersion}/search`;

    const method = 'POST';

    const headers = this.getAuthHeaders();

    const body = JSON.stringify({
      jql,
      fields: [],
      maxResults: 0,
    });

    const data = await this.sendRequest({ url, method, headers, body });

    if (
      data &&
      typeof data === 'object' &&
      'total' in data &&
      typeof data.total === 'number'
    ) {
      return data.total;
    }

    throw new Error('Jira error during loading');
  }
}
