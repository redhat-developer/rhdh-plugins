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
  AggregatedMetricResult,
  MetricResult,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { NotFoundError, stringifyError } from '@backstage/errors';
import { AuthService } from '@backstage/backend-plugin-api';
import { filterAuthorizedMetrics } from '../permissions/permissionUtils';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';
import { mergeEntityAndProviderThresholds } from '../utils/mergeEntityAndProviderThresholds';
import { aggregateMetricsByStatus } from '../utils/aggregateMetricsByStatus';

type CatalogMetricServiceOptions = {
  catalog: CatalogService;
  auth: AuthService;
  registry: MetricProvidersRegistry;
  database: DatabaseMetricValues;
};

export type AggregatedMetricsByStatus = Record<
  string,
  { values: { success: number; warning: number; error: number }; total: number }
>;

export class CatalogMetricService {
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly registry: MetricProvidersRegistry;
  private readonly database: DatabaseMetricValues;

  constructor(options: CatalogMetricServiceOptions) {
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.registry = options.registry;
    this.database = options.database;
  }

  /**
   * Get the catalog service
   *
   * @returns CatalogService
   */
  getCatalogService(): CatalogService {
    return this.catalog;
  }

  /**
   * Get latest metric results for a specific catalog entity and metric providers.
   *
   * @param entityRef - Entity reference in format "kind:namespace/name"
   * @param providerIds - Optional array of provider IDs to get latest metrics of.
   *                      If not provided, gets all available latest metrics.
   * @param filter - Permission filter
   * @returns Metric results with entity-specific thresholds applied
   */
  async getLatestEntityMetrics(
    entityRef: string,
    providerIds?: string[],
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<MetricResult[]> {
    const entity = await this.catalog.getEntityByRef(entityRef, {
      credentials: await this.auth.getOwnServiceCredentials(),
    });
    if (!entity) {
      throw new NotFoundError(`Entity not found: ${entityRef}`);
    }

    const metricsToFetch = this.registry.listMetrics(providerIds);

    const authorizedMetricsToFetch = filterAuthorizedMetrics(
      metricsToFetch,
      filter,
    );
    const rawResults = await this.database.readLatestEntityMetricValues(
      entityRef,
      authorizedMetricsToFetch.map(m => m.id),
    );

    return rawResults.map(
      ({ metric_id, value, error_message, timestamp, status }) => {
        let thresholds: ThresholdConfig | undefined;
        let thresholdError: string | undefined;

        const provider = this.registry.getProvider(metric_id);
        const metric = provider.getMetric();

        try {
          thresholds = mergeEntityAndProviderThresholds(entity, provider);

          if (value === null) {
            thresholdError =
              'Unable to evaluate thresholds, metric value is missing';
          } else if (error_message) {
            thresholdError = error_message;
          }
        } catch (error) {
          thresholdError = stringifyError(error);
        }

        const isMetricCalcError = error_message !== null && value === null;

        return {
          id: metric.id,
          status: isMetricCalcError ? 'error' : 'success',
          metadata: {
            title: metric.title,
            description: metric.description,
            type: metric.type,
            history: metric.history,
          },
          ...(isMetricCalcError && {
            error:
              error_message ??
              stringifyError(new Error(`Metric value is 'undefined'`)),
          }),
          result: {
            value,
            timestamp: new Date(timestamp).toISOString(),
            thresholdResult: {
              definition: thresholds,
              status: thresholdError ? 'error' : 'success',
              evaluation: status,
              ...(thresholdError && { error: thresholdError }),
            },
          },
        };
      },
    );
  }

  /**
   * Get aggregated metrics for multiple entities and metrics
   *
   * @param entityRefs - Array of entity references in format "kind:namespace/name"
   * @param metricIds - Optional array of metric IDs to get aggregated metrics of.
   *                    If not provided, gets all available aggregated metrics.
   * @returns Aggregated metric results
   */
  async getAggregatedMetricsByEntityRefs(
    entityRefs: string[],
    metricIds?: string[],
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<AggregatedMetricResult[]> {
    const metricsToFetch = this.registry.listMetrics(metricIds);

    const authorizedMetricsToFetch = filterAuthorizedMetrics(
      metricsToFetch,
      filter,
    );

    const aggregatedMetrics =
      await this.database.readAggregatedMetricsByEntityRefs(
        entityRefs,
        authorizedMetricsToFetch.map(m => m.id),
      );

    return aggregatedMetrics.map(row => {
      const metricId = row.metric_id;
      const success = row.success || 0;
      const warning = row.warning || 0;
      const error = row.error || 0;
      const total = row.total || 0;
      const timestamp = row.max_timestamp
        ? new Date(row.max_timestamp).toISOString()
        : new Date().toISOString();

      const provider = this.registry.getProvider(metricId);
      const metric = provider.getMetric();

      return {
        id: metricId,
        status: 'success',
        metadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
          history: metric.history,
        },
        result: {
          values: [
            { count: success, name: 'success' },
            { count: warning, name: 'warning' },
            { count: error, name: 'error' },
          ],
          total,
          timestamp,
        },
      };
    });
  }
}
