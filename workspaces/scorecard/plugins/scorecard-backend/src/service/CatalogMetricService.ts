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

import { CatalogApi } from '@backstage/catalog-client';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import {
  MetricResult,
  MetricType,
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';
import { NotFoundError, stringifyError } from '@backstage/errors';
import {
  MetricProvider,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import { filterAuthorizedMetrics } from '../permissions/permissionUtils';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';

export type CatalogMetricServiceOptions = {
  catalogApi: CatalogApi;
  registry: MetricProvidersRegistry;
  thresholdEvaluator: ThresholdEvaluator;
  logger: LoggerService;
  auth?: AuthService;
};

export class CatalogMetricService {
  private readonly catalogApi: CatalogApi;
  private readonly registry: MetricProvidersRegistry;
  private readonly thresholdEvaluator: ThresholdEvaluator;
  private readonly logger: LoggerService;
  private readonly auth?: AuthService;

  constructor(options: CatalogMetricServiceOptions) {
    this.thresholdEvaluator = options.thresholdEvaluator;
    this.registry = options.registry;
    this.catalogApi = options.catalogApi;
    this.logger = options.logger;
    this.auth = options.auth;
  }

  /**
   * Calculate metric results for a specific catalog entity.
   *
   * @param entityRef - Entity reference in format "kind:namespace/name"
   * @param providerIds - Optional array of provider IDs to calculate.
   *                      If not provided, calculates all available metrics.
   * @returns Metric results with entity-specific thresholds applied
   */
  async calculateEntityMetrics(
    entityRef: string,
    providerIds?: string[],
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<MetricResult[]> {
    const token = await this.getServiceToken();
    const entity = await this.catalogApi.getEntityByRef(entityRef, token);
    if (!entity) {
      throw new NotFoundError(`Entity not found: ${entityRef}`);
    }

    const metricsToCalculate = providerIds
      ? this.registry.listMetrics().filter(m => providerIds.includes(m.id))
      : this.registry.listMetrics();

    const authorizedMetricsToCalculate = filterAuthorizedMetrics(
      metricsToCalculate,
      filter,
    );
    const rawResults = await this.registry.calculateMetrics(
      authorizedMetricsToCalculate.map(m => m.id),
      entity,
    );

    return rawResults.map(({ providerId, value, error }, index) => {
      const provider = this.registry.getProvider(providerId);
      const metric = authorizedMetricsToCalculate[index];

      if (error || value === undefined) {
        return {
          id: providerId,
          status: 'error',
          metadata: {
            title: metric.title,
            description: metric.description,
            type: metric.type,
            history: metric.history,
          },
          error: error
            ? stringifyError(error)
            : stringifyError(new Error(`Metric value is 'undefined'`)),
        };
      }

      const thresholds = this.mergeEntityAndProviderThresholds(
        entity,
        provider,
        metric.type,
      );

      let evaluation: string | undefined;
      let thresholdError: string | undefined;
      try {
        evaluation = this.thresholdEvaluator.getFirstMatchingThreshold(
          value,
          metric.type,
          thresholds,
        );
      } catch (e) {
        thresholdError = stringifyError(e);
      }

      return {
        id: metric.id,
        status: 'success',
        metadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
          history: metric.history,
        },
        result: {
          value,
          timestamp: new Date().toISOString(),
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

  private async getServiceToken(): Promise<{ token: string } | undefined> {
    if (!this.auth) {
      return undefined;
    }
    return await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
  }

  /**
   * Parse threshold overrides from entity annotations.
   * Looks for annotations in the format:
   *   scorecard.io/{providerId}.thresholds.rules.{thresholdName}: "{expression}"
   *
   * @param entity - The catalog entity
   * @param providerId - The metric provider ID (e.g., 'jira.open-issues')
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
          this.logger.error(
            `Invalid threshold annotation in entity '${stringifyEntityRef(
              entity,
            )}': ${JSON.stringify(
              entityRule,
            )}. Skipping including this threshold.`,
            e,
          );
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
        this.logger.error(
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
