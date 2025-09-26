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
import { THRESHOLDS_CONFIG_PATH } from '../constants';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { JiraClient } from '../clients/base';
import { JiraClientFactory } from '../clients/JiraClientFactory';

export class JiraOpenIssuesProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;
  private readonly jiraClient: JiraClient;

  private constructor(config: Config, thresholds?: ThresholdConfig) {
    this.jiraClient = JiraClientFactory.create(config);
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
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

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  supportsEntity(entity: Entity): boolean {
    return entity.metadata.annotations?.['jira/project-key'] !== undefined;
  }

  static fromConfig(config: Config): JiraOpenIssuesProvider {
    const configuredThresholds = config.getOptional(THRESHOLDS_CONFIG_PATH);
    if (configuredThresholds !== undefined) {
      validateThresholds(configuredThresholds, 'number');
    }

    return new JiraOpenIssuesProvider(config, configuredThresholds);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    return this.jiraClient.getCountOpenIssues(entity);
  }
}
