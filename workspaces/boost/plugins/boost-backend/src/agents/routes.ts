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
} from '@backstage/backend-plugin-api';
import {
  AuthenticationError,
  ConflictError,
  InputError,
  NotFoundError,
} from '@backstage/errors';
import {
  boostAgentListPermission,
  boostAgentRegisterPermission,
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { authorizeLifecycleAction } from '../middleware/security';
import type { AgentLifecycleStore } from './AgentLifecycleStore';
import { isValidTransition, isDeletableStage } from './lifecycle';

/**
 * Options for creating agent routes.
 *
 * @public
 */
export interface AgentRoutesOptions {
  /** The agent lifecycle store for persistence. */
  store: AgentLifecycleStore;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Create a resource loader that loads agent governance records from the store.
 *
 * @internal
 */
function createStoreAgentResourceLoader(store: AgentLifecycleStore) {
  return async (req: import('express').Request) => {
    const { id } = req.params;
    if (!id) {
      return undefined;
    }
    const agent = await store.get(id);
    if (!agent) {
      return undefined;
    }
    return {
      createdBy: agent.createdBy,
      lifecycleStage: agent.lifecycleStage,
    };
  };
}

/**
 * Creates an Express router with all agent lifecycle routes.
 *
 * Routes implemented (tasks 3.1–3.7, 4.1):
 * - GET    /agents              — list agents (boost.agent.list)
 * - PUT    /agents/:id/register — register agent (boost.agent.register)
 * - PUT    /agents/:id/promote  — promote draft→pending (boost.agent.promote)
 * - PUT    /agents/:id/approve  — approve pending→published (boost.agent.approve)
 * - PUT    /agents/:id/request-unpublish — request unpublish (boost.agent.unpublish)
 * - PUT    /agents/:id/withdraw — withdraw pending→draft (boost.agent.withdraw)
 * - DELETE /agents/:id          — delete agent (boost.agent.delete)
 *
 * @public
 */
export function createAgentRoutes(options: AgentRoutesOptions): Router {
  const { store, permissions, httpAuth, logger } = options;
  const router = Router();
  const authOptions = { permissions, httpAuth };
  const resourceLoader = createStoreAgentResourceLoader(store);

  const AGENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/;
  function validateAgentId(id: string): void {
    if (!AGENT_ID_PATTERN.test(id)) {
      throw new InputError(
        'Invalid agent ID: must be 1-255 characters, alphanumeric with dots, hyphens, and underscores',
      );
    }
  }

  // 3.1: GET /agents — list agents with visibility filtering
  router.get(
    '/agents',
    authorizeLifecycleAction(
      boostAgentListPermission,
      resourceLoader,
      authOptions,
    ),
    async (_req, res, next) => {
      try {
        const agents = await store.list();
        res.json({ agents });
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.2: PUT /agents/:id/register — register agent for governance
  router.put(
    '/agents/:id/register',
    authorizeLifecycleAction(
      boostAgentRegisterPermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const { name, description } = req.body ?? {};

        if (!name || typeof name !== 'string') {
          throw new InputError('Agent name is required');
        }

        // Check if already registered
        const existing = await store.get(id);
        if (existing) {
          throw new ConflictError(`Agent "${id}" is already registered`);
        }

        // Resolve the user identity for createdBy
        const credentials = await httpAuth.credentials(req);
        const principal = credentials.principal as
          | { userEntityRef?: string }
          | undefined;
        const userRef = principal?.userEntityRef;
        if (!userRef) {
          throw new AuthenticationError(
            'Cannot register agent: unable to resolve user identity from credentials',
          );
        }

        const agent = await store.register({
          id,
          name,
          description:
            typeof description === 'string' ? description : undefined,
          createdBy: userRef,
        });

        logger.info(`Agent registered: ${id} by ${userRef}`);
        res.status(201).json(agent);
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.3: PUT /agents/:id/promote — promote draft→pending (IS_OWNER, HAS_LIFECYCLE_STAGE)
  router.put(
    '/agents/:id/promote',
    authorizeLifecycleAction(
      boostAgentPromotePermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const agent = await store.get(id);
        if (!agent) {
          throw new NotFoundError(`Agent "${id}" not found`);
        }

        if (!isValidTransition(agent.lifecycleStage, 'pending')) {
          throw new InputError(
            `Cannot promote agent from "${agent.lifecycleStage}" to "pending". ` +
              `Agent must be in "draft" stage to be promoted.`,
          );
        }

        const updated = await store.updateStage(id, 'pending');
        if (!updated) {
          throw new NotFoundError(
            `Agent "${id}" was deleted during transition`,
          );
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.4: PUT /agents/:id/approve — approve pending→published (IS_NOT_CREATOR, HAS_LIFECYCLE_STAGE)
  router.put(
    '/agents/:id/approve',
    authorizeLifecycleAction(
      boostAgentApprovePermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const agent = await store.get(id);
        if (!agent) {
          throw new NotFoundError(`Agent "${id}" not found`);
        }

        if (!isValidTransition(agent.lifecycleStage, 'published')) {
          throw new InputError(
            `Cannot approve agent from "${agent.lifecycleStage}" to "published". ` +
              `Agent must be in "pending" stage to be approved.`,
          );
        }

        const updated = await store.updateStage(id, 'published');
        if (!updated) {
          throw new NotFoundError(
            `Agent "${id}" was deleted during transition`,
          );
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.5: PUT /agents/:id/request-unpublish — request unpublishing (IS_OWNER)
  router.put(
    '/agents/:id/request-unpublish',
    authorizeLifecycleAction(
      boostAgentUnpublishPermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const agent = await store.get(id);
        if (!agent) {
          throw new NotFoundError(`Agent "${id}" not found`);
        }

        if (!isValidTransition(agent.lifecycleStage, 'archived')) {
          throw new InputError(
            `Cannot unpublish agent from "${agent.lifecycleStage}". ` +
              `Agent must be in "published" stage to be unpublished.`,
          );
        }

        const updated = await store.updateStage(id, 'archived');
        if (!updated) {
          throw new NotFoundError(
            `Agent "${id}" was deleted during transition`,
          );
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.6: PUT /agents/:id/withdraw — withdraw pending→draft (IS_OWNER)
  router.put(
    '/agents/:id/withdraw',
    authorizeLifecycleAction(
      boostAgentWithdrawPermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const agent = await store.get(id);
        if (!agent) {
          throw new NotFoundError(`Agent "${id}" not found`);
        }

        if (!isValidTransition(agent.lifecycleStage, 'draft')) {
          throw new InputError(
            `Cannot withdraw agent from "${agent.lifecycleStage}". ` +
              `Agent must be in "pending" stage to be withdrawn.`,
          );
        }

        const updated = await store.updateStage(id, 'draft');
        if (!updated) {
          throw new NotFoundError(
            `Agent "${id}" was deleted during transition`,
          );
        }
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 3.7: DELETE /agents/:id — delete agent (IS_OWNER, HAS_LIFECYCLE_STAGE)
  router.delete(
    '/agents/:id',
    authorizeLifecycleAction(
      boostAgentDeletePermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateAgentId(id);
        const agent = await store.get(id);
        if (!agent) {
          throw new NotFoundError(`Agent "${id}" not found`);
        }

        if (!isDeletableStage(agent.lifecycleStage)) {
          throw new InputError(
            `Cannot delete agent in "${agent.lifecycleStage}" stage. ` +
              `Agent must be in "draft" or "archived" stage to be deleted.`,
          );
        }

        // Cascading delete: the store removes the governance record.
        // Source detection (kagenti/orchestration/workflow) and
        // multi-store cleanup is handled by the caller or a
        // higher-level service.
        await store.delete(id);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
