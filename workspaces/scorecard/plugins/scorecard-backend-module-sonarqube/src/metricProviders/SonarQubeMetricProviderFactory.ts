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
import type { LoggerService } from '@backstage/backend-plugin-api';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { SonarQubeBooleanMetricProvider } from './SonarQubeBooleanMetricProvider';
import { SonarQubeNumberMetricProvider } from './SonarQubeNumberMetricProvider';
import { SONARQUBE_METRICS, type SonarQubeMetricId } from './SonarQubeConfig';

export class SonarQubeMetricProviderFactory {
  private constructor() {}

  static createMetricProvider(
    config: Config,
    logger: LoggerService,
    metricId: SonarQubeMetricId,
  ): MetricProvider {
    if (metricId === 'quality_gate') {
      return SonarQubeBooleanMetricProvider.fromConfig(
        config,
        logger,
        metricId,
      );
    }
    return SonarQubeNumberMetricProvider.fromConfig(config, logger, metricId);
  }

  static fromConfig(config: Config, logger: LoggerService): MetricProvider[] {
    return SONARQUBE_METRICS.map(metricId =>
      SonarQubeMetricProviderFactory.createMetricProvider(
        config,
        logger,
        metricId,
      ),
    );
  }
}
