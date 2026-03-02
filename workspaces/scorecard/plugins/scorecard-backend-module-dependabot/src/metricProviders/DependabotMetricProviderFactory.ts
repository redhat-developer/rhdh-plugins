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
import { DependabotMetricProvider } from './DependabotMetricProvider';
import { DependabotSeverity } from './DependabotConfig';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

const DEPENDABOT_SEVERITIES: DependabotSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
];

/**
 * Creates a single Dependabot metric provider for the given severity.
 */
export function createDependabotMetricProvider(
  config: Config,
  logger: LoggerService,
  severity: DependabotSeverity,
  thresholds?: ThresholdConfig,
): MetricProvider<'number'> {
  return new DependabotMetricProvider(config, logger, severity, thresholds);
}

/**
 * Creates one metric provider per severity (critical, high, medium, low).
 */
export function createDependabotMetricProviders(
  config: Config,
  logger: LoggerService,
  thresholds?: ThresholdConfig,
): DependabotMetricProvider[] {
  return DEPENDABOT_SEVERITIES.map(severity =>
    createDependabotMetricProvider(config, logger, severity, thresholds),
  );
}
