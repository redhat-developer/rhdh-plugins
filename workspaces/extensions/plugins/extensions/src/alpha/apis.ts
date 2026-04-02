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
  ApiBlueprint,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/frontend-plugin-api';
import { dynamicPluginsInfoApiRef, extensionsApiRef } from '../api';
import { ExtensionsBackendClient } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { DynamicPluginsInfoClient } from '../api/DynamicPluginsInfoClient';

/**
 * API module providing extensions implementations.
 * @alpha
 */
export const extensionApi: any = ApiBlueprint.make({
  name: 'extensions',
  params: defineParams =>
    defineParams({
      api: extensionsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, fetchApi, identityApi, configApi }) =>
        new ExtensionsBackendClient({
          discoveryApi,
          fetchApi,
          identityApi,
          configApi,
        }),
    }),
});

/**
 * API module providing dynamic-plugins-info implementations.
 * @alpha
 */
export const dynamicPluginsInfoApi: any = ApiBlueprint.make({
  name: 'dynamic-plugins-info',
  params: defineParams =>
    defineParams({
      api: dynamicPluginsInfoApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new DynamicPluginsInfoClient({
          discoveryApi,
          fetchApi,
        }),
    }),
});
