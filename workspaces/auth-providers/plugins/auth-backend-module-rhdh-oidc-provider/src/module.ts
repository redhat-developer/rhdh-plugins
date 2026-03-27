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

import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import type { AuthProviderFactory } from '@backstage/plugin-auth-node';
import { authProvidersExtensionPoint } from '@backstage/plugin-auth-node';

import { keycloakProviderFactory } from './providers/keycloakProviderFactory';
import { pingFederateProviderFactory } from './providers/pingFederateProviderFactory';

/**
 * Provider ID for Keycloak OIDC authentication.
 * @public
 */
export const KEYCLOAK_PROVIDER_ID = 'keycloak';

/**
 * Provider ID for PingFederate OIDC authentication.
 * @public
 */
export const PINGFEDERATE_PROVIDER_ID = 'pingfederate';

/**
 * Combined OIDC auth backend module that registers Keycloak and PingFederate providers.
 *
 * This module provides OIDC authentication with RHDH-specific sign-in resolvers
 * for both Keycloak and PingFederate identity providers.
 *
 * Registers providers based on auth.providers configuration:
 * - providerId: 'keycloak' uses keycloakProviderFactory
 * - providerId: 'pingfederate' uses pingFederateProviderFactory
 *
 * @public
 */
const authProvidersModule = createBackendModule({
  pluginId: 'auth',
  moduleId: 'rhdh-oidc-auth-providers',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        providers: authProvidersExtensionPoint,
      },
      async init({ config, providers }) {
        const providersConfig = config.getConfig('auth.providers');

        const providerFactories: Record<string, AuthProviderFactory> = {
          [KEYCLOAK_PROVIDER_ID]: keycloakProviderFactory,
          [PINGFEDERATE_PROVIDER_ID]: pingFederateProviderFactory,
        };

        providersConfig
          .keys()
          .filter(providerId => providerId in providerFactories)
          .forEach(providerId => {
            const factory = providerFactories[providerId];
            providers.registerProvider({
              providerId,
              factory,
            });
          });
      },
    });
  },
});

export default authProvidersModule;
