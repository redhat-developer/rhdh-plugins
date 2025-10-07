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
import { JiraEntityFilters, JiraOptions, RequestOptions } from './types';
import { JIRA_OPTIONS_PATH, JIRA_MANDATORY_FILTER } from '../constants';
import { ScorecardJiraAnnotations } from '../annotations';
import { sanitizeValue, validateIdentifier, validateJQLValue } from './utils';
import { ConnectionStrategy } from '../strategies/ConnectionStrategy';

const { PROJECT_KEY, COMPONENT, LABEL, TEAM, CUSTOM_FILTER } =
  ScorecardJiraAnnotations;

export abstract class JiraClient {
  protected readonly options?: JiraOptions;
  protected readonly connectionStrategy: ConnectionStrategy;

  constructor(rootConfig: Config, connectionStrategy: ConnectionStrategy) {
    this.connectionStrategy = connectionStrategy;

    const jiraOptions = rootConfig.getOptionalConfig(JIRA_OPTIONS_PATH);
    if (jiraOptions) {
      this.options = {
        mandatoryFilter: jiraOptions.getOptionalString('mandatoryFilter'),
        customFilter: jiraOptions.getOptionalString('customFilter'),
      };
    }
  }

  protected abstract getSearchEndpoint(): string;

  protected abstract buildSearchBody(jql: string): string;

  protected abstract extractIssueCountFromResponse(data: unknown): number;

  protected abstract getApiVersion(): number;

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

    const projectKey = annotations[PROJECT_KEY];
    if (!projectKey) {
      throw new Error(
        `Missing required '${PROJECT_KEY}' annotation for entity '${
          entity.metadata?.name || 'unknown'
        }'`,
      );
    }

    const sanitizedProjectKey = sanitizeValue(projectKey);
    const filters: JiraEntityFilters = {
      project: `project = "${validateJQLValue(
        sanitizedProjectKey,
        PROJECT_KEY,
      )}"`,
    };

    const component = annotations[COMPONENT];
    if (component) {
      const sanitizedComponent = sanitizeValue(component);
      filters.component = `component = "${validateJQLValue(
        sanitizedComponent,
        COMPONENT,
      )}"`;
    }

    const label = annotations[LABEL];
    if (label) {
      const sanitizedLabel = sanitizeValue(label);
      filters.label = `labels = "${validateJQLValue(sanitizedLabel, LABEL)}"`;
    }

    const team = annotations[TEAM];
    if (team) {
      const sanitizedTeam = sanitizeValue(team);
      filters.team = `team = ${validateIdentifier(sanitizedTeam, TEAM)}`;
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

  protected async getBaseUrl(): Promise<string> {
    const apiVersion = this.getApiVersion();
    return this.connectionStrategy.getBaseUrl(apiVersion);
  }

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    return this.connectionStrategy.getAuthHeaders();
  }

  public async getCountOpenIssues(entity: Entity): Promise<number> {
    const baseUrl = await this.getBaseUrl();
    const countOpenIssuesUrl = `${baseUrl}${this.getSearchEndpoint()}`;

    const filters = this.getFiltersFromEntity(entity);
    const jql = this.buildJqlFilters(filters);
    const headers = await this.getAuthHeaders();

    const data = await this.sendRequest({
      method: 'POST',
      url: countOpenIssuesUrl,
      headers,
      body: this.buildSearchBody(jql),
    });

    return this.extractIssueCountFromResponse(data);
  }
}
