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

import type {
  ExtensionsApi,
  ExtensionsCollection,
  ExtensionsPackage,
  ExtensionsPlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import {
  EXTENSIONS_API_VERSION,
  ExtensionsKind,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import type { GetEntitiesRequest } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

function filterByRequest<T extends { metadata?: { name?: string } }>(
  items: T[],
  request?: GetEntitiesRequest,
): T[] {
  if (!request?.filter) return items;
  const filter = request.filter as Record<string, unknown>;
  const nameFilter = filter['metadata.name'];
  if (typeof nameFilter === 'string') {
    return items.filter(item => item.metadata?.name === nameFilter);
  }
  return items;
}

export const mockPlugins: ExtensionsPlugin[] = [
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'techdocs',
      title: 'TechDocs',
      description: 'Documentation as code for your Backstage instance.',
    },
    spec: {
      categories: ['documentation'],
      author: 'Backstage',
      packages: ['default/techdocs-package'],
    },
  },
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'catalog',
      title: 'Software Catalog',
      description: 'Manage your software ecosystem with a unified catalog.',
    },
    spec: {
      categories: ['infrastructure'],
      author: 'Backstage',
      packages: ['default/catalog-package'],
    },
  },
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'scaffolder',
      title: 'Software Templates',
      description: 'Create new components and projects from templates.',
    },
    spec: {
      categories: ['developer-tools'],
      author: 'Backstage',
      packages: ['default/scaffolder-package'],
    },
  },
];

export const mockCollections: ExtensionsCollection[] = [
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Collection,
    metadata: {
      namespace: 'default',
      name: 'featured',
      title: 'Featured Plugins',
    },
    spec: {
      type: 'curated',
      plugins: ['default/techdocs', 'default/catalog', 'default/scaffolder'],
    },
  },
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Collection,
    metadata: {
      namespace: 'default',
      name: 'developer-tools',
      title: 'Developer Tools',
    },
    spec: {
      type: 'curated',
      plugins: ['default/scaffolder'],
    },
  },
];

export const mockPackages: ExtensionsPackage[] = [
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Package,
    metadata: {
      namespace: 'default',
      name: 'techdocs-package',
      title: '@backstage/plugin-techdocs',
    },
    spec: {
      packageName: '@backstage/plugin-techdocs',
      version: '1.10.0',
      partOf: ['default/techdocs'],
      dynamicArtifact:
        './dynamic-plugins/dist/backstage-plugin-techdocs-dynamic',
    },
  },
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Package,
    metadata: {
      namespace: 'default',
      name: 'catalog-package',
      title: '@backstage/plugin-catalog',
    },
    spec: {
      packageName: '@backstage/plugin-catalog',
      version: '1.18.0',
      partOf: ['default/catalog'],
      dynamicArtifact:
        './dynamic-plugins/dist/backstage-plugin-catalog-dynamic',
    },
  },
  {
    apiVersion: EXTENSIONS_API_VERSION,
    kind: ExtensionsKind.Package,
    metadata: {
      namespace: 'default',
      name: 'scaffolder-package',
      title: '@backstage/plugin-scaffolder',
    },
    spec: {
      packageName: '@backstage/plugin-scaffolder',
      version: '1.21.0',
      partOf: ['default/scaffolder'],
      dynamicArtifact:
        './dynamic-plugins/dist/backstage-plugin-scaffolder-dynamic',
    },
  },
];

const emptyFacetsResponse = { facets: {} };

export class MockExtensionsApi implements ExtensionsApi {
  async getCollections(request?: GetEntitiesRequest): Promise<{
    items: ExtensionsCollection[];
    totalItems: number;
    pageInfo: { nextCursor?: string; prevCursor?: string };
  }> {
    const items = filterByRequest(mockCollections, request);
    return {
      items,
      totalItems: items.length,
      pageInfo: {},
    };
  }

  async getCollectionsFacets() {
    return emptyFacetsResponse;
  }

  async getCollectionByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsCollection> {
    const collection = mockCollections.find(
      c => c.metadata.namespace === namespace && c.metadata.name === name,
    );
    if (!collection) {
      throw new Error(`Collection ${namespace}/${name} not found`);
    }
    return collection;
  }

  async getCollectionPlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
    const collection = mockCollections.find(
      c => c.metadata.namespace === namespace && c.metadata.name === name,
    );
    if (!collection?.spec?.plugins) return [];
    return mockPlugins.filter(p =>
      collection.spec!.plugins!.some(
        ref =>
          ref === `${p.metadata.namespace}/${p.metadata.name}` ||
          ref === p.metadata.name,
      ),
    );
  }

  async getPackages(request?: GetEntitiesRequest): Promise<{
    items: ExtensionsPackage[];
    totalItems: number;
    pageInfo: { nextCursor?: string; prevCursor?: string };
  }> {
    const items = filterByRequest(mockPackages, request);
    return {
      items,
      totalItems: items.length,
      pageInfo: {},
    };
  }

  async getPackagesFacets() {
    return emptyFacetsResponse;
  }

  async getPackageByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage> {
    const pkg = mockPackages.find(
      p => p.metadata.namespace === namespace && p.metadata.name === name,
    );
    if (!pkg) {
      throw new Error(`Package ${namespace}/${name} not found`);
    }
    return pkg;
  }

  async getPlugins(request?: GetEntitiesRequest): Promise<{
    items: ExtensionsPlugin[];
    totalItems: number;
    pageInfo: { nextCursor?: string; prevCursor?: string };
  }> {
    const items = filterByRequest(mockPlugins, request);
    return {
      items,
      totalItems: items.length,
      pageInfo: {},
    };
  }

  async getPluginFacets() {
    return emptyFacetsResponse;
  }

  async getPluginByName(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin> {
    const plugin = mockPlugins.find(
      p => p.metadata.namespace === namespace && p.metadata.name === name,
    );
    if (!plugin) {
      throw new Error(`Plugin ${namespace}/${name} not found`);
    }
    return plugin;
  }

  async getPluginConfigAuthorization(
    _namespace: string,
    _name: string,
  ): Promise<{ read: 'ALLOW' | 'DENY'; write: 'ALLOW' | 'DENY' }> {
    return { read: 'ALLOW', write: 'ALLOW' };
  }

  async getPluginPackages(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPackage[]> {
    const plugin = mockPlugins.find(
      p => p.metadata.namespace === namespace && p.metadata.name === name,
    );
    if (!plugin?.spec?.packages) return [];
    return mockPackages.filter(p =>
      plugin.spec!.packages!.some(
        ref =>
          ref === `${p.metadata.namespace}/${p.metadata.name}` ||
          ref === p.metadata.name,
      ),
    );
  }

  async getPackagePlugins(
    namespace: string,
    name: string,
  ): Promise<ExtensionsPlugin[]> {
    const pkg = mockPackages.find(
      p => p.metadata.namespace === namespace && p.metadata.name === name,
    );
    if (!pkg?.spec?.partOf) return [];
    return mockPlugins.filter(plugin =>
      pkg.spec!.partOf!.some(
        ref =>
          ref === `${plugin.metadata.namespace}/${plugin.metadata.name}` ||
          ref === plugin.metadata.name,
      ),
    );
  }

  async getExtensionsConfiguration() {
    return { enabled: true };
  }

  async getNodeEnvironment() {
    return { nodeEnv: 'development' as const };
  }
}
