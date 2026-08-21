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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { DORA_TIME_WINDOW_DAYS } from '../constants';
import { daysToMilliseconds } from '../scheduler/utils';
import type { DoraDataService } from '../service/DoraDataService';
import type { DoraSyncService } from '../service/DoraSyncService';
import {
  DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS,
  type DoraChangeFailureRateConfig,
  parseDoraChangeFailureRateConfig,
} from './DoraConfig';
import { isProductionEnvironment } from './utils/deploymentFilterUtils';

type DoraChangeFailureRateProviderOptions = {
  doraSyncService: DoraSyncService;
  doraDataService: DoraDataService;
  config: DoraChangeFailureRateConfig;
  logger: LoggerService;
};

export class DoraChangeFailureRateProvider implements MetricProvider<'number'> {
  private readonly doraSyncService: DoraSyncService;
  private readonly doraDataService: DoraDataService;
  private readonly config: DoraChangeFailureRateConfig;
  private readonly logger: LoggerService;

  private constructor(options: DoraChangeFailureRateProviderOptions) {
    this.doraSyncService = options.doraSyncService;
    this.doraDataService = options.doraDataService;
    this.config = options.config;
    this.logger = options.logger;
  }

  static fromConfig(
    config: Config,
    options: {
      doraSyncService: DoraSyncService;
      doraDataService: DoraDataService;
      logger: LoggerService;
    },
  ): DoraChangeFailureRateProvider {
    return new DoraChangeFailureRateProvider({
      doraSyncService: options.doraSyncService,
      doraDataService: options.doraDataService,
      config: parseDoraChangeFailureRateConfig(config),
      logger: options.logger,
    });
  }

  getProviderDatasourceId(): string {
    return 'dora';
  }

  getProviderId() {
    return 'dora.changeFailureRate';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: this.getProviderId(),
        title: 'DORA - Change Failure Rate',
        description:
          'Monitors the percentage of deployments that cause a failure in production over the past 30 days. Elite performers maintain a change failure rate below 5%.',
        type: 'number',
        thresholds: DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS,
        unit: '%',
        history: true,
        defaultVisualization: 'sparkline',
        collectorIds: [
          this.config.deploymentsCollector.id,
          this.config.incidentsCollector.id,
        ],
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

    await Promise.all([
      this.doraSyncService.syncDeployments(entity, {
        windowFrom: from,
        windowTo: to,
        collector: this.config.deploymentsCollector,
      }),
      this.doraSyncService.syncIncidents(entity, {
        windowFrom: from,
        windowTo: to,
        collector: this.config.incidentsCollector,
      }),
    ]);

    const catalogEntityRef = stringifyEntityRef(entity);
    const [deployments, incidents] = await Promise.all([
      this.doraDataService.readDeployments(catalogEntityRef, {
        windowFrom: from,
        windowTo: to,
        collector: this.config.deploymentsCollector,
      }),
      this.doraDataService.readIncidents(catalogEntityRef, {
        windowFrom: from,
        windowTo: to,
        collector: this.config.incidentsCollector,
      }),
    ]);

    const productionDeployments = deployments.filter(deployment =>
      isProductionEnvironment(
        deployment.environment,
        this.config.productionEnvironments,
      ),
    );

    if (productionDeployments.length < 2) {
      throw new Error(
        `Unable to calculate change failure rate: need at least 2 successful production deployments in the last ${DORA_TIME_WINDOW_DAYS} days, found ${productionDeployments.length}`,
      );
    }

    let deploymentsWithIncidents = 0;
    let evaluatedDeployments = 0;
    for (
      let deploymentIndex = 0;
      deploymentIndex < productionDeployments.length - 1;
      deploymentIndex++
    ) {
      const deployment = productionDeployments[deploymentIndex];
      const nextDeployment = productionDeployments[deploymentIndex + 1];
      const deploymentCreatedAt = deployment.createdAt.getTime();
      const nextDeploymentCreatedAt = nextDeployment.createdAt.getTime();
      if (nextDeploymentCreatedAt <= deploymentCreatedAt) {
        this.logger.warn(
          `Skipping deployment interval ${deployment.id}..${
            nextDeployment.id
          } for ${stringifyEntityRef(
            entity,
          )} while calculating ${this.getProviderId()}: non-increasing createdAt (deployment=${deployment.createdAt.toISOString()}, nextDeployment=${nextDeployment.createdAt.toISOString()})`,
        );
        continue;
      }

      evaluatedDeployments += 1;
      const hasIncident = incidents.some(incident => {
        const incidentCreatedAt = incident.createdAt.getTime();
        return (
          incidentCreatedAt >= deploymentCreatedAt &&
          incidentCreatedAt < nextDeploymentCreatedAt
        );
      });
      if (hasIncident) {
        deploymentsWithIncidents += 1;
      }
    }

    if (evaluatedDeployments === 0) {
      throw new Error(
        'Unable to calculate change failure rate: no evaluable deployment intervals were found (adjacent successful production deployments must have distinct createdAt timestamps)',
      );
    }

    results.set(
      this.getProviderId(),
      Number(
        ((deploymentsWithIncidents / evaluatedDeployments) * 100).toFixed(4),
      ),
    );
    return results;
  }
}
