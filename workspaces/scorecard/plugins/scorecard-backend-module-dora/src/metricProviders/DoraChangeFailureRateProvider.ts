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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
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
  incidentsCollectorInputSchema,
  incidentsCollectorOutputSchema,
} from './schemas/incidentSchemas';
import {
  DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS,
  type DoraChangeFailureRateConfig,
  parseDoraChangeFailureRateConfig,
} from './DoraConfig';
import { isSuccessfulProductionDeployment } from './utils/deploymentFilterUtils';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

type DoraChangeFailureRateProviderOptions = {
  collectorsService: ScorecardCollectorsService;
  config: DoraChangeFailureRateConfig;
  logger: LoggerService;
};

export class DoraChangeFailureRateProvider implements MetricProvider<'number'> {
  private readonly collectorsService: ScorecardCollectorsService;
  private readonly config: DoraChangeFailureRateConfig;
  private readonly logger: LoggerService;

  private constructor(options: DoraChangeFailureRateProviderOptions) {
    this.collectorsService = options.collectorsService;
    this.config = options.config;
    this.logger = options.logger;
  }

  static fromConfig(
    config: Config,
    options: {
      collectorsService: ScorecardCollectorsService;
      logger: LoggerService;
    },
  ): DoraChangeFailureRateProvider {
    return new DoraChangeFailureRateProvider({
      collectorsService: options.collectorsService,
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

    const successfulProductionDeployments =
      deploymentsCollected.deployments.filter(deployment =>
        isSuccessfulProductionDeployment(
          deployment,
          this.config.productionEnvironments,
        ),
      );

    if (successfulProductionDeployments.length < 2) {
      throw new Error(
        `Unable to calculate change failure rate: need at least 2 successful production deployments in the last ${DORA_TIME_WINDOW_DAYS} days, found ${successfulProductionDeployments.length}`,
      );
    }

    const incidentsCollected = await this.collectorsService.collect<
      typeof incidentsCollectorInputSchema,
      typeof incidentsCollectorOutputSchema
    >({
      collectorId: this.config.incidentsCollector.id,
      contract: {
        inputSchema: incidentsCollectorInputSchema,
        outputSchema: incidentsCollectorOutputSchema,
      },
      entity,
      input: {
        ...this.config.incidentsCollector.input,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });

    let deploymentsWithIncidents = 0;
    let evaluatedDeployments = 0;
    for (
      let deploymentIndex = 0;
      deploymentIndex < successfulProductionDeployments.length - 1;
      deploymentIndex++
    ) {
      const deployment = successfulProductionDeployments[deploymentIndex];
      const nextDeployment =
        successfulProductionDeployments[deploymentIndex + 1];
      const deploymentCreatedAt = new Date(deployment.createdAt).getTime();
      const nextDeploymentCreatedAt = new Date(
        nextDeployment.createdAt,
      ).getTime();
      if (nextDeploymentCreatedAt <= deploymentCreatedAt) {
        this.logger.warn(
          `Skipping deployment interval ${deployment.id}..${
            nextDeployment.id
          } for ${stringifyEntityRef(
            entity,
          )} while calculating ${this.getProviderId()}: non-increasing createdAt (deployment=${
            deployment.createdAt
          }, nextDeployment=${nextDeployment.createdAt})`,
        );
        continue;
      }

      evaluatedDeployments += 1;
      const hasIncident = incidentsCollected.incidents.some(incident => {
        const incidentCreatedAt = new Date(incident.createdAt).getTime();
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
