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
  dcm: {
    /**
     * Base URL of the DCM API Gateway.
     *
     * All API services (catalog, policy-manager, providers) are routed
     * through this single gateway. The backend appends `/api/v1alpha1/<path>`
     * to construct the upstream URL.
     *
     * @example "http://localhost:9080"
     * @visibility backend
     */
    apiGatewayUrl?: string;

    /**
     * Base URL for the SSO token endpoint.
     *
     * Defaults to "https://sso.redhat.com".
     *
     * @visibility backend
     */
    ssoBaseUrl?: string;

    /**
     * SSO client ID used to obtain a bearer token for upstream API calls.
     * Leave empty to disable SSO token exchange.
     *
     * @visibility secret
     */
    clientId?: string;

    /**
     * SSO client secret used to obtain a bearer token for upstream API calls.
     * Leave empty to disable SSO token exchange.
     *
     * @visibility secret
     */
    clientSecret?: string;
  };
}
