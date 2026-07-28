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

import { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';
import {
  AggregationType,
  ThresholdConfig,
  AggregationThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export interface Config {
  /** Configuration for scorecard plugin */
  scorecard?: {
    /** Configuration for scorecard aggregation KPIs */
    aggregationKPIs?: {
      /** Unique identifier for scorecard aggregation KPIs */
      [aggregationId: string]: {
        /** Title of the aggregation */
        title: string;
        /** Description of the aggregation */
        description: string;
        /** Type of the aggregation */
        type: AggregationType;
        /** Metric ID for which the aggregation is calculated */
        metricId: string;
        /** Type-specific settings */
        options?: {
          /** Required under `options` when `type` is `weightedStatusScore` */
          statusScores?: {
            [thresholdRuleKey: string]: number;
          };
          /**
           * Optional: threshold rules for coloring the KPI headline value from the aggregation result
           * (e.g. weighted status score percentage 0–100 for `weightedStatusScore` KPIs).
           */
          thresholds?: {
            rules: AggregationThresholdRule[];
          };
        };
      };
    };
    /** Number of days to retain metric data in the database. Older data will be automatically cleaned up. Default: 365 days */
    dataRetentionDays?: number;
    /** List of metric IDs (e.g. openssf.packaging) that are disabled globally. Entity annotations cannot override this. */
    disabledMetrics?: string[];
    /** Control whether users can override behavior via entity annotations. */
    entityAnnotations?: {
      /** Whether entity scorecard.io/disabled-metrics annotation can override. Only affects annotations; global disabledMetrics is unchanged. */
      disabledMetrics?: {
        /** If true (default), entities can disable metrics that are not mentioned in `except` list via `scorecard.io/disabled-metrics` annotation; if false, the annotation has no effect */
        enabled?: boolean;
        /** When enabled is true: entity annotations cannot disable metric IDs listed here (these checks always run). */
        except?: string[];
      };
    };
    /** Metric providers calculate one or more metrics on a schedule. */
    metricProviders?: {
      /** Datasource ID, matches `getProviderDatasourceId()` of a provider (e.g., `jira`, `github`, `filecheck`). */
      [datasource: string]: {
        /** Configuration for a specific metric provider.
         * Use the local name without datasource prefix (e.g., `openPRs` instead of `github.openPRs`).
         */
        [providerName: string]: {
          /** How often metrics will be calculated for this provider. */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /**
           * How metric values are categorized for all metrics of this provider.
           * Overridden by metric-level thresholds when set.
           */
          thresholds?: ThresholdConfig;
          /** Per-metric configuration. */
          metrics?: {
            /** Configuration for a specific metric.
             * Use the local name without datasource prefix (e.g., 'openPRs' instead of 'github.openPRs').
             */
            [metricName: string]: {
              /**
               * How metric values are categorized for this metric.
               * Overrides provider-level thresholds.
               */
              thresholds?: ThresholdConfig;
            };
          };
          /** Provider-specific options (shape defined by each module). */
          options?: unknown;
        };
      };
    };
  };
}
