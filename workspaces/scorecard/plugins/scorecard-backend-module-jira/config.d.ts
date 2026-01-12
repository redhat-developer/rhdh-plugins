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
    /** Configuration for scorecard plugins/datasources */
    plugins?: {
      /** JIRA datasource configuration */
      jira?: {
        open_issues?: {
          options?: {
            mandatoryFilter?: string;
            customFilter?: string;
          };
          thresholds?: {
            rules?: Array<{
              key: 'error' | 'warning' | 'success';
              /** Threshold expression - supports: >=, <=, >, <, ==, !=, - (range) */
              expression: string;
            }>;
          };
          schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
        };
      };
    };
  };
}
