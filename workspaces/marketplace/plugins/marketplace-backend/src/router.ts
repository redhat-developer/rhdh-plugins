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

import express, { Request, Response, NextFunction } from 'express';
import Router from 'express-promise-router';
import { InputError, NotAllowedError } from '@backstage/errors';
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
  extensionsPluginWritePermission,
  extensionsPluginReadPermission,
  MarketplaceApi,
  MarketplacePlugin,
  RESOURCE_TYPE_EXTENSIONS_PLUGIN,
  extensionsPermissions,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import { createSearchParams } from './utils/createSearchParams';
import { removeVerboseSpecContent } from './utils/removeVerboseSpecContent';
import { rules as extensionRules } from './permissions/rules';
import { matches } from './utils/permissionUtils';
import { InstallationDataService } from './installation/InstallationDataService';
import { ConfigFormatError } from './errors/ConfigFormatError';

export type MarketplaceRouterOptions = {
  httpAuth: HttpAuthService;
  marketplaceApi: MarketplaceApi;
  permissions: PermissionsService;
  installationDataService: InstallationDataService;
};

export async function createRouter(
  options: MarketplaceRouterOptions,
): Promise<express.Router> {
  const { httpAuth, marketplaceApi, permissions, installationDataService } =
    options;

  const requireInitializedInstallationDataService = (
    _req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    const error = installationDataService.getInitializationError();
    if (error) {
      throw error;
    }
    next();
  };

  const router = Router();
  const permissionsIntegrationRouter = createPermissionIntegrationRouter({
    resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
    permissions: extensionsPermissions,
    rules: Object.values(extensionRules),
  });
  router.use(express.json());
  router.use(permissionsIntegrationRouter);

  const authorizeConditional = async (
    request: Request,
    permission:
      | ResourcePermission<'extensions-plugin' | 'extensions-package'>
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

  router.get(
    '/package/:namespace/:name/configuration',
    requireInitializedInstallationDataService,
    async (req, res) => {
      const marketplacePackage = await marketplaceApi.getPackageByName(
        req.params.namespace,
        req.params.name,
      );

      if (!marketplacePackage.spec?.dynamicArtifact) {
        throw new Error(
          `Package catalog entity ${marketplacePackage.metadata.name} is missing 'spec.dynamicArtifact'`,
        );
      }
      const result = installationDataService.getPackageConfig(
        marketplacePackage.spec?.dynamicArtifact,
      );
      res.status(200).json({ configYaml: result });
    },
  );

  router.post(
    '/package/:namespace/:name/configuration',
    requireInitializedInstallationDataService,
    async (req, res) => {
      const marketplacePackage = await marketplaceApi.getPackageByName(
        req.params.namespace,
        req.params.name,
      );
      if (!marketplacePackage.spec?.dynamicArtifact) {
        throw new Error(
          `Package ${marketplacePackage.metadata.name} is missing 'spec.dynamicArtifact'`,
        );
      }

      const newConfig = req.body.configYaml;
      if (!newConfig) {
        throw new InputError("'configYaml' object must be present");
      }
      try {
        installationDataService.updatePackageConfig(
          marketplacePackage.spec.dynamicArtifact,
          newConfig,
        );
      } catch (e) {
        if (e instanceof ConfigFormatError) {
          throw new InputError(e.message);
        }
        throw e;
      }
      res.status(200).json({ status: 'OK' });
    },
  );

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
        authorizeConditional(req, extensionsPluginReadPermission),
        authorizeConditional(req, extensionsPluginWritePermission),
      ]);
      if (
        readDecision.result === AuthorizeResult.DENY &&
        installDecision.result === AuthorizeResult.DENY
      ) {
        res.status(200).json({ read: 'DENY', write: 'DENY' });
        return;
      }

      let authorizedActions = {};
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
            authorizedActions = { ...authorizedActions, [action]: 'ALLOW' };
          }
        } else if (decision.result === AuthorizeResult.ALLOW) {
          authorizedActions = { ...authorizedActions, [action]: 'ALLOW' };
        }
      };

      await Promise.all([
        evaluateConditional(readDecision, 'read'),
        evaluateConditional(installDecision, 'write'),
      ]);

      if (Object.keys(authorizedActions).length === 0) {
        res.status(200).json({ read: 'DENY', write: 'DENY' });
      } else {
        res.status(200).json(authorizedActions);
      }
    },
  );

  router.get(
    '/plugin/:namespace/:name/configuration',
    requireInitializedInstallationDataService,
    async (req, res) => {
      const readDecision = await authorizeConditional(
        req,
        extensionsPluginReadPermission,
      );
      if (readDecision.result === AuthorizeResult.DENY) {
        throw new NotAllowedError(
          `Not allowed to read the configuration of ${req.params.namespace}:${req.params.name}`,
        );
      }

      const marketplacePlugin = await marketplaceApi.getPluginByName(
        req.params.namespace,
        req.params.name,
      );

      const hasReadAccess =
        readDecision.result === AuthorizeResult.ALLOW ||
        (readDecision.result === AuthorizeResult.CONDITIONAL &&
          matches(marketplacePlugin, readDecision.conditions));
      if (!hasReadAccess) {
        throw new NotAllowedError(
          `Not allowed to read the configuration of ${req.params.namespace}:${req.params.name}`,
        );
      }

      const result =
        await installationDataService.getPluginConfig(marketplacePlugin);
      res.status(200).json({ configYaml: result });
    },
  );

  router.post(
    '/plugin/:namespace/:name/configuration',
    requireInitializedInstallationDataService,
    async (req, res) => {
      // installs the plugin
      const installDecision = await authorizeConditional(
        req,
        extensionsPluginWritePermission,
      );
      if (installDecision.result === AuthorizeResult.DENY) {
        throw new NotAllowedError(
          `Not allowed to configure ${req.params.namespace}:${req.params.name}`,
        );
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
        throw new NotAllowedError(
          `Not allowed to configure ${req.params.namespace}:${req.params.name}`,
        );
      }

      const newConfig = req.body.configYaml;
      if (!newConfig) {
        throw new InputError("'configYaml' object must be present");
      }
      try {
        await installationDataService.updatePluginConfig(plugin, newConfig);
      } catch (e) {
        if (e instanceof ConfigFormatError) {
          throw new InputError(e.message);
        }
        throw e;
      }
      res.status(200).json({ status: 'OK' });
    },
  );

  router.get('/plugin/:namespace/:name/packages', async (req, res) => {
    const packages = await marketplaceApi.getPluginPackages(
      req.params.namespace,
      req.params.name,
    );
    res.json(packages);
  });

  return router;
}
