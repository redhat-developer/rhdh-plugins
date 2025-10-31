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

import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import {
  MetricResult,
  MetricType,
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';
import { isError, NotFoundError, stringifyError } from '@backstage/errors';
import {
  MetricProvider,
  ThresholdConfigFormatError,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { AuthService } from '@backstage/backend-plugin-api';
import { filterAuthorizedMetrics } from '../permissions/permissionUtils';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';

export type CatalogMetricServiceOptions = {
  catalog: CatalogService;
  auth: AuthService;
  registry: MetricProvidersRegistry;
  thresholdEvaluator: ThresholdEvaluator;
  database: DatabaseMetricValues;
};

export class CatalogMetricService {
  private readonly catalog: CatalogService;
  private readonly auth: AuthService;
  private readonly registry: MetricProvidersRegistry;
  private readonly thresholdEvaluator: ThresholdEvaluator;
  private readonly database: DatabaseMetricValues;

  constructor(options: CatalogMetricServiceOptions) {
    this.catalog = options.catalog;
    this.auth = options.auth;
    this.registry = options.registry;
    this.thresholdEvaluator = options.thresholdEvaluator;
    this.database = options.database;
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

    const metricsToFetch = providerIds
      ? this.registry.listMetrics().filter(m => providerIds.includes(m.id))
      : this.registry.listMetrics();

    const authorizedMetricsToFetch = filterAuthorizedMetrics(
      metricsToFetch,
      filter,
    );
    const rawResults = await this.database.readLatestEntityMetricValues(
      entityRef,
      authorizedMetricsToFetch.map(m => m.id),
    );

    return rawResults.map(({ metric_id, value, error_message, timestamp }) => {
      const provider = this.registry.getProvider(metric_id);
      const metric = provider.getMetric();

      let thresholds: ThresholdConfig | undefined;
      let evaluation: string | undefined;
      let thresholdError: string | undefined;
      try {
        thresholds = this.mergeEntityAndProviderThresholds(
          entity,
          provider,
          metric.type,
        );
        if (value === undefined) {
          thresholdError =
            'Unable to evaluate thresholds, metric value is missing';
        } else {
          evaluation = this.thresholdEvaluator.getFirstMatchingThreshold(
            value,
            metric.type,
            thresholds,
          );
        }
      } catch (e) {
        thresholdError = stringifyError(e);
      }

      const isMetricCalcError = error_message || value === undefined;
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
            evaluation,
            ...(thresholdError && { error: thresholdError }),
          },
        },
      };
    });
  }

  /**
   * Parse threshold overrides from entity annotations.
   * Looks for annotations in the format:
   *   scorecard.io/{providerId}.thresholds.rules.{thresholdName}: "{expression}"
   *
   * @param entity - The catalog entity
   * @param providerId - The metric provider ID (e.g., 'jira.open_issues')
   * @param metricType - The metric type
   * @returns Threshold rules from entity annotations, or empty rules if none found or invalid
   */
  private parseEntityOverrideThresholds(
    entity: Entity,
    providerId: string,
    metricType: MetricType,
  ): ThresholdRule[] {
    const annotations = entity.metadata?.annotations || {};
    const prefix = `scorecard.io/${providerId}.thresholds.rules.`;
    const overrides: ThresholdRule[] = [];

    for (const [annotationKey, expression] of Object.entries(annotations)) {
      if (annotationKey.startsWith(prefix) && expression) {
        const key = annotationKey.substring(prefix.length);
        const entityRule = { key, expression };
        try {
          validateThresholds({ rules: [entityRule] }, metricType);
          overrides.push(entityRule);
        } catch (e) {
          if (isError(e)) {
            throw new ThresholdConfigFormatError(
              `Invalid threshold annotation '${annotationKey}: ${expression}' in entity '${stringifyEntityRef(
                entity,
              )}': ${e.message}`,
            );
          }
          throw e;
        }
      }
    }

    return overrides;
  }

  private mergeEntityAndProviderThresholds(
    entity: Entity,
    provider: MetricProvider,
    metricType: MetricType,
  ): ThresholdConfig {
    const providerThresholds = provider.getMetricThresholds();
    const entityOverrideThresholds = this.parseEntityOverrideThresholds(
      entity,
      provider.getProviderId(),
      metricType,
    );

    const mergedRules = [...providerThresholds.rules];
    for (const override of entityOverrideThresholds) {
      const foundKey = mergedRules.findIndex(rule => rule.key === override.key);
      if (foundKey !== -1) {
        mergedRules[foundKey] = override;
      } else {
        throw new ThresholdConfigFormatError(
          `Unable to override ${stringifyEntityRef(
            entity,
          )} thresholds by ${JSON.stringify(
            override,
          )}, metric provider ${provider.getProviderId()} does not support key ${
            override.key
          }`,
        );
      }
    }

    return {
      rules: mergedRules,
    };
  }
}
