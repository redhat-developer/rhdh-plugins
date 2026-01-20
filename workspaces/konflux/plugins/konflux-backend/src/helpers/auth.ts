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

import { KonfluxConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KonfluxLogger } from './logger';

export interface AuthTokenResult {
  token: string;
  requiresImpersonation: boolean;
}

/**
 * Gets authentication token based on authProvider configuration.
 *
 * Handles three authentication methods:
 * - 'oidc': Uses OIDC token from context (must be provided)
 * - 'impersonationHeaders': Uses serviceAccountToken (requires userEmail validation)
 * - 'serviceAccount': Uses serviceAccountToken from cluster config
 *
 * @param konfluxConfig - Konflux configuration
 * @param clusterConfig - Cluster-specific configuration
 * @param oidcToken - Optional OIDC token for OIDC auth provider
 * @param userEmail - User email (required for impersonationHeaders)
 * @param logger - Logger instance for error logging
 * @param context - Context for error messages (cluster, namespace, resource)
 * @returns Authentication token result
 * @throws Error if token cannot be obtained or validation fails
 */
export function getAuthToken(
  konfluxConfig: KonfluxConfig,
  clusterConfig: { serviceAccountToken?: string } | undefined,
  oidcToken: string | undefined,
  userEmail: string,
  logger: KonfluxLogger,
  context: {
    cluster: string;
    namespace?: string;
    resource?: string;
  },
): AuthTokenResult {
  let token: string | undefined;

  // handle OIDC auth
  if (konfluxConfig?.authProvider === 'oidc') {
    if (oidcToken) {
      token = oidcToken;
      logger.debug('Using OIDC token for authentication', {
        cluster: context.cluster,
        namespace: context.namespace,
      });
    } else {
      logger.error(
        'OIDC authProvider configured but no token available',
        undefined,
        {
          cluster: context.cluster,
          namespace: context.namespace,
          resource: context.resource,
        },
      );
      throw new Error(
        `OIDC authProvider configured for cluster ${context.cluster} but no token available`,
      );
    }
  } else {
    // for non-OIDC auth providers, use serviceAccountToken
    token = clusterConfig?.serviceAccountToken;
  }

  // validate token exists
  if (!token) {
    logger.error('No authentication token available', undefined, {
      cluster: context.cluster,
      namespace: context.namespace,
      resource: context.resource,
      authProvider: konfluxConfig?.authProvider,
    });
    throw new Error(
      `No authentication token available for cluster ${context.cluster}`,
    );
  }

  // validate userEmail for impersonation
  const requiresImpersonation =
    konfluxConfig?.authProvider === 'impersonationHeaders';
  if (requiresImpersonation && (!userEmail || userEmail.trim().length === 0)) {
    logger.error(
      'Impersonation headers required but user email is missing',
      undefined,
      {
        cluster: context.cluster,
        namespace: context.namespace,
        resource: context.resource,
        authProvider: konfluxConfig?.authProvider,
      },
    );
    throw new Error(
      `User email is required for impersonation but was not provided for cluster ${context.cluster}`,
    );
  }

  return { token, requiresImpersonation };
}
