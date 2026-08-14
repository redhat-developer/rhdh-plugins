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
import type { DoraDataService } from '../service/DoraDataService';
import type { DoraSyncService } from '../service/DoraSyncService';
import {
  DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS,
  parseDoraMedianLeadTimeForChangesConfig,
  type DoraMedianLeadTimeForChangesConfig,
} from './DoraConfig';
import { calculateMedian } from './utils/calculationUtils';
import { isProductionEnvironment } from './utils/deploymentFilterUtils';

type DoraMedianLeadTimeForChangesProviderOptions = {
  doraSyncService: DoraSyncService;
  doraDataService: DoraDataService;
  config: DoraMedianLeadTimeForChangesConfig;
  logger: LoggerService;
};

export class DoraMedianLeadTimeForChangesProvider
  implements MetricProvider<'number'>
{
  private readonly doraSyncService: DoraSyncService;
  private readonly doraDataService: DoraDataService;
  private readonly config: DoraMedianLeadTimeForChangesConfig;
  private readonly logger: LoggerService;

  private constructor(options: DoraMedianLeadTimeForChangesProviderOptions) {
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
  ): DoraMedianLeadTimeForChangesProvider {
    return new DoraMedianLeadTimeForChangesProvider({
      doraSyncService: options.doraSyncService,
      doraDataService: options.doraDataService,
      config: parseDoraMedianLeadTimeForChangesConfig(config),
      logger: options.logger,
    });
  }

  getProviderDatasourceId(): string {
    return 'dora';
  }

  getProviderId() {
    return 'dora.medianLeadTimeForChanges';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: this.getProviderId(),
        title: 'DORA - Median Lead Time for Changes',
        description:
          'Measures the time from code commit to production deployment over the past 30 days. Elite performers have a lead time of less than 24 hours',
        type: 'number',
        thresholds: DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS,
        unit: 'h',
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

    await this.doraSyncService.syncDeployments(entity, {
      windowFrom: from,
      windowTo: to,
      collector: this.config.deploymentsCollector,
    });

    const catalogEntityRef = stringifyEntityRef(entity);

    // Deployments are expected to be returned sorted ascending by createdAt.
    const deployments = (
      await this.doraDataService.readDeployments(catalogEntityRef, {
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

    if (deployments.length < 2) {
      throw new Error(
        `Unable to calculate median lead time for changes: need at least 2 successful production deployments in the last ${DORA_TIME_WINDOW_DAYS} days, found ${deployments.length}`,
      );
    }

    const leadTimeHours: number[] = [];
    for (
      let deploymentIndex = 1;
      deploymentIndex < deployments.length;
      deploymentIndex++
    ) {
      const previousDeployment = deployments[deploymentIndex - 1];
      const deployment = deployments[deploymentIndex];

      try {
        await this.doraSyncService.syncPullRequestsForDeployment(entity, {
          collector: this.config.deploymentPullRequestsCollector,
          deploymentId: deployment.id,
          baseCommitSha: previousDeployment.commitSha,
          headCommitSha: deployment.commitSha,
        });
      } catch (error) {
        this.logger.warn(
          `Skipping deployment interval ${previousDeployment.commitSha}..${
            deployment.commitSha
          } for ${stringifyEntityRef(
            entity,
          )} while calculating ${this.getProviderId()}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        continue;
      }

      const pullRequests =
        await this.doraDataService.readPullRequestsForDeployment(
          catalogEntityRef,
          {
            collector: this.config.deploymentPullRequestsCollector,
            deploymentId: deployment.id,
          },
        );

      const deployedAtTimestamp = deployment.createdAt.getTime();
      for (const pullRequest of pullRequests) {
        const firstCommitAtTimestamp = pullRequest.firstCommitAt.getTime();
        if (deployedAtTimestamp < firstCommitAtTimestamp) {
          this.logger.warn(
            `Skipping pull request ${pullRequest.id} for deployment ${
              deployment.id
            } (${stringifyEntityRef(
              entity,
            )}) while calculating ${this.getProviderId()}: negative lead time (deployedAt=${deployment.createdAt.toISOString()}, firstCommitAt=${pullRequest.firstCommitAt.toISOString()})`,
          );
          continue;
        }
        leadTimeHours.push(
          (deployedAtTimestamp - firstCommitAtTimestamp) / 3_600_000,
        );
      }
    }

    if (leadTimeHours.length === 0) {
      throw new Error(
        'Unable to calculate median lead time for changes: no pull requests with a measurable lead time were found between deployments',
      );
    }

    const median = calculateMedian(leadTimeHours);
    results.set(this.getProviderId(), Number(median.toFixed(4)));
    return results;
  }
}
