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

import {
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { type Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { DependabotClient } from '../clients/DependabotClient';
import { DEPENDABOT_THRESHOLDS } from './DependabotConfig';

const GITHUB_PROJECT_ANNOTATION = 'github.com/project-slug';

export class DependabotMetricProvider implements MetricProvider<'number'> {
  private readonly dependabotClient: DependabotClient;
  private readonly thresholds: ThresholdConfig;
  private readonly logger: LoggerService;

  constructor(
    config: Config,
    logger: LoggerService,
    thresholds?: ThresholdConfig,
  ) {
    this.logger = logger.child({ component: 'DependabotMetricProvider' });
    this.dependabotClient = new DependabotClient(config, logger);
    this.thresholds = thresholds ?? DEPENDABOT_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'dependabot';
  }

  getProviderId(): string {
    return 'dependabot.alerts';
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Dependabot Alerts',
      description: 'Current count of Dependabot alerts for a given repository.',
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  getRepository(entity: Entity): { owner: string; repo: string } {
    const projectSlug =
      entity.metadata.annotations?.[GITHUB_PROJECT_ANNOTATION];
    if (!projectSlug) {
      throw new Error(
        `Missing annotation '${GITHUB_PROJECT_ANNOTATION}' for entity ${stringifyEntityRef(
          entity,
        )}`,
      );
    }

    const [owner, repo] = projectSlug.split('/');
    if (!owner || !repo) {
      throw new Error(
        `Invalid format of '${GITHUB_PROJECT_ANNOTATION}' ${projectSlug} for entity ${stringifyEntityRef(
          entity,
        )}`,
      );
    }

    return { owner, repo };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const { owner, repo } = this.getRepository(entity);
    const githubUrl = `https://github.com/${owner}/${repo}`;
    const alerts = await this.dependabotClient.getDependabotAlerts(githubUrl, {
      owner,
      repo,
    });

    this.logger.info(
      `Fetched ${alerts.length} Dependabot alerts for ${entity.metadata.name}`,
    );
    if (alerts.filter(alert => alert.severity === 'CRITICAL').length > 0) {
      return 9;
    } else if (alerts.filter(alert => alert.severity === 'HIGH').length > 0) {
      return 6;
    } else if (alerts.filter(alert => alert.severity === 'MEDIUM').length > 0) {
      return 3;
    }

    return 0;
  }
}

/**
 * @returns a Dependabot metric provider.
 */
export function createDependabotMetricProvider(
  config: Config,
  logger: LoggerService,
  thresholds?: ThresholdConfig,
): MetricProvider<'number'> {
  return new DependabotMetricProvider(config, logger, thresholds);
}
