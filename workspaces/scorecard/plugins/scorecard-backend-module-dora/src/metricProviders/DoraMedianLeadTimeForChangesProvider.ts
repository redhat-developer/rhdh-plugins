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
  deploymentPullRequestsCollectorInputSchema,
  deploymentPullRequestsCollectorOutputSchema,
} from './schemas/pullRequestSchemas';
import {
  deploymentsCollectorInputSchema,
  deploymentsCollectorOutputSchema,
} from './schemas/deploymentSchemas';
import { calculateMedian } from './utils/calculationUtils';
import {
  DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS,
  type DoraMedianLeadTimeForChangesConfig,
  parseDoraMedianLeadTimeForChangesConfig,
} from './DoraConfig';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { isSuccessfulProductionDeployment } from './utils/deploymentFilterUtils';

type DoraMedianLeadTimeForChangesProviderOptions = {
  collectorsService: ScorecardCollectorsService;
  config: DoraMedianLeadTimeForChangesConfig;
  logger: LoggerService;
};

export class DoraMedianLeadTimeForChangesProvider
  implements MetricProvider<'number'>
{
  private readonly collectorsService: ScorecardCollectorsService;
  private readonly config: DoraMedianLeadTimeForChangesConfig;
  private readonly logger: LoggerService;

  private constructor(options: DoraMedianLeadTimeForChangesProviderOptions) {
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
  ): DoraMedianLeadTimeForChangesProvider {
    return new DoraMedianLeadTimeForChangesProvider({
      collectorsService: options.collectorsService,
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
        collectorIds: [
          this.config.deploymentsCollector.id,
          this.config.deploymentPullRequestsCollector.id,
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

    // Deployments are expected to be returned sorted ascending by createdAt.
    const deployments = deploymentsCollected.deployments.filter(deployment =>
      isSuccessfulProductionDeployment(
        deployment,
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

      let pullRequestsCollected;
      try {
        pullRequestsCollected = await this.collectorsService.collect<
          typeof deploymentPullRequestsCollectorInputSchema,
          typeof deploymentPullRequestsCollectorOutputSchema
        >({
          collectorId: this.config.deploymentPullRequestsCollector.id,
          contract: {
            inputSchema: deploymentPullRequestsCollectorInputSchema,
            outputSchema: deploymentPullRequestsCollectorOutputSchema,
          },
          entity,
          input: {
            ...this.config.deploymentPullRequestsCollector.input,
            baseCommitSha: previousDeployment.commitSha,
            headCommitSha: deployment.commitSha,
          },
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

      const deployedAtTimestamp = new Date(deployment.createdAt).getTime();
      for (const pullRequest of pullRequestsCollected.pullRequests) {
        const firstCommitAtTimestamp = new Date(
          pullRequest.firstCommitAt,
        ).getTime();
        if (deployedAtTimestamp < firstCommitAtTimestamp) {
          this.logger.warn(
            `Skipping pull request ${pullRequest.id} for deployment ${
              deployment.id
            } (${stringifyEntityRef(
              entity,
            )}) while calculating ${this.getProviderId()}: negative lead time (deployedAt=${
              deployment.createdAt
            }, firstCommitAt=${pullRequest.firstCommitAt})`,
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
