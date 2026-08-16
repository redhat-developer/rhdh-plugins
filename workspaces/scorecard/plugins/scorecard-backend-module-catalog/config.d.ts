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
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export interface Config {
  /** Configuration for scorecard plugin */
  scorecard?: {
    /** Metric providers calculate one or more metrics on a schedule. */
    metricProviders?: {
      /** Catalog check configuration */
      catalog?: {
        requiredAttributes?: {
          /** How often catalog.requiredAttributes metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /** How catalog metadata metric values are categorized */
          thresholds?: ThresholdConfig;
          /** Provider-specific options */
          options?: {
            /**
             * Entity filter — scopes which catalog entities this provider evaluates.
             * Passed directly to the catalog client query.
             */
            filter: object;
            /** Metrics to evaluate — keys are metric IDs (used as catalog.<id>) */
            metrics?: {
              [metricId: string]: {
                /** Human-readable title */
                title: string;
                /** Human-readable description */
                description: string;
                /** Dotted field path to check on the entity (e.g. metadata.title, spec.lifecycle) */
                field: string;
                /** Per-metric status mapping overrides */
                statusMapping?: {
                  /** Status when field exists with a non-empty value not matched by values */
                  exists?: string;
                  /** Status when field resolves to null or undefined */
                  empty?: string;
                  /** Status when field resolves to an empty string */
                  emptyString?: string;
                  /** Status when field resolves to an empty array */
                  emptyArray?: string;
                  /** Status when the field path does not resolve */
                  missed?: string;
                  /** Status per specific field value */
                  values?: {
                    [value: string]: string;
                  };
                };
              };
            };
            /** Options-level status mapping defaults for all metrics */
            statusMapping?: {
              /** Status when field exists with a non-empty value not matched by values */
              exists?: string;
              /** Status when field resolves to null or undefined */
              empty?: string;
              /** Status when field resolves to an empty string */
              emptyString?: string;
              /** Status when field resolves to an empty array */
              emptyArray?: string;
              /** Status when the field path does not resolve */
              missed?: string;
              /** Status per specific field value */
              values?: {
                [value: string]: string;
              };
            };
          };
          /** Per-metric configuration. Keys are local metric names (no datasource prefix). */
          metrics?: {
            [metricName: string]: {
              thresholds?: ThresholdConfig;
            };
          };
        };
      };
    };
  };
}
