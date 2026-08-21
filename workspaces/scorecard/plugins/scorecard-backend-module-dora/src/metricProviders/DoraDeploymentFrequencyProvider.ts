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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { DORA_TIME_WINDOW_DAYS } from '../constants';
import { daysToMilliseconds } from '../scheduler/utils';
import type { DoraDataService } from '../service/DoraDataService';
import type { DoraSyncService } from '../service/DoraSyncService';
import {
  DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS,
  type DoraDeploymentFrequencyConfig,
  parseDoraDeploymentFrequencyConfig,
} from './DoraConfig';
import { isProductionEnvironment } from './utils/deploymentFilterUtils';

type DoraDeploymentFrequencyProviderOptions = {
  doraSyncService: DoraSyncService;
  doraDataService: DoraDataService;
  config: DoraDeploymentFrequencyConfig;
};

export class DoraDeploymentFrequencyProvider
  implements MetricProvider<'number'>
{
  private readonly doraSyncService: DoraSyncService;
  private readonly doraDataService: DoraDataService;
  private readonly config: DoraDeploymentFrequencyConfig;

  private constructor(options: DoraDeploymentFrequencyProviderOptions) {
    this.doraSyncService = options.doraSyncService;
    this.doraDataService = options.doraDataService;
    this.config = options.config;
  }

  static fromConfig(
    config: Config,
    options: {
      doraSyncService: DoraSyncService;
      doraDataService: DoraDataService;
    },
  ): DoraDeploymentFrequencyProvider {
    return new DoraDeploymentFrequencyProvider({
      doraSyncService: options.doraSyncService,
      doraDataService: options.doraDataService,
      config: parseDoraDeploymentFrequencyConfig(config),
    });
  }

  getProviderDatasourceId(): string {
    return 'dora';
  }

  getProviderId() {
    return 'dora.deploymentFrequency';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: this.getProviderId(),
        title: 'DORA - Deployment Frequency',
        description:
          'Tracks how often code is successfully deployed to production over the past 30 days. Elite performers deploy on demand (multiple times per day).',
        type: 'number',
        thresholds: DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS,
        unit: '/week',
        history: true,
        defaultVisualization: 'sparkline',
        collectorIds: [this.config.deploymentsCollector.id],
      },
    ];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.scorecard.io/dora': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const to = new Date();
    const from = new Date(
      to.getTime() - daysToMilliseconds(DORA_TIME_WINDOW_DAYS),
    );

    await this.doraSyncService.syncDeployments(entity, {
      windowFrom: from,
      windowTo: to,
      collector: this.config.deploymentsCollector,
    });

    const deployments = (
      await this.doraDataService.readDeployments(stringifyEntityRef(entity), {
        windowFrom: from,
        windowTo: to,
        collector: this.config.deploymentsCollector,
      })
    ).filter(deployment =>
      isProductionEnvironment(
        deployment.environment,
        this.config.productionEnvironments,
      ),
    );

    if (deployments.length === 0) {
      results.set(this.getProviderId(), 0);
      return results;
    }

    const deploymentsPerWeek = (deployments.length / DORA_TIME_WINDOW_DAYS) * 7;
    results.set(this.getProviderId(), Number(deploymentsPerWeek.toFixed(4)));
    return results;
  }
}
