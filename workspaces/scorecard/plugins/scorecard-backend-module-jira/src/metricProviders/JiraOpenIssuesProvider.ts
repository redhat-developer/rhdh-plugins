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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { JIRA_CONFIG_PATH, THRESHOLDS_CONFIG_PATH } from '../constants';
import {
  AuthService,
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { BaseMetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraClient } from '../clients/base';
import { JiraClientFactory } from '../clients/JiraClientFactory';
import { ScorecardJiraAnnotations } from '../annotations';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerService,
  SchedulerServiceTaskRunner,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import {
  ConnectionStrategy,
  DirectConnectionStrategy,
  ProxyConnectionStrategy,
} from '../strategies/ConnectionStrategy';
import { Product } from '../clients/types';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { v4 as uuid } from 'uuid';

const { PROJECT_KEY } = ScorecardJiraAnnotations;

export class JiraOpenIssuesProvider extends BaseMetricProvider<'number'> {
  private readonly jiraClient: JiraClient;

  private constructor(
    config: Config,
    connectionStrategy: ConnectionStrategy,
    auth: AuthService,
    logger: LoggerService,
    catalog: CatalogService,
    taskRunner: SchedulerServiceTaskRunner,
    thresholds?: ThresholdConfig,
  ) {
    super(
      auth,
      logger,
      catalog,
      taskRunner,
      { 'metadata.annotations.jira/project-key': CATALOG_FILTER_EXISTS },
      thresholds ?? DEFAULT_NUMBER_THRESHOLDS,
    );
    this.jiraClient = JiraClientFactory.create(config, connectionStrategy);
  }

  getProviderDatasourceId(): string {
    return 'jira';
  }

  getProviderId() {
    return 'jira.open_issues';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Jira open blocking tickets',
      description:
        'Highlights the number of issues that are currently open in Jira.',
      type: 'number',
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
      logger: LoggerService;
      scheduler: SchedulerService;
      catalog: CatalogService;
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

    const thresholds = this.getThresholdsFromConfig(
      config,
      `${OPEN_ISSUES_CONFIG_PATH}.thresholds`,
    );
    const schedule = BaseMetricProvider.getScheduleFromConfig(
      config,
      `${OPEN_ISSUES_CONFIG_PATH}.schedule`,
    );
    const taskRunner = options.scheduler.createScheduledTaskRunner(schedule);

    return new JiraOpenIssuesProvider(
      config,
      connectionStrategy,
      options.auth,
      options.logger,
      options.catalog,
      taskRunner,
      thresholds,
    );
  }

  async calculateMetric(entity: Entity): Promise<number> {
    return this.jiraClient.getCountOpenIssues(entity);
  }
}
