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
  createBackendPlugin,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import { boostPermissions } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import {
  boostAiProviderServiceRef,
  boostProviderExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-boost-node';
import { Router } from 'express';
import { ProviderManager } from './provider/ProviderManager';
import { validateSecurityMode } from './middleware/security';

/**
 * The ProviderManager instance shared between the plugin and the
 * service factory. This module-level singleton is safe because each
 * backend process runs a single plugin instance.
 *
 * @internal
 */
const providerManager = new ProviderManager();

/**
 * Default service factory for `boostAiProviderServiceRef`.
 *
 * Resolves to the active provider from the `ProviderManager`.
 * Install this alongside the plugin in the backend:
 *
 * ```ts
 * backend.add(import('@red-hat-developer-hub/backstage-plugin-boost-backend'));
 * backend.add(boostAiProviderServiceFactory);
 * ```
 *
 * @public
 */
export const boostAiProviderServiceFactory = createServiceFactory({
  service: boostAiProviderServiceRef,
  deps: {},
  factory() {
    return providerManager.getActiveProvider();
  },
});

/**
 * The boost backend plugin.
 *
 * Provides:
 * - `boostProviderExtensionPoint` for provider module registration
 * - Default service factory for `boostAiProviderServiceRef`
 * - Permission registration for all 23 boost permissions
 * - Security mode validation and enforcement
 * - Health check endpoint
 *
 * @public
 */
export const boostPlugin = createBackendPlugin({
  pluginId: 'boost',
  register(env) {
    // Register the extension point so provider modules can register
    env.registerExtensionPoint(boostProviderExtensionPoint, {
      registerProvider(provider) {
        providerManager.registerProvider(provider);
      },
    });

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({
        logger,
        config,
        httpRouter,
        permissions: _permissions,
        permissionsRegistry,
      }) {
        logger.info('Initializing boost backend plugin');

        // Validate security mode (rejects 'none', warns in production)
        const securityMode = validateSecurityMode(
          config.getOptionalString('boost.security.mode'),
          logger,
        );
        logger.info(`Boost security mode: ${securityMode}`);

        // Register all boost permissions with the framework
        permissionsRegistry.addPermissions([...boostPermissions]);
        logger.info(`Registered ${boostPermissions.length} boost permissions`);

        // Log registered providers
        const providers = providerManager.getRegisteredProviders();
        if (providers.length > 0) {
          for (const desc of providers) {
            logger.info(`Registered AI provider: ${desc.id} (${desc.name})`);
          }
        } else {
          logger.warn(
            'No AI providers registered. Install a provider module ' +
              '(e.g., boost-backend-module-llamastack) to enable AI features.',
          );
        }

        // Set up HTTP routes
        const router = Router();

        // Permission integration router for Backstage permission framework discovery
        const permissionIntegrationRouter = createPermissionIntegrationRouter({
          permissions: [...boostPermissions],
        });
        router.use(permissionIntegrationRouter);

        // Health check endpoint (always unauthenticated)
        router.get('/health', (_req, res) => {
          res.json({ status: 'ok' });
        });

        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        logger.info('Boost backend plugin initialized successfully');
      },
    });
  },
});
