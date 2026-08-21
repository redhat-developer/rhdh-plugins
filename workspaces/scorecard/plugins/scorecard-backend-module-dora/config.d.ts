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
  CollectorConfig,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export interface Config {
  /** Configuration for scorecard dora plugin. */
  scorecard?: {
    plugins?: {
      /**
       * Configuration for scorecard dora plugin.
       */
      dora?: {
        /**
         * Number of days to retain scorecard DORA source data (deployments, incidents,
         * pull requests) in the database. Older data is cleaned up by the
         * `scorecard-dora:cleanup-expired-data` task.
         * Must be greater than or equal to the DORA metric computation window (30 days).
         * @default 365
         */
        dataRetentionDays?: number;
        /**
         * Freshness threshold in milliseconds for DORA deployment and incident collector refresh.
         * If last successful deployments or incidents sync for a collector is within this value,
         * data refresh is skipped and existing database data is reused.
         * Must be greater than or equal to 0.
         * Set to `0` to always refresh.
         * @default 60000 (1 minute)
         */
        staleAfterMs?: number;
        /**
         * How far before the last successful deployments watermark to re-query
         * deployments by created time. Covers status updated to success after
         * that finishes after the previous refresh.
         * Must be greater than or equal to 0 and less than or equal
         * to the DORA metric computation window (30 days).
         * Set to `0` for watermark-only incremental refresh (no lookback).
         * @default 172800000 (48 hours)
         */
        deploymentLookbackMs?: number;
      };
    };
    metricProviders?: {
      dora?: {
        deploymentFrequency?: {
          /**
           * Provider-specific options.
           */
          options?: {
            /**
             * Environment names treated as production (case-insensitive).
             * Missing/unknown deployment environments still count as production.
             * @default ['production']
             */
            productionEnvironments?: string[];
            collectors?: {
              deployments?: CollectorConfig;
            };
          };
          thresholds?: ThresholdConfig;
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
        medianLeadTimeForChanges?: {
          /**
           * Provider-specific options.
           */
          options?: {
            /**
             * Environment names treated as production (case-insensitive).
             * Missing/unknown deployment environments still count as production.
             * @default ['production']
             */
            productionEnvironments?: string[];
            collectors?: {
              deployments?: CollectorConfig;
              deploymentPullRequests?: CollectorConfig;
            };
          };
          thresholds?: ThresholdConfig;
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
        meanTimeToRestore?: {
          /**
           * Provider-specific options.
           */
          options?: {
            collectors?: {
              incidents?: CollectorConfig;
            };
          };
          thresholds?: ThresholdConfig;
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
        changeFailureRate?: {
          /**
           * Provider-specific options.
           */
          options?: {
            /**
             * Environment names treated as production (case-insensitive).
             * Missing/unknown deployment environments still count as production.
             * @default ['production']
             */
            productionEnvironments?: string[];
            collectors?: {
              deployments?: CollectorConfig;
              incidents?: CollectorConfig;
            };
          };
          thresholds?: ThresholdConfig;
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
