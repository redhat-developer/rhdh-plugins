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
         *
         * Must be an absolute http(s) URL without credentials, query, or fragment.
         * In production (NODE_ENV=production), https is required unless allowInsecureHttp is true.
         */
        baseUrl: string;
        /**
         * Optional allowlist for the hostname parsed from baseUrl.
         * Entries are matched case-insensitively. If an entry starts with `.`, the hostname must be
         * that suffix or a subdomain (e.g. `.example.com` allows `loki.example.com`).
         */
        allowedHosts?: string[];
        /**
         * When true, allows http:// baseUrl when NODE_ENV is production.
         * Defaults to false; local/dev typically uses NODE_ENV!=production where http is already allowed.
         */
        allowInsecureHttp?: boolean;
        /**
         * Auth Token for accessing the loki query url
         */
        /** @visibility secret */
        token: string;
        /**
         * Limit the number of logs to fetch
         * defaults to 100
         */
        limit?: number;
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
