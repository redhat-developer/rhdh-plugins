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
  AuthorizeResult,
  type ResourcePermission,
} from '@backstage/plugin-permission-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  aiCatalogAssetAccessPermission,
  aiCatalogAssetAccessUsageDocsPermission,
  aiCatalogAdminPermission,
  type AI_CATALOG_ASSET_RESOURCE_TYPE,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal AI catalog asset shape for route responses.
 * The actual entity shape will come from the catalog; this interface
 * defines the subset relevant to graduated visibility filtering.
 *
 * @public
 */
export interface AiCatalogAsset {
  /** Asset identifier. */
  id: string;
  /** Asset display name (Tier 1). */
  name: string;
  /** Asset description (Tier 1). */
  description?: string;
  /** Asset category — ai-model, agent, skill, etc. (Tier 1). */
  category?: string;
  /** Lifecycle stage (Tier 1). */
  lifecycleStage?: string;
  /** Number of versions (Tier 1). */
  versionCount?: number;
  /** Tags for discovery (Tier 1). */
  tags?: string[];
  /** Usage documentation (Tier 2 — filtered when denied). */
  usageDocs?: string;
  /** Connection endpoints (Tier 2 — filtered when denied). */
  connectionEndpoints?: Record<string, string>;
  /** Configuration blocks (Tier 2 — filtered when denied). */
  config?: Record<string, unknown>;
  /** Deployment parameters (Tier 2 — filtered when denied). */
  deploymentParameters?: Record<string, unknown>;
}

/**
 * Options for creating AI catalog routes.
 *
 * @public
 */
export interface AiCatalogRoutesOptions {
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service. */
  httpAuth: HttpAuthService;
  /** Logger service. */
  logger: LoggerService;
  /** Loads the full list of AI catalog assets. */
  assetLoader: AiCatalogAssetLoader;
}

/**
 * Abstraction for loading AI catalog assets. In production this is
 * backed by the Backstage catalog via {@link CatalogAssetLoader}; the
 * interface allows injection for testing.
 *
 * @public
 */
export interface AiCatalogAssetLoader {
  /** Load a single asset by ID. Returns undefined if not found. */
  findById(id: string): Promise<AiCatalogAsset | undefined>;
  /** Load all assets. */
  list(): Promise<AiCatalogAsset[]>;
}

// ---------------------------------------------------------------------------
// Tier 2 field-level filtering
// ---------------------------------------------------------------------------

/** Fields omitted when the user lacks Tier 2 access. */
const TIER_2_FIELDS: (keyof AiCatalogAsset)[] = [
  'usageDocs',
  'connectionEndpoints',
  'config',
  'deploymentParameters',
];

/**
 * Strip Tier 2 fields from an asset response.
 *
 * @internal
 */
export function stripTier2Fields(asset: AiCatalogAsset): AiCatalogAsset {
  const filtered = { ...asset };
  for (const field of TIER_2_FIELDS) {
    delete filtered[field];
  }
  return filtered;
}

// ---------------------------------------------------------------------------
// Route factory
// ---------------------------------------------------------------------------

/**
 * Creates an Express router with AI catalog asset routes implementing
 * graduated visibility (Tier 1 / Tier 2 field-level filtering).
 *
 * Routes:
 * - GET /ai-catalog/assets       — list assets (entity-level filtering)
 * - GET /ai-catalog/assets/:id   — get asset detail (field-level filtering)
 *
 * @public
 */
export function createAiCatalogRoutes(options: AiCatalogRoutesOptions): Router {
  const { permissions, httpAuth, logger, assetLoader } = options;
  const router = Router();

  // GET /ai-catalog/assets — list assets with entity-level filtering (task 2.2)
  router.get('/ai-catalog/assets', async (req, res, next) => {
    try {
      const credentials = await httpAuth.credentials(req);

      // Entity-level filtering via authorizeConditional() (task 2.2)
      const [readDecision] = await permissions.authorizeConditional(
        [
          {
            permission: aiCatalogAssetAccessPermission as ResourcePermission<
              typeof AI_CATALOG_ASSET_RESOURCE_TYPE
            >,
          },
        ],
        { credentials },
      );

      if (readDecision.result === AuthorizeResult.DENY) {
        // Fall back to admin check
        const [adminDecision] = await permissions.authorize(
          [{ permission: aiCatalogAdminPermission }],
          { credentials },
        );
        if (adminDecision.result !== AuthorizeResult.ALLOW) {
          throw new NotAllowedError('Unauthorized');
        }
      }

      let assets = await assetLoader.list();

      if (readDecision.result === AuthorizeResult.CONDITIONAL) {
        // TODO: Apply CONDITIONAL filtering using createConditionTransformer()
        // to convert the decision's conditions into catalog query predicates
        // (via each rule's toQuery()), then pass those as catalog entity
        // filters so only matching assets are returned.  Until then,
        // CONDITIONAL is treated as ALLOW — the same deferral pattern used
        // by the agent list endpoint (see agents/routes.ts).
        logger.debug(
          'ai-catalog.asset.access returned CONDITIONAL — entity-level condition filtering not yet applied (treated as ALLOW)',
        );
      }

      // Batch Tier 2 check — single authorizeConditional() call (task 2.3)
      const [tier2Decision] = await permissions.authorizeConditional(
        [
          {
            permission:
              aiCatalogAssetAccessUsageDocsPermission as ResourcePermission<
                typeof AI_CATALOG_ASSET_RESOURCE_TYPE
              >,
          },
        ],
        { credentials },
      );

      // Tier 2 CONDITIONAL is intentionally treated as DENY (strip
      // fields).  The graduated-visibility spec requires the conservative
      // approach: sensitive details are only shown when the permission
      // backend returns an explicit ALLOW.  This avoids leaking Tier 2
      // data when conditional policies are in effect but their
      // per-resource evaluation has not been performed.
      if (tier2Decision.result !== AuthorizeResult.ALLOW) {
        assets = assets.map(stripTier2Fields);
      }

      res.json({ assets });
    } catch (error) {
      next(error);
    }
  });

  // GET /ai-catalog/assets/:id — get asset detail with field-level filtering (task 2.1)
  router.get('/ai-catalog/assets/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const credentials = await httpAuth.credentials(req);

      // Tier 1: check basic read access
      const [readDecision] = await permissions.authorize(
        [
          {
            permission: aiCatalogAssetAccessPermission,
            resourceRef: id,
          },
        ],
        { credentials },
      );

      if (readDecision.result === AuthorizeResult.DENY) {
        // Fall back to admin check
        const [adminDecision] = await permissions.authorize(
          [{ permission: aiCatalogAdminPermission }],
          { credentials },
        );
        if (adminDecision.result !== AuthorizeResult.ALLOW) {
          throw new NotAllowedError('Unauthorized');
        }
      }

      const asset = await assetLoader.findById(id);
      if (!asset) {
        throw new NotFoundError(`AI catalog asset "${id}" not found`);
      }

      // Tier 2: check usage-docs access for field-level filtering (task 2.1).
      // Non-ALLOW results (DENY or CONDITIONAL) strip Tier 2 fields —
      // see the batch Tier 2 comment on the list endpoint for the
      // design rationale (conservative default per graduated-visibility spec).
      const [tier2Decision] = await permissions.authorize(
        [
          {
            permission: aiCatalogAssetAccessUsageDocsPermission,
            resourceRef: id,
          },
        ],
        { credentials },
      );

      if (tier2Decision.result !== AuthorizeResult.ALLOW) {
        res.json(stripTier2Fields(asset));
        return;
      }

      res.json(asset);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
