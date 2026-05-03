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
} from '@backstage/backend-plugin-api';
import { augmentPermissions } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ProviderType } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  augmentProviderExtensionPoint,
  type AgenticProviderFactory,
} from './extensions';
import type { ProviderDescriptor } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { createRouter } from './router';
import {
  createProvider,
  registerProviderFactory,
  registerProvider,
  ProviderManager,
} from './providers';
import { ChatSessionService } from './services/ChatSessionService';
import { AdminConfigService } from './services/AdminConfigService';
import { toErrorMessage } from './services/utils';

const SYNC_TASK_TIMEOUT_MINUTES = 30;

/**
 * Parse duration string to milliseconds
 * Supports: '30s', '5m', '1h', '1d'
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Augment backend plugin
 *
 * Provides agentic AI chat with RAG, tool calling, and safety guardrails.
 * The agentic provider is configurable via `augment.provider` in app-config.yaml
 * (default: 'llamastack'). Each provider implements the AgenticProvider
 * interface and brings its own chat, RAG, safety, and evaluation capabilities.
 *
 * @public
 */
export const augmentPlugin = createBackendPlugin({
  pluginId: 'augment',
  register(env) {
    const extensionProviders: Array<{
      descriptor: ProviderDescriptor;
      factory: AgenticProviderFactory;
    }> = [];

    env.registerExtensionPoint(augmentProviderExtensionPoint, {
      registerProvider(descriptor, factory) {
        extensionProviders.push({ descriptor, factory });
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
        scheduler: coreServices.scheduler,
        database: coreServices.database,
      },
      async init({
        logger,
        httpRouter,
        config,
        scheduler,
        httpAuth,
        permissions,
        permissionsRegistry,
        database,
      }) {
        logger.info('Initializing Augment backend plugin');

        for (const { descriptor, factory } of extensionProviders) {
          registerProvider(descriptor);
          registerProviderFactory(descriptor.id, factory);
          logger.info(
            `Registered extension provider: ${descriptor.id} (${descriptor.displayName})`,
          );
        }

        // Register the single plugin-level permission with the permissions framework
        // This controls access to the entire Augment plugin (all or nothing)
        // Configure via RBAC policies to restrict access to specific Keycloak groups
        permissionsRegistry.addPermissions(augmentPermissions);
        logger.info(
          'Registered augment.access permission for plugin-level access control',
        );

        // Get security mode early to configure auth policies correctly
        const securityMode =
          config.getOptionalString('augment.security.mode') || 'plugin-only';
        logger.info(`Augment security mode: ${securityMode}`);

        // Initialize shared admin config service (DB-backed, shared by provider and router)
        const adminConfig = new AdminConfigService(database, logger);
        await adminConfig.initialize();

        // Create the provider factory options (shared across hot-swaps)
        const providerOptions = { logger, config, database, adminConfig };

        // Factory function for creating providers by type
        const providerFactory = (type: ProviderType) =>
          createProvider(providerOptions, type);

        // Create and initialize the initial provider
        const initialProvider = createProvider(providerOptions);
        let initErrorMessage: string | undefined;
        try {
          await initialProvider.initialize();
          await initialProvider.postInitialize();
        } catch (initError) {
          initErrorMessage = toErrorMessage(initError);
          logger.error(
            `Provider initialization failed: ${initErrorMessage}. ` +
              'The plugin will start but all provider routes will return 503 until the issue is resolved. ' +
              'Check your augment.kagenti configuration in app-config.yaml.',
          );
        }

        const providerManager = new ProviderManager(
          initialProvider,
          providerFactory,
          logger,
          initErrorMessage,
        );

        // Set up periodic document sync if configured and provider supports RAG
        const syncSchedule = config.getOptionalString(
          'augment.documents.syncSchedule',
        );
        if (syncSchedule && providerManager.provider.rag) {
          try {
            const intervalMs = parseDuration(syncSchedule);
            logger.info(
              `Setting up periodic document sync every ${syncSchedule} (${intervalMs}ms)`,
            );

            await scheduler.scheduleTask({
              id: 'augment-document-sync',
              frequency: { milliseconds: intervalMs },
              timeout: { minutes: SYNC_TASK_TIMEOUT_MINUTES },
              fn: async () => {
                const currentProvider = providerManager.provider;
                logger.info('Running scheduled document sync');
                try {
                  const result = await currentProvider.rag!.syncDocuments();
                  logger.info(
                    `Scheduled sync completed: added=${result.added}, updated=${result.updated}, removed=${result.removed}`,
                  );
                } catch (error) {
                  logger.error(
                    `Scheduled sync failed: ${toErrorMessage(error)}`,
                  );
                }
              },
            });
          } catch (error) {
            logger.warn(
              `Invalid sync schedule format: ${syncSchedule}. Use formats like '30m', '1h', '1d'`,
            );
          }
        }

        // Initialize session service (local DB for session metadata)
        let sessions: ChatSessionService | undefined;
        try {
          const sessionService = new ChatSessionService(database, logger);
          await sessionService.initialize();
          sessions = sessionService;
          logger.info('Chat session service initialized');
        } catch (sessError) {
          logger.error(
            `Session service initialization failed: ${toErrorMessage(
              sessError,
            )}. Sessions will be unavailable.`,
          );
        }

        // Register HTTP routes
        httpRouter.use(
          await createRouter({
            logger,
            config,
            httpAuth,
            permissions,
            database,
            providerManager,
            sessions,
            adminConfig,
          }),
        );

        // Health check endpoint is always unauthenticated (for load balancers/k8s probes)
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        // Auth policy depends on security mode:
        // - 'none': all endpoints allow unauthenticated access
        // - 'plugin-only' or 'full': require user-cookie (OIDC session)
        const authPolicy: 'unauthenticated' | 'user-cookie' =
          securityMode === 'none' ? 'unauthenticated' : 'user-cookie';

        const protectedPaths = [
          '/status',
          '/branding',
          '/sessions',
          '/conversations',
          '/workflows',
          '/quick-actions',
          '/documents',
          '/chat',
          '/chat/stream',
          '/chat/approve',
          '/agents',
          '/sync',
          '/safety/status',
          '/evaluation/status',
          '/vector-stores',
          '/prompt-groups',
          '/admin',
          '/kagenti',
          '/scoring-functions',
          '/scoring',
          '/benchmarks',
          '/datasets',
        ];

        for (const path of protectedPaths) {
          httpRouter.addAuthPolicy({ path, allow: authPolicy });
        }

        if (securityMode === 'none') {
          logger.info(
            'Auth policy: All endpoints allow unauthenticated access (mode: none)',
          );
        } else {
          logger.info(
            'Auth policy: Endpoints require user-cookie authentication (mode: plugin-only/full)',
          );
        }

        logger.info('Augment backend plugin initialized successfully');
      },
    });
  },
});
