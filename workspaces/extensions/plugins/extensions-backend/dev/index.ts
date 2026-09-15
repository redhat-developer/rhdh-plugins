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

import { createBackend } from '@backstage/backend-defaults';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import {
  DynamicPluginProvider,
  dynamicPluginsServiceRef,
} from '@backstage/backend-dynamic-feature-service';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

import { ExtensionsKind } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

// Standalone backend for this package. Export BACKSTAGE_DEV_STATIC_TOKEN
// (min 8 chars) before `yarn start`. Curl examples:
//
//   curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
//     http://localhost:7007/api/extensions/environment
//   curl -H "Authorization: Bearer ${BACKSTAGE_DEV_STATIC_TOKEN}" \
//     http://localhost:7007/api/extensions/plugins/configure
//
// Catalog-backed list routes (GET /plugins, /packages, /collections) need the
// workspace backend, which includes catalog and the catalog module. See
// CONTRIBUTING.md.

const backend = createBackend();

const mockDynamicPluginProvider: DynamicPluginProvider = {
  plugins: () => [],
  getScannedPackage: () => {
    throw new Error('getScannedPackage is not used in the standalone harness');
  },
  frontendPlugins: () => [],
  backendPlugins: () => [],
};

backend.add(
  createServiceFactory({
    service: dynamicPluginsServiceRef,
    deps: {},
    factory: () => mockDynamicPluginProvider,
  }),
);

backend.add(
  catalogServiceMock.factory({
    entities: [
      {
        apiVersion: 'extensions.backstage.io/v1alpha1',
        kind: ExtensionsKind.Plugin,
        metadata: {
          name: 'sample-plugin',
          title: 'Sample Plugin',
          namespace: 'default',
        },
        spec: {
          packages: [],
        },
      },
    ],
  }),
);

backend.add(import('../src'));

backend.start();
