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

export interface Config {
  /**
   * Configuration for the Orchestrator plugin.
   */
  orchestrator?: {
    workflowLogProvider?: {
      loki?: {
        /**
         * Base URL of the Loki service.
         * /loki/api/v1/query_range will be appended to the baseUrl
         */
        baseUrl: string;
        /**
         * Auth Token for accessing the loki query url
         */
        token: string;
        /**
         * Set to false if the baseUrl has a self-signed certificate
         * defaults to true
         */
        rejectUnauthorized?: boolean;
        // Add custom log pipeline filters
        // default is the workflow instanceId
        // new values will be appened
        logPipelineFilters?: Array<string>;
        logStreamSelectors?: Array<{
          // label is the selector, something like 'app' or 'service_name', etc...
          label: string;
          // value is the label matching operator, so something like: '=~".+"'
          value: string;
        }>;
      };
    };
  };
}
