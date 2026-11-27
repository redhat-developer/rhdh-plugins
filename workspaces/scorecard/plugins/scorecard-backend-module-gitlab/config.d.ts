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
      /** GitLab datasource configuration */
      gitlab?: {
        /** Issues metrics provider (`gitlab.issues`) */
        issues?: {
          /** How often this provider's metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /**
           * Provider-level thresholds applied to every metric from this provider
           * unless overridden under `metrics`. Prefer per-metric overrides when
           * count and percentage metrics share a provider.
           */
          thresholds?: ThresholdConfig;
          /** Per-metric configuration. Keys are local metric names (no datasource prefix). */
          metrics?: {
            [metricName: string]: {
              thresholds?: ThresholdConfig;
            };
          };
        };
        /** Merge request metrics provider (`gitlab.mergeRequests`) */
        mergeRequests?: {
          /** How often this provider's metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /**
           * Provider-level thresholds applied to every metric from this provider
           * unless overridden under `metrics`. Prefer per-metric overrides when
           * count and percentage metrics share a provider.
           */
          thresholds?: ThresholdConfig;
          /** Per-metric configuration. Keys are local metric names (no datasource prefix). */
          metrics?: {
            [metricName: string]: {
              thresholds?: ThresholdConfig;
            };
          };
        };
        /** Pipeline metrics provider (`gitlab.pipelines`) */
        pipelines?: {
          /** How often this provider's metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /**
           * Provider-level thresholds applied to every metric from this provider
           * unless overridden under `metrics`. Prefer per-metric overrides when
           * count and percentage metrics share a provider.
           */
          thresholds?: ThresholdConfig;
          /** Per-metric configuration. Keys are local metric names (no datasource prefix). */
          metrics?: {
            [metricName: string]: {
              thresholds?: ThresholdConfig;
            };
          };
        };
        /** Job metrics provider (`gitlab.jobs`) */
        jobs?: {
          /** How often this provider's metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /**
           * Provider-level thresholds applied to every metric from this provider
           * unless overridden under `metrics`. Prefer per-metric overrides when
           * count and percentage metrics share a provider.
           */
          thresholds?: ThresholdConfig;
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
