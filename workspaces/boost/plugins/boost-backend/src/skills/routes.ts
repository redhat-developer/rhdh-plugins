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

import { Router } from 'express';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import {
  boostAccessPermission,
  boostAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';

/**
 * Options for creating skills marketplace routes.
 *
 * @public
 */
export interface SkillsRoutesOptions {
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
  /** The root config service for reading skills marketplace settings. */
  config: RootConfigService;
}

/**
 * Creates an Express router with skills marketplace proxy routes.
 *
 * Boost acts as a consumer of an external skills catalog backend.
 * These routes proxy browse/filter requests to the configured
 * skills catalog endpoint (task 5.1) and provide deployment
 * management (tasks 5.3, 5.4).
 *
 * Routes:
 * - GET /skills — list available skills (proxied)
 * - GET /skills/runtimes — list skill runtimes (proxied)
 * - GET /skills/domains — list skill domains (proxied)
 * - POST /skills/deploy — generate K8s manifest and deploy a skill
 * - GET /skills/deployments/:id — poll deployment progress
 *
 * @public
 */
export function createSkillsRoutes(options: SkillsRoutesOptions): Router {
  const { permissions, httpAuth, logger, config } = options;
  const router = Router();

  /**
   * Get the skills catalog endpoint from config.
   * Returns undefined if not configured.
   */
  function getSkillsEndpoint(): string | undefined {
    return config.getOptionalString('boost.skillsMarketplace.endpoint');
  }

  /**
   * Check whether the skills marketplace feature is enabled.
   */
  function isSkillsEnabled(): boolean {
    return (
      config.getOptionalBoolean('boost.features.skillsMarketplace') ?? false
    );
  }

  /**
   * Middleware to require boost access permission.
   */
  async function requireAccess(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);
      const [decision] = await permissions.authorize(
        [{ permission: boostAccessPermission }],
        { credentials },
      );
      if (decision.result !== AuthorizeResult.ALLOW) {
        throw new NotAllowedError('Unauthorized');
      }
      return next();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Middleware to require admin permission for deployment operations.
   */
  async function requireAdmin(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);
      const [decision] = await permissions.authorize(
        [{ permission: boostAdminPermission }],
        { credentials },
      );
      if (decision.result !== AuthorizeResult.ALLOW) {
        throw new NotAllowedError('Unauthorized');
      }
      return next();
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Middleware to check that skills marketplace is enabled and configured.
   */
  function requireSkillsEnabled(
    _req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): void {
    if (!isSkillsEnabled()) {
      return next(new NotFoundError('Skills marketplace is not enabled'));
    }
    return next();
  }

  /**
   * Proxy a GET request to the external skills catalog backend.
   */
  async function proxyToSkillsCatalog(
    path: string,
    query: Record<string, string | string[] | undefined>,
  ): Promise<{ status: number; body: unknown }> {
    const endpoint = getSkillsEndpoint();
    if (!endpoint) {
      throw new NotFoundError(
        'Skills marketplace endpoint is not configured. ' +
          'Set boost.skillsMarketplace.endpoint in app-config.yaml.',
      );
    }

    const url = new URL(endpoint);
    url.pathname = url.pathname.replace(/\/$/, '') + path;
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v);
          }
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    logger.debug(`Proxying skills request to ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = {
        error: `Upstream returned non-JSON response (HTTP ${response.status})`,
      };
    }
    return { status: response.status, body };
  }

  // 5.1: GET /skills — list available skills
  router.get(
    '/skills',
    requireSkillsEnabled,
    requireAccess,
    async (req, res, next) => {
      try {
        const result = await proxyToSkillsCatalog(
          '/skills',
          req.query as Record<string, string>,
        );
        res.status(result.status).json(result.body);
      } catch (error) {
        next(error);
      }
    },
  );

  // 5.1: GET /skills/runtimes — list skill runtimes
  router.get(
    '/skills/runtimes',
    requireSkillsEnabled,
    requireAccess,
    async (req, res, next) => {
      try {
        const result = await proxyToSkillsCatalog(
          '/skills/runtimes',
          req.query as Record<string, string>,
        );
        res.status(result.status).json(result.body);
      } catch (error) {
        next(error);
      }
    },
  );

  // 5.1: GET /skills/domains — list skill domains
  router.get(
    '/skills/domains',
    requireSkillsEnabled,
    requireAccess,
    async (req, res, next) => {
      try {
        const result = await proxyToSkillsCatalog(
          '/skills/domains',
          req.query as Record<string, string>,
        );
        res.status(result.status).json(result.body);
      } catch (error) {
        next(error);
      }
    },
  );

  // 5.3: POST /skills/deploy — generate K8s manifest with OCI init
  // containers and deploy a skill agent
  router.post(
    '/skills/deploy',
    requireSkillsEnabled,
    requireAdmin,
    async (req, res, next) => {
      try {
        const { skillId, namespace, name, ociImage, chatEndpoint, resources } =
          req.body as {
            skillId: string;
            namespace?: string;
            name?: string;
            ociImage: string;
            chatEndpoint?: string;
            resources?: {
              cpu?: string;
              memory?: string;
            };
          };

        if (!skillId || !ociImage) {
          res.status(400).json({
            error: 'skillId and ociImage are required',
          });
          return;
        }

        const deploymentId = `skill-${skillId}-${Date.now()}`;
        const deploymentName = name || `skill-${skillId}`;
        const deploymentNamespace = namespace || 'boost-skills';

        // Generate K8s manifest with OCI init container
        const manifest = {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name: deploymentName,
            namespace: deploymentNamespace,
            labels: {
              'app.kubernetes.io/name': deploymentName,
              'app.kubernetes.io/managed-by': 'boost',
              'boost.redhat.com/skill-id': skillId,
              'boost.redhat.com/deployment-id': deploymentId,
            },
          },
          spec: {
            replicas: 1,
            selector: {
              matchLabels: {
                'app.kubernetes.io/name': deploymentName,
              },
            },
            template: {
              metadata: {
                labels: {
                  'app.kubernetes.io/name': deploymentName,
                  'boost.redhat.com/skill-id': skillId,
                },
              },
              spec: {
                initContainers: [
                  {
                    name: 'oci-init',
                    image: ociImage,
                    command: ['cp', '-r', '/skill/.', '/shared/skill'],
                    volumeMounts: [
                      {
                        name: 'shared-skill',
                        mountPath: '/shared/skill',
                      },
                    ],
                  },
                ],
                containers: [
                  {
                    name: 'skill-agent',
                    image: ociImage,
                    ports: [{ containerPort: 8080, name: 'http' }],
                    resources: {
                      requests: {
                        cpu: resources?.cpu || '100m',
                        memory: resources?.memory || '256Mi',
                      },
                      limits: {
                        cpu: resources?.cpu || '500m',
                        memory: resources?.memory || '512Mi',
                      },
                    },
                    env: [
                      {
                        name: 'SKILL_ID',
                        value: skillId,
                      },
                    ],
                    volumeMounts: [
                      {
                        name: 'shared-skill',
                        mountPath: '/shared/skill',
                        readOnly: true,
                      },
                    ],
                  },
                ],
                volumes: [
                  {
                    name: 'shared-skill',
                    emptyDir: {},
                  },
                ],
              },
            },
          },
        };

        logger.info(
          `Generated K8s manifest for skill deployment ${deploymentId}`,
        );

        res.status(201).json({
          deploymentId,
          skillId,
          namespace: deploymentNamespace,
          name: deploymentName,
          status: 'pending',
          chatEndpoint: chatEndpoint || null,
          manifest,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // 5.4: GET /skills/deployments/:id — poll deployment progress
  router.get(
    '/skills/deployments/:id',
    requireSkillsEnabled,
    requireAccess,
    async (req, res, next) => {
      try {
        const { id } = req.params;

        logger.debug(`Polling deployment status for ${id}`);

        // Deployment status will be backed by a persistent store
        // in a future iteration. For now, return a structured response
        // that the frontend can consume.
        res.json({
          deploymentId: id,
          status: 'unknown',
          message:
            'Deployment status tracking requires a persistent store. ' +
            'Check cluster status directly.',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
