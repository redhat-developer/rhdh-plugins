/*
 * Copyright 2024 The Backstage Authors
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
    sonataFlowService: {
      /**
       * Base URL of the Sonata Flow service.
       * Default: http://localhost
       */
      baseUrl?: string;
      /**
       * Port of the Sonata Flow service.
       * Default: no port
       */
      port?: string;
      /**
       * Whether to start the Sonata Flow service automatically.
       * If set to `false`, the plugin assumes that the SonataFlow service is already running on `baseUrl`:`port` (or just `baseUrl` if `port` is not set).
       * Default: false
       */
      autoStart?: boolean;
      /**
       * Workflows definitions source configurations
       */
      workflowsSource?:
        | {
            /**
             * Remote git repository where workflows definitions are stored
             */
            gitRepositoryUrl: string;
            /**
             * Path to map workflow resources to SonataFlow service.
             * Example: /home/orchestrator/workflows
             */
            localPath: string;
          }
        | {
            localPath: string;
          };

      /**
       * Container image name of the Sonata Flow service.
       * Default: quay.io/kiegroup/kogito-swf-devmode-nightly:main-2024-02-19
       */
      container?: string;
      /**
       * Persistance configuration of the Sonata Flow service.
       */
      persistance?: {
        /**
         * Path in the container image to store persistance data.
         * Default: /home/kogito/persistence
         */
        path?: string;
      };
    };
    dataIndexService: {
      /**
       * URL of the Data Index service.
       * Example: http://localhost:8099
       */
      url: string;
    };
  };
}
