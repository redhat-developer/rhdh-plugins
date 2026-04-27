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
  type AggregatedMetricResult,
  type AggregationType,
  ThresholdConfig,
  aggregationKinds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { Config } from '@backstage/config';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationConfig } from '../../utils/buildAggregationConfig';
import type { AggregationOptions } from './types';
import type { AggregationStrategy } from './strategies/types';
import { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import { AggregatedMetricLoader } from './AggregatedMetricLoader';
import { createAggregationStrategyRegistry } from './strategies/registerStrategies';
import { LoggerService } from '@backstage/backend-plugin-api';

export type AggregationsServiceOptions = {
  config: Config;
  logger: LoggerService;
  database: DatabaseMetricValues;
};

export type AggregationKpiOptions = {
  statusScores: Record<string, number>;
  aggregationResultThresholds?: ThresholdConfig;
};

export type AggregationConfig = {
  id: string;
  title: string;
  description: string;
  type: AggregationType;
  metricId: string;
  options?: AggregationKpiOptions;
};

export class AggregationsService {
  private readonly config: Config;
  private readonly database: DatabaseMetricValues;
  private readonly strategyRegistry: Map<AggregationType, AggregationStrategy>;
  private readonly logger: LoggerService;

  constructor(options: AggregationsServiceOptions) {
    this.config = options.config;
    this.logger = options.logger;
    this.database = options.database;
    this.strategyRegistry = createAggregationStrategyRegistry(
      new AggregatedMetricLoader(this.database),
      this.logger,
    );
  }

  getAggregationConfig(aggregationId: string): AggregationConfig {
    const config = this.config.getOptionalConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}`,
    );

    if (!config) {
      this.logger.warn(
        `No "${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}" block in app-config; ` +
          `using default type "${aggregationKinds.statusGrouped}" with metricId="${aggregationId}" ` +
          '(same as aggregation id). Add a KPI entry if you meant a custom title, description, or type.',
      );
      return {
        id: aggregationId,
        type: aggregationKinds.statusGrouped,
        metricId: aggregationId,
      } as AggregationConfig;
    }

    return buildAggregationConfig(aggregationId, {
      config,
    });
  }

  async getAggregatedMetricByEntityRefs(
    options: AggregationOptions,
  ): Promise<AggregatedMetricResult> {
    const { aggregationConfig } = options;

    const strategy = this.strategyRegistry.get(aggregationConfig.type);

    if (!strategy) {
      throw new Error(
        `Unsupported aggregation type: ${aggregationConfig.type}`,
      );
    }

    return strategy.aggregate(options);
  }
}
