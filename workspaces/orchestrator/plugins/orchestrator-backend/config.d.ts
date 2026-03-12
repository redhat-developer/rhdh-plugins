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
    kafka?: {
      // A logical identifier of an application.
      // https://kafka.js.org/docs/configuration#client-id
      clientId: string;
      // logLevel override for the orchestrator kafka services
      // logLevel values based on KafkaJS values https://kafka.js.org/docs/configuration#logging
      //  export enum logLevel {
      //    NOTHING = 0,
      //    ERROR = 1,
      //    WARN = 2,
      //    INFO = 4,
      //    DEBUG = 5,
      //  }
      logLevel?: 0 | 1 | 2 | 4 | 5;
      /**
       * List of brokers in the Kafka cluster to connect to.
       */
      brokers: string[];
      /**
       * Optional SSL connection parameters to connect to the cluster. Passed directly to Node tls.connect.
       * See https://nodejs.org/dist/latest-v8.x/docs/api/tls.html#tls_tls_createsecurecontext_options
       */
      ssl?:
        | {
            ca?: string[];
            /** @visibility secret */
            key?: string;
            cert?: string;
            rejectUnauthorized?: boolean;
          }
        | boolean;
      /**
       * Optional SASL connection parameters.
       */
      sasl?: {
        mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
        username: string;
        /** @visibility secret */
        password: string;
      };
    };
  };
}
