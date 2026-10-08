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

import { mockServices } from '@backstage/backend-test-utils';
import {
  setupCatalogRoute,
  fetchModelCard,
  createCatalogClient,
  CATALOG_BASE_URI,
} from './Catalog';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeRoute(name: string, host?: string): any {
  return {
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: { name, namespace: 'default' },
    spec: {},
    ...(host ? { status: { ingress: [{ host }] } } : {}),
  };
}

describe('setupCatalogRoute', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return early if catalogRoute is already set', async () => {
    const existingRoute = makeRoute('existing-catalog', 'host.example.com');
    const listFn = jest.fn();
    const config: any = {
      catalogRoute: existingRoute,
      routeClient: { listNamespacedCustomObject: listFn },
      logger,
    };

    await setupCatalogRoute(config);

    expect(listFn).not.toHaveBeenCalled();
    expect(config.catalogRoute).toBe(existingRoute);
  });

  it('should return early if catalogUrl is set', async () => {
    const listFn = jest.fn();
    const config: any = {
      catalogUrl: 'https://catalog.example.com',
      routeClient: { listNamespacedCustomObject: listFn },
      logger,
    };

    await setupCatalogRoute(config);

    expect(listFn).not.toHaveBeenCalled();
  });

  it('should return early if no routeClient is available', async () => {
    const config: any = { logger };

    await setupCatalogRoute(config);

    expect(config.catalogRoute).toBeUndefined();
  });

  it('should find and set the catalog route', async () => {
    const catalogRoute = makeRoute(
      'model-catalog-route',
      'catalog.apps.cluster',
    );
    const otherRoute = makeRoute('registry-route', 'registry.apps.cluster');

    const config: any = {
      routeClient: {
        listNamespacedCustomObject: jest.fn().mockResolvedValue({
          body: { items: [otherRoute, catalogRoute] },
        }),
      },
      logger,
    };

    await setupCatalogRoute(config);

    expect(config.catalogRoute).toBe(catalogRoute);
  });

  it('should not set catalogRoute when no route contains catalog in name', async () => {
    const config: any = {
      routeClient: {
        listNamespacedCustomObject: jest.fn().mockResolvedValue({
          body: { items: [makeRoute('registry-route', 'r.apps.cluster')] },
        }),
      },
      logger,
    };

    await setupCatalogRoute(config);

    expect(config.catalogRoute).toBeUndefined();
  });

  it('should handle API errors gracefully', async () => {
    const config: any = {
      routeClient: {
        listNamespacedCustomObject: jest
          .fn()
          .mockRejectedValue(new Error('forbidden')),
      },
      logger,
    };

    await setupCatalogRoute(config);

    expect(config.catalogRoute).toBeUndefined();
  });
});

describe('fetchModelCard', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return the readme from a successful response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ readme: '# Model Card\nThis is a model.' }),
    });

    const result = await fetchModelCard(
      'https://catalog.example.com/api/model_catalog/v1alpha1',
      'rhoai-catalog',
      'granite-8b',
      'test-token',
      logger,
    );

    expect(result).toBe('# Model Card\nThis is a model.');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://catalog.example.com/api/model_catalog/v1alpha1/sources/rhoai-catalog/models/granite-8b',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('should URL-encode sourceId and modelName', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ readme: 'encoded' }),
    });

    await fetchModelCard(
      'https://catalog.example.com/api/model_catalog/v1alpha1',
      'source/with/slashes',
      'model name',
      'tok',
    );

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('source%2Fwith%2Fslashes');
    expect(calledUrl).toContain('model%20name');
  });

  it('should throw on non-ok response with status and body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'model not found',
    });

    await expect(
      fetchModelCard(
        'https://catalog.example.com/api/model_catalog/v1alpha1',
        'src',
        'missing-model',
        'tok',
      ),
    ).rejects.toThrow(/failed with status 404.*model not found/);
  });
});

describe('createCatalogClient', () => {
  const logger = mockServices.logger.mock();

  it('should create client from direct catalogUrl', () => {
    const client = createCatalogClient(
      undefined,
      'tok',
      'https://direct.example.com',
      logger,
    );

    expect(client).toBeDefined();
    expect(client!.rootCatalogURL).toBe(
      `https://direct.example.com${CATALOG_BASE_URI}`,
    );
  });

  it('should prefer catalogUrl over route ingress', () => {
    const route = makeRoute('catalog-route', 'route.apps.cluster');
    const client = createCatalogClient(
      route,
      'tok',
      'https://direct.example.com',
      logger,
    );

    expect(client!.rootCatalogURL).toBe(
      `https://direct.example.com${CATALOG_BASE_URI}`,
    );
  });

  it('should create client from route ingress when no catalogUrl', () => {
    const route = makeRoute('catalog-route', 'catalog.apps.cluster');
    const client = createCatalogClient(route, 'tok', undefined, logger);

    expect(client).toBeDefined();
    expect(client!.rootCatalogURL).toBe(
      `https://catalog.apps.cluster${CATALOG_BASE_URI}`,
    );
  });

  it('should return undefined when neither catalogUrl nor route ingress available', () => {
    const client = createCatalogClient(undefined, 'tok', undefined, logger);

    expect(client).toBeUndefined();
  });

  it('should return undefined when route has no ingress', () => {
    const route = makeRoute('catalog-route');
    const client = createCatalogClient(route, 'tok', undefined, logger);

    expect(client).toBeUndefined();
  });

  it('should wire getModelCard to call fetchModelCard', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ readme: 'card content' }),
    });

    const client = createCatalogClient(
      undefined,
      'my-token',
      'https://cat.example.com',
      logger,
    );
    const result = await client!.getModelCard('source1', 'modelA');

    expect(result).toBe('card content');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('source1/models/modelA'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      }),
    );
  });
});
