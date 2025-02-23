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

import express from 'express';
import Router from 'express-promise-router';

import { HttpAuthService } from '@backstage/backend-plugin-api';

import {
  decodeGetEntitiesRequest,
  decodeGetEntityFacetsRequest,
  MarketplaceApi,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { createSearchParams } from './utils/createSearchParams';
import { removeVerboseSpecContent } from './utils/removeVerboseSpecContent';

export async function createRouter({
  marketplaceApi,
}: {
  httpAuth: HttpAuthService;
  marketplaceApi: MarketplaceApi;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

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

  router.get('/plugin/:namespace/:name/packages', async (req, res) => {
    const packages = await marketplaceApi.getPluginPackages(
      req.params.namespace,
      req.params.name,
    );
    removeVerboseSpecContent(packages);
    res.json(packages);
  });

  return router;
}
