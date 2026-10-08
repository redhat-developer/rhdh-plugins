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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  buildJqlFiltersFromEntity,
  OPEN_ISSUES_FILTER_ANNOTATIONS,
} from '../annotations';
import { JiraClient } from '../clients/base';
import {
  parseJiraOpenIssuesConfigOptions,
  type JiraOpenIssuesOptions,
} from './JiraOpenIssuesConfig';
import { buildOpenIssuesJql } from './openIssuesJql';

export class JiraOpenIssuesProvider implements MetricProvider<'number'> {
  private readonly jiraClient: JiraClient;
  private readonly options: JiraOpenIssuesOptions;

  private constructor(jiraClient: JiraClient, options: JiraOpenIssuesOptions) {
    this.jiraClient = jiraClient;
    this.options = options;
  }

  static fromConfig(
    config: Config,
    options: { jiraClient: JiraClient },
  ): JiraOpenIssuesProvider {
    return new JiraOpenIssuesProvider(
      options.jiraClient,
      parseJiraOpenIssuesConfigOptions(config),
    );
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.jira/project-key': CATALOG_FILTER_EXISTS,
    };
  }

  getProviderDatasourceId(): string {
    return 'jira';
  }

  getProviderId() {
    return 'jira.openIssues';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: this.getProviderId(),
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of issues that are currently open in Jira.',
        type: 'number',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        history: true,
      },
    ];
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const entityFilters = buildJqlFiltersFromEntity(
      entity,
      OPEN_ISSUES_FILTER_ANNOTATIONS,
    );
    const jql = buildOpenIssuesJql(entityFilters, this.options);
    const value = await this.jiraClient.getCountOpenIssues(jql);
    const results = new Map<string, number>();
    results.set(this.getProviderId(), value);
    return results;
  }
}
