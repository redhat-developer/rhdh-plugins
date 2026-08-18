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
  /** Configuration for jira plugin */
  jira: (
    | {
        /** Required only when using direct connection. */
        baseUrl: string;
        /** Required only when using direct connection. */
        token: string;
      }
    | {
        /** Required only when using proxy connection. */
        proxyPath: string;
      }
  ) & {
    product: string;
  };
  /** Configuration for scorecard plugin */
  scorecard?: {
    /** Metric providers calculate one or more metrics on a schedule. */
    metricProviders?: {
      /** JIRA datasource configuration */
      jira?: {
        openIssues?: {
          options?: {
            mandatoryFilter?: string;
            customFilter?: string;
          };
          /** How often jira.openIssues metrics will be calculated */
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
          /** How jira.openIssues metric values are categorized */
          thresholds?: ThresholdConfig;
        };
      };
    };
  };
}
