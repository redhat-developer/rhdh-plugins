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

// Catalog route discovery and model card fetching via the
// KubeFlow Model Catalog API (/api/model_catalog/v1alpha1).

import type { LoggerService } from '@backstage/backend-plugin-api';
import {
  type ReconcilerConfig,
  type Route,
  type CatalogModel,
  route_group,
  route_version,
  route_plural,
} from './types';

export const CATALOG_BASE_URI = '/api/model_catalog/v1alpha1';
export const GET_CATALOG_MODEL_URI = '/sources/%s/models/%s';

export const CATALOG_SOURCE_ANNOTATION = 'rhdh.io/catalog-source';
export const CATALOG_MODEL_ANNOTATION = 'rhdh.io/catalog-model';

/**
 * Minimal client interface for the KubeFlow Model Catalog API.
 */
export interface CatalogClient {
  rootCatalogURL: string;
  getModelCard(
    sourceId: string,
    modelName: string,
  ): Promise<string | undefined>;
}

/**
 * Discover the Model Catalog OpenShift route by querying routes
 * managed by the model-registry-operator and selecting the one
 * whose name includes 'catalog'. Stores the result on
 * config.catalogRoute.
 */
export async function setupCatalogRoute(
  config: ReconcilerConfig,
): Promise<void> {
  if (config.catalogRoute) {
    config.logger?.debug('setupCatalogRoute: catalog route already discovered');
    return;
  }

  if (config.catalogUrl) {
    config.logger?.debug('setupCatalogRoute: catalog url configured');
    return;
  }

  if (!config.routeClient) {
    config.logger?.debug('setupCatalogRoute: no route client available');
    return;
  }

  try {
    const listResponse = await config.routeClient.listNamespacedCustomObject(
      route_group,
      route_version,
      '',
      route_plural,
      undefined,
      undefined,
      undefined,
      undefined,
      'app.kubernetes.io/managed-by=model-registry-operator',
      undefined,
      undefined,
      undefined,
      undefined,
      false,
    );
    const routes = (listResponse.body as any).items as Route[];

    for (const route of routes) {
      if (route.metadata.name.includes('catalog')) {
        config.logger?.debug(
          `setupCatalogRoute: found catalog route ${route.metadata.name}`,
        );
        config.catalogRoute = route;
        return;
      }
    }

    config.logger?.debug('setupCatalogRoute: no catalog route found');
  } catch (error) {
    config.logger?.error(
      'setupCatalogRoute: error listing routes by label',
      error as Error,
    );
  }
}

/**
 * Fetch a model card (readme) from the Model Catalog API.
 */
export async function fetchModelCard(
  rootCatalogURL: string,
  sourceId: string,
  modelName: string,
  token: string,
  logger?: LoggerService,
): Promise<string | undefined> {
  const encodedSourceId = encodeURIComponent(sourceId);
  const encodedModelName = encodeURIComponent(modelName);
  const url =
    rootCatalogURL +
    GET_CATALOG_MODEL_URI.replace('%s', encodedSourceId).replace(
      '%s',
      encodedModelName,
    );

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GET request to ${url} failed with status ${response.status}: ${body}`,
    );
  }

  logger?.debug(`fetchModelCard: GET request to ${url} returned ok`);
  const data: CatalogModel = await response.json();
  return data.readme;
}

/**
 * Create a CatalogClient from a direct URL (config) or discovered catalog route.
 * The catalogUrl parameter takes precedence over the route's ingress host.
 * Returns undefined if neither source provides a usable URL.
 */
export function createCatalogClient(
  catalogRoute: Route | undefined,
  token: string,
  catalogUrl?: string,
  logger?: LoggerService,
): CatalogClient | undefined {
  let rootCatalogURL: string;

  if (catalogUrl) {
    rootCatalogURL = `${catalogUrl}${CATALOG_BASE_URI}`;
  } else if (catalogRoute?.status?.ingress?.length) {
    rootCatalogURL = `https://${catalogRoute.status.ingress[0].host}${CATALOG_BASE_URI}`;
  } else {
    logger?.debug(
      'createCatalogClient: no catalog URL or route ingress available',
    );
    return undefined;
  }

  return {
    rootCatalogURL,
    getModelCard: (sourceId: string, modelName: string) =>
      fetchModelCard(rootCatalogURL, sourceId, modelName, token, logger),
  };
}
