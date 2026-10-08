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

/**
 * Configuration schema for the Kagenti provider module.
 *
 * Declares the config paths read by KagentiProviderFactory so that
 * Backstage validates and enforces visibility on these keys even if
 * the module is loaded independently of boost-backend.
 */
export interface Config {
  boost?: {
    /** AI provider connection settings. */
    providers?: {
      /** Kagenti A2A provider connection. */
      kagenti?: {
        /**
         * Base URL for the Kagenti A2A endpoint.
         * @configScope yaml-only
         */
        baseUrl?: string;
        /**
         * Default agent ID for task routing.
         * @configScope yaml-only
         */
        defaultAgent?: string;
      };
    };

    /** Kagenti provider configuration. */
    kagenti?: {
      /** Keycloak service-account authentication. */
      auth?: {
        /**
         * Keycloak token endpoint URL for OAuth2 Client Credentials Grant.
         * @configScope yaml-only
         */
        tokenEndpoint?: string;
        /**
         * OAuth2 client ID for service-account authentication.
         * @configScope yaml-only
         */
        clientId?: string;
        /**
         * OAuth2 client secret for service-account authentication.
         * @visibility secret
         * @configScope yaml-only
         */
        clientSecret?: string;
        /**
         * Seconds before token expiry to proactively refresh.
         * @configScope yaml-only
         */
        tokenExpiryBufferSeconds?: number;
      };
    };
  };
}
