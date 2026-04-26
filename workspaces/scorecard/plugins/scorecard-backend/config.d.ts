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
import { AggregationType } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

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
          /** Required under `options` when `type` is `average` */
          statusScores?: {
            [thresholdRuleKey: string]: number;
          };
          /**
           * Optional: threshold rules for coloring the KPI headline value from the aggregation result
           * (e.g. average percentage 0–100 for `average` KPIs). Same shape as metric `thresholds`;
           * rules are evaluated in order against that headline value.
           */
          aggregationResultThresholds?: {
            rules?: Array<{
              key: string;
              expression: string;
              color?: string;
            }>;
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
    /** Configuration for scorecard metric providers */
    plugins?: {
      /** Configuration for datasource */
      [datasource: string]: {
        /** Configuration for metric providers within the datasource.
         * Each key corresponds to the metric name part of the provider ID (datasource.metricName).
         */
        [metricName: string]: {
          /** Threshold configuration for the metric */
          thresholds?: {
            /**
             * Rules describe how metric values are categorized and how that category is presented in the UI.
             * They are evaluated in order and the first matching rule is applied.
             */
            rules?: Array<{
              /**
               * Threshold category key that a metric value is assigned to when this rule
               * matches (for example `success`, `warning`, `error`, or a custom key).
               */
              key: string;
              /**
               * Threshold expression that determines whether a metric value matches this
               * rule. Supports:`>=`, `<=`, `>`, `<`, `==`, `!=`, `-` (range).
               *
               * @example `<= 10` - Metric value must be less than or equal to 10.
               * @example `10-60` - Metric value must be between 10 and 60 (inclusive).
               */
              expression: string;
              /**
               * Color configuration - supports multiple formats:
               * - theme palette reference (`success.main` / `warning.main` / `error.main`)
               * - HEX code (e.g. '#FFA500')
               * - RGB/RGBA (e.g. 'rgb(255, 0, 0)')
               *
               * Threshold rules 'success', 'warning' and 'error' have default colors.
               */
              color?: string;
              /**
               * Icon configuration - supports multiple formats:
               * - Backstage system icons: 'kind:component', 'kind:api', etc.
               * - Material Design icons: 'settings', 'home', 'build', etc.
               * - SVG strings: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
               * - URLs: 'https://example.com/icon.png', '/assets/icon.svg'
               * - Data URIs: 'data:image/svg+xml;base64,...'
               *
               * Threshold rules 'success', 'warning' and 'error' have default icons.
               */
              icon?: string;
            }>;
          };
          /**
           * Schedule for collecting this metric. If not set, the default hourly schedule is used.
           *
           * Default schedule:
           * ```ts
           * {
           *   frequency: { hours: 1 },
           *   timeout: { minutes: 15 },
           *   initialDelay: { minutes: 1 },
           * }
           * ```
           */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
