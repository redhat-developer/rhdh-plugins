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
import {
  type DependabotSeverity,
  DEPENDABOT_SEVERITY_METRIC,
  DEPENDABOT_THRESHOLDS,
} from './DependabotConfig';

const GITHUB_PROJECT_ANNOTATION = 'github.com/project-slug';

/**
 * Metric provider for Dependabot alerts of a single severity (critical, high, medium, low).
 * Use one instance per severity; the module registers four providers.
 */
export class DependabotMetricProvider implements MetricProvider<'number'> {
  private readonly dependabotClient: DependabotClient;
  private readonly thresholds: ThresholdConfig;
  private readonly logger: LoggerService;
  private readonly severity: DependabotSeverity;

  constructor(
    config: Config,
    logger: LoggerService,
    severity: DependabotSeverity,
    thresholds?: ThresholdConfig,
  ) {
    this.severity = severity;
    this.logger = logger.child({
      component: 'DependabotMetricProvider',
      severity,
    });
    this.dependabotClient = new DependabotClient(config, logger);
    this.thresholds = thresholds ?? DEPENDABOT_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'dependabot';
  }

  getProviderId(): string {
    return DEPENDABOT_SEVERITY_METRIC[this.severity].id;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    const meta = DEPENDABOT_SEVERITY_METRIC[this.severity];
    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
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
    const alerts = await this.getAlertsBySeverity(githubUrl, { owner, repo });
    return alerts.length;
  }

  private getAlertsBySeverity(
    url: string,
    repository: { owner: string; repo: string },
  ) {
    switch (this.severity) {
      case 'critical':
        return this.dependabotClient.getCriticalAlerts(url, repository);
      case 'high':
        return this.dependabotClient.getHighAlerts(url, repository);
      case 'medium':
        return this.dependabotClient.getMediumAlerts(url, repository);
      case 'low':
      default:
        return this.dependabotClient.getLowAlerts(url, repository);
    }
  }
}
