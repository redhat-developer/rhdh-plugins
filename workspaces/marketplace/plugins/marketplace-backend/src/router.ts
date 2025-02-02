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

import express from 'express';
import Router from 'express-promise-router';

import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import {
  decodeGetPluginsRequest,
  decodeQueryParams,
  EntityFacetSchema,
  GetEntityFacetsRequest,
  GetPluginsRequest,
  MarketplaceApi,
  MarketplaceKinds,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

export async function createRouter({
  marketplaceApi,
}: {
  httpAuth: HttpAuthService;
  marketplaceApi: MarketplaceApi;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/plugins', async (req, res) => {
    const query = req.url.split('?')[1] || '';
    const request: GetPluginsRequest = decodeGetPluginsRequest(query);
    const plugins = await marketplaceApi.getPlugins(request);
    res.json(plugins);
  });

  router.get('/plugins/:name', async (req, res) => {
    const name = req.params.name;
    const plugin = await marketplaceApi.getPluginByName(name);
    // TODO: let us use a generic solution instead
    if (!plugin) {
      res
        .status(404)
        .json({ error: `${MarketplaceKinds.plugin}:${name} not found` });
    }
    res.json(plugin);
  });

  router.get('/pluginlists', async (_req, res) => {
    const pluginlist = await marketplaceApi.getPluginLists();
    res.json(pluginlist);
  });

  router.get('/pluginlists/:name', async (req, res) => {
    const name = req.params.name;
    const pluginlist = await marketplaceApi.getPluginListByName(name);
    // TODO: let us use a generic solution instead
    if (!pluginlist) {
      res
        .status(404)
        .json({ error: `${MarketplaceKinds.pluginList}:${name} not found` });
    }
    res.json(pluginlist);
  });

  router.get('/pluginlists/:name/plugins', async (req, res) => {
    const name = req.params.name;

    try {
      const pluginlist = await marketplaceApi.getPluginsByPluginListName(name);

      res.json(pluginlist);
    } catch (error) {
      // TODO: let us use a generic solution instead
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: `Internal server error: ${error}` });
    }
  });

  router.get('/aggregations', async (req, res) => {
    const queryString = req.url.split('?')[1] || '';
    const entityFacetRequest = decodeQueryParams(
      queryString,
    ) as GetEntityFacetsRequest;

    const { error: validationError } =
      EntityFacetSchema.safeParse(entityFacetRequest);
    if (validationError) {
      throw new InputError(validationError.errors[0].message, validationError);
    }

    try {
      const aggregatedData =
        await marketplaceApi.getEntityFacets(entityFacetRequest);
      res.json(aggregatedData);
    } catch (error) {
      const errorMesssage = error.message;

      res.status(error.statusCode ?? 500).json({
        error: `Internal server error: ${errorMesssage}`,
      });
    }
  });

  return router;
}
