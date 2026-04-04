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
  LoggerService,
  HttpAuthService,
  PermissionsService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type { SecurityMode } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import express from 'express';
import Router from 'express-promise-router';
import type { ProviderManager } from './providers';
import type { ChatSessionService } from './services/ChatSessionService';
import type { RouteContext } from './routes';
import {
  registerStatusRoutes,
  registerChatRoutes,
  registerDocumentRoutes,
  registerConfigRoutes,
  registerSessionRoutes,
  registerConversationRoutes,
  registerAdminRoutes,
  registerKagentiRoutes,
  registerKagentiSandboxRoutes,
  registerKagentiAdminRoutes,
} from './routes';
import { toErrorMessage } from './services/utils';
import { sanitizeErrorMessage } from './services/utils/errorSanitizer';
import type { AdminConfigService } from './services/AdminConfigService';
import { createSecurityMiddleware } from './middleware/security';
import { createRateLimiter } from './middleware/rateLimiter';
import {
  parseChatRequest,
  parseApprovalRequest,
} from './parsers/chatRequestParsers';

export interface RouterOptions {
  logger: LoggerService;
  config: import('@backstage/config').Config;
  httpAuth: HttpAuthService;
  permissions: PermissionsService;
  database: DatabaseService;
  providerManager: ProviderManager;
  sessions?: ChatSessionService;
  adminConfig: AdminConfigService;
}

/**
 * Creates an Express router for the Augment backend
 *
 * Documents are managed via config-driven ingestion, not via API endpoints.
 * The documents endpoint is read-only for viewing what's in the knowledge base.
 *
 * Authentication & Authorization:
 * - All endpoints (except /health) require user authentication via Backstage httpAuth
 * - Authorization uses a single plugin-level permission: augment.access
 * - If a user has the permission, they get FULL access to all features
 * - If not, they are blocked from the entire plugin
 *
 * To restrict access to a Keycloak group, configure RBAC policies in app-config.yaml:
 * ```yaml
 * permission:
 *   enabled: true
 *   rbac:
 *     policies:
 *       # Map Keycloak group to a role
 *       - g, group:default/augment-users, role:default/augment-user
 *       # Grant plugin access to the role (single permission for entire plugin)
 *       - p, role:default/augment-user, augment.access, read, allow
 * ```
 *
 * @public
 */
export async function createRouter({
  logger,
  config,
  httpAuth,
  permissions,
  providerManager,
  sessions,
  adminConfig,
}: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json({ limit: '1mb' }));

  // =============================================================================
  // Shared Helpers
  // =============================================================================

  function sendRouteError(
    res: express.Response,
    error: unknown,
    logLabel: string,
    userFacingError: string,
    extra?: Record<string, unknown>,
    statusCode?: number,
  ): void {
    const rawMsg = toErrorMessage(error);
    logger.error(`${logLabel}: ${rawMsg}`);
    const { message, inferredStatus } = sanitizeErrorMessage(rawMsg);
    const resolvedStatus =
      statusCode ??
      (error instanceof InputError ? 400 : (inferredStatus ?? 500));
    res
      .status(resolvedStatus)
      .json({ error: userFacingError, message, ...extra });
  }

  function missingSessions(res: express.Response): boolean {
    if (!sessions) {
      res.status(501).json({ success: false, error: 'Sessions not available' });
      return true;
    }
    return false;
  }

  function missingConversations(res: express.Response): boolean {
    if (!providerManager.provider.conversations) {
      res.status(501).json({
        success: false,
        error: 'Conversations not supported by current provider',
      });
      return true;
    }
    return false;
  }

  // =============================================================================
  // Security Configuration
  // =============================================================================

  const VALID_SECURITY_MODES: ReadonlySet<SecurityMode> = new Set<SecurityMode>(
    ['none', 'plugin-only', 'full'],
  );
  const rawSecurityMode =
    config.getOptionalString('augment.security.mode') || 'plugin-only';
  if (!VALID_SECURITY_MODES.has(rawSecurityMode as SecurityMode)) {
    throw new InputError(
      `Invalid security mode "${rawSecurityMode}". Must be one of: ${[
        ...VALID_SECURITY_MODES,
      ].join(', ')}`,
    );
  }
  const securityMode = rawSecurityMode as SecurityMode;
  const securityConfig = {
    mode: securityMode,
    accessDeniedMessage: config.getOptionalString(
      'augment.security.accessDeniedMessage',
    ),
  };
  const adminUsers = config.getOptionalStringArray(
    'augment.security.adminUsers',
  );
  const permissionsEnabled =
    config.getOptionalBoolean('permission.enabled') === true;

  const { requirePluginAccess, checkIsAdmin, requireAdminAccess, getUserRef } =
    createSecurityMiddleware({
      logger,
      httpAuth,
      permissions,
      securityMode,
      accessDeniedMessage: securityConfig.accessDeniedMessage,
      adminUsers,
      permissionsEnabled,
    });

  // Log security mode and admin mechanism
  if (securityConfig.mode === 'none') {
    logger.info('Augment security mode: NONE (no access control)');
  } else if (securityConfig.mode === 'plugin-only') {
    logger.info(
      'Augment security mode: PLUGIN-ONLY (Backstage RBAC for plugin access)',
    );
  } else if (securityConfig.mode === 'full') {
    logger.info('Augment security mode: FULL (Backstage RBAC + MCP OAuth)');
    logger.info('  MCP servers will receive OAuth tokens');
  }
  if (securityConfig.mode !== 'none') {
    if (permissionsEnabled) {
      logger.info(
        '  Admin access: determined by Backstage RBAC (augment.admin permission)',
      );
    } else if (adminUsers && adminUsers.length > 0) {
      logger.info(
        `  Admin access: config-based (${adminUsers.length} user${
          adminUsers.length !== 1 ? 's' : ''
        } in augment.security.adminUsers)`,
      );
    } else {
      logger.warn(
        '  Admin access: NO admin mechanism configured. ' +
          'Either enable Backstage permissions (permission.enabled: true) ' +
          'or set augment.security.adminUsers in app-config.yaml.',
      );
    }
  }

  // =============================================================================
  // Route Registration
  // =============================================================================

  const ctx: RouteContext = {
    router,
    logger,
    config,
    get provider() {
      return providerManager.provider;
    },
    sessions,
    toErrorMessage,
    sendRouteError,
    missingSessions,
    missingConversations,
    getUserRef,
    checkIsAdmin,
    requireAdminAccess,
    parseChatRequest,
    parseApprovalRequest,
  };

  const onConfigChanged = () => {
    providerManager.provider.invalidateRuntimeConfig?.();
  };

  // Public routes (before auth middleware)
  registerStatusRoutes(ctx, adminConfig, providerManager.initializationError);

  // Apply plugin-level access control to ALL subsequent routes
  router.use(requirePluginAccess);

  const mutationLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 30,
  });
  router.post('/chat/approve', mutationLimiter);

  // Authenticated routes
  registerChatRoutes(ctx);
  registerDocumentRoutes(ctx);
  registerConfigRoutes(ctx, adminConfig);
  registerSessionRoutes(ctx);
  registerConversationRoutes(ctx);

  // Admin routes (requireAdminAccess is applied inside registerAdminRoutes)
  registerAdminRoutes(ctx, adminConfig, onConfigChanged, providerManager);

  // Kagenti-specific routes (only when provider is kagenti)
  if (providerManager.provider.id === 'kagenti') {
    registerKagentiRoutes(ctx);
    registerKagentiSandboxRoutes(ctx);
    registerKagentiAdminRoutes(ctx);
    logger.info('Kagenti provider routes registered');
  }

  return router;
}
