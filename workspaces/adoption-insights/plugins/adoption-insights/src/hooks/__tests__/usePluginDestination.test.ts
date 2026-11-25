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

import type { ApiHolder } from '@backstage/core-plugin-api';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  appTreeApiRef,
  coreExtensionData,
  routeResolutionApiRef,
} from '@backstage/frontend-plugin-api';
import type { AppTree, RouteRef } from '@backstage/frontend-plugin-api';
import { ConfigReader } from '@backstage/config';
import type { JsonObject } from '@backstage/types';

import {
  findMainRouteRef,
  nodeMatchesPluginId,
  pageNameFromExtensionId,
  rankRoute,
  resolvePluginDestinationWithApis,
} from '../usePluginDestination';

function makeRouteRef(id: string): RouteRef {
  return {
    $$type: '@backstage/RouteRef',
    version: 'v1',
    T: undefined as never,
    getParams: () => [],
    getDescription: () => id,
    setId: () => undefined,
  } as unknown as RouteRef;
}

describe('rankRoute', () => {
  it('prefers root and index over path depth', () => {
    expect(rankRoute('root', '/deep/path')).toBeLessThan(
      rankRoute(undefined, '/a'),
    );
    expect(rankRoute('index', '/x')).toBeLessThan(rankRoute(undefined, '/a'));
    expect(rankRoute(undefined, '/a')).toBeLessThan(
      rankRoute(undefined, '/a/b'),
    );
    expect(rankRoute(undefined, '/:id')).toBe(100);
  });
});

describe('pageNameFromExtensionId / nodeMatchesPluginId', () => {
  it('extracts page names from NFS extension ids', () => {
    expect(pageNameFromExtensionId('page:catalog')).toBe('catalog');
    expect(pageNameFromExtensionId('page:app/learning-paths')).toBe(
      'learning-paths',
    );
    expect(pageNameFromExtensionId('page:bulk-import')).toBe('bulk-import');
    expect(pageNameFromExtensionId('api:app/something')).toBeUndefined();
  });

  it('does not treat shared shell pluginId app as a destination match', () => {
    expect(nodeMatchesPluginId('page:app/learning-paths', 'app', 'app')).toBe(
      false,
    );
    expect(
      nodeMatchesPluginId('page:app/learning-paths', 'app', 'learning-paths'),
    ).toBe(true);
    expect(nodeMatchesPluginId('page:catalog', 'catalog', 'catalog')).toBe(
      true,
    );
  });
});

describe('findMainRouteRef', () => {
  it('returns the preferred route for a matching pluginId', () => {
    const rootRef = makeRouteRef('root');
    const otherRef = makeRouteRef('settings');
    const tree = {
      root: {} as AppTree['root'],
      orphans: [],
      nodes: new Map([
        [
          'page:catalog',
          {
            spec: {
              id: 'page:catalog',
              plugin: {
                pluginId: 'catalog',
                routes: { root: rootRef, settings: otherRef },
              },
            },
            instance: {
              getData: (ref: unknown) => {
                if (ref === coreExtensionData.routeRef) {
                  return rootRef;
                }
                if (ref === coreExtensionData.routePath) {
                  return '/catalog';
                }
                return undefined;
              },
            },
          },
        ],
      ]),
    } as unknown as AppTree;

    expect(findMainRouteRef(tree, 'catalog')).toBe(rootRef);
    expect(findMainRouteRef(tree, 'Catalog')).toBe(rootRef);
    expect(findMainRouteRef(tree, 'mystery')).toBeUndefined();
  });

  it('does not resolve shared shell pluginId app to Learning Paths', () => {
    const learningRef = makeRouteRef('learning-paths');
    const tree = {
      root: {} as AppTree['root'],
      orphans: [],
      nodes: new Map([
        [
          'page:app/learning-paths',
          {
            spec: {
              id: 'page:app/learning-paths',
              plugin: {
                pluginId: 'app',
                routes: { 'learning-paths': learningRef },
              },
            },
            instance: {
              getData: (ref: unknown) => {
                if (ref === coreExtensionData.routeRef) {
                  return learningRef;
                }
                if (ref === coreExtensionData.routePath) {
                  return '/learning-paths';
                }
                return undefined;
              },
            },
          },
        ],
      ]),
    } as unknown as AppTree;

    expect(findMainRouteRef(tree, 'app')).toBeUndefined();
    expect(findMainRouteRef(tree, 'learning-paths')).toBe(learningRef);
  });
});

describe('resolvePluginDestinationWithApis', () => {
  const catalogRef = makeRouteRef('catalog');

  function makeHolder(options: {
    config?: JsonObject;
    appHref?: string;
  }): ApiHolder {
    const tree = {
      root: {} as AppTree['root'],
      orphans: [],
      nodes: new Map(
        options.appHref
          ? [
              [
                'page:catalog',
                {
                  spec: {
                    id: 'page:catalog',
                    plugin: {
                      pluginId: 'catalog',
                      routes: { root: catalogRef },
                    },
                  },
                  instance: {
                    getData: (ref: unknown) => {
                      if (ref === coreExtensionData.routeRef) {
                        return catalogRef;
                      }
                      if (ref === coreExtensionData.routePath) {
                        return options.appHref;
                      }
                      return undefined;
                    },
                  },
                },
              ],
            ]
          : [],
      ),
    } as unknown as AppTree;

    const apis = new Map<unknown, unknown>([
      [
        configApiRef,
        new ConfigReader({
          adoptionInsights: options.config
            ? { pluginDestinations: options.config }
            : {},
        }),
      ],
      [
        appTreeApiRef,
        {
          getTree: () => ({ tree }),
          getNodesByRoutePath: () => ({ nodes: [] }),
        },
      ],
      [
        routeResolutionApiRef,
        {
          resolve: () =>
            options.appHref ? () => options.appHref as string : undefined,
        },
      ],
    ]);

    return {
      get: <T>(ref: { id?: string } | unknown) =>
        apis.get(ref) as T | undefined,
    };
  }

  it('prefers widget overrides, then config, then app tree, then default', () => {
    const holder = makeHolder({
      config: { catalog: '/from-config' },
      appHref: '/from-app',
    });

    expect(
      resolvePluginDestinationWithApis(holder, 'catalog', {
        widgetOverrides: { catalog: '/from-widget' },
      }),
    ).toEqual({ href: '/from-widget', source: 'config' });

    expect(resolvePluginDestinationWithApis(holder, 'catalog')).toEqual({
      href: '/from-config',
      source: 'config',
    });

    expect(
      resolvePluginDestinationWithApis(
        makeHolder({ appHref: '/from-app' }),
        'catalog',
      ),
    ).toEqual({ href: '/from-app', source: 'app' });

    expect(resolvePluginDestinationWithApis(makeHolder({}), 'catalog')).toEqual(
      { href: '/catalog', source: 'default' },
    );
  });

  it('disables the link when config or widget override is false', () => {
    expect(
      resolvePluginDestinationWithApis(
        makeHolder({ config: { catalog: false }, appHref: '/from-app' }),
        'catalog',
      ),
    ).toBeUndefined();

    expect(
      resolvePluginDestinationWithApis(
        makeHolder({ appHref: '/from-app' }),
        'catalog',
        { widgetOverrides: { catalog: false } },
      ),
    ).toBeUndefined();
  });

  it('covers third-party plugins mounted in the app tree', () => {
    expect(
      resolvePluginDestinationWithApis(
        makeHolder({ appHref: '/my-custom-plugin' }),
        'catalog',
      ),
    ).toEqual({ href: '/my-custom-plugin', source: 'app' });
  });
});
