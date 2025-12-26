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
import {
  MarketplaceApi,
  MarketplaceKind,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { FileInstallationStorage } from '../src/installation/FileInstallationStorage';
import { type JsonObject } from '@backstage/types';
import { stringify } from 'yaml';
import { InstallationDataService } from '../src/installation/InstallationDataService';

export const mockCollections = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Collection,
    metadata: {
      namespace: 'default',
      name: 'featured-plugins',
    },
    spec: {
      plugins: ['plugin1', 'plugin2'],
    },
    relations: [
      { type: 'hasPart', targetRef: 'plugin:plugin1' },
      { type: 'hasPart', targetRef: 'plugin:plugin2' },
    ],
  },
];

export const mockPlugins = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'plugin1',
    },
    spec: {
      packages: ['package11', 'package12'],
    },
    relations: [
      { type: 'hasPart', targetRef: 'package:package11' },
      { type: 'hasPart', targetRef: 'package:package12' },
    ],
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Plugin,
    metadata: {
      namespace: 'default',
      name: 'plugin2',
    },
    spec: {
      packages: ['package21'],
    },
    relations: [{ type: 'hasPart', targetRef: 'package:package21' }],
  },
];

export const mockPackages = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Package,
    metadata: {
      namespace: 'default',
      name: 'package11',
    },
    spec: {
      dynamicArtifact: './dynamic-plugins/dist/package11-backend-dynamic',
    },
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Package,
    metadata: {
      namespace: 'default',
      name: 'package12',
    },
    spec: {
      dynamicArtifact: './dynamic-plugins/dist/package12',
      appConfigExamples: [
        {
          title: 'Default configuration',
          content: {
            dynamicPlugins: {
              frontend: {
                'default.package12': {
                  dynamicRoutes: [
                    {
                      path: '/package12',
                      importName: 'Package12Page',
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    },
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: MarketplaceKind.Package,
    metadata: {
      namespace: 'default',
      name: 'package21',
    },
    spec: {
      dynamicArtifact: './dynamic-plugins/dist/package21-backend-dynamic',
    },
  },
];

export const mockDynamicPackage11 = {
  package: mockPackages[0].spec.dynamicArtifact,
  disabled: true,
};

export const mockDynamicPackage12 = {
  package: mockPackages[1].spec.dynamicArtifact,
  disabled: true,
  pluginConfig: mockPackages[1].spec.appConfigExamples?.at(0)?.content,
};

export const mockDynamicPackage21 = {
  package: mockPackages[2].spec.dynamicArtifact,
  disabled: true,
};

export const mockDynamicPlugin1 = [mockDynamicPackage11, mockDynamicPackage12];

const mockPluginsMap = new Map<string, JsonObject>([
  [mockDynamicPackage11.package, mockDynamicPackage11],
  [mockDynamicPackage12.package, mockDynamicPackage12],
]);
export const mockFileInstallationStorage = {
  initialize: jest.fn(),
  getPackage: jest.fn((name: string) => {
    const pcg = mockPluginsMap.get(name);
    return pcg ? stringify(pcg) : pcg;
  }),
  getPackages: jest.fn((names: Iterable<string>) => {
    const packages = Array.from(names)
      .filter(name => mockPluginsMap.has(name))
      .map(name => mockPluginsMap.get(name));
    return stringify(packages);
  }),
  updatePackage: jest.fn(),
  updatePackages: jest.fn(),
  setPackageDisabled: jest.fn(),
  setPackagesDisabled: jest.fn(),
} as unknown as jest.Mocked<FileInstallationStorage>;

export const mockInstallationDataService = {
  getPluginConfig: jest.fn(),
  getPackageConfig: jest.fn(),
  getInitializationError: jest.fn().mockReturnValue(undefined),
  updatePackageConfig: jest.fn(),
  updatePluginConfig: jest.fn(),
  setPackageDisabled: jest.fn(),
  setPluginDisabled: jest.fn(),
} as unknown as jest.Mocked<InstallationDataService>;

export const mockMarketplaceApi = {
  getPluginByName: jest.fn(),
  getPackageByName: jest.fn(),
  getPluginPackages: jest.fn(),
} as unknown as jest.Mocked<MarketplaceApi>;
