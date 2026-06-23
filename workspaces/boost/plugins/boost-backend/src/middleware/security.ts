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

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import {
  AuthorizeResult,
  type Permission,
  type AuthorizePermissionRequest,
} from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';
import { boostAdminPermission } from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Security mode validation
// ---------------------------------------------------------------------------

/**
 * Valid security modes for the boost plugin.
 *
 * @public
 */
export type SecurityMode = 'development-only-no-auth' | 'plugin-only' | 'full';

const VALID_SECURITY_MODES: readonly SecurityMode[] = [
  'development-only-no-auth',
  'plugin-only',
  'full',
];

/**
 * Validate and return the configured security mode.
 *
 * - Rejects `none` with a clear error directing users to `development-only-no-auth`.
 * - Rejects any other invalid value with a list of valid modes.
 * - Logs a warning if `development-only-no-auth` is used in a production environment.
 * - Defaults to `development-only-no-auth` when no mode is configured.
 *
 * @param mode - The raw config value from `boost.security.mode`.
 * @param logger - Logger for startup warnings.
 * @returns The validated security mode.
 *
 * @public
 */
export function validateSecurityMode(
  mode: string | undefined,
  logger: LoggerService,
): SecurityMode {
  if (mode === 'none') {
    throw new Error(
      'Security mode "none" is not a valid mode name. ' +
        'Use "development-only-no-auth" instead. ' +
        `Valid modes: ${VALID_SECURITY_MODES.join(', ')}`,
    );
  }

  if (!mode) {
    return 'development-only-no-auth';
  }

  if (!VALID_SECURITY_MODES.includes(mode as SecurityMode)) {
    throw new Error(
      `Invalid security mode "${mode}". ` +
        `Valid modes: ${VALID_SECURITY_MODES.join(', ')}`,
    );
  }

  const securityMode = mode as SecurityMode;

  if (securityMode === 'development-only-no-auth') {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      logger.warn(
        'Security mode is set to "development-only-no-auth" in a production environment. ' +
          'This disables all authentication and authorization. ' +
          'Use "plugin-only" or "full" for production deployments.',
      );
    }
  }

  return securityMode;
}

// ---------------------------------------------------------------------------
// Authorization middleware
// ---------------------------------------------------------------------------

/**
 * A function that loads a resource for permission evaluation.
 * Returns the resource metadata needed for conditional permission checks,
 * or `undefined` if the resource is not found.
 *
 * @public
 */
export type ResourceLoader = (req: Request) => Promise<
  | {
      createdBy?: string;
      lifecycleStage?: string;
    }
  | undefined
>;

/**
 * Options for the `authorizeLifecycleAction` middleware.
 *
 * @public
 */
export interface AuthorizeLifecycleActionOptions {
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
}

/**
 * Express middleware that enforces fine-grained permission checks
 * for lifecycle actions on agents and tools.
 *
 * The authorization flow:
 * 1. Check the fine-grained `permission` via `permissions.authorize()`.
 * 2. If ALLOW, proceed.
 * 3. If DENY, fall back to checking `boost.admin` permission.
 * 4. If admin ALLOW, proceed.
 * 5. If admin DENY, respond with 403.
 *
 * This enables deployments that prefer coarse-grained control to work
 * with just `boost.admin` without configuring all 16 permissions.
 *
 * @param permission - The fine-grained permission to check. Resource-scoped permissions
 *   are accepted but conditional authorization is deferred to a later issue — for now
 *   the check is non-conditional (ALLOW/DENY only).
 * @param _resourceLoader - Loads the resource for conditional checks (reserved for future use).
 * @param options - Services needed for authorization.
 * @returns Express middleware handler.
 *
 * @public
 */
export function authorizeLifecycleAction(
  permission: Permission,
  _resourceLoader: ResourceLoader,
  options: AuthorizeLifecycleActionOptions,
): RequestHandler {
  const { permissions, httpAuth } = options;

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const credentials = await httpAuth.credentials(req);

      // Step 1: Try fine-grained permission
      // For resource-scoped permissions, include the resource ref from the URL
      const resourceRef = req.params?.id;
      const request =
        permission.type === 'resource' && resourceRef
          ? { permission, resourceRef }
          : { permission };

      const [decision] = await permissions.authorize(
        [request as AuthorizePermissionRequest],
        { credentials },
      );

      if (decision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      // Step 2: Fall back to admin permission
      const [adminDecision] = await permissions.authorize(
        [{ permission: boostAdminPermission }],
        { credentials },
      );

      if (adminDecision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      // Step 3: Deny
      throw new NotAllowedError('Unauthorized');
    } catch (error) {
      return next(error);
    }
  };
}

// ---------------------------------------------------------------------------
// Resource loaders
// ---------------------------------------------------------------------------

/**
 * Creates a resource loader for agents. Extracts `createdBy` and
 * `lifecycleStage` from the loaded agent resource.
 *
 * @remarks
 * This is a placeholder that returns `undefined` until the agent
 * store is implemented in a later issue. The middleware will fall
 * back to non-conditional authorization until then.
 *
 * @public
 */
export function createAgentResourceLoader(): ResourceLoader {
  return async (_req: Request) => {
    // Placeholder — agent store integration in a later issue.
    return undefined;
  };
}

/**
 * Creates a resource loader for tools. Extracts `createdBy` and
 * `lifecycleStage` from the loaded tool resource.
 *
 * @remarks
 * This is a placeholder that returns `undefined` until the tool
 * store is implemented in a later issue. The middleware will fall
 * back to non-conditional authorization until then.
 *
 * @public
 */
export function createToolResourceLoader(): ResourceLoader {
  return async (_req: Request) => {
    // Placeholder — tool store integration in a later issue.
    return undefined;
  };
}
