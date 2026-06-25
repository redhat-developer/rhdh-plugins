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
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { AgenticProvider } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import {
  boostAdminPermission,
  boostPermissions,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import {
  boostAiProviderServiceRef,
  boostProviderExtensionPoint,
} from '@red-hat-developer-hub/backstage-plugin-boost-node';
import { Router } from 'express';
import { AdminConfigService } from './config/AdminConfigService';
import { RuntimeConfigResolver } from './config/RuntimeConfigResolver';
import { isSensitiveField, type BoostConfigKey } from './config/schemas';
import { ProviderManager } from './provider/ProviderManager';
import { validateSecurityMode } from './middleware/security';
import { AgentLifecycleStore } from './agents/AgentLifecycleStore';
import { createAgentRoutes } from './agents/routes';
import { ToolLifecycleStore } from './tools/ToolLifecycleStore';
import { createToolRoutes } from './tools/routes';
import { createKagentiAdminRoutes } from './kagenti/routes';
import { McpServerStore } from './mcp/McpServerStore';
import { createMcpServerRoutes } from './mcp/routes';
import { createChatRoutes } from './chat/routes';
import { createConversationRoutes } from './chat/conversationRoutes';
import { ConversationAgentCache } from './chat/ConversationAgentCache';
import { ConversationRegistry } from './chat/ConversationRegistry';
import { ConversationStore } from './chat/ConversationStore';
import { RateLimiter } from './chat/RateLimiter';
import { BackendApprovalStore } from './approval/BackendApprovalStore';
import { DocumentSyncService } from './documents/DocumentSyncService';
import { createSkillsRoutes } from './skills/routes';

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
  factory(): AgenticProvider {
    // Return a lazy proxy so that provider modules can register after
    // the service factory is resolved. Each method delegates to
    // providerManager.getActiveProvider() at invocation time.
    return {
      get descriptor() {
        return providerManager.getActiveProvider().descriptor;
      },
      chat(messages) {
        return providerManager.getActiveProvider().chat(messages);
      },
      chatStream(messages) {
        return providerManager.getActiveProvider().chatStream(messages);
      },
    };
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
        cache: coreServices.cache,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
      },
      async init({
        logger,
        config,
        cache,
        database,
        httpRouter,
        httpAuth,
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

        // Initialize runtime configuration engine
        const encryptionSecret = config.getOptionalString(
          'boost.encryptionSecret',
        );
        const adminConfigService = new AdminConfigService({
          database,
          logger,
          encryptionSecret,
        });

        // Re-validate stored DB values against current Zod schemas (schema evolution)
        const removedKeys = await adminConfigService.validateStoredValues();
        if (removedKeys.length > 0) {
          logger.warn(
            `Schema validation removed ${removedKeys.length} stale config override(s) on startup`,
          );
        }

        const runtimeConfigResolver = new RuntimeConfigResolver({
          cache,
          config,
          adminConfigService,
          logger,
        });

        logger.info('Runtime configuration engine initialized');

        // Initialize agent lifecycle store
        const agentStore = new AgentLifecycleStore({
          database,
          logger,
        });

        // Initialize tool lifecycle store
        const toolStore = new ToolLifecycleStore({
          database,
          logger,
        });

        // Initialize MCP server store
        const mcpServerStore = new McpServerStore({
          database,
          logger,
        });

        // Initialize conversation-agent cache (task 1.8)
        const conversationAgentCache = new ConversationAgentCache({
          cache,
          logger,
        });

        // Initialize conversation registry — maps response IDs to
        // conversation IDs with 24h TTL (task 1.3). Available for
        // provider modules and future response-tracking features.
        // @ts-ignore TS6133 — retained for provider modules / response-tracking
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _conversationRegistry = new ConversationRegistry({
          cache,
          logger,
        });

        // Initialize conversation store (issue 7 of 15)
        const conversationStore = new ConversationStore({
          database,
          logger,
        });

        // Initialize rate limiter (task 1.9)
        const rateLimiter = new RateLimiter({
          cache,
          logger,
        });

        // Initialize HITL approval store (task 1.10)
        // @ts-ignore TS6133 — retained for approval routes / HITL flow
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _approvalStore = new BackendApprovalStore({
          cache,
          logger,
        });

        // Initialize document sync service — tracks content hashes
        // for RAG pipeline change detection (task 1.4). Available for
        // document ingestion and sync features.
        // @ts-ignore TS6133 — retained for RAG pipeline / document sync
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _documentSyncService = new DocumentSyncService({
          cache,
          logger,
        });

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

        // Agent lifecycle routes (tasks 3.1–3.7)
        const agentRoutes = createAgentRoutes({
          store: agentStore,
          permissions: _permissions,
          httpAuth,
          logger,
        });
        router.use(agentRoutes);

        // Tool lifecycle routes (tasks 4.1–4.4)
        const toolRoutes = createToolRoutes({
          store: toolStore,
          permissions: _permissions,
          httpAuth,
          logger,
        });
        router.use(toolRoutes);

        // Kagenti admin routes (task 5.1)
        const kagentiRoutes = createKagentiAdminRoutes({
          permissions: _permissions,
          httpAuth,
          logger,
        });
        router.use(kagentiRoutes);

        // MCP server registration routes
        const mcpRoutes = createMcpServerRoutes({
          store: mcpServerStore,
          permissions: _permissions,
          httpAuth,
          logger,
        });
        router.use(mcpRoutes);

        // Chat and streaming routes (issue 6 of 15)
        const chatRoutes = createChatRoutes({
          providerManager,
          permissions: _permissions,
          httpAuth,
          logger,
          conversationAgentCache,
          rateLimiter,
        });
        router.use(chatRoutes);

        // Conversation history routes (issue 7 of 15)
        const conversationRoutes = createConversationRoutes({
          store: conversationStore,
          permissions: _permissions,
          httpAuth,
          logger,
        });
        router.use(conversationRoutes);

        // Skills marketplace proxy routes (issue 15 of 15, tasks 5.1/5.3/5.4)
        const skillsRoutes = createSkillsRoutes({
          permissions: _permissions,
          httpAuth,
          logger,
          config,
        });
        router.use(skillsRoutes);

        // Health check endpoint (always unauthenticated)
        router.get('/health', (_req, res) => {
          res.json({ status: 'ok' });
        });

        // Config status endpoint (for admin onboarding)
        router.get('/config/status', async (req, res) => {
          try {
            const credentials = await httpAuth.credentials(req);
            const decision = await _permissions.authorize(
              [{ permission: boostAdminPermission }],
              { credentials },
            );
            if (decision[0].result !== AuthorizeResult.ALLOW) {
              res.status(403).json({ status: 'error', message: 'Forbidden' });
              return;
            }

            const allConfig = await runtimeConfigResolver.resolveAll();
            const redacted: Record<string, unknown> = {};
            for (const [key, value] of allConfig) {
              redacted[key] = isSensitiveField(key as BoostConfigKey)
                ? '**REDACTED**'
                : value;
            }
            res.json({
              status: 'ok',
              fieldCount: allConfig.size,
              config: redacted,
            });
          } catch (error) {
            logger.error('Config status endpoint failed', error as Error);
            res
              .status(500)
              .json({ status: 'error', message: 'Internal server error' });
          }
        });

        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/config/status',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/agents',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/tools',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/kagenti',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/mcp',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/chat',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/conversations',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/skills',
          allow: 'user-cookie',
        });

        logger.info('Boost backend plugin initialized successfully');
      },
    });
  },
});
