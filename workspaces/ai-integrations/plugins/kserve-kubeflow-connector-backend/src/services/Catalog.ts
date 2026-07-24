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

// Model Catalog client code extracted from the former Kfmr.ts module.
// Provides catalog route discovery and model card fetching via the
// KubeFlow Model Catalog API (/api/model_catalog/v1alpha1).

import {
  type ReconcilerConfig,
  type Route,
  type CatalogModel,
  route_group,
  route_version,
  route_plural,
} from './types';

// Catalog API constants (renamed from KFMR_CATALOG_BASE_URI)
export const CATALOG_BASE_URI = '/api/model_catalog/v1alpha1';
export const GET_CATALOG_MODEL_URI = '/sources/%s/models/%s';

/**
 * Minimal client interface for the KubeFlow Model Catalog API.
 * Retains only catalog-related operations from the former KFMRClient.
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
    console.log('setupCatalogRoute: catalog route already discovered');
    return;
  }

  if (!config.routeClient) {
    console.log('setupCatalogRoute: no route client available');
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
        console.log(
          `setupCatalogRoute: found catalog route ${route.metadata.name}`,
        );
        config.catalogRoute = route;
        return;
      }
    }

    console.log('setupCatalogRoute: no catalog route found');
  } catch (error) {
    console.error('setupCatalogRoute: error listing routes by label:', error);
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

  console.log(`fetchModelCard: GET request to ${url} returned ok`);
  const data: CatalogModel = await response.json();
  return data.readme;
}

/**
 * Create a CatalogClient from a discovered catalog route and auth token.
 * Returns undefined if the route has no usable ingress.
 */
export function createCatalogClient(
  catalogRoute: Route,
  token: string,
): CatalogClient | undefined {
  if (
    !catalogRoute.status?.ingress ||
    catalogRoute.status.ingress.length === 0
  ) {
    console.log('createCatalogClient: catalog route has no ingress');
    return undefined;
  }

  const rootCatalogURL = `https://${catalogRoute.status.ingress[0].host}${CATALOG_BASE_URI}`;

  return {
    rootCatalogURL,
    getModelCard: (sourceId: string, modelName: string) =>
      fetchModelCard(rootCatalogURL, sourceId, modelName, token),
  };
}
