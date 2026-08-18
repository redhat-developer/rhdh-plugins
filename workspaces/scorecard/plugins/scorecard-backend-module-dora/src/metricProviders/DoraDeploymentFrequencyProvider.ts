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
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  type ScorecardCollectorsService,
  MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { DORA_TIME_WINDOW_DAYS } from '../constants';
import {
  deploymentsCollectorInputSchema,
  deploymentsCollectorOutputSchema,
} from './schemas/deploymentSchemas';
import {
  DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS,
  type DoraDeploymentFrequencyConfig,
  parseDoraDeploymentFrequencyConfig,
} from './DoraConfig';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { isSuccessfulProductionDeployment } from './utils/deploymentFilterUtils';

type DoraDeploymentFrequencyProviderOptions = {
  collectorsService: ScorecardCollectorsService;
  config: DoraDeploymentFrequencyConfig;
};

export class DoraDeploymentFrequencyProvider
  implements MetricProvider<'number'>
{
  private readonly collectorsService: ScorecardCollectorsService;
  private readonly config: DoraDeploymentFrequencyConfig;

  private constructor(options: DoraDeploymentFrequencyProviderOptions) {
    this.collectorsService = options.collectorsService;
    this.config = options.config;
  }

  static fromConfig(
    config: Config,
    options: {
      collectorsService: ScorecardCollectorsService;
    },
  ): DoraDeploymentFrequencyProvider {
    return new DoraDeploymentFrequencyProvider({
      collectorsService: options.collectorsService,
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
    const from = new Date();
    from.setDate(to.getDate() - DORA_TIME_WINDOW_DAYS);

    const deploymentsCollected = await this.collectorsService.collect<
      typeof deploymentsCollectorInputSchema,
      typeof deploymentsCollectorOutputSchema
    >({
      collectorId: this.config.deploymentsCollector.id,
      contract: {
        inputSchema: deploymentsCollectorInputSchema,
        outputSchema: deploymentsCollectorOutputSchema,
      },
      entity,
      input: {
        ...this.config.deploymentsCollector.input,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });

    if (deploymentsCollected.deployments.length === 0) {
      results.set(this.getProviderId(), 0);
      return results;
    }

    const deployments = deploymentsCollected.deployments.filter(deployment =>
      isSuccessfulProductionDeployment(
        deployment,
        this.config.productionEnvironments,
      ),
    );

    const deploymentsPerWeek = (deployments.length / DORA_TIME_WINDOW_DAYS) * 7;
    results.set(this.getProviderId(), Number(deploymentsPerWeek.toFixed(4)));
    return results;
  }
}
