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
import { JIRA_CONFIG_PATH, OPEN_ISSUES_CONFIG_PATH } from '../constants';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  getThresholdsFromConfig,
  MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraClient } from '../clients/base';
import { JiraClientFactory } from '../clients/JiraClientFactory';
import { ScorecardJiraAnnotations } from '../annotations';
import {
  type AuthService,
  type DiscoveryService,
} from '@backstage/backend-plugin-api';
import {
  ConnectionStrategy,
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from '../strategies/ConnectionStrategy';
import { Product } from '../clients/types';

const { PROJECT_KEY } = ScorecardJiraAnnotations;
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

export class JiraOpenIssuesProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;
  private readonly jiraClient: JiraClient;

  private constructor(
    config: Config,
    connectionStrategy: ConnectionStrategy,
    thresholds: ThresholdConfig,
  ) {
    this.jiraClient = JiraClientFactory.create(config, connectionStrategy);
    this.thresholds = thresholds;
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
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
    return 'jira.open_issues';
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of issues that are currently open in Jira.',
      type: this.getMetricType(),
      history: true,
    };
  }

  supportsEntity(entity: Entity): boolean {
    return entity.metadata.annotations?.[PROJECT_KEY] !== undefined;
  }

  static fromConfig(
    config: Config,
    options: {
      auth: AuthService;
      discovery: DiscoveryService;
    },
  ): JiraOpenIssuesProvider {
    let connectionStrategy: ConnectionStrategy;

    const jiraConfig = config.getConfig(JIRA_CONFIG_PATH);
    const proxyPath = jiraConfig.getOptionalString('proxyPath');

    if (proxyPath) {
      connectionStrategy = new ProxyConnectionStrategy(
        proxyPath,
        options.auth,
        options.discovery,
      );
    } else {
      connectionStrategy = new DirectConnectionStrategy(
        jiraConfig.getString('baseUrl'),
        jiraConfig.getString('token'),
        jiraConfig.getString('product') as Product,
      );
    }

    const thresholds =
      getThresholdsFromConfig(
        config,
        `${OPEN_ISSUES_CONFIG_PATH}.thresholds`,
        'number',
      ) ?? DEFAULT_NUMBER_THRESHOLDS;

    return new JiraOpenIssuesProvider(config, connectionStrategy, thresholds);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    return this.jiraClient.getCountOpenIssues(entity);
  }
}
