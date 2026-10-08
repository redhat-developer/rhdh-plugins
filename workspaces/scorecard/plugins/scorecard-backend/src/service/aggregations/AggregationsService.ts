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

import { InputError } from '@backstage/errors';
import type { AggregationOptions, AggregationTimeSeriesOptions } from './types';
import { parseValidatedAggregationConfig } from '../../utils/aggregation/parseValidatedAggregationConfig';
import {
  type AggregatedMetricResult,
  type AggregatedMetricTimeSeriesResponse,
  type AggregationType,
  aggregationTypes,
  scalarAggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { Config } from '@backstage/config';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationConfig } from '../../utils/aggregation/buildAggregationConfig';
import type { AggregationStrategy } from './strategies/types';
import { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import { AggregatedMetricLoader } from './AggregatedMetricLoader';
import { createAggregationStrategyRegistry } from './strategies/registerStrategies';
import { LoggerService } from '@backstage/backend-plugin-api';
import type { ValidatedAggregationConfig } from '../../validation/schemas/aggregationConfigSchemas';
import type { MetricProvidersRegistry } from '../../providers/MetricProvidersRegistry';

export type AggregationsServiceOptions = {
  config: Config;
  logger: LoggerService;
  database: DatabaseMetricValues;
};

export class AggregationsService {
  private readonly config: Config;
  private readonly strategyRegistry: Map<AggregationType, AggregationStrategy>;
  private readonly logger: LoggerService;
  private readonly aggregationKpisConfigCache: Map<
    string,
    ValidatedAggregationConfig
  >;

  constructor(options: AggregationsServiceOptions) {
    this.config = options.config;
    this.logger = options.logger;
    this.aggregationKpisConfigCache = new Map();
    this.strategyRegistry = createAggregationStrategyRegistry(
      new AggregatedMetricLoader(options.database),
      this.logger,
    );
  }

  getAggregationConfig(
    aggregationId: string,
    metricProviderRegistry: MetricProvidersRegistry,
  ): ValidatedAggregationConfig {
    const cachedConfig = this.aggregationKpisConfigCache.get(aggregationId);

    if (cachedConfig) {
      return cachedConfig;
    }

    const config = this.config.getOptionalConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}`,
    );

    if (!config) {
      const metric = metricProviderRegistry.getMetric(aggregationId);
      const defaultType =
        metric.defaultVisualization === 'sparkline'
          ? aggregationTypes.average
          : aggregationTypes.statusGrouped;

      this.logger.info(
        `No "${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}" block in app-config; ` +
          `using default type "${defaultType}" with metricId="${aggregationId}" ` +
          '(same as aggregation id). Add a KPI entry if you meant a custom title, description, or type.',
      );

      const fallbackConfig: ValidatedAggregationConfig = {
        id: aggregationId,
        metricId: aggregationId,
        title: metric.title,
        description: metric.description,
        type: defaultType,
      };
      this.aggregationKpisConfigCache.set(aggregationId, fallbackConfig);

      return fallbackConfig;
    }

    const validatedConfig = parseValidatedAggregationConfig(
      buildAggregationConfig(aggregationId, {
        config,
      }),
    );
    this.aggregationKpisConfigCache.set(aggregationId, validatedConfig);

    return validatedConfig;
  }

  async getAggregatedMetricByEntityRefs(
    options: AggregationOptions,
  ): Promise<AggregatedMetricResult> {
    return this.getStrategy(options.aggregationConfig.type).aggregate(options);
  }

  async getAggregatedMetricTimeSeries(
    options: AggregationTimeSeriesOptions,
  ): Promise<AggregatedMetricTimeSeriesResponse> {
    const strategy = this.getStrategy(options.aggregationConfig.type);

    if (!strategy.aggregateTimeSeries) {
      throw new InputError(
        `Aggregation type "${
          options.aggregationConfig.type
        }" does not support time-series. Currently only scalar types (${scalarAggregationTypes.join(
          ', ',
        )}) are supported.`,
      );
    }

    return strategy.aggregateTimeSeries(options);
  }

  private getStrategy(type: AggregationType): AggregationStrategy {
    const strategy = this.strategyRegistry.get(type);

    if (!strategy) {
      throw new Error(`Unsupported aggregation type: ${type}`);
    }

    return strategy;
  }
}
