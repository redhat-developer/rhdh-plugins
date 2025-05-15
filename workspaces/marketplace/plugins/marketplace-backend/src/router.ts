/*
 * Copyright The Backstage Authors
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

import express, { Request } from 'express';
import Router from 'express-promise-router';

import {
  HttpAuthService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import {
  AuthorizeResult,
  BasicPermission,
  PolicyDecision,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

import {
  decodeGetEntitiesRequest,
  decodeGetEntityFacetsRequest,
  extensionPluginCreatePermission,
  extensionPluginReadPermission,
  MarketplaceApi,
  MarketplacePlugin,
  RESOURCE_TYPE_EXTENSION_PLUGIN,
  extensionPermissions,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import { createSearchParams } from './utils/createSearchParams';
import { removeVerboseSpecContent } from './utils/removeVerboseSpecContent';
import { rules as extensionRules } from './permissions/rules';
import { matches } from './utils/permissionUtils';

export async function createRouter({
  marketplaceApi,
  httpAuth,
  permissions,
}: {
  httpAuth: HttpAuthService;
  marketplaceApi: MarketplaceApi;
  permissions: PermissionsService;
}): Promise<express.Router> {
  const router = Router();
  const permissionsIntegrationRouter = createPermissionIntegrationRouter({
    resourceType: RESOURCE_TYPE_EXTENSION_PLUGIN,
    permissions: extensionPermissions,
    rules: Object.values(extensionRules),
  });
  router.use(express.json());
  router.use(permissionsIntegrationRouter);

  const authorizeConditional = async (
    request: Request,
    permission:
      | ResourcePermission<'extension-plugin' | 'extension-package'>
      | BasicPermission,
  ) => {
    const credentials = await httpAuth.credentials(request);
    let decision: PolicyDecision;
    if (permission.type === 'resource') {
      decision = (
        await permissions.authorizeConditional([{ permission }], {
          credentials,
        })
      )[0];
    } else {
      decision = (
        await permissions.authorize([{ permission }], {
          credentials,
        })
      )[0];
    }

    return decision;
  };

  router.get('/collections', async (req, res) => {
    const request = decodeGetEntitiesRequest(createSearchParams(req));
    const collections = await marketplaceApi.getCollections(request);
    res.json(collections);
  });

  router.get('/collections/facets', async (req, res) => {
    const request = decodeGetEntityFacetsRequest(createSearchParams(req));
    const facets = await marketplaceApi.getCollectionsFacets(request);
    res.json(facets);
  });

  router.get('/collection/:namespace/:name', async (req, res) => {
    const collection = await marketplaceApi.getCollectionByName(
      req.params.namespace,
      req.params.name,
    );
    res.json(collection);
  });

  router.get('/collection/:namespace/:name/plugins', async (req, res) => {
    const plugins = await marketplaceApi.getCollectionPlugins(
      req.params.namespace,
      req.params.name,
    );
    removeVerboseSpecContent(plugins);
    res.json(plugins);
  });

  router.get('/packages', async (req, res) => {
    const request = decodeGetEntitiesRequest(createSearchParams(req));
    const packages = await marketplaceApi.getPackages(request);
    removeVerboseSpecContent(packages.items);
    res.json(packages);
  });

  router.get('/packages/facets', async (req, res) => {
    const request = decodeGetEntityFacetsRequest(createSearchParams(req));
    const facets = await marketplaceApi.getPackagesFacets(request);
    res.json(facets);
  });

  router.get('/package/:namespace/:name', async (req, res) => {
    res.json(
      await marketplaceApi.getPackageByName(
        req.params.namespace,
        req.params.name,
      ),
    );
  });

  router.get('/plugins', async (req, res) => {
    const request = decodeGetEntitiesRequest(createSearchParams(req));
    const plugins = await marketplaceApi.getPlugins(request);
    removeVerboseSpecContent(plugins.items);
    res.json(plugins);
  });

  router.get('/plugins/facets', async (req, res) => {
    const request = decodeGetEntityFacetsRequest(createSearchParams(req));
    const facets = await marketplaceApi.getPluginFacets(request);
    res.json(facets);
  });

  router.get('/plugin/:namespace/:name', async (req, res) => {
    const plugin = await marketplaceApi.getPluginByName(
      req.params.namespace,
      req.params.name,
    );
    res.json(plugin);
  });

  router.get(
    '/plugin/:namespace/:name/configuration/authorize',
    async (req, res) => {
      const [readDecision, installDecision] = await Promise.all([
        authorizeConditional(req, extensionPluginReadPermission),
        authorizeConditional(req, extensionPluginCreatePermission),
      ]);
      if (
        readDecision.result === AuthorizeResult.DENY &&
        installDecision.result === AuthorizeResult.DENY
      ) {
        res.status(403);
        return;
      }

      const authorizedActions: string[] = [];
      let plugin: MarketplacePlugin;

      const evaluateConditional = async (
        decision: PolicyDecision,
        action: string,
      ) => {
        if (decision.result === AuthorizeResult.CONDITIONAL) {
          if (!plugin) {
            plugin = await marketplaceApi.getPluginByName(
              req.params.namespace,
              req.params.name,
            );
          }
          if (matches(plugin, decision.conditions)) {
            authorizedActions.push(action);
          }
        } else if (decision.result === AuthorizeResult.ALLOW) {
          authorizedActions.push(action);
        }
      };

      await Promise.all([
        evaluateConditional(readDecision, 'read'),
        evaluateConditional(installDecision, 'create'),
      ]);

      if (authorizedActions.length === 0) {
        res.status(403);
        return;
      }
      res.status(200).json({ authorizedActions });
    },
  );

  router.get('/plugin/:namespace/:name/configuration', async (req, res) => {
    const readDecision = await authorizeConditional(
      req,
      extensionPluginReadPermission,
    );
    if (readDecision.result === AuthorizeResult.DENY) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const plugin = await marketplaceApi.getPluginByName(
      req.params.namespace,
      req.params.name,
    );

    const hasReadAccess =
      readDecision.result === AuthorizeResult.ALLOW ||
      (readDecision.result === AuthorizeResult.CONDITIONAL &&
        matches(plugin, readDecision.conditions));
    if (!hasReadAccess) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(200).json({}); // This should return the configuration in YAML string
  });

  router.post('/plugin/:namespace/:name/configuration', async (req, res) => {
    // installs the plugin
    const installDecision = await authorizeConditional(
      req,
      extensionPluginCreatePermission,
    );
    if (installDecision.result === AuthorizeResult.DENY) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const plugin = await marketplaceApi.getPluginByName(
      req.params.namespace,
      req.params.name,
    );

    const hasInstallAccess =
      installDecision.result === AuthorizeResult.ALLOW ||
      (installDecision.result === AuthorizeResult.CONDITIONAL &&
        matches(plugin, installDecision.conditions));

    if (!hasInstallAccess) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.status(200).json({});
  });

  router.get('/plugin/:namespace/:name/packages', async (req, res) => {
    const packages = await marketplaceApi.getPluginPackages(
      req.params.namespace,
      req.params.name,
    );
    res.json(packages);
  });

  return router;
}
