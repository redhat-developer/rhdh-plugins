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
import { InputError, NotFoundError } from '@backstage/errors';
import {
  boostToolPromotePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { LifecycleStage } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { authorizeLifecycleAction } from '../middleware/security';
import type { ToolLifecycleStore } from './ToolLifecycleStore';
import { isValidToolTransition } from './lifecycle';

/**
 * Options for creating tool routes.
 *
 * @public
 */
export interface ToolRoutesOptions {
  /** The tool lifecycle store for persistence. */
  store: ToolLifecycleStore;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Create a resource loader that loads tool governance records from the store.
 *
 * @internal
 */
function createStoreToolResourceLoader(store: ToolLifecycleStore) {
  return async (req: import('express').Request) => {
    const { id } = req.params;
    if (!id) {
      return undefined;
    }
    const tool = await store.get(id);
    if (!tool) {
      return undefined;
    }
    return {
      createdBy: tool.createdBy,
      lifecycleStage: tool.lifecycleStage,
    };
  };
}

const TOOL_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/;

function validateToolId(id: string): void {
  if (!TOOL_ID_PATTERN.test(id)) {
    throw new InputError(
      'Invalid tool ID: must be 1-255 characters, alphanumeric with dots, hyphens, and underscores',
    );
  }
}

/**
 * Creates an Express router with all Kagenti tool lifecycle routes.
 *
 * Routes implemented (tasks 4.1–4.4):
 * - PUT    /tools/:id/promote   — promote tool lifecycle (boost.tool.promote)
 * - PUT    /tools/:id/demote    — demote tool lifecycle (boost.tool.demote)
 * - PUT    /tools/:id/publish   — publish a tool (boost.tool.publish)
 * - PUT    /tools/:id/unpublish — unpublish a tool (boost.tool.unpublish)
 *
 * @public
 */
export function createToolRoutes(options: ToolRoutesOptions): Router {
  const { store, permissions, httpAuth, logger } = options;
  const router = Router();
  const authOptions = { permissions, httpAuth };
  const resourceLoader = createStoreToolResourceLoader(store);

  // 4.1: PUT /tools/:id/promote — promote tool lifecycle (IS_OWNER)
  router.put(
    '/tools/:id/promote',
    authorizeLifecycleAction(
      boostToolPromotePermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateToolId(id);
        const tool = await store.get(id);
        if (!tool) {
          throw new NotFoundError(`Tool "${id}" not found`);
        }

        if (tool.lifecycleStage !== 'draft') {
          throw new InputError(
            `Cannot promote tool from "${tool.lifecycleStage}" to "pending". ` +
              `Tool must be in "draft" stage to be promoted.`,
          );
        }

        const updated = await store.updateStage(id, 'pending');
        if (!updated) {
          throw new NotFoundError(`Tool "${id}" was deleted during transition`);
        }
        logger.info(`Tool promoted: ${id}`);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 4.2: PUT /tools/:id/demote — demote tool lifecycle
  router.put(
    '/tools/:id/demote',
    authorizeLifecycleAction(
      boostToolDemotePermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateToolId(id);
        const tool = await store.get(id);
        if (!tool) {
          throw new NotFoundError(`Tool "${id}" not found`);
        }

        // Demote moves one step backward:
        //   published → pending, pending → draft
        const demoteTargets: Record<string, string> = {
          published: 'pending',
          pending: 'draft',
        };
        const targetStage = demoteTargets[tool.lifecycleStage];

        if (
          !targetStage ||
          !isValidToolTransition(
            tool.lifecycleStage,
            targetStage as LifecycleStage,
          )
        ) {
          throw new InputError(
            `Cannot demote tool from "${tool.lifecycleStage}". ` +
              `Tool must be in "pending" or "published" stage to be demoted.`,
          );
        }
        const updated = await store.updateStage(
          id,
          targetStage as LifecycleStage,
        );
        if (!updated) {
          throw new NotFoundError(`Tool "${id}" was deleted during transition`);
        }
        logger.info(`Tool demoted: ${id}`);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 4.3: PUT /tools/:id/publish — publish a tool
  router.put(
    '/tools/:id/publish',
    authorizeLifecycleAction(
      boostToolPublishPermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateToolId(id);
        const tool = await store.get(id);
        if (!tool) {
          throw new NotFoundError(`Tool "${id}" not found`);
        }

        if (!isValidToolTransition(tool.lifecycleStage, 'published')) {
          throw new InputError(
            `Cannot publish tool from "${tool.lifecycleStage}". ` +
              `Tool must be in "pending" stage to be published.`,
          );
        }

        const updated = await store.updateStage(id, 'published');
        if (!updated) {
          throw new NotFoundError(`Tool "${id}" was deleted during transition`);
        }
        logger.info(`Tool published: ${id}`);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  // 4.4: PUT /tools/:id/unpublish — unpublish a tool
  router.put(
    '/tools/:id/unpublish',
    authorizeLifecycleAction(
      boostToolUnpublishPermission,
      resourceLoader,
      authOptions,
    ),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        validateToolId(id);
        const tool = await store.get(id);
        if (!tool) {
          throw new NotFoundError(`Tool "${id}" not found`);
        }

        if (!isValidToolTransition(tool.lifecycleStage, 'archived')) {
          throw new InputError(
            `Cannot unpublish tool from "${tool.lifecycleStage}". ` +
              `Tool must be in "published" stage to be unpublished.`,
          );
        }

        const updated = await store.updateStage(id, 'archived');
        if (!updated) {
          throw new NotFoundError(`Tool "${id}" was deleted during transition`);
        }
        logger.info(`Tool unpublished: ${id}`);
        res.json(updated);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
