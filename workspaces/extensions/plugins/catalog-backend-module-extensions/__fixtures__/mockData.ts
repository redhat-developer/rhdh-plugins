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
  ExtensionsPackage,
  ExtensionsPlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export const packageEntity: ExtensionsPackage = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Package',
  metadata: {
    namespace: 'default',
    name: 'testpackage',
    title: 'APIs with Test package',
    description: 'Test package.',
    tags: ['3scale', 'api'],
  },
  spec: {
    packageName: 'test-package',
  },
};

export const pluginEntity: ExtensionsPlugin = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
  kind: 'Plugin',
  metadata: {
    namespace: 'default',
    name: 'plugin1',
  },
  spec: {
    packages: ['test-package'],
  },
};

export const mockTopologyPackage = {
  ...packageEntity,
  spec: {
    packageName: '@backstage-community/plugin-topology',
    dynamicArtifact:
      './dynamic-plugins/dist/backstage-community-plugin-topology',
  },
};

export const mockExtensionsPackage = {
  ...packageEntity,
  metadata: {
    name: 'red-hat-developer-hub-backstage-plugin-extensions',
    namespace: 'extensions-plugin-demo',
  },
  spec: {
    packageName: '@red-hat-developer-hub/backstage-plugin-extensions',
    dynamicArtifact:
      './dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-catalog-backend-module-extensions-dynamic',
  },
};

export const mockExtensionsBackendPackage = {
  ...packageEntity,
  metadata: {
    name: 'red-hat-developer-hub-backstage-plugin-extensions-backend',
    namespace: 'extensions-plugin-demo',
  },
  spec: {
    packageName: '@red-hat-developer-hub/backstage-plugin-extensions-backend',
    dynamicArtifact:
      './dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-extensions-backend-dynamic',
  },
};

export const mockExtensionsPlugin = {
  ...pluginEntity,
  metadata: {
    namespace: 'extensions-plugin-demo',
    name: 'extensions',
  },
  spec: {
    packages: [
      'extensions-plugin-demo/red-hat-developer-hub-backstage-plugin-extensions',
      'package:extensions-plugin-demo/red-hat-developer-hub-backstage-plugin-extensions-backend',
    ],
  },
};

export const locationSpec = {
  type: '',
  target: '',
};
