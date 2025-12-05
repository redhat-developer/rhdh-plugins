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
import type { Config } from '@backstage/config';

import {
  HttpAuthService,
  PermissionsService,
  LoggerService,
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

import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  BaseDynamicPlugin,
  DynamicPluginProvider,
} from '@backstage/backend-dynamic-feature-service';

export type MarketplaceRouterOptions = {
  httpAuth: HttpAuthService;
  marketplaceApi: MarketplaceApi;
  permissions: PermissionsService;
  installationDataService: InstallationDataService;
  pluginProvider: DynamicPluginProvider;
  logger: LoggerService;
  config: Config;
};

export async function createRouter(
  options: MarketplaceRouterOptions,
): Promise<express.Router> {
  const {
    httpAuth,
    marketplaceApi,
    permissions,
    installationDataService,
    pluginProvider,
    logger,
    config,
  } = options;

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
    permission: ResourcePermission<'extensions-plugin'> | BasicPermission,
  ) => {
    const credentials = await httpAuth.credentials(request);
    let decision: PolicyDecision;
    // No permission configured, always allow.
    if (!permission) {
      return { result: AuthorizeResult.ALLOW };
    }

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

  const getAuthorizedPlugin = async (
    request: Request,
    permission: ResourcePermission<'extensions-plugin'> | BasicPermission,
  ) => {
    const decision = await authorizeConditional(request, permission);

    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(
        `Not allowed to ${permission.attributes.action} the configuration of ${request.params.namespace}:${request.params.name}`,
      );
    }

    const plugin = await marketplaceApi.getPluginByName(
      request.params.namespace,
      request.params.name,
    );

    const hasAccess =
      decision.result === AuthorizeResult.ALLOW ||
      (decision.result === AuthorizeResult.CONDITIONAL &&
        matches(plugin, decision.conditions));
    if (!hasAccess) {
      throw new NotAllowedError(
        `Not allowed to ${permission.attributes.action} the configuration of ${request.params.namespace}:${request.params.name}`,
      );
    }

    return plugin;
  };

  const getAuthorizedPackage = async (
    request: Request,
    permission: ResourcePermission<'extensions-plugin'> | BasicPermission,
  ) => {
    const decision = await authorizeConditional(request, permission);

    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(
        `Not allowed to ${permission.attributes.action} the configuration of ${request.params.namespace}:${request.params.name}`,
      );
    }

    const packagePlugins = await marketplaceApi.getPackagePlugins(
      request.params.namespace,
      request.params.name,
    );
    const hasAccess =
      decision.result === AuthorizeResult.ALLOW ||
      (decision.result === AuthorizeResult.CONDITIONAL &&
        packagePlugins.some(plugin => matches(plugin, decision.conditions)));
    if (!hasAccess) {
      throw new NotAllowedError(
        `Not allowed to ${permission.attributes.action} the configuration of ${request.params.namespace}:${request.params.name}`,
      );
    }

    return await marketplaceApi.getPackageByName(
      request.params.namespace,
      request.params.name,
    );
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
      const marketplacePackage = await getAuthorizedPackage(
        req,
        extensionsPluginReadPermission,
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
      const marketplacePackage = await getAuthorizedPackage(
        req,
        extensionsPluginWritePermission,
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

  router.get('/environment', async (_req, res) => {
    res.status(200).json({
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  });

  router.patch(
    '/package/:namespace/:name/configuration/disable',
    requireInitializedInstallationDataService,
    async (req, res) => {
      const marketplacePackage = await getAuthorizedPackage(
        req,
        extensionsPluginWritePermission,
      );

      if (!marketplacePackage.spec?.dynamicArtifact) {
        throw new Error(
          `Package catalog entity ${marketplacePackage.metadata.name} is missing 'spec.dynamicArtifact'`,
        );
      }

      const disabled = req.body.disabled;
      if (typeof disabled !== 'boolean') {
        throw new InputError("'disabled' must be present boolean");
      }
      installationDataService.setPackageDisabled(
        marketplacePackage.spec.dynamicArtifact,
        disabled,
      );
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

  router.get('/plugins/configure', async (_req, res) => {
    const isPluginInstallationEnabled =
      config.getOptionalBoolean('extensions.installation.enabled') ?? false;
    res.json({ enabled: isPluginInstallationEnabled });
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
      const plugin = await getAuthorizedPlugin(
        req,
        extensionsPluginReadPermission,
      );
      const result = await installationDataService.getPluginConfig(plugin);
      res.status(200).json({ configYaml: result });
    },
  );

  router.post(
    '/plugin/:namespace/:name/configuration',
    requireInitializedInstallationDataService,
    async (req, res) => {
      // installs the plugin
      const plugin = await getAuthorizedPlugin(
        req,
        extensionsPluginWritePermission,
      );

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

  router.patch(
    '/plugin/:namespace/:name/configuration/disable',
    requireInitializedInstallationDataService,
    async (req, res) => {
      const plugin = await getAuthorizedPlugin(
        req,
        extensionsPluginWritePermission,
      );
      const disabled = req.body.disabled;
      if (typeof disabled !== 'boolean') {
        throw new InputError("'disabled' must be present boolean");
      }
      await installationDataService.setPluginDisabled(plugin, disabled);
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

  const plugins = pluginProvider.plugins();
  const dynamicPlugins = plugins.map(p => {
    // Remove the installer details for the dynamic backend plugins
    if (p.platform === 'node') {
      const { installer, ...rest } = p;
      return rest as BaseDynamicPlugin;
    }
    return p as BaseDynamicPlugin;
  });
  router.get('/loaded-plugins', async (req, response) => {
    await httpAuth.credentials(req, { allow: ['user', 'service'] });
    response.send(dynamicPlugins);
  });
  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());

  return router;
}
