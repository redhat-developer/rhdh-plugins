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

export interface Config {
  /** Configuration for scorecard plugin */
  scorecard?: {
    /** Number of days to retain metric data in the database. Older data will be automatically cleaned up. Default: 365 days */
    dataRetentionDays?: number;
    /** List of metric IDs (e.g. openssf.packaging) that are disabled globally. Entity annotations cannot override this. */
    disabledMetrics?: string[];
    /** Control whether users can override behavior via entity annotations. */
    entityOverrides?: {
      /** Whether entity scorecard.io/disabled-metrics annotation can override. Only affects annotations; global disabledMetrics is unchanged. */
      disabledMetrics?: {
        /** If true (default), except list can force any entity disabled metrics to run. If false, the disabled metrics set are respected accordingly. */
        enabled?: boolean;
        /** When enabled is true: this list creates an exception by enabling all metrics listed. */
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
            rules?: Array<{
              key: string;
              /** Threshold expression - supports: >=, <=, >, <, ==, !=, - (range) */
              expression: string;
              /**
               * Color for this threshold rule. Can be a theme palette path (e.g., 'error.main')
               * or a direct color value (e.g., '#ADD8E6', 'blue', 'rgb(255,255,0)')
               */
              color?: string;
            }>;
          };
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
