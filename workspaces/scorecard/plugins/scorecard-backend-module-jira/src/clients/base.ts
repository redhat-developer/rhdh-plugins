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
} from './types';
import {
  API_VERSION_DEFAULT,
  JIRA_CONFIG_PATH,
  JIRA_OPTIONS_PATH,
  JIRA_MANDATORY_FILTER,
} from '../constants';
import { ScorecardJiraAnnotations } from '../annotations';

const { PROJECT_KEY, COMPONENT, LABEL, TEAM, CUSTOM_FILTER } =
  ScorecardJiraAnnotations;

export abstract class JiraClient {
  protected readonly config: JiraConfig;
  protected readonly options?: JiraOptions;

  constructor(rootConfig: Config) {
    const jiraConfig = rootConfig.getConfig(JIRA_CONFIG_PATH);
    this.config = {
      baseUrl: jiraConfig.getString('baseUrl'),
      token: jiraConfig.getString('token'),
      product: jiraConfig.getString('product') as Product,
      apiVersion: jiraConfig.getOptionalString('apiVersion'),
    };

    const jiraOptions = rootConfig.getOptionalConfig(JIRA_OPTIONS_PATH);
    if (jiraOptions) {
      this.options = {
        mandatoryFilter: jiraOptions.getOptionalString('mandatoryFilter'),
        customFilter: jiraOptions.getOptionalString('customFilter'),
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

  private sanitizeValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private validateIdentifier(value: string, fieldName: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      throw new Error(
        `${fieldName} contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.`,
      );
    }
    return value;
  }

  protected getFiltersFromEntity(entity: Entity): JiraEntityFilters {
    const annotations = entity?.metadata?.annotations || {};

    const projectKey = annotations[PROJECT_KEY];
    if (!projectKey) {
      throw new Error(
        `Missing required 'jira/project-key' annotation for entity '${
          entity.metadata?.name || 'unknown'
        }'`,
      );
    }

    const sanitizedProjectKey = this.sanitizeValue(projectKey);
    const filters: JiraEntityFilters = {
      project: `project = "${this.validateIdentifier(
        sanitizedProjectKey,
        PROJECT_KEY,
      )}"`,
    };

    const component = annotations[COMPONENT];
    if (component) {
      const sanitizedComponent = this.sanitizeValue(component);
      filters.component = `component = "${this.validateIdentifier(
        sanitizedComponent,
        COMPONENT,
      )}"`;
    }

    const label = annotations[LABEL];
    if (label) {
      const sanitizedLabel = this.sanitizeValue(label);
      filters.label = `labels = "${this.validateIdentifier(
        sanitizedLabel,
        LABEL,
      )}"`;
    }

    const team = annotations[TEAM];
    if (team) {
      const sanitizedTeam = this.sanitizeValue(team);
      filters.team = `team = "${this.validateIdentifier(sanitizedTeam, TEAM)}"`;
    }

    const customFilter = annotations[CUSTOM_FILTER];
    if (customFilter) {
      filters.customFilter = customFilter;
    }

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
      ...filters,
      defaultFilterQuery,
      customFilterQuery,
    })
      .filter(value => value && value !== '')
      .map(value => `(${value})`)
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
