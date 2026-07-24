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

import {
  configApiRef,
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  storageApiRef,
} from '@backstage/core-plugin-api';
import { visitsApiRef } from '@backstage/plugin-home';

import { defaultWidgetsApiRef, quickAccessApiRef } from './api';
import {
  CatalogStarredEntitiesCard,
  defaultWidgetsApiRef as pluginDefaultWidgetsApiRef,
  DynamicCustomizableHomePage,
  DynamicHomePage,
  dynamicHomePagePlugin,
  EntitySection,
  FeaturedDocsCard,
  Headline,
  Markdown,
  MarkdownCard,
  OnboardingSection,
  Placeholder,
  QuickAccessCard,
  RecentlyVisitedCard,
  SearchBar,
  TemplateSection,
  TopVisitedCard,
  VisitListener,
  WorldClock,
} from './plugin';
import { rootRouteRef } from './routes';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    createPlugin: jest.fn(actual.createPlugin),
    createApiFactory: jest.fn(actual.createApiFactory),
    createRoutableExtension: jest.fn(actual.createRoutableExtension),
    createComponentExtension: jest.fn(actual.createComponentExtension),
  };
});

const componentExtensions = [
  'SearchBar',
  'QuickAccessCard',
  'Headline',
  'Markdown',
  'MarkdownCard',
  'Placeholder',
  'CatalogStarredEntitiesCard',
  'RecentlyVisitedCard',
  'TopVisitedCard',
  'FeaturedDocsCard',
  'VisitListener',
  'WorldClock',
  'OnboardingSection',
  'EntitySection',
  'TemplateSection',
] as const;

const mockCreateApiFactory = jest.mocked(createApiFactory);
const mockCreateRoutableExtension = jest.mocked(createRoutableExtension);
const mockCreateComponentExtension = jest.mocked(createComponentExtension);

type ApiFactoryConfig = {
  api: unknown;
  factory: (deps: Record<string, unknown>) => unknown;
};

function getApiFactory(apiRef: unknown) {
  const config = mockCreateApiFactory.mock.calls.find(
    ([factoryConfig]) =>
      (factoryConfig as unknown as ApiFactoryConfig).api === apiRef,
  )?.[0] as unknown as ApiFactoryConfig | undefined;

  return config?.factory;
}

describe('homepage plugin', () => {
  it('should export plugin', () => {
    expect(dynamicHomePagePlugin).toBeDefined();
  });

  it('should create the plugin with correct id and routes', () => {
    expect(createPlugin).toHaveBeenCalledWith({
      id: 'homepage',
      routes: { root: rootRouteRef },
      apis: expect.any(Array),
    });
  });

  it('should define API factories with correct dependencies', () => {
    expect(createApiFactory).toHaveBeenCalledWith({
      api: quickAccessApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: expect.any(Function),
    });

    expect(createApiFactory).toHaveBeenCalledWith({
      api: defaultWidgetsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: expect.any(Function),
    });

    expect(createApiFactory).toHaveBeenCalledWith({
      api: visitsApiRef,
      deps: {
        storageApi: storageApiRef,
        identityApi: identityApiRef,
      },
      factory: expect.any(Function),
    });
  });

  it('should provide routable home page extensions', () => {
    expect(createRoutableExtension).toHaveBeenCalledWith({
      name: 'DynamicHomePage',
      component: expect.any(Function),
      mountPoint: rootRouteRef,
    });

    expect(createRoutableExtension).toHaveBeenCalledWith({
      name: 'DynamicCustomizableHomePage',
      component: expect.any(Function),
      mountPoint: rootRouteRef,
    });
  });

  it.each(componentExtensions)(
    'should provide %s as a component extension',
    name => {
      expect(createComponentExtension).toHaveBeenCalledWith({
        name,
        component: {
          lazy: expect.any(Function),
        },
      });
    },
  );

  it('should export all public extensions', () => {
    expect(DynamicHomePage).toBeDefined();
    expect(DynamicCustomizableHomePage).toBeDefined();
    expect(SearchBar).toBeDefined();
    expect(QuickAccessCard).toBeDefined();
    expect(Headline).toBeDefined();
    expect(Markdown).toBeDefined();
    expect(MarkdownCard).toBeDefined();
    expect(Placeholder).toBeDefined();
    expect(CatalogStarredEntitiesCard).toBeDefined();
    expect(RecentlyVisitedCard).toBeDefined();
    expect(TopVisitedCard).toBeDefined();
    expect(FeaturedDocsCard).toBeDefined();
    expect(VisitListener).toBeDefined();
    expect(WorldClock).toBeDefined();
    expect(OnboardingSection).toBeDefined();
    expect(EntitySection).toBeDefined();
    expect(TemplateSection).toBeDefined();
  });

  it('should export defaultWidgetsApiRef from the plugin module', () => {
    expect(pluginDefaultWidgetsApiRef).toBe(defaultWidgetsApiRef);
  });

  it('should create API clients from factories', () => {
    const mockDeps = {
      discoveryApi: { getBaseUrl: jest.fn() },
      configApi: { getOptionalString: jest.fn() },
      identityApi: { getBackstageIdentity: jest.fn() },
      fetchApi: { fetch: jest.fn() },
      storageApi: { snapshot: jest.fn() },
    };

    const quickAccessFactory = getApiFactory(quickAccessApiRef);
    const defaultWidgetsFactory = getApiFactory(defaultWidgetsApiRef);
    const visitsFactory = getApiFactory(visitsApiRef);

    expect(
      quickAccessFactory?.({
        discoveryApi: mockDeps.discoveryApi,
        configApi: mockDeps.configApi,
        identityApi: mockDeps.identityApi,
      }),
    ).toBeDefined();
    expect(
      defaultWidgetsFactory?.({
        discoveryApi: mockDeps.discoveryApi,
        fetchApi: mockDeps.fetchApi,
      }),
    ).toBeDefined();
    expect(
      visitsFactory?.({
        storageApi: mockDeps.storageApi,
        identityApi: mockDeps.identityApi,
      }),
    ).toBeDefined();
  });

  it('should resolve lazy-loaded routable components', async () => {
    const dynamicHomePageCall = mockCreateRoutableExtension.mock.calls.find(
      ([config]) => config.name === 'DynamicHomePage',
    );
    const customizableHomePageCall =
      mockCreateRoutableExtension.mock.calls.find(
        ([config]) => config.name === 'DynamicCustomizableHomePage',
      );

    await expect(dynamicHomePageCall?.[0].component()).resolves.toBeDefined();
    await expect(
      customizableHomePageCall?.[0].component(),
    ).resolves.toBeDefined();
  });

  it('should resolve lazy-loaded component extensions', async () => {
    await Promise.all(
      mockCreateComponentExtension.mock.calls.map(async ([config]) => {
        const lazyLoader = config.component as { lazy: () => Promise<unknown> };
        const component = await lazyLoader.lazy();
        expect(component).toBeDefined();
      }),
    );
  });
});
